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

## 📡 API Endpoints

### 🔐 Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@isp.com",
  "password": "password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmdq6xykz0000z4j59qwhnpp0",
    "email": "admin@isp.com",
    "name": "Super Admin",
    "role": "SUPER_ADMIN",
    "tenantId": null,
    "isActive": true
  }
}
```

### 👥 Users Management

#### Get Users (Super/Sub Admin only)
```http
GET /api/users?page=1&limit=10&role=ISP_OWNER&search=john
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /api/users/[id]
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/users/[id]
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true
}
```

#### Delete User
```http
DELETE /api/users/[id]
Authorization: Bearer <token>
```

### 📋 Plans Management

#### Get Plans
```http
GET /api/plans?page=1&limit=10&tenantId=isp-owner-id&isActive=true
Authorization: Bearer <token>
```

**Response:**
```json
{
  "plans": [
    {
      "id": "plan123",
      "name": "Basic Plan",
      "description": "Basic internet plan",
      "price": 29.99,
      "speed": "100 Mbps",
      "dataLimit": "100 GB",
      "validity": 30,
      "ispOwnerId": "isp-owner-id",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### Create Plan
```http
POST /api/plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Plan",
  "description": "High-speed internet plan",
  "price": 59.99,
  "speed": "500 Mbps",
  "dataLimit": "500 GB",
  "validity": 30,
  "tenantId": "isp-owner-id"
}
```

#### Get Plan by ID
```http
GET /api/plans/[id]
Authorization: Bearer <token>
```

#### Update Plan
```http
PUT /api/plans/[id]
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Plan",
  "price": 69.99,
  "isActive": false
}
```

#### Delete Plan
```http
DELETE /api/plans/[id]
Authorization: Bearer <token>
```

### 🧾 Invoice Management

#### Get Invoices
```http
GET /api/invoices?page=1&limit=10&tenantId=isp-owner-id&status=PENDING
Authorization: Bearer <token>
```

**Response:**
```json
{
  "invoices": [
    {
      "id": "invoice123",
      "invoiceNo": "INV-2024-001",
      "customerId": "customer123",
      "planId": "plan123",
      "ispOwnerId": "isp-owner-id",
      "amount": 29.99,
      "dueDate": "2024-02-01T00:00:00.000Z",
      "status": "PENDING",
      "description": "Monthly internet service",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "customer": {
        "id": "customer123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "plan": {
        "id": "plan123",
        "name": "Basic Plan"
      },
      "payments": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### Create Invoice
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer123",
  "planId": "plan123",
  "amount": 29.99,
  "dueDate": "2024-02-01T00:00:00.000Z",
  "description": "Monthly internet service",
  "tenantId": "isp-owner-id"
}
```

#### Get Invoice by ID
```http
GET /api/invoices/[id]
Authorization: Bearer <token>
```

#### Update Invoice
```http
PUT /api/invoices/[id]
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "PAID",
  "amount": 29.99
}
```

#### Delete Invoice
```http
DELETE /api/invoices/[id]
Authorization: Bearer <token>
```

### 💳 Payment Management

#### Get Payments
```http
GET /api/payments?page=1&limit=10&tenantId=isp-owner-id&status=COMPLETED
Authorization: Bearer <token>
```

**Response:**
```json
{
  "payments": [
    {
      "id": "payment123",
      "invoiceId": "invoice123",
      "customerId": "customer123",
      "amount": 29.99,
      "status": "COMPLETED",
      "paymentDate": "2024-01-15T00:00:00.000Z",
      "transactionId": "txn_123456",
      "paymentMethod": "CREDIT_CARD",
      "notes": "Payment received",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "invoice": {
        "id": "invoice123",
        "invoiceNo": "INV-2024-001"
      },
      "customer": {
        "id": "customer123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### Create Payment
```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoiceId": "invoice123",
  "customerId": "customer123",
  "amount": 29.99,
  "paymentMethod": "CREDIT_CARD",
  "transactionId": "txn_123456",
  "notes": "Payment received"
}
```

#### Get Payment by ID
```http
GET /api/payments/[id]
Authorization: Bearer <token>
```

#### Update Payment
```http
PUT /api/payments/[id]
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "REFUNDED",
  "notes": "Payment refunded due to service issue"
}
```

#### Delete Payment
```http
DELETE /api/payments/[id]
Authorization: Bearer <token>
```

### 👤 Customer Management

#### Get Customers
```http
GET /api/customers?page=1&limit=10&tenantId=isp-owner-id&status=ACTIVE
Authorization: Bearer <token>
```

#### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State",
  "planId": "plan123",
  "tenantId": "isp-owner-id"
}
```

### 🌐 Router Management

#### Get Routers
```http
GET /api/routers?page=1&limit=10&tenantId=isp-owner-id
Authorization: Bearer <token>
```

#### Create Router
```http
POST /api/routers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Main Router",
  "ipAddress": "192.168.1.1",
  "port": 8728,
  "username": "admin",
  "password": "password",
  "location": "Data Center",
  "model": "MikroTik hEX",
  "tenantId": "isp-owner-id"
}
```

### 👥 PPPoE Users

#### Get PPPoE Users
```http
GET /api/pppoe-users?page=1&limit=10&tenantId=isp-owner-id
Authorization: Bearer <token>
```

#### Create PPPoE User
```http
POST /api/pppoe-users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123",
  "customerId": "customer123",
  "routerId": "router123",
  "planId": "plan123",
  "tenantId": "isp-owner-id"
}
```

### 📊 Statistics & Analytics

#### Super Admin Stats
```http
GET /api/super-admin/stats
Authorization: Bearer <token>
```

#### Sub Admin Stats
```http
GET /api/sub-admin/stats
Authorization: Bearer <token>
```

#### ISP Owner Stats
```http
GET /api/isp-owner/stats
Authorization: Bearer <token>
```

#### Customer Stats
```http
GET /api/customer/stats
Authorization: Bearer <token>
```

### 🔍 Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "message": "Good!"
}
```

## 🔐 Authentication & Authorization

All API endpoints (except `/api/auth/login` and `/api/health`) require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access Control

- **SUPER_ADMIN**: Access to all endpoints, can manage all tenants
- **SUB_ADMIN**: Access to most endpoints, can manage ISP owners
- **ISP_OWNER**: Access to own tenant data only (plans, customers, invoices, payments)
- **CUSTOMER**: Limited access to own data only

### Tenant Isolation

ISP owners can only access their own data. The system automatically filters data based on the `tenantId` parameter or the user's associated tenant.

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