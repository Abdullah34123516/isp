#!/bin/bash

echo "🚀 Setting up ISP Billing App with SQLite..."
echo "=========================================="

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file..."
    echo "DATABASE_URL=file:./db/custom.db" > .env
    echo "JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters-long" >> .env
    echo "NODE_ENV=development" >> .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Step 3: Create database directory
echo "📁 Creating database directory..."
mkdir -p db
echo "✅ Database directory created"

# Step 4: Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate
echo "✅ Prisma client generated"

# Step 5: Push database schema
echo "💾 Pushing database schema..."
npm run db:push
echo "✅ Database schema pushed"

# Step 6: Verify setup
echo "🔍 Verifying setup..."
if [ -f "db/custom.db" ]; then
    echo "✅ Database file created successfully"
    echo "📊 Database file size: $(ls -lh db/custom.db | awk '{print $5}')"
else
    echo "❌ Database file not found"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo "=========================================="
echo "🚀 Start the development server with:"
echo "   npm run dev"
echo ""
echo "📝 Available commands:"
echo "   npm run dev          - Start development server"
echo "   npm run build        - Build for production"
echo "   npm run start        - Start production server"
echo "   npm run lint         - Run linting"
echo "   npm run db:push      - Push schema changes"
echo "   npm run db:generate  - Generate Prisma client"
echo ""
echo "🔐 Don't forget to update your JWT_SECRET in .env file!"
echo "   Generate a secure secret with: openssl rand -base64 32"