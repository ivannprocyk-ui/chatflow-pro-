# 🚀 GUÍA DE MIGRACIÓN A PRODUCCIÓN
## ChatFlow Pro - De Prototipo a Sistema Multi-Tenant

---

## 📋 TABLA DE CONTENIDOS

1. [Stack Tecnológico](#stack-tecnológico)
2. [Arquitectura](#arquitectura)
3. [Setup del Backend](#setup-del-backend)
4. [Autenticación y Autorización](#autenticación-y-autorización)
5. [Migración de Datos](#migración-de-datos)
6. [Frontend Changes](#frontend-changes)
7. [Deployment](#deployment)
8. [Costos y Escalabilidad](#costos-y-escalabilidad)

---

## 🛠️ STACK TECNOLÓGICO

### **Backend**
- **Node.js 18+** - Runtime
- **NestJS** - Framework backend modular
- **Prisma** - ORM moderno y type-safe
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación stateless
- **Passport** - Middleware de autenticación
- **bcrypt** - Hash de contraseñas
- **class-validator** - Validación de DTOs

### **Frontend** (ya existe)
- React + TypeScript
- Axios/Fetch para API calls
- Context API para auth state

### **Infraestructura**
- **Railway** / **Render** / **Fly.io** - Backend hosting
- **Vercel** / **Netlify** - Frontend hosting
- **Supabase** / **Neon** - PostgreSQL managed
- **Redis** (opcional) - Cache y sessions

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────┐
│                  CLIENTE (Browser)                   │
│           React App + Auth Context                   │
└────────────┬────────────────────────────────────────┘
             │ HTTPS + JWT
┌────────────▼────────────────────────────────────────┐
│              BACKEND API (NestJS)                    │
│  ┌──────────────────────────────────────────────┐   │
│  │  Auth Module                                 │   │
│  │  - Login/Register                            │   │
│  │  - JWT Strategy                              │   │
│  │  - Refresh Tokens                            │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Contacts Module                             │   │
│  │  - CRUD operations                           │   │
│  │  - Organization isolation                    │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Messages Module                             │   │
│  │  - Send messages via Meta API                │   │
│  │  - Webhook receiver                          │   │
│  │  - Message history                           │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Analytics Module                            │   │
│  │  - Dashboard data                            │   │
│  │  - Reports generation                        │   │
│  └──────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────┘
             │ Prisma ORM
┌────────────▼────────────────────────────────────────┐
│           PostgreSQL Database                        │
│  - Multi-tenant con organization_id                  │
│  - Row Level Security (opcional)                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 SETUP DEL BACKEND

### **Paso 1: Crear proyecto NestJS**

```bash
# Instalar NestJS CLI
npm install -g @nestjs/cli

# Crear nuevo proyecto
nest new chatflow-pro-backend

# Navegar al proyecto
cd chatflow-pro-backend

# Instalar dependencias
npm install @nestjs/passport @nestjs/jwt passport passport-jwt
npm install @nestjs/config
npm install @prisma/client
npm install bcrypt class-validator class-transformer
npm install -D @types/passport-jwt @types/bcrypt prisma

# Inicializar Prisma
npx prisma init
```

### **Paso 2: Configurar Prisma**

Copia el schema SQL que creé en `database/schema.sql` o crea un Prisma schema:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique

  // Meta API
  metaAccessToken   String? @map("meta_access_token")
  metaWabaId        String? @map("meta_waba_id")
  metaPhoneNumberId String? @map("meta_phone_number_id")

  // Plan
  plan              String  @default("free")
  maxContacts       Int     @default(1000) @map("max_contacts")

  isActive          Boolean @default(true) @map("is_active")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  users             User[]
  contacts          Contact[]
  messages          Message[]
  templates         MessageTemplate[]
  campaigns         Campaign[]
  events            CalendarEvent[]

  @@map("organizations")
}

model User {
  id               String   @id @default(uuid())
  organizationId   String   @map("organization_id")
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  email            String   @unique
  passwordHash     String   @map("password_hash")
  firstName        String?  @map("first_name")
  lastName         String?  @map("last_name")

  role             String   @default("user")

  isActive         Boolean  @default(true) @map("is_active")
  isEmailVerified  Boolean  @default(false) @map("is_email_verified")

  lastLoginAt      DateTime? @map("last_login_at")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@index([email])
  @@index([organizationId])
  @@map("users")
}

model Contact {
  id               String   @id @default(uuid())
  organizationId   String   @map("organization_id")
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  phone            String
  status           String?
  customFields     Json     @default("{}") @map("custom_fields")

  messagesSent     Int      @default(0) @map("messages_sent")
  lastContactAt    DateTime? @map("last_contact_at")

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  messages         Message[]

  @@unique([organizationId, phone])
  @@index([organizationId])
  @@index([phone])
  @@map("contacts")
}

model Message {
  id               String   @id @default(uuid())
  organizationId   String   @map("organization_id")
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  contactId        String   @map("contact_id")
  contact          Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)

  metaMessageId    String?  @map("meta_message_id")

  direction        String   @default("outbound")
  status           String   @default("pending")

  templateName     String?  @map("template_name")
  messageContent   String?  @map("message_content")

  campaignName     String?  @map("campaign_name")
  metadata         Json?

  errorMessage     String?  @map("error_message")

  sentAt           DateTime @default(now()) @map("sent_at")
  deliveredAt      DateTime? @map("delivered_at")
  readAt           DateTime? @map("read_at")

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@index([organizationId])
  @@index([contactId])
  @@index([status])
  @@map("messages")
}

// Más modelos según necesites...
```

Luego:

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear migraciones
npx prisma migrate dev --name init

# (Opcional) Seed de datos
npx prisma db seed
```

### **Paso 3: Estructura de módulos NestJS**

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── contacts/
│   ├── contacts.module.ts
│   ├── contacts.controller.ts
│   ├── contacts.service.ts
│   └── dto/
├── messages/
│   ├── messages.module.ts
│   ├── messages.controller.ts
│   ├── messages.service.ts
│   └── dto/
├── analytics/
│   ├── analytics.module.ts
│   ├── analytics.controller.ts
│   └── analytics.service.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   └── organization.guard.ts
│   └── interceptors/
│       └── organization.interceptor.ts
├── app.module.ts
└── main.ts
```

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### **Auth Module - auth.service.ts**

```typescript
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, organizationName: string) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    // Crear organización
    const slug = organizationName.toLowerCase().replace(/\s+/g, '-');
    const organization = await this.prisma.organization.create({
      data: {
        name: organizationName,
        slug: `${slug}-${Date.now()}`,
      },
    });

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario admin
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'admin',
        organizationId: organization.id,
      },
      include: {
        organization: true,
      },
    });

    // Generar JWT
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Actualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generar JWT
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
      },
      ...tokens,
    };
  }

  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
  }
}
```

### **Auth Controller - auth.controller.ts**

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.organizationName);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
```

