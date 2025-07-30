const { db } = require('./src/lib/db.js');
const { hashPassword } = require('./src/lib/auth.js');
const { UserRole } = require('@prisma/client');

async function createSuperAdmin() {
  try {
    const superAdminData = {
      email: 'superadmin@yourdomain.com',
      password: await hashPassword('admin123'),
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      isActive: true
    };

    // Check if Super Admin already exists
    const existingSuperAdmin = await db.user.findUnique({
      where: { email: superAdminData.email }
    });

    if (existingSuperAdmin) {
      console.log('Super Admin already exists!');
      console.log('Email:', existingSuperAdmin.email);
      console.log('Name:', existingSuperAdmin.name);
      console.log('Role:', existingSuperAdmin.role);
      return existingSuperAdmin;
    }

    // Create Super Admin user
    const superAdmin = await db.user.create({
      data: superAdminData
    });

    console.log('Super Admin created successfully!');
    console.log('Email:', superAdmin.email);
    console.log('Password: admin123');
    console.log('User ID:', superAdmin.id);
    console.log('Role:', superAdmin.role);

    return superAdmin;
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    throw error;
  }
}

// Run the function
createSuperAdmin().catch(console.error);