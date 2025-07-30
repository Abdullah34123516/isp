const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default super admin user
  const superAdminEmail = 'admin@isp.com';
  const superAdminPassword = 'password';
  
  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Default super admin created:');
    console.log(`   Email: ${superAdminEmail}`);
    console.log(`   Password: ${superAdminPassword}`);
    console.log(`   Role: SUPER_ADMIN`);
  } else {
    console.log('ℹ️  Super admin already exists');
  }

  // Create default sub admin user
  const subAdminEmail = 'subadmin@isp.com';
  const subAdminPassword = 'password';
  
  const existingSubAdmin = await prisma.user.findUnique({
    where: { email: subAdminEmail }
  });

  if (!existingSubAdmin) {
    const hashedPassword = await bcrypt.hash(subAdminPassword, 10);
    
    const subAdmin = await prisma.user.create({
      data: {
        email: subAdminEmail,
        password: hashedPassword,
        name: 'Sub Admin',
        role: 'SUB_ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Default sub admin created:');
    console.log(`   Email: ${subAdminEmail}`);
    console.log(`   Password: ${subAdminPassword}`);
    console.log(`   Role: SUB_ADMIN`);
  } else {
    console.log('ℹ️  Sub admin already exists');
  }

  // Create default ISP owner user and related ISP owner record
  const ispOwnerEmail = 'ispowner@isp.com';
  const ispOwnerPassword = 'password';
  
  const existingIspOwnerUser = await prisma.user.findUnique({
    where: { email: ispOwnerEmail }
  });

  if (!existingIspOwnerUser) {
    const hashedPassword = await bcrypt.hash(ispOwnerPassword, 10);
    
    const ispOwnerUser = await prisma.user.create({
      data: {
        email: ispOwnerEmail,
        password: hashedPassword,
        name: 'ISP Owner',
        role: 'ISP_OWNER',
        isActive: true,
      },
    });

    // Create ISP owner record
    const ispOwner = await prisma.ispOwner.create({
      data: {
        userId: ispOwnerUser.id,
        companyName: 'Default ISP Company',
        address: '123 Main Street, City, Country',
        phone: '+1234567890',
      },
    });

    // Update the user record to set the tenantId
    await prisma.user.update({
      where: { id: ispOwnerUser.id },
      data: { tenantId: ispOwner.id },
    });

    console.log('✅ Default ISP owner created:');
    console.log(`   Email: ${ispOwnerEmail}`);
    console.log(`   Password: ${ispOwnerPassword}`);
    console.log(`   Role: ISP_OWNER`);
    console.log(`   Company: Default ISP Company`);
    console.log(`   Tenant ID: ${ispOwner.id}`);
  } else {
    console.log('ℹ️  ISP owner already exists');
    
    // Check if the existing ISP owner user has the tenantId set
    const existingIspOwner = await prisma.ispOwner.findFirst({
      where: { userId: existingIspOwnerUser.id }
    });
    
    if (existingIspOwner && !existingIspOwnerUser.tenantId) {
      await prisma.user.update({
        where: { id: existingIspOwnerUser.id },
        data: { tenantId: existingIspOwner.id },
      });
      console.log('✅ Updated existing ISP owner user with tenantId');
    }
  }

  // Create default customer user and related customer record
  const customerEmail = 'customer@isp.com';
  const customerPassword = 'password';
  
  const existingCustomerUser = await prisma.user.findUnique({
    where: { email: customerEmail }
  });

  if (!existingCustomerUser) {
    const hashedPassword = await bcrypt.hash(customerPassword, 10);
    
    const customerUser = await prisma.user.create({
      data: {
        email: customerEmail,
        password: hashedPassword,
        name: 'Customer User',
        role: 'CUSTOMER',
        isActive: true,
      },
    });

    // Get the first ISP owner to associate with customer
    const ispOwner = await prisma.ispOwner.findFirst();
    
    if (ispOwner) {
      // Create customer record
      const customer = await prisma.customer.create({
        data: {
          userId: customerUser.id,
          ispOwnerId: ispOwner.id,
          name: 'Default Customer',
          email: customerEmail,
          phone: '+1234567891',
          address: '456 Customer Street, City, Country',
          status: 'ACTIVE',
        },
      });

      console.log('✅ Default customer created:');
      console.log(`   Email: ${customerEmail}`);
      console.log(`   Password: ${customerPassword}`);
      console.log(`   Role: CUSTOMER`);
      console.log(`   Associated with: ${ispOwner.companyName}`);
    } else {
      console.log('⚠️  Customer user created but no ISP owner found to associate with');
    }
  } else {
    console.log('ℹ️  Customer already exists');
  }

  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('📋 Default User Credentials:');
  console.log('   Super Admin: admin@isp.com / password');
  console.log('   Sub Admin:   subadmin@isp.com / password');
  console.log('   ISP Owner:   ispowner@isp.com / password');
  console.log('   Customer:    customer@isp.com / password');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });