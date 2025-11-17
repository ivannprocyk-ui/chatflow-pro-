import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, Organization, JwtPayload } from '../common/types';
import { OrganizationsService } from '../organizations/organizations.service';
import { SUPABASE_CLIENT } from '../database/database.module';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private jwtService: JwtService,
    private organizationsService: OrganizationsService,
  ) {}

  async register(email: string, password: string, organizationName: string) {
    // Check if user already exists
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create organization first
    const organization = await this.organizationsService.create({
      name: organizationName,
      slug: this.generateSlug(organizationName),
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      id: uuidv4(),
      organization_id: organization.id,
      email,
      password_hash: passwordHash,
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { data: createdUser, error } = await this.supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    // Generate tokens
    const tokens = await this.generateTokens(
      this.mapDbUserToUser(createdUser),
      organization,
    );

    return {
      user: this.sanitizeUser(this.mapDbUserToUser(createdUser)),
      organization: organization,
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const organization = await this.organizationsService.findOne(user.organizationId);

    // Update last login
    await this.supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const tokens = await this.generateTokens(user, organization);

    return {
      user: this.sanitizeUser(user),
      organization: organization,
      ...tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const { data: dbUser, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !dbUser) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    return this.mapDbUserToUser(dbUser);
  }

  async validateToken(payload: JwtPayload): Promise<User | null> {
    const { data: dbUser, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !dbUser || !dbUser.is_active) {
      return null;
    }

    return this.mapDbUserToUser(dbUser);
  }

  private async generateTokens(user: User, organization: Organization) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now();
  }

  /**
   * Map database user (snake_case) to application User (camelCase)
   */
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      organizationId: dbUser.organization_id,
      email: dbUser.email,
      passwordHash: dbUser.password_hash,
      role: dbUser.role,
      isActive: dbUser.is_active,
      lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : undefined,
      createdAt: new Date(dbUser.created_at),
    };
  }

  // For testing/development
  async getAllUsers() {
    const { data: users } = await this.supabase
      .from('users')
      .select('*');

    return (users || []).map(u => this.sanitizeUser(this.mapDbUserToUser(u)));
  }
}
