# 👥 User Setup Guide

This guide explains how to set up users for each role in the ISP billing platform: Super Admin, Sub Admin, ISP Owner, and Customer.

## 🎯 User Roles Overview

### 1. **Super Admin**
- **Permissions**: Manage entire platform, all users, system-wide metrics
- **Access**: Can create Sub Admins and ISP Owners
- **Dashboard**: System-wide statistics and user management

### 2. **Sub Admin**
- **Permissions**: Assist Super Admin, manage ISP Owners
- **Access**: Can create ISP Owners and view their data
- **Dashboard**: ISP Owner management and oversight

### 3. **ISP Owner**
- **Permissions**: Manage their own customers, plans, invoices, payments
- **Access**: Can create Customers and Plans for their tenant
- **Dashboard**: Business management for their ISP

### 4. **Customer**
- **Permissions**: View their own plans, invoices, make payments
- **Access**: Can only access their own data
- **Dashboard**: Personal account management

## 🚀 Setup Methods

### Method 1: Using API Calls (Recommended)

#### 1. Create Super Admin

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "admin123",
    "name": "Super Admin",
    "role": "SUPER_ADMIN"
  }'
```

#### 2. Create Sub Admin

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subadmin@example.com",
    "password": "admin123",
    "name": "Sub Admin",
    "role": "SUB_ADMIN"
  }'
```

#### 3. Create ISP Owner

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ispowner@example.com",
    "password": "admin123",
    "name": "ISP Owner",
    "role": "ISP_OWNER",
    "companyName": "TechNet Solutions"
  }'
```

#### 4. Create Customer

First, get the ISP Owner's tenant ID (it's the same as their user ID):

```bash
# Get ISP Owner info to get tenantId
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ispowner@example.com",
    "password": "admin123"
  }'
```

Then create the customer:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "customer123",
    "name": "John Customer",
    "role": "CUSTOMER",
    "tenantId": "ISP_OWNER_USER_ID_HERE"
  }'
```

### Method 2: Using the Interface

#### Step 1: Access the Application
1. Open http://localhost:3000
2. You'll see the role selection page

#### Step 2: Create Super Admin (Manual Database Setup)
Since you need a Super Admin to create other users, you'll need to create the first Super Admin directly:

```javascript
// In your database or using Prisma Studio
const superAdmin = await prisma.user.create({
  data: {
    email: 'superadmin@example.com',
    password: '$2a$12$hashedpasswordhere', // Hash the password
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    isActive: true
  }
});
```

#### Step 3: Login and Create Other Users
1. **Login as Super Admin**:
   - Go to http://localhost:3000/login/super-admin
   - Use the credentials you created
   - You'll be redirected to the Super Admin dashboard

2. **Create Sub Admin**:
   - In the Super Admin dashboard, navigate to "Users"
   - Click "Add User" or similar button
   - Fill in the details:
     ```
     Email: subadmin@example.com
     Name: Sub Admin
     Role: SUB_ADMIN
     Password: admin123
     ```

3. **Create ISP Owner**:
   - Navigate to "ISP Owners" or "Users"
   - Click "Add ISP Owner"
   - Fill in the details:
     ```
     Email: ispowner@example.com
     Name: ISP Owner
     Company Name: TechNet Solutions
     Role: ISP_OWNER
     Password: admin123
     ```

4. **Create Customer**:
   - First, login as ISP Owner
   - Navigate to "Customers"
   - Click "Add Customer"
   - Fill in the details:
     ```
     Email: customer@example.com
     Name: John Customer
     Phone: +1-555-0123
     Address: 123 Main St
     Role: CUSTOMER
     ```

### Method 3: Database Seed Script

Create a seed script to populate initial users:

