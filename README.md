# LCEO Nonprofit Platform - Backend Architecture

## **Project Overview**
A comprehensive backend system for Life-Changing Endeavor Organization (LCEO) supporting donor management, beneficiary tracking, program monitoring, and impact reporting with USSD/offline capabilities.

## **Tech Stack**

### **Core Backend**
- **Framework**: NestJS (Node.js with TypeScript)
- **Language**: TypeScript (strict mode enabled)
- **Package Manager**: npm or yarn

### **Database**
- **Primary**: PostgreSQL 15+ (relational data)
- **Secondary**: MongoDB (optional for logs/content)
- **Cache**: Redis 7+ (sessions, queues, caching)
- **ORM**: TypeORM with migrations

### **External Services**
- **Payments**: Stripe + Mobile Money APIs (MTN, Airtel Money)
- **SMS/USSD**: Africa's Talking API
- **Email**: SendGrid
- **File Storage**: Cloudinary
- **Data Collection**: Kobo Toolbox REST API
- **Monitoring**: Sentry (error tracking)

### **Development Tools**
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI
- **CI/CD**: GitHub Actions
- **Containerization**: Docker & Docker Compose
- **Environment**: Node.js 18+

## **Project Structure**

```
life-changing-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.module.ts
│   │   ├── database.config.ts
│   │   ├── validation-schema.ts
│   │   └── constants/
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── middleware/
│   │   └── pipes/
│   ├── shared/
│   │   ├── database/
│   │   ├── services/
│   │   ├── utils/
│   │   └── interfaces/
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/
│       │   ├── dto/
│       │   └── interfaces/
│       ├── users/
│       ├── beneficiaries/
│       ├── donations/
│       ├── programs/
│       ├── content/
│       ├── ussd/
│       ├── analytics/
│       ├── admin/
│       ├── notifications/
│       └── webhooks/
├── test/
├── migrations/
├── scripts/
├── docker/
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── nest-cli.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## **Complete Database Schema with TypeORM**

### **Core Entities**

#### **1. User Entity**
#### **2. Beneficiary Entity**
#### **3. Donor Entity**
#### **4. Staff Entity**


### **Program Management Entities**

#### **5. Program Entity**
#### **6. Project Entity**

### **Donation System Entities**

#### **7. Donation Entity**
#### **8. Recurring Donation Entity**

### **Tracking & Impact Entities**

#### **9. Weekly Tracking Entity**
#### **10. Goal Entity**

### **USSD & Communication Entities**

#### **11. USSD Session Entity**
#### **12. SMS/Notification Entity**

### **Content Management Entities**

#### **13. Story/Testimonial Entity**

### **System Entities**

#### **14. Activity Log Entity**

## **Environment Variables**

Create `.env` file:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# ============================================
# DATABASE
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lceo
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lceo

# ============================================
# REDIS
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# ============================================
# PAYMENT GATEWAYS
# ============================================
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Mobile Money - MTN Rwanda
MTN_MOMO_API_KEY=xxx
MTN_MOMO_USER_ID=xxx
MTN_MOMO_PRIMARY_KEY=xxx

# Mobile Money - Airtel Money Rwanda
AIRTEL_MONEY_API_KEY=xxx
AIRTEL_MONEY_CLIENT_ID=xxx
AIRTEL_MONEY_CLIENT_SECRET=xxx

# ============================================
# COMMUNICATION SERVICES
# ============================================
# Africa's Talking (SMS/USSD)
AFRICAS_TALKING_API_KEY=xxx
AFRICAS_TALKING_USERNAME=xxx
AFRICAS_TALKING_SHORT_CODE=xxx

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@lceo.org
EMAIL_FROM_NAME=LCEO

# ============================================
# FILE STORAGE
# ============================================
# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# ============================================
# EXTERNAL INTEGRATIONS
# ============================================
# Kobo Toolbox
KOBO_TOOLBOX_TOKEN=xxx
KOBO_BASE_URL=https://kf.kobotoolbox.org
KOBO_FORM_IDS=form1_id,form2_id

# ============================================
# FEATURE TOGGLES
# ============================================
ENABLE_USSD=true
ENABLE_OFFLINE_SYNC=true
ENABLE_KOBO_SYNC=true
ENABLE_PAYMENT=true

# ============================================
# MONITORING
# ============================================
SENTRY_DSN=xxx

# ============================================
# CORS
# ============================================
CORS_ORIGIN=http://localhost:3001
```

