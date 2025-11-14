import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, Organization, JwtPayload } from '../common/types';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AuthService {
  // Mock data storage (in-memory)
  private users: User[] = [
    {
      id: '1',
      organizationId: '1',
      email: 'demo@pizzeria.com',
      passwordHash: '$2b$10$8V8BlIVzRjqh5h3QXj.v2eHlUG4/qN7fpNtNeW5Be2wEupXfYfOiu', // password: demo123
      role: 'admin',
      isActive: true,
      createdAt: new Date('2024-01-01'),
    },
  ];

  constructor(
    private jwtService: JwtService,
    private organizationsService: OrganizationsService,
  ) {}

  async register(email: string, password: string, organizationName: string) {
    // Check if user already exists
    const existingUser = this.users.find((u) => u.email === email);
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
    const newUser: User = {
      id: uuidv4(),
      organizationId: organization.id,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
    };

    this.users.push(newUser);

    // Generate tokens
    const tokens = await this.generateTokens(newUser, organization);

    return {
      user: this.sanitizeUser(newUser),
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
    user.lastLoginAt = new Date();

    const tokens = await this.generateTokens(user, organization);

    return {
      user: this.sanitizeUser(user),
      organization: organization,
      ...tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async validateToken(payload: JwtPayload): Promise<User | null> {
    const user = this.users.find((u) => u.id === payload.sub);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
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
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }

  // For testing/development
  getAllUsers() {
    return this.users.map(u => this.sanitizeUser(u));
  }
}
