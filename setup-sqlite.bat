@echo off
echo 🚀 Setting up ISP Billing App with SQLite...
echo ==========================================

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
npm install

REM Step 2: Create .env file if it doesn't exist
if not exist .env (
    echo ⚙️ Creating .env file...
    echo DATABASE_URL=file:./db/custom.db > .env
    echo JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters-long >> .env
    echo NODE_ENV=development >> .env
    echo ✅ .env file created
) else (
    echo ✅ .env file already exists
)

REM Step 3: Create database directory
echo 📁 Creating database directory...
if not exist db mkdir db
echo ✅ Database directory created

REM Step 4: Generate Prisma client
echo 🔧 Generating Prisma client...
npm run db:generate
echo ✅ Prisma client generated

REM Step 5: Push database schema
echo 💾 Pushing database schema...
npm run db:push
echo ✅ Database schema pushed

REM Step 6: Verify setup
echo 🔍 Verifying setup...
if exist db\custom.db (
    echo ✅ Database file created successfully
    for %%F in (db\custom.db) do echo 📊 Database file size: %%~zF bytes
) else (
    echo ❌ Database file not found
    pause
    exit /b 1
)

echo.
echo 🎉 Setup completed successfully!
echo ==========================================
echo 🚀 Start the development server with:
echo    npm run dev
echo.
echo 📝 Available commands:
echo    npm run dev          - Start development server
echo    npm run build        - Build for production
echo    npm run start        - Start production server
echo    npm run lint         - Run linting
echo    npm run db:push      - Push schema changes
echo    npm run db:generate  - Generate Prisma client
echo.
echo 🔐 Don't forget to update your JWT_SECRET in .env file!
echo    Generate a secure secret with: openssl rand -base64 32
echo.
pause