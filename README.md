# About this Platform

nPlatform is a platform that provides a set of tools and services to help developers build and deploy applications quickly and efficiently. 

### Post Type
![](./public/preview.png)
### Map Type
![](./public/preview_1.png)
### Page Builder
![](./public/preview_2.png)
### Custom Lexical Editor
![](./public/preview_3.png)
### Dark Mode
![](./public/preview_4.png)

# Key Features Powering the Platform:

- **Granular User Role Management**: Define and control access with precision.
- **Centralized App Settings**: Configure and customize the application effortlessly.
- **Dynamic Content Hub (Posts/Blogs)**: Engage your audience with rich, easily managed content.
- **Integrated Stakeholder Management (Customers/Vendors)**: Streamline interactions and relationships.
- **Secure File Management**: Organize and access digital assets with confidence.
- **Efficient Order Processing**: Manage the entire order lifecycle seamlessly.
- **Comprehensive Product Catalog**: Showcase and manage your offerings effectively.
- ... and more capabilities designed for growth.

# Our Current Tech Stack Includes:

- **Tailwind CSS v4**: We leverage this utility-first CSS framework for rapid and highly customizable UI development, allowing for efficient styling directly within our components.
- **Next.js v15**: Built upon React, Next.js provides us with a powerful framework for building performant and scalable web applications, offering features like server-side rendering and API routes.
- **NextAuth.js v5**: We use this comprehensive authentication library to implement secure and flexible user authentication, supporting various providers and strategies.
- **Prisma ORM v6**: Our data layer is managed with Prisma, a modern ORM that ensures type-safe database access and simplifies database interactions for our Node.js and TypeScript backend.
- **Meta Lexical Editor**: For rich text editing capabilities, we've integrated the highly extensible and performant Lexical framework, enabling collaborative and feature-rich content creation.
- **Radix UI**: We utilize this collection of unstyled and accessible UI primitives to build robust and user-friendly interfaces with complete control over styling and behavior.
- **Next Themes**: Implementing dark mode and other custom themes is streamlined with Next Themes, providing a simple and efficient way to enhance the user experience.
- **Lucide Icons**: Our interfaces are enriched with beautiful and consistent open-source icons from Lucide, ensuring a clean and professional visual style.
- **Zod Form**: We employ Zod for robust form validation, defining clear schemas and ensuring type safety for reliable and user-friendly form handling.
- **Redux, Redux Persist**: For managing complex application state, we use Redux, complemented by Redux Persist to maintain state across user sessions, improving persistence and user experience.
- **Upload file to R2**: Uploading files to server or Amazon S3 or Cloudflare R2
- **Supabase**: 
- **React Email & NodeMailer**: 
- ...

# Setup & Running

## 🚀 Quick Start

### 1. Create Environment File

Copy `.env.sample` to `.env`:

```bash
cp .env.sample .env
```

### 2. Add Next Auth Secret Key

Generate authentication secret:

```bash
npx auth secret
```
Then select => Yes

### 3. Install Dependencies

```bash
yarn
# or
npm install
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Seed database with initial data
npm run seed
```

### 5. Run the Application

```bash
# Quick start (uses app.sh)
sh app.sh

# Or using npm scripts
npm run dev
```

## 📋 Available Commands

### Development Commands

| Command | Description | Script Location |
|---------|-------------|----------------|
| `npm run dev` | Start development server with Turbopack | - |
| `npm run build` | Build for production with Turbopack | - |
| `npm run start` | Start production server | - |
| `npm run lint` | Run ESLint without cache | - |
| `npm run format` | Format code with ESLint + Biome | - |
| `npm run check-types` | TypeScript type checking | - |

### Standalone Deployment

| Command | Description | Script Location |
|---------|-------------|----------------|
| `npm run build:standalone` | Build standalone application | `cmd/build-standalone.sh` |
| `npm run start:standalone` | Start standalone server | `cmd/start-standalone.sh` |

### Database Commands

| Command | Description | Script Location |
|---------|-------------|----------------|
| `npm run generate` | Generate Prisma client | - |
| `npm run migrate` | Run database migrations | - |
| `npm run reset` | Reset database (dev only) | - |
| `npm run seed` | Seed database with data | - |
| `npm run update` | Check migration status | - |

### Performance & Analysis

| Command | Description | Script Location |
|---------|-------------|----------------|
| `npm run optimize` | Basic performance optimization | `scripts/optimize-performance.sh` |
| `npm run optimize:advanced` | Advanced optimization | `scripts/advanced-optimize.sh` |
| `npm run analyze` | Analyze bundle size | - |
| `npm run bundle:analyze` | Bundle analysis with Turbopack | - |
| `npm run perf:monitor` | Monitor performance | `scripts/performance-monitor.js` |

### Email Development

| Command | Description |
|---------|-------------|
| `npm run email` | Start email development server on port 9000 |

## 🛠️ Command Scripts Directory (`/cmd`)

