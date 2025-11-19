#!/usr/bin/env node

/**
 * ChatFlow Pro - Database Setup Script
 * This script initializes the database and creates initial admin user
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: '173.249.14.83',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '80pV9fFFP7P6oZ7aoIUHNyZjuKFRHN3x',
};

// Initial organization and user data
const orgData = {
  name: 'ChatFlow Pro',
  slug: 'chatflow-pro',
  plan: 'enterprise',
};

const adminData = {
  username: 'G6z9ns1CpUNlGGx6',
  password: 'RCb7yGphRO6whOuxugALmpJOkIJosD6W',
  email: 'admin@chatflow.local',
  role: 'admin',
};

async function main() {
  console.log('🚀 ChatFlow Pro - Database Setup\n');

  const client = new Client(dbConfig);

  try {
    // Connect to database
    console.log('📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read and execute schema SQL
    console.log('📄 Reading database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'database-init.sql'), 'utf8');

    console.log('🔨 Creating tables, indexes, and triggers...');
    await client.query(schemaSQL);
    console.log('✅ Database schema created successfully\n');

    // Hash password
    console.log('🔐 Hashing admin password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);
    console.log('✅ Password hashed\n');

    // Insert organization
    console.log('🏢 Creating initial organization...');
    const orgResult = await client.query(
      `INSERT INTO public.organizations (name, slug, plan, is_active, ai_enabled)
       VALUES ($1, $2, $3, true, true)
       RETURNING id, name, slug`,
      [orgData.name, orgData.slug, orgData.plan]
    );
    const organization = orgResult.rows[0];
    console.log(`✅ Organization created: ${organization.name} (${organization.slug})\n`);

    // Insert admin user
    console.log('👤 Creating admin user...');
    const userResult = await client.query(
      `INSERT INTO public.users (organization_id, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, role`,
      [organization.id, adminData.email, passwordHash, adminData.role]
    );
    const user = userResult.rows[0];
    console.log(`✅ Admin user created: ${user.email} (${user.role})\n`);

    // Create default bot config
    console.log('🤖 Creating default bot configuration...');
    await client.query(
      `INSERT INTO public.bot_configs (
        organization_id,
        business_name,
        agent_type,
        language,
        tone,
        bot_enabled,
        connection_status
      )
      VALUES ($1, $2, $3, $4, $5, false, 'disconnected')`,
      [organization.id, orgData.name, 'vendedor', 'es', 'professional']
    );
    console.log('✅ Bot configuration created\n');

    // Summary
    console.log('════════════════════════════════════════════');
    console.log('✨ Database initialization completed!\n');
    console.log('📋 Summary:');
    console.log(`   Organization: ${organization.name}`);
    console.log(`   Slug: ${organization.slug}`);
    console.log(`   Organization ID: ${organization.id}`);
    console.log(`   Admin Email: ${user.email}`);
    console.log(`   Admin Password: ${adminData.password}`);
    console.log('════════════════════════════════════════════\n');

    console.log('🔧 Next steps:');
    console.log('   1. Update backend/.env with database connection');
    console.log('   2. Start the backend server');
    console.log('   3. Login with admin credentials');
    console.log('   4. Configure Evolution API, Flowise, and Chatwoot\n');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