## **API Endpoints Documentation**

### **Authentication**
```
POST   /auth/register               # Register new user
POST   /auth/login                  # Login
POST   /auth/logout                 # Logout
POST   /auth/refresh-token          # Refresh JWT token
POST   /auth/forgot-password        # Request password reset
POST   /auth/reset-password         # Reset password
POST   /auth/verify-phone           # Verify phone number
POST   /auth/verify-email           # Verify email
```

### **Users**
```
GET    /users/profile               # Get current user profile
PUT    /users/profile               # Update profile
GET    /users/beneficiaries         # Get beneficiaries (admin)
GET    /users/donors                # Get donors (admin)
GET    /users/staff                 # Get staff (admin)
PUT    /users/:id/role              # Update user role (admin)
PUT    /users/:id/status            # Update user status (admin)
```

### **Beneficiaries**
```
GET    /beneficiaries               # List beneficiaries
GET    /beneficiaries/:id           # Get beneficiary details
POST   /beneficiaries               # Create beneficiary (admin)
PUT    /beneficiaries/:id           # Update beneficiary
DELETE /beneficiaries/:id           # Delete beneficiary (admin)
GET    /beneficiaries/:id/progress  # Get beneficiary progress
GET    /beneficiaries/:id/trackings # Get tracking history
POST   /beneficiaries/:id/trackings # Submit weekly tracking
GET    /beneficiaries/:id/goals     # Get goals
POST   /beneficiaries/:id/goals     # Create goal
PUT    /beneficiaries/:id/goals/:goalId  # Update goal
```

### **Programs & Projects**
```
GET    /programs                    # List all programs
GET    /programs/:id                # Get program details
POST   /programs                    # Create program (admin)
PUT    /programs/:id                # Update program (admin)
DELETE /programs/:id                # Delete program (admin)
GET    /programs/:id/projects       # Get program projects
GET    /programs/:id/beneficiaries  # Get program beneficiaries
GET    /programs/:id/impact         # Get program impact metrics

GET    /projects                    # List all projects
GET    /projects/:id                # Get project details
POST   /projects                    # Create project (admin)
PUT    /projects/:id                # Update project (admin)
GET    /projects/:id/donations      # Get project donations
```

### **Donations**
```
GET    /donations                   # List donations (admin/donor)
POST   /donations                   # Create donation
GET    /donations/:id               # Get donation details
POST   /donations/:id/cancel        # Cancel donation
GET    /donations/recurring         # List recurring donations
POST   /donations/recurring         # Create recurring donation
PUT    /donations/recurring/:id     # Update recurring donation
DELETE /donations/recurring/:id     # Cancel recurring donation
POST   /donations/webhook/stripe    # Stripe webhook
POST   /donations/webhook/momo      # Mobile money webhook
```

### **USSD API**
```
POST   /ussd                        # USSD endpoint (Africa's Talking)
GET    /ussd/sessions               # List USSD sessions (admin)
GET    /ussd/sessions/:id           # Get USSD session details
POST   /ussd/offline-sync           # Sync offline data
GET    /ussd/menu/:phone            # Get current menu state
```

### **Content Management**
```
GET    /content/pages               # List pages
GET    /content/pages/:slug         # Get page by slug
POST   /content/pages               # Create page (admin)
PUT    /content/pages/:id           # Update page (admin)
DELETE /content/pages/:id           # Delete page (admin)

GET    /content/stories             # List stories
GET    /content/stories/:id         # Get story details
POST   /content/stories             # Create story (admin)
PUT    /content/stories/:id         # Update story (admin)

GET    /content/resources           # List resources
POST   /content/resources           # Upload resource (admin)
DELETE /content/resources/:id       # Delete resource (admin)
```

