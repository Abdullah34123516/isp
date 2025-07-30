# 🚀 ISP Billing Platform

A comprehensive multi-tenant SaaS platform for Internet Service Providers (ISPs) to manage customers, plans, invoices, and payments. Built with modern web technologies for scalability and performance.

## ✨ Technology Stack

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 JWT Authentication** - Secure token-based authentication

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Utilities
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Platform Features

### 👥 Multi-User Roles
- **Super Admin** - Manage the entire platform with system-wide metrics
- **Sub Admin** - Assist Super Admin and manage ISP Owners
- **ISP Owner** - Manage customers, plans, invoices, and payments
- **Customer** - View plans, invoices, and make payments

### 🏢 Multi-Tenant Architecture
- Complete tenant isolation for data security
- Each ISP Owner operates in their own isolated environment
- Scalable architecture supporting multiple businesses

### 💰 Billing & Invoicing
- Automated invoice generation
- Payment processing and tracking
- Multiple payment methods support
- Invoice status management (Pending, Paid, Overdue, Cancelled)

### 📊 Analytics & Reporting
- Revenue tracking and analytics
- Customer metrics and insights
- System-wide statistics for administrators
- Performance dashboards for all roles

### 🔐 Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- Secure API endpoints with middleware

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Abdullah34123516/isp.git
cd isp

# Install dependencies
npm install

# Run the automatic setup (creates database, seeds data, and creates .env file)
npm run setup
```

### Default Login Credentials

After running the setup, you can log in with these default credentials:

- **Email**: admin@isp.com
- **Password**: password
- **Role**: SUPER_ADMIN

### Manual Setup (Optional)

If you prefer to set up manually:

```bash
# Install dependencies
npm install

# Create .env file
echo 'DATABASE_URL="file:./db/custom.db"\nJWT_SECRET="your-super-secret-jwt-key"' > .env

# Set up database
npm run db:push

# Seed database with default admin user
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

The setup script automatically creates a `.env` file with the following variables:

```env
DATABASE_URL="file:./db/custom.db"
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

For a complete list of available environment variables and their descriptions, see the `.env.example` file in the project root. This file includes optional configurations for production databases, email services, MicroTik routers, and more.

### Running the Application

1. **Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

2. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User management
│   │   ├── plans/         # ISP plans
│   │   ├── customers/     # Customer management
│   │   ├── invoices/      # Invoice management
│   │   └── payments/      # Payment processing
│   ├── dashboard/         # Role-specific dashboards
│   │   ├── super-admin/   # Super Admin dashboard
│   │   ├── sub-admin/     # Sub Admin dashboard
│   │   ├── isp-owner/     # ISP Owner dashboard
│   │   └── customer/      # Customer dashboard
│   └── login/             # Role-specific login pages
├── components/            # Reusable React components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
└── lib/                   # Utility functions and configurations
    ├── auth.ts            # Authentication utilities
    ├── middleware.ts      # Authentication middleware
    ├── db.ts              # Database client
    └── utils.ts           # Utility functions
```

## 🎨 Available Features

### 🧩 UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar

### 📊 Advanced Data Features
- **Tables**: Powerful data tables with sorting, filtering, pagination
- **Charts**: Beautiful visualizations with Recharts
- **Forms**: Type-safe forms with React Hook Form + Zod validation

### 🎨 Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Theme Switching**: Built-in dark/light mode support
- **Responsive Design**: Mobile-first design principles

### 🔐 Backend Integration
- **Authentication**: JWT-based authentication with role-based access
- **Database**: Type-safe database operations with Prisma
- **API Client**: HTTP requests with Axios + TanStack Query
- **State Management**: Simple and scalable with Zustand

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Connect repository and configure build settings
- **Railway**: Deploy with Docker configuration
- **Heroku**: Deploy with proper buildpack configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Review the code comments for implementation details

---

Built with ❤️ for the ISP management community.