```javascript
// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@example.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true
    }
  });

  // Create Sub Admin
  const subAdmin = await prisma.user.create({
    data: {
      email: 'subadmin@example.com',
      password: hashedPassword,
      name: 'Sub Admin',
      role: 'SUB_ADMIN',
      isActive: true
    }
  });

  // Create ISP Owner
  const ispOwner = await prisma.user.create({
    data: {
      email: 'ispowner@example.com',
      password: hashedPassword,
      name: 'ISP Owner',
      role: 'ISP_OWNER',
      isActive: true,
      tenantId: 'isp-owner-id' // Will be set after creation
    }
  });

  // Create ISP Owner profile
  await prisma.ispOwner.create({
    data: {
      userId: ispOwner.id,
      companyName: 'TechNet Solutions',
      tenantId: ispOwner.id
    }
  });

  // Update ISP Owner with tenant ID
  await prisma.user.update({
    where: { id: ispOwner.id },
    data: { tenantId: ispOwner.id }
  });

  // Create Customer
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: hashedPassword,
      name: 'John Customer',
      role: 'CUSTOMER',
      isActive: true,
      tenantId: ispOwner.id
    }
  });

  // Create Customer profile
  await prisma.customer.create({
    data: {
      userId: customer.id,
      ispOwnerId: ispOwner.id,
      name: 'John Customer',
      email: 'customer@example.com'
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add this to your `package.json`:
```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

Run the seed:
```bash
npx prisma db seed
```

## 🔑 Default Credentials for Testing

Here are the default credentials you can use for testing:

### Super Admin
- **Email**: `superadmin@example.com`
- **Password**: `admin123`
- **Login URL**: http://localhost:3000/login/super-admin

### Sub Admin
- **Email**: `subadmin@example.com`
- **Password**: `admin123`
- **Login URL**: http://localhost:3000/login/sub-admin

### ISP Owner
- **Email**: `ispowner@example.com`
- **Password**: `admin123`
- **Company**: TechNet Solutions
- **Login URL**: http://localhost:3000/login/isp-owner

### Customer
- **Email**: `customer@example.com`
- **Password**: `customer123`
- **Login URL**: http://localhost:3000/login/customer

## 📋 User Creation Workflow

### 1. Initial Setup (First Time)
```
1. Create Super Admin manually (via database or API)
2. Login as Super Admin
3. Create Sub Admins (optional)
4. Create ISP Owners
5. Each ISP Owner creates their own Customers
```

### 2. Day-to-Day Operations
```
Super Admin → Creates Sub Admins and ISP Owners
Sub Admin → Creates ISP Owners and manages them
ISP Owner → Creates Customers and manages their business
Customer → Views their account and makes payments
```

## 🔧 Troubleshooting

### Common Issues

1. **Cannot Login**:
   - Make sure the user exists in the database
   - Check if the user is active (`isActive: true`)
   - Verify the password is correct

2. **Permission Denied**:
   - Ensure the user has the correct role
   - Check if the tenant ID is set correctly for ISP Owners and Customers
   - Verify the user is active

3. **Cannot Create Users**:
   - Make sure you're logged in as a user with appropriate permissions
   - Super Admin can create all roles
   - Sub Admin can create ISP Owners
   - ISP Owner can create Customers

### Database Checks

```sql
-- Check all users
SELECT id, email, name, role, tenantId, isActive FROM users;

-- Check ISP Owners
SELECT u.id, u.email, u.name, io.companyName, io.tenantId 
FROM users u 
JOIN isp_owners io ON u.id = io.userId;

-- Check Customers
SELECT u.id, u.email, u.name, c.ispOwnerId, c.status 
FROM users u 
JOIN customers c ON u.id = c.userId;
```

## 🚀 Quick Setup Commands

For quick testing, use these curl commands:

```bash
# Create Super Admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"admin123","name":"Super Admin","role":"SUPER_ADMIN"}'

# Create Sub Admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"subadmin@example.com","password":"admin123","name":"Sub Admin","role":"SUB_ADMIN"}'

# Create ISP Owner
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ispowner@example.com","password":"admin123","name":"ISP Owner","role":"ISP_OWNER","companyName":"TechNet Solutions"}'

# Get ISP Owner tenant ID (login first)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ispowner@example.com","password":"admin123"}'

# Create Customer (replace TENANT_ID with actual tenant ID)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"customer123","name":"John Customer","role":"CUSTOMER","tenantId":"TENANT_ID"}'
```

Now you have a complete setup for all user roles in your ISP billing platform! 🎉