### **Admin Dashboard**
```
GET    /admin/dashboard/stats       # Dashboard statistics
GET    /admin/dashboard/analytics   # Advanced analytics
GET    /admin/reports/donations     # Generate donation report
GET    /admin/reports/beneficiaries # Generate beneficiary report
GET    /admin/reports/programs      # Generate program report
POST   /admin/import/beneficiaries  # Import beneficiaries from Excel
POST   /admin/import/donations      # Import donations from CSV
POST   /admin/sync/kobo             # Sync with Kobo Toolbox
GET    /admin/activity-logs         # View activity logs
GET    /admin/system-health         # System health check
```

## **Setup & Installation**

### **1. Prerequisites**
```bash
# Install Node.js 18+
# Install PostgreSQL 15+
# Install Redis 7+
# Install Docker (optional)
```

### **2. Clone and Install**
```bash
# Clone the repository
git clone https://github.com/Solvit-Africa-Training-Center/life-changing-backend.git
cd life-changing-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configurations
nano .env
```

### **3. Database Setup**
```bash
# Start PostgreSQL and Redis
# Using Docker:
docker-compose up -d postgres redis

# Or manually install and start services

# Run migrations
npm run migration:run

# Seed initial data (optional)
npm run seed
```

### **4. Development**
```bash
# Start in development mode
npm run start:dev

# The API will be available at http://localhost:3000
# API documentation at http://localhost:3000/api
```

### **5. Production Deployment**
```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod

# Or using PM2
pm2 start dist/main.js --name lceo-api
```

## **Testing**

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## **API Documentation**

The API is automatically documented using Swagger/OpenAPI. After starting the server, visit:

- Development: `http://localhost:3000/api`
- Production: `https://api.lceo.org/api`

## **Security Considerations**

### **1. Authentication & Authorization**
- JWT tokens with short expiration
- Refresh token rotation
- Role-based access control (RBAC)
- API rate limiting
- IP whitelisting for admin endpoints

### **2. Data Protection**
- Encryption at rest for sensitive data
- SSL/TLS for all communications
- Regular security audits
- GDPR compliance for donor data

### **3. Payment Security**
- PCI DSS compliance through Stripe
- Never store raw payment details
- Use payment gateway tokens
- Regular security scans

## **Monitoring & Maintenance**

### **1. Health Checks**
```bash
# Health check endpoint
GET /health

# Database status
GET /health/db

# Redis status
GET /health/redis
```

### **2. Logging**
- Structured logging with Winston
- Error tracking with Sentry
- Activity logging for audit trails
- Performance monitoring

### **3. Backup Strategy**
```bash
# Automated daily backups
# Off-site backup storage
# Regular restore testing
# Point-in-time recovery
```

## **Deployment with Docker**

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec backend npm run migration:run

# Scale services
docker-compose up -d --scale backend=3
```

## **Troubleshooting**

### **Common Issues**

1. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check connection string in .env
   # Test connection manually
   psql -h localhost -U postgres -d lceo
   ```

2. **Redis Connection Issues**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Should respond with PONG
   ```

3. **Migration Issues**
   ```bash
   # Revert last migration
   npm run migration:revert
   
   # Generate new migration
   npm run migration:generate --name=MigrationName
   ```

4. **Environment Variables**
   ```bash
   # Verify all required variables are set
   node -e "require('dotenv').config(); console.log(process.env)"
   ```

## **Support & Contact**

For technical support:
- Email: tech-support@lceo.org
- Slack: #lceo-tech-team
- GitHub Issues: https://github.com/lceo/lceo-backend/issues

## **License**

This project is proprietary software owned by Life-Changing Endeavor Organization (LCEO). All rights reserved.

---

**Next Steps:**
1. Set up your environment variables in `.env`
2. Run database migrations
3. Seed initial data (admin users, programs)
4. Configure external services (Stripe, Africa's Talking, etc.)
5. Test the USSD flow with a test phone number
6. Set up monitoring and alerts
7. Deploy to production environment

This comprehensive backend architecture provides all the necessary components for LCEO's digital platform, with special attention to:

- **Accessibility** through USSD and offline capabilities
- **Scalability** with modular NestJS structure
- **Security** with proper authentication and data protection
- **Integration** with external services (Kobo, payments, communications)
- **Admin capabilities** for managing beneficiaries, programs, and donations
- **Multi-language support** for English and Kinyarwanda