### Core Development Scripts

- **`app.sh`** - Main application launcher
- **`dev.sh`** - Development server startup
- **`build.sh`** - Production build script
- **`format.sh`** - Code formatting script
- **`kill.sh`** - Kill running processes

### Database Scripts

- **`migrate.sh`** - Database migration helper
- **`prisma-migrate.sh`** - Prisma-specific migrations
- **`prisma-seed.sh`** - Database seeding script
- **`reset.sh`** - Reset development database

### Deployment Scripts

- **`build-standalone.sh`** - Build standalone application
- **`start-standalone.sh`** - Start standalone server
- **`beta.sh`** - Beta deployment script
- **`docs.sh`** - Documentation generation

## ⚡ Performance Scripts Directory (`/scripts`)

- **`optimize-performance.sh`** - Basic performance optimizations
- **`advanced-optimize.sh`** - Advanced performance tuning
- **`performance-monitor.sh`** - Performance monitoring setup
- **`migrate-permissions.sh`** - Permission system migration

## 📚 Documentation (`/CHANGELOG`)

### Migration Guides
- **`MIGRATION_STATUS.md`** - Current migration status
- **`TURBOPACK_MIGRATION.md`** - Turbopack migration guide
- **`REDUX_AUTH_IMPROVEMENTS.md`** - Redux authentication updates

### Performance Guides  
- **`PERFORMANCE_OPTIMIZATION.md`** - Performance optimization guide
- **`PERFORMANCE_PRODUCTION_GUIDE.md`** - Production performance guide
- **`PERFORMANCE_RECOMMENDATIONS.md`** - Performance recommendations
- **`VERCEL_OPTIMIZATION.md`** - Vercel-specific optimizations

### System Guides
- **`PERMISSION_SYSTEM_GUIDE.md`** - Permission system documentation

## 🔌 API Structure (`/src/app/api`)

### Authentication APIs
```
/api/auth/
├── [...nextauth]/route.ts    # NextAuth.js handler
└── signin/route.ts           # Custom signin endpoint
```

### Admin APIs (`/api/v1/admin`)
```
/api/v1/admin/
├── route.ts                  # Admin dashboard API
├── posts/                    # Post management
├── customers/                # Customer management  
├── users/                    # User management
├── categories/               # Category management
├── attributes/               # Product attributes
├── files/                    # File management
├── upload/                   # File upload
├── orders/                   # Order management
├── settings/                 # App settings
└── search/                   # Admin search
```

### Public APIs (`/api/v1/public`)
```
/api/v1/public/
├── posts/                    # Public post access
└── pages/                    # Public page access
```

### API Endpoints Overview

#### Admin Endpoints
- **Posts**: `GET|POST /api/v1/admin/posts`, `GET|PUT|DELETE /api/v1/admin/posts/[id]`
- **Customers**: `GET|POST /api/v1/admin/customers`, `GET|PUT|DELETE /api/v1/admin/customers/[id]`
- **Users**: `GET|POST /api/v1/admin/users`, `GET|PUT|DELETE /api/v1/admin/users/[id]`
- **Categories**: `GET|POST /api/v1/admin/categories`, `GET|PUT|DELETE /api/v1/admin/categories/[id]`
- **Files**: `GET|POST /api/v1/admin/files`, `GET|DELETE /api/v1/admin/files/[id]`
- **Orders**: `GET|POST /api/v1/admin/orders`, `GET|PUT|DELETE /api/v1/admin/orders/[id]`
- **Upload**: `POST /api/v1/admin/upload`
- **Settings**: `GET|PUT /api/v1/admin/settings`
- **Search**: `GET /api/v1/admin/search`

#### Public Endpoints
- **Posts**: `GET /api/v1/public/posts`, `GET /api/v1/public/posts/[id]`
- **Pages**: `GET /api/v1/public/pages/[id]`

## 🚢 Deployment Options

### 1. Development
```bash
npm run dev
```

### 2. Production (Vercel/Platform)
```bash
npm run build
npm run start
```

### 3. Standalone Deployment
```bash
npm run build:standalone
npm run start:standalone
```

### 4. Docker Deployment
```bash
docker build -t nplatform .
docker run -p 3000:3000 nplatform
```

## 🔧 Environment Variables

Create `.env` file with these variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nplatform"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-id"  
GITHUB_SECRET="your-github-secret"

# Email
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# File Upload
MAX_FILE_SIZE="10mb"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# API
PUBLIC_API_URL="http://localhost:3000/api"
```

## 📖 Additional Resources

- **Standalone Deployment Guide**: See `STANDALONE_DEPLOYMENT.md`
- **Performance Optimization**: See `CHANGELOG/PERFORMANCE_OPTIMIZATION.md`
- **Permission System**: See `CHANGELOG/PERMISSION_SYSTEM_GUIDE.md`
- **API Documentation**: Available at `/api/v1` when running