### **JWT Strategy**

```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  }
}
```

### **JWT Guard**

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### **Current User Decorator**

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## 📦 EJEMPLO: CONTACTS MODULE

### **Contacts Controller**

```typescript
// src/contacts/contacts.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.contactsService.findAll(user.organizationId, { status, search });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.findOne(user.organizationId, id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateContactDto) {
    return this.contactsService.create(user.organizationId, dto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.remove(user.organizationId, id);
  }
}
```

### **Contacts Service**

```typescript
// src/contacts/contacts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from './dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { phone: { contains: filters.search } },
        { customFields: { path: ['name'], string_contains: filters.search } },
      ];
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async create(organizationId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        organizationId,
        phone: dto.phone,
        status: dto.status,
        customFields: dto.customFields || {},
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        status: dto.status,
        customFields: dto.customFields,
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({ where: { id } });

    return { message: 'Contact deleted successfully' };
  }
}
```

---

## 🔄 MIGRACIÓN DE DATOS

### **Script de migración de localStorage a DB**

```typescript
// scripts/migrate-localstorage-to-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LocalStorageData {
  config: any;
  crmConfig: any;
  contacts: any[];
  messageHistory: any[];
  contactLists: any[];
  templates: any[];
  calendarEvents: any[];
}

async function migrate(organizationId: string, data: LocalStorageData) {
  console.log('🚀 Starting migration...');

  // 1. Migrar campos CRM
  console.log('📋 Migrating CRM fields...');
  if (data.crmConfig?.fields) {
    for (const field of data.crmConfig.fields) {
      await prisma.cRMField.create({
        data: {
          organizationId,
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          position: field.position || 0,
        },
      });
    }
  }

  // 2. Migrar estados CRM
  console.log('🎨 Migrating CRM statuses...');
  if (data.crmConfig?.statuses) {
    for (const status of data.crmConfig.statuses) {
      await prisma.cRMStatus.create({
        data: {
          organizationId,
          name: status.name,
          label: status.label,
          color: status.color,
          position: status.position || 0,
        },
      });
    }
  }

  // 3. Migrar contactos
  console.log('👥 Migrating contacts...');
  const contactMap = new Map();

  for (const contact of data.contacts || []) {
    const newContact = await prisma.contact.create({
      data: {
        organizationId,
        phone: contact.phone || contact.id,
        status: contact.status,
        customFields: contact,
        createdAt: contact.createdAt ? new Date(contact.createdAt) : new Date(),
      },
    });

    contactMap.set(contact.id, newContact.id);
  }

  // 4. Migrar historial de mensajes
  console.log('💬 Migrating message history...');
  for (const message of data.messageHistory || []) {
    const contactId = contactMap.get(message.contactId);

    if (contactId) {
      await prisma.message.create({
        data: {
          organizationId,
          contactId,
          direction: 'outbound',
          status: message.status,
          templateName: message.templateName,
          campaignName: message.campaignName,
          metadata: message.metadata || {},
          errorMessage: message.errorMessage,
          sentAt: new Date(message.sentAt),
        },
      });
    }
  }

  // 5. Migrar eventos del calendario
  console.log('📅 Migrating calendar events...');
  for (const event of data.calendarEvents || []) {
    await prisma.calendarEvent.create({
      data: {
        organizationId,
        title: event.title,
        description: event.description,
        startTime: new Date(event.start),
        endTime: new Date(event.end),
        eventType: event.type || 'general',
        color: event.color || 'blue',
      },
    });
  }

  console.log('✅ Migration completed successfully!');
}

// Ejecutar migración
const organizationId = process.argv[2];
const dataPath = process.argv[3];

if (!organizationId || !dataPath) {
  console.error('Usage: ts-node migrate.ts <organizationId> <dataPath>');
  process.exit(1);
}

const data = require(dataPath);
migrate(organizationId, data)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Uso:**

```bash
# Exportar datos desde frontend (usando el botón de backup)
# Luego ejecutar:
ts-node scripts/migrate-localstorage-to-db.ts <org-id> ./backup.json
```

---

## 🎨 FRONTEND CHANGES

### **1. Crear Auth Context**

```typescript
// src/react-app/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  role: string;
  organization: {
    id: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario desde localStorage al inicio
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
      email,
      password,
    });

    const { user, accessToken } = response.data;

    // Guardar en localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Configurar header de axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    setUser(user);
  };

  const register = async (email: string, password: string, organizationName: string) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
      email,
      password,
      organizationName,
    });

    const { user, accessToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### **2. Crear Login Page**

```typescript
// src/react-app/pages/Login.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, organizationName);
      } else {
        await login(email, password);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-gray-600">
            {isRegister ? 'Registra tu organización' : 'Accede a tu cuenta'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Organización
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Mi Empresa S.A."
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {loading
              ? 'Cargando...'
              : isRegister
              ? 'Registrarse'
              : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isRegister
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### **3. Protected Routes**

```typescript
// src/react-app/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### **4. Reemplazar storage.ts calls con API calls**

```typescript
// Antes (localStorage):
const contacts = loadCRMData();

// Después (API):
const { data: contacts } = await axios.get('/api/contacts');
```

---

## 🚀 DEPLOYMENT

### **Backend (Railway)**

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Agregar PostgreSQL
railway add

# 5. Configurar variables de entorno
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-secret"

# 6. Deploy
railway up
```

### **Frontend (Vercel)**

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Configurar variables de entorno
vercel env add REACT_APP_API_URL production
```

---

## 💰 COSTOS ESTIMADOS

### **Hosting**

| Servicio | Plan | Costo Mensual |
|----------|------|---------------|
| Railway (Backend) | Hobby | $5 (500 horas) |
| Vercel (Frontend) | Hobby | Gratis |
| Supabase (PostgreSQL) | Free | Gratis (hasta 500MB) |
| **TOTAL** | | **$5/mes** |

### **Escalabilidad**

- **Hobby ($5-10/mes)**: 100-500 usuarios, 10k contactos
- **Pro ($50-100/mes)**: 1k-5k usuarios, 100k contactos
- **Enterprise ($200+/mes)**: Ilimitado

---

## 📝 SIGUIENTE PASO

1. **Copiar el schema SQL** a tu base de datos PostgreSQL
2. **Crear el backend NestJS** siguiendo la estructura
3. **Implementar módulos** (auth, contacts, messages, etc.)
4. **Modificar frontend** para usar API en lugar de localStorage
5. **Testing** completo
6. **Deploy** a producción

¿Necesitas ayuda con algún paso específico? 🚀
