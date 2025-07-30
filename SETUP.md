# 🚀 Quick Setup Guide

This guide will help you set up the ISP Management Platform quickly with the default super admin user.

## ⚡ One-Command Setup

```bash
# Clone the repository
git clone https://github.com/Abdullah34123516/isp.git
cd isp

# Install dependencies and run setup
npm install && npm run setup
```

## 🔑 Default Login Credentials

After setup completes, you can immediately log in with:

- **Email**: `admin@isp.com`
- **Password**: `password`
- **Role**: `SUPER_ADMIN`

## 📋 What the Setup Script Does

1. **Creates .env file** with necessary environment variables
2. **Sets up database** using Prisma
3. **Seeds default super admin** user with the credentials above
4. **Generates Prisma client** for database operations

## 🚀 Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the default credentials.

## 🛠️ Manual Setup (If Needed)

If the automatic setup fails, you can set up manually:

```bash
# Install dependencies
npm install

# Create .env file
echo 'DATABASE_URL="file:./dev.db"\nNEXTAUTH_SECRET="your-secret-key-here"\nNEXTAUTH_URL="http://localhost:3000"' > .env

# Set up database
npm run db:push

# Seed database
npm run db:seed

# Start application
npm run dev
```

## 🔧 Environment Variables

The setup creates these environment variables:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

For a complete reference of all available environment variables, including optional configurations for production databases, email services, and MicroTik routers, see the `.env.example` file in the project root.

## 🎯 Next Steps After Login

1. **Change the default password** for security
2. **Create ISP Owners** to manage different ISP businesses
3. **Set up internet plans** for customers
4. **Add customers** and assign them to plans
5. **Configure routers** for PPPoE user management

## 🆘 Troubleshooting

### Database Issues
```bash
# Reset database
npm run db:reset

# Re-seed database
npm run db:seed
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Permission Issues
```bash
# Give execute permission to setup script
chmod +x setup.js
```

---

🎉 **You're ready to go!** The platform is now set up with a default super admin user.