# CITY WORKSHOP — Complete Project Architecture & Development Plan

**Document Version:** 1.0  
**Date:** August 2026  
**Status:** Architecture Planning Phase (Code Implementation Not Started)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Recommended Technology Stack](#1-recommended-technology-stack)
3. [Folder & Project Structure](#2-folder--project-structure)
4. [Frontend Architecture](#3-frontend-architecture)
5. [Backend Architecture](#4-backend-architecture)
6. [Database Architecture](#5-database-architecture)
7. [Authentication Architecture](#6-authentication-architecture)
8. [Role & Permission Architecture](#7-role--permission-architecture)
9. [API Architecture](#8-api-architecture)
10. [Real-time Architecture](#9-real-time-architecture)
11. [File/Storage Architecture](#10-filestorage-architecture)
12. [Marketplace Architecture](#11-marketplace-architecture)
13. [Booking Architecture](#12-booking-architecture)
14. [Technician/Rider Architecture](#13-techniciansrider-architecture)
15. [Franchise/City Architecture](#14-franchisecity-architecture)
16. [Admin Architecture](#15-admin-architecture)
17. [Security Architecture](#16-security-architecture)
18. [Testing Strategy](#17-testing-strategy)
19. [Deployment Architecture](#18-deployment-architecture)
20. [Environment Configuration](#19-environment-configuration)
21. [Phase-by-Phase Roadmap](#20-phase-by-phase-roadmap)

---

## Executive Summary

CITY WORKSHOP is a production-grade, multi-city home appliance repair and spare-parts marketplace platform. The architecture is designed to be:

- **Modular & Scalable**: Each major feature can be toggled on/off by Super Admin
- **Multi-tenant**: Support multiple cities, franchises, and vendors independently
- **Secure**: Enterprise-grade security with role-based access control
- **Configurable**: Business rules (pricing, commissions, fees) are admin-configurable, not hardcoded
- **Real-time**: WebSocket-based live updates for bookings, orders, and tracking
- **Cloud-native**: Container-ready, serverless-ready, CDN-optimized

**Why this architecture?**
- **Modularity** allows incremental feature releases and A/B testing
- **Multi-tenancy** enables single platform to serve multiple independent cities/franchises
- **Configuration-driven** business logic reduces development time for rule changes
- **Cloud-native design** ensures cost-efficiency and horizontal scalability
- **Layered architecture** enables parallel development across teams

---

## 1. Recommended Technology Stack

### Backend
| Layer | Technology | Why? |
|-------|-----------|------|
| **Runtime** | Node.js 20+ LTS | Fast I/O, JavaScript ecosystem, easy deployment, excellent scaling |
| **Framework** | NestJS | Enterprise-grade architecture, built-in dependency injection, GraphQL support, decorators for clean code |
| **Database** | PostgreSQL 15+ | ACID transactions (critical for payments), JSON columns (flexible configs), advanced indexing, PostGIS for location queries |
| **Cache** | Redis 7+ | Session management, real-time data, pub/sub for WebSockets, rate limiting |
| **Search** | Elasticsearch 8+ | Product search, booking history, logs, analytics queries (optional for Phase 1) |
| **Message Queue** | Bull/RabbitMQ | Async job processing (notifications, image compression, email/SMS), background workers |
| **File Storage** | AWS S3 / MinIO | Scalable file storage, CDN integration, signed URLs for security |
| **Authentication** | JWT + OAuth2/Passport | Stateless, scalable, social login ready |
| **API Documentation** | Swagger/OpenAPI | Auto-generated docs, client SDK generation |

### Frontend
| Layer | Technology | Why? |
|-------|-----------|------|
| **Framework** | React 18+ | Large ecosystem, component reusability, state management options |
| **Package Manager** | pnpm | Faster, more efficient than npm, monorepo support |
| **State Management** | Redux Toolkit + RTK Query | Predictable state, caching for API calls, DevTools support |
| **UI Component Lib** | MUI v5 + Tailwind CSS | Professional, accessible, mobile-first, fast |
| **Mobile App** | React Native / Expo | Code reuse, native performance, easy deployment |
| **Build Tool** | Vite | Fast dev server, optimized production builds |
| **Testing** | Vitest + React Testing Library | Fast unit tests, realistic component testing |
| **PWA** | Workbox | Offline support, background sync |
| **Maps** | Google Maps API / Mapbox | Real-time tracking, geolocation, route optimization |

### DevOps & Infrastructure
| Tool | Purpose | Why? |
|------|---------|------|
| **Containerization** | Docker + Docker Compose | Consistent environments, easy deployment |
| **Orchestration** | Kubernetes / AWS ECS | Auto-scaling, load balancing, self-healing |
| **CI/CD** | GitHub Actions | Native GitHub integration, no extra cost for public repos |
| **Monitoring** | DataDog / New Relic | APM, error tracking, performance monitoring |
| **Logging** | ELK Stack / CloudWatch | Centralized logs, searchable, analytics |
| **Infrastructure** | AWS / DigitalOcean / Azure | Managed services (RDS, ElastiCache), auto-scaling, global CDN |

### Admin & Utilities
| Tool | Purpose | Why? |
|------|---------|------|
| **Admin Panel** | React + Redux | Custom-built (see Admin Architecture section) |
| **Documentation** | GitBook / Notion | Internal documentation, API reference |
| **Code Quality** | ESLint + Prettier | Consistent formatting, error prevention |
| **Version Control** | Git + GitHub | Distributed, collaborative, industry standard |

---

## 2. Folder & Project Structure

```
city-workshop/
├── .github/
│   └── workflows/                    # GitHub Actions CI/CD
│       ├── backend-test-build.yml
│       ├── frontend-test-build.yml
│       └── deploy-production.yml
│
├── apps/                             # Monorepo apps
│   │
│   ├── backend/                      # NestJS API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   │
│   │   │   ├── common/               # Shared utilities
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/          # Exception filters
│   │   │   │   ├── guards/           # Auth guards, role guards
│   │   │   │   ├── interceptors/     # Logging, response formatting
│   │   │   │   ├── middleware/
│   │   │   │   ├── pipes/            # Validation pipes
│   │   │   │   └── utils/
│   │   │   │
│   │   │   ├── config/               # Configuration
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── cache.config.ts
│   │   │   │   ├── storage.config.ts
│   │   │   │   └── business-rules.config.ts
│   │   │   │
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   ├── oauth.strategy.ts
│   │   │   │   │   └── auth.module.ts
│   │   │   │   │
│   │   │   │   ├── users/
│   │   │   │   │   ├── users.controller.ts
│   │   │   │   │   ├── users.service.ts
│   │   │   │   │   ├── entities/user.entity.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── users.module.ts
│   │   │   │   │
│   │   │   │   ├── customers/
│   │   │   │   │   ├── customers.controller.ts
│   │   │   │   │   ├── customers.service.ts
│   │   │   │   │   ├── entities/customer.entity.ts
│   │   │   │   │   └── customers.module.ts
│   │   │   │   │
│   │   │   │   ├── technicians/
│   │   │   │   │   ├── technicians.controller.ts
│   │   │   │   │   ├── technicians.service.ts
│   │   │   │   │   ├── kyc.service.ts
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   ├── technician.entity.ts
│   │   │   │   │   │   └── kyc-document.entity.ts
│   │   │   │   │   └── technicians.module.ts
│   │   │   │   │
│   │   │   │   ├── bookings/
│   │   │   │   │   ├── bookings.controller.ts
│   │   │   │   │   ├── bookings.service.ts
│   │   │   │   │   ├── booking-assignment.service.ts
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   ├── booking.entity.ts
│   │   │   │   │   │   └── booking-timeline.entity.ts
│   │   │   │   │   ├── events/
│   │   │   │   │   │   ├── booking-created.event.ts
│   │   │   │   │   │   └── booking-status-changed.event.ts
│   │   │   │   │   └── bookings.module.ts
│   │   │   │   │
│   │   │   │   ├── marketplace/
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── vendors/
│   │   │   │   │   ├── orders/
│   │   │   │   │   ├── inventory/
│   │   │   │   │   ├── categories/
│   │   │   │   │   └── marketplace.module.ts
│   │   │   │   │
│   │   │   │   ├── payments/
│   │   │   │   │   ├── payments.controller.ts
│   │   │   │   │   ├── payments.service.ts
│   │   │   │   │   ├── gateway.service.ts
│   │   │   │   │   ├── wallet.service.ts
│   │   │   │   │   ├── entities/
│   │   │   │   │   └── payments.module.ts
│   │   │   │   │
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── notifications.service.ts
│   │   │   │   │   ├── email.service.ts
│   │   │   │   │   ├── sms.service.ts
│   │   │   │   │   ├── whatsapp.service.ts
│   │   │   │   │   ├── entities/
│   │   │   │   │   └── notifications.module.ts
│   │   │   │   │
│   │   │   │   ├── franchise/
│   │   │   │   │   ├── cities.controller.ts
│   │   │   │   │   ├── franchises.controller.ts
│   │   │   │   │   ├── entities/
│   │   │   │   │   └── franchise.module.ts
│   │   │   │   │
│   │   │   │   ├── admin/
│   │   │   │   │   ├── dashboard.controller.ts
│   │   │   │   │   ├── system-settings.service.ts
│   │   │   │   │   ├── feature-management.service.ts
│   │   │   │   │   ├── analytics.service.ts
│   │   │   │   │   ├── audit.service.ts
│   │   │   │   │   └── admin.module.ts
│   │   │   │   │
│   │   │   │   └── shared/
│   │   │   │       ├── entities/
│   │   │   │       ├── dto/
│   │   │   │       └── shared.module.ts
│   │   │   │
│   │   │   ├── database/
│   │   │   │   ├── migrations/
│   │   │   │   ├── seeds/
│   │   │   │   └── typeorm.config.ts
│   │   │   │
│   │   │   └── websocket/
│   │   │       ├── events.gateway.ts
│   │   │       ├── events.module.ts
│   │   │       └── socket-auth.middleware.ts
│   │   │
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── frontend/                     # React Web App
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── common/           # Reusable components
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Navigation.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   ├── customer/         # Customer pages
│   │   │   │   ├── technician/       # Technician pages
│   │   │   │   └── admin/            # Admin pages
│   │   │   │
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── bookings/
│   │   │   │   ├── marketplace/
│   │   │   │   ├── profile/
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── store/                # Redux store
│   │   │   │   ├── store.ts
│   │   │   │   ├── slices/
│   │   │   │   ├── api/              # RTK Query
│   │   │   │   └── hooks/
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── analytics.service.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   ├── styles/
│   │   │   ├── layouts/
│   │   │   └── constants/
│   │   │
│   │   ├── public/
│   │   ├── Dockerfile
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── mobile/                       # React Native App (Technician + Rider)
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── navigation/
│   │   │   ├── store/
│   │   │   └── App.tsx
│   │   │
│   │   ├── app.json
│   │   ├── app.config.ts
│   │   └── package.json
│   │
│   └── admin/                        # Admin Dashboard (React)
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── store/
│       │   └── App.tsx
│       │
│       └── package.json
│
├── packages/                         # Shared packages (monorepo)
│   ├── common/                       # Shared types, constants, utils
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── api-client/                   # Generated API client
│       ├── src/
│       ├── package.json
│       └── README.md
│
├── docker/
│   ├── nginx.conf                    # Nginx config for production
│   ├── postgres-init.sql             # DB initialization
│   └── redis.conf
│
├── docs/
│   ├── API.md                        # API documentation
│   ├── DATABASE.md                   # Database schema docs
│   ├── DEPLOYMENT.md                 # Deployment guide
│   ├── SECURITY.md                   # Security guidelines
│   └── DEVELOPMENT.md                # Development setup
│
├── terraform/                        # IaC for AWS/Cloud
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── environments/
│
├── .env.example                      # Example env vars
├── .gitignore
├── docker-compose.yml                # Full stack local development
├── pnpm-workspace.yaml               # Monorepo config
├── package.json                      # Root package
└── ARCHITECTURE.md                   # This file
```

**Why this structure?**
- **Monorepo**: Shared code, synchronized versioning, single CI/CD pipeline
- **Modular by feature**: Easy to locate code, clear dependencies
- **Separation of concerns**: Backend, frontend, mobile clearly isolated
- **Scalable**: Can split into separate repos later if needed
- **Infrastructure as Code**: Terraform enables reproducible deployments

---

## 3. Frontend Architecture

### 3.1 Application Shell & Routing

```
App.tsx
├── AuthContext (JWT token management)
├── SocketContext (WebSocket connection)
├── ThemeProvider (Dark/Light mode)
└── Router
    ├── Public Routes
    │   ├── /login
    │   ├── /register
    │   ├── /forgot-password
    │   └── /verify-otp
    │
    ├── Customer Routes (Protected)
    │   ├── /dashboard
    │   ├── /bookings
    │   │   ├── /new (multi-step form)
    │   │   ├── /:id
    │   │   └── /:id/track
    │   ├── /marketplace
    │   │   ├── /products
    │   │   ├── /cart
    │   │   └── /orders
    │   ├── /profile
    │   └── /wallet
    │
    ├── Technician Routes (Protected)
    │   ├── /dashboard
    │   ├── /jobs
    │   │   ├── /available
    │   │   ├── /assigned
    │   │   └── /:id/details
    │   ├── /navigation
    │   ├── /earnings
    │   ├── /wallet
    │   └── /profile
    │
    ├── Admin Routes (Protected + Role-based)
    │   ├── /admin/dashboard
    │   ├── /admin/users
    │   ├── /admin/bookings
    │   ├── /admin/marketplace
    │   ├── /admin/settings
    │   └── ...
    │
    └── NotFound (404)
```

**Why this approach?**
- Clear role-based routing prevents unauthorized access
- Lazy-loaded route components reduce bundle size
- Nested routes enable complex layouts for multi-step flows

### 3.2 State Management

```
Redux Store
├── auth/
│   ├── currentUser
│   ├── token
│   ├── refreshToken
│   ├── permissions
│   └── isLoading
│
├── customer/
│   ├── profile
│   ├── addresses
│   ├── savedCities
│   ├── preferences
│   └── wallet
│
├── bookings/
│   ├── current (real-time via WebSocket)
│   ├── history
│   ├── filters
│   └── statusMap
│
├── marketplace/
│   ├── cart
│   ├── filters
│   ├── searchQuery
│   └── orders
│
├── ui/
│   ├── theme
│   ├── notifications (toast queue)
│   ├── modals (open/close state)
│   └── sidebarOpen
│
└── admin/
    ├── selectedCity
    ├── dateRange
    ├── adminFilters
    └── selectedMetric
```

**RTK Query API Slices:**
- `authApi` - Login, logout, refresh token
- `usersApi` - User CRUD, profile
- `bookingsApi` - Booking CRUD, status, assignment
- `productsApi` - Products, search, filters
- `ordersApi` - Orders, cart operations
- `technicianApi` - Technician jobs, availability
- `adminApi` - All admin endpoints

**Why RTK Query?**
- Automatic caching reduces API calls
- Built-in loading/error states
- Automatic refetch on focus/reconnect
- Optimistic updates support
- DevTools integration

### 3.3 Component Architecture

**Container Components (Smart):**
- Connect to Redux store
- Fetch data via RTK Query
- Handle business logic
- Pass data to presentational components

**Presentational Components (Dumb):**
- Pure, render-only
- Accept props
- No Redux dependency
- Maximum reusability

**Custom Hooks:**
```typescript
// Authentication
useAuth() → { user, isLoggedIn, logout }
usePermission(permission) → boolean
useRole() → string

// Real-time
useBookingUpdates(bookingId) → booking (WebSocket)
useLocationTracking() → { latitude, longitude, accuracy }
useNotifications() → { messages, add, remove }

// Business logic
useCartCalculation() → { subtotal, tax, discount, total }
useCommissionCalculation(amount, role) → commission
useETA(startLat, startLng, endLat, endLng) → minutes

// UI
useResponsive() → { isMobile, isTablet, isDesktop }
useDebounce(value, delay) → value
usePagination(items, pageSize) → { currentPage, items, handlers }
```

**Why this structure?**
- Clear separation of concerns
- Easy testing (presentational components are pure functions)
- High reusability
- Composable logic via custom hooks

### 3.4 Mobile-First Responsive Design

```
Breakpoints:
- Mobile: 0px - 480px (primary target)
- Tablet: 481px - 1024px
- Desktop: 1025px+

Layout Strategy:
- 1 column on mobile (100% width)
- 2 columns on tablet (if applicable)
- 3+ columns on desktop

Touch targets: Min 44px × 44px (mobile), 48px minimum (desktop)
```

### 3.5 PWA Features

- **Service Worker** (Workbox): Offline support, caching strategy
- **Web App Manifest**: Installable, full-screen, app icon
- **Background Sync**: Queue actions (bookings, orders) when offline
- **Push Notifications**: Real-time alerts via Service Worker

---

## 4. Backend Architecture

### 4.1 NestJS Layered Architecture

```
Request → Guards → Interceptors → Pipes → Controllers → Services → Database
         ↓        ↓              ↓        ↓            ↓          ↓
      Auth    Logging/         Validation Response   Business   ORM
      Check   Response         & DTOs    Transform   Logic      Queries
```

### 4.2 Module Organization

**Core Modules (Shared across app):**
- `AuthModule` - JWT, OAuth, social login
- `CacheModule` - Redis wrapper
- `FileModule` - File upload, image optimization
- `NotificationModule` - Email, SMS, WhatsApp, push
- `PaymentModule` - Payment gateway integration

**Feature Modules:**
- `UsersModule` - User CRUD, profiles
- `CustomerModule` - Customer-specific logic
- `TechnicianModule` - Technician management, KYC, wallet
- `BookingModule` - Booking lifecycle, assignment, tracking
- `MarketplaceModule` - Products, vendors, inventory, orders
- `FranchiseModule` - Cities, franchises, city-specific config
- `AdminModule` - Admin dashboard, analytics, settings
- `WebSocketModule` - Real-time updates

### 4.3 Service Layer Pattern

```typescript
// Example: BookingService (not actual code)

@Injectable()
class BookingService {
  constructor(
    private repo: BookingRepository,
    private assignmentService: BookingAssignmentService,
    private notificationService: NotificationService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {}

  async createBooking(dto: CreateBookingDto, customerId: string): Promise<Booking> {
    // Validate business rules via configService
    // Create booking entity
    // Emit event (booking-created)
    // This triggers: auto-assignment, notification, wallet check
    // Return booking
  }

  async assignTechnician(bookingId: string, technicianId: string): Promise<void> {
    // Update booking
    // Emit event (booking-assigned)
    // Send notification to technician & customer
  }

  // ... other methods
}
```

**Why this pattern?**
- Single Responsibility: Each service handles one domain
- Testability: Services are injectable, easy to mock
- Reusability: Services used across controllers and events
- Event-driven: Decoupled async operations

### 4.4 Async Processing (Bull/RabbitMQ)

```
Background Jobs Queue:
├── Email notifications (batched, scheduled)
├── SMS/WhatsApp sending
├── Image compression & upload to S3
├── PDF invoice generation
├── Analytics data aggregation
├── Technician auto-assignment
└── Wallet settlement
```

**Job Processor:**
- Separated microservice (optional at scale)
- Retry logic with exponential backoff
- Dead-letter queue for failed jobs
- Job monitoring & logs

---

## 5. Database Architecture

### 5.1 Core Entities & Relationships

```
User (Base)
├── Admin
├── Customer
├── Technician
├── Rider
├── Vendor
├── CityAdmin
└── FranchiseOwner

Customer
├── addresses[]
├── bookings[]
├── orders[]
├── reviews[]
└── wallet

Technician
├── kyc_documents[]
├── availability_schedule[]
├── assigned_bookings[]
├── completed_bookings[]
├── wallet
├── performance_score
└── rating

Booking
├── customer_id
├── assigned_technician_id
├── city_id
├── status (enum: pending, assigned, in-progress, completed, cancelled)
├── booking_timeline (audit trail)
├── images[]
├── invoice
└── review

Service (AC, Fridge, etc.)
├── city_service_mapping (city-wise activation)
├── pricing_rules (configurable charges)
└── appliances[]

Appliance (specific to service)
├── brand
├── model
├── serial_number (optional)
├── condition
└── issues[]

Marketplace_Product
├── vendor_id
├── category_id
├── inventory (per-city)
├── images[]
├── warranty
├── price_per_city (city-wise pricing)
└── orders[]

Vendor
├── store_name
├── city_service_mapping
├── commissions (admin, technician, vendor)
└── rating

Order (Marketplace)
├── customer_id
├── vendor_id
├── rider_id (delivery)
├── items[]
├── status
├── delivery_address
└── invoice

Franchise
├── owner_id
├── cities[]
├── subscription_plan
└── limits (technicians, vendors, etc.)

City
├── state
├── district
├── franchise_id
├── admin_id
├── services_enabled[]
├── business_rules (fees, commissions)
├── delivery_zones[]
└── active (bool)

BusinessRuleConfig (All configurable rules as JSON)
├── city_id (null for global)
├── rule_name (inspection_fee, service_charge, commission_rate, etc.)
├── rule_value (JSON, flexible)
├── effective_date
└── created_by_admin_id

AuditLog
├── entity_type
├── entity_id
├── action (create, update, delete)
├── changed_fields
├── changed_by_user_id
├── timestamp
└── ip_address
```

### 5.2 Key Indexes

```sql
-- Performance-critical queries
CREATE INDEX idx_booking_customer_created ON bookings(customer_id, created_at);
CREATE INDEX idx_booking_technician_status ON bookings(assigned_technician_id, status);
CREATE INDEX idx_booking_city_date ON bookings(city_id, created_at);
CREATE INDEX idx_booking_status ON bookings(status) WHERE status != 'completed';

CREATE INDEX idx_product_city_category ON marketplace_products(city_id, category_id);
CREATE INDEX idx_order_customer_created ON orders(customer_id, created_at);
CREATE INDEX idx_order_status ON orders(status) WHERE status IN ('pending', 'assigned');

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_technician_city_available ON technicians(city_id, is_available);
CREATE INDEX idx_vendor_city ON vendors(city_id);

-- Location-based queries (PostGIS)
CREATE INDEX idx_booking_location ON bookings USING gist(location);
CREATE INDEX idx_delivery_zone ON delivery_zones USING gist(polygon_boundary);
```

### 5.3 Soft-Delete Strategy

```typescript
// Every entity has:
deleted_at?: DateTime (null = active, timestamped = deleted)

// Queries automatically filter soft-deleted records
// Admin can restore deleted records
// Audit logs preserved even after soft-delete
// Hard-delete only for GDPR compliance (after retention period)
```

### 5.4 Multi-City Data Isolation

```typescript
// Every entity has city_id or can be traced to city via relations
// Queries automatically filtered by user's authorized cities
// City Admin can only see their city's data
// Technician can only see bookings in their assigned city
// Indexes ensure efficient city-based queries
```

---

## 6. Authentication Architecture

### 6.1 Authentication Flow

```
1. Registration
   ├── Email + Password (or social login)
   ├── OTP verification (SMS/Email)
   ├── Role selection (Customer/Technician/etc.)
   └── Profile setup (image, details)

2. Login
   ├── Email/Phone + Password
   ├── OTP verification (optional MFA)
   ├── Issue JWT + Refresh token
   └── Return user profile + permissions

3. Token Refresh
   ├── Refresh token → new JWT
   ├── Automatic on frontend when token expires
   └── Refresh token rotation (new refresh token issued)

4. Logout
   ├── Invalidate refresh token in Redis
   ├── Frontend deletes JWT
   └── Socket disconnect
```

### 6.2 JWT Strategy

```typescript
JWT Structure:
{
  sub: userId,
  email: "user@example.com",
  role: "customer|technician|admin|city_admin|franchise_owner",
  city_ids: [1, 2, 3], // Cities user can access
  permissions: ["booking:create", "booking:view", ...],
  iat: timestamp,
  exp: timestamp,
}

Tokens:
- Access Token: 15 minutes (short-lived, in JWT)
- Refresh Token: 7 days (long-lived, in Redis)
- Both stored securely:
  - Frontend: Access token in memory, Refresh token in httpOnly cookie
  - Mobile: Both in secure storage (Keychain/Keystore)
```

### 6.3 OAuth & Social Login

```
Strategies:
├── Google OAuth2
├── Facebook OAuth2
├── WhatsApp Business API (for phone-based login)
└── Custom SMS/Email OTP

First-time login:
├── Create user account (auto-generated username)
├── Link social account
├── Redirect to role selection / profile completion
```

### 6.4 MFA & Security

```
Options:
├── TOTP (Time-based One-Time Password) for admin/technician
├── SMS OTP (fallback)
├── Biometric (mobile app)

Implementation:
├── Optional for customers (recommended for wallet operations)
├── Mandatory for technicians & admins
├── Rate limiting on OTP requests (5 attempts/15 min)
└── OTP stored hashed in Redis with 10-minute expiry
```

---

## 7. Role & Permission Architecture

### 7.1 Role Hierarchy

```
SuperAdmin (Ultimate control)
├── System-wide settings
├── All user management
├── All analytics
└── Feature activation/deactivation

├─ CityAdmin (Admin for one/multiple cities)
│  ├── City-specific users (technicians, vendors, customers)
│  ├── City-specific bookings, orders
│  ├── City-specific analytics
│  └── City-specific settings
│
├─ FranchiseOwner (Owns franchise)
│  ├── City selection/management
│  ├── Franchise limits
│  ├── Franchise analytics
│  └── Subscription management
│
├─ Vendor (Marketplace seller)
│  ├── Product management
│  ├── Inventory management
│  ├── Orders (own products)
│  ├── Vendor analytics
│  └── Commissions
│
├─ Technician/Rider (Service providers)
│  ├── Job management
│  ├── Availability status
│  ├── Wallet/earnings
│  ├── Profile/KYC
│  └── Limited customer communication
│
└─ Customer (End user)
   ├── Booking management
   ├── Marketplace orders
   ├── Profile management
   ├── Wallet
   └── Communication with service providers
```

### 7.2 Permission Model

```typescript
// Permission naming convention: entity:action:scope
Permissions: [
  "booking:create:own",        // Can create own bookings
  "booking:view:own",          // Can view own bookings
  "booking:view:assigned",     // Technician: Can view assigned bookings
  "booking:update:assigned",   // Technician: Can update assigned bookings
  
  "product:create:all",        // Vendor: Can create products
  "product:update:own",        // Vendor: Can update own products
  
  "order:view:own",            // Can view own orders
  "order:manage:vendor_orders", // Vendor: Can manage orders for own products
  
  "user:view:city",            // CityAdmin: Can view city users
  "user:manage:city",          // CityAdmin: Can manage city users
  
  "settings:manage:global",    // SuperAdmin: Can manage global settings
  "settings:manage:city",      // CityAdmin: Can manage city settings
  
  "analytics:view:own",        // Can view own analytics
  "analytics:view:city",       // CityAdmin: Can view city analytics
  "analytics:view:global",     // SuperAdmin: Can view global analytics
]
```

### 7.3 Permission Check Implementation

```typescript
// In controller or guard
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@Permission('booking:create:own')
@Post('/bookings')
async createBooking(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
  // Permission guard already verified
}

// Or in service (runtime check)
async updateBooking(bookingId: string, userId: string, dto: UpdateBookingDto) {
  const booking = await this.getBooking(bookingId);
  
  if (!this.permissionService.can(userId, 'booking:update:assigned')) {
    throw new ForbiddenException();
  }
  
  // Update logic
}
```

### 7.4 City Authorization

```typescript
// Middleware: Every request scoped to user's authorized cities
request.authorizedCities = user.city_ids;
request.cityId = req.query.city_id || user.default_city_id;

// Validate: city_id is in user's authorized_cities
if (!request.authorizedCities.includes(request.cityId)) {
  throw new ForbiddenException('City not authorized');
}

// Repository: Auto-filter queries by city_id
```

---

## 8. API Architecture

### 8.1 RESTful API Design

```
Base URL: /api/v1

Authentication endpoints:
POST   /auth/register          → User registration
POST   /auth/login             → User login
POST   /auth/refresh-token     → Refresh JWT
POST   /auth/logout            → Logout (invalidate refresh token)
POST   /auth/forgot-password   → Send reset email
POST   /auth/reset-password    → Reset password with token

Customer endpoints:
GET    /customers/:id          → Get customer profile
PUT    /customers/:id          → Update profile
GET    /customers/:id/bookings → Get booking history
GET    /customers/:id/orders   → Get marketplace orders
POST   /customers/:id/addresses → Add address
GET    /customers/:id/wallet   → Get wallet balance

Booking endpoints:
POST   /bookings               → Create booking
GET    /bookings/:id           → Get booking details
PUT    /bookings/:id           → Update booking
GET    /bookings/:id/track     → Real-time tracking (WebSocket recommended)
POST   /bookings/:id/cancel    → Cancel booking
POST   /bookings/:id/complete  → Mark as complete (technician)
POST   /bookings/:id/rate      → Add review/rating

Marketplace endpoints:
GET    /products               → List products (filters, search)
GET    /products/:id           → Get product details
POST   /cart                   → Add to cart
GET    /cart                   → Get cart
DELETE /cart/:productId        → Remove from cart
POST   /orders                 → Create order (checkout)
GET    /orders/:id             → Get order details
PUT    /orders/:id             → Update order (customer tracking)

Technician endpoints:
GET    /technicians/:id        → Get profile
PUT    /technicians/:id        → Update profile
POST   /technicians/:id/kyc    → Upload KYC documents
GET    /technicians/:id/jobs   → Get available jobs
POST   /technicians/:id/jobs/:jobId/accept   → Accept job
POST   /technicians/:id/jobs/:jobId/reject   → Reject job
PUT    /technicians/:id/availability         → Set availability
GET    /technicians/:id/earnings → Get earnings
GET    /technicians/:id/location → Get current location (admin only)

Admin endpoints:
GET    /admin/dashboard        → Dashboard metrics
GET    /admin/users            → List users (with filters)
POST   /admin/users            → Create user (manual)
PUT    /admin/users/:id        → Update user
DELETE /admin/users/:id        → Delete user (soft-delete)
GET    /admin/bookings         → List all bookings (filters)
GET    /admin/orders           → List all orders
GET    /admin/analytics/bookings → Analytics for bookings
GET    /admin/analytics/revenue → Revenue analytics
GET    /admin/settings         → Get system settings
PUT    /admin/settings         → Update settings
POST   /admin/services         → Add service category
PUT    /admin/services/:id     → Update service
DELETE /admin/services/:id     → Deactivate service
POST   /admin/cities           → Add city
PUT    /admin/cities/:id       → Update city
POST   /admin/business-rules   → Add business rule
GET    /admin/audit-logs       → Get audit logs
GET    /admin/features         → List features & toggle status
PUT    /admin/features/:id     → Enable/disable feature
```

### 8.2 Query Parameters & Filtering

```
Pagination:
GET /bookings?page=1&limit=20

Filtering:
GET /bookings?status=completed&city_id=1&date_from=2026-01-01&date_to=2026-12-31

Sorting:
GET /bookings?sort=-created_at (- for descending)

Searching:
GET /products?search=samsung&category=ac

Selection:
GET /bookings?fields=id,customer_id,status (select specific fields)
```

### 8.3 Response Format

```typescript
// Success response
{
  success: true,
  data: { /* entity or array */ },
  meta: { page: 1, limit: 20, total: 100 } // Only for paginated endpoints
}

// Error response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: [
      { field: "email", message: "Invalid email format" }
    ]
  }
}

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized
- 403: Forbidden (authorized but not permitted)
- 404: Not Found
- 409: Conflict (business rule violation)
- 422: Unprocessable Entity (validation error)
- 500: Server Error
```

### 8.4 Rate Limiting

```
Global: 1000 requests/hour per IP
Auth endpoints: 5 attempts/15 minutes per email/phone
API key endpoints: Configurable per key
WebSocket: 100 connections per user

Exceeded limits return 429 (Too Many Requests)
```

### 8.5 API Versioning

```
Current: /api/v1
Future: /api/v2 (if major breaking changes)

Backward compatibility maintained for at least 2 versions
Deprecation warnings in headers: Deprecation: true
```

---

## 9. Real-time Architecture

### 9.1 WebSocket Server (Socket.IO + NestJS)

```typescript
// Gateway: src/websocket/events.gateway.ts

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: process.env.FRONTEND_URL },
})
class EventsGateway {
  @WebSocketServer() server: Server;

  // Connection
  handleConnection(client: Socket) {
    // Authenticate socket with JWT
    // Store client info in Redis
    // Join user to room: `user:${userId}`
  }

  // Booking status updates
  @SubscribeMessage('booking:subscribe')
  subscribeToBooking(client: Socket, bookingId: string) {
    client.join(`booking:${bookingId}`);
    // Return current booking state
  }

  // Real-time location tracking
  @SubscribeMessage('technician:location-update')
  updateLocation(client: Socket, data: { lat, lng, accuracy }) {
    // Validate technician, update DB
    // Broadcast to customer
    this.server
      .to(`booking:${bookingId}`)
      .emit('location-updated', { lat, lng, accuracy });
  }

  // Order status
  @SubscribeMessage('order:subscribe')
  subscribeToOrder(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
  }

  // Rider live tracking for delivery
  @SubscribeMessage('rider:location-stream')
  startLocationStream(client: Socket, orderId: string) {
    // Stream rider location every 5 seconds
  }
}

// Emitting events from service
@Injectable()
class BookingService {
  constructor(
    private eventEmitter: EventEmitter2,
    private socketGateway: EventsGateway,
  ) {}

  async updateBookingStatus(bookingId: string, status: string) {
    const booking = await this.repo.update(bookingId, { status });

    // Broadcast to subscribed clients
    this.socketGateway.server
      .to(`booking:${bookingId}`)
      .emit('status-changed', { status, timestamp });

    // Emit internal event (for async processing)
    this.eventEmitter.emit('booking.status-changed', { bookingId, status });
  }
}
```

### 9.2 Real-time Events

```
Booking Events:
├── booking:created → Sent to customer & assigned technician
├── booking:assigned → Sent to customer & technician
├── booking:technician-on-way → Customer & admin
├── booking:technician-arrived → Customer & admin
├── booking:in-progress → All involved parties
├── booking:paused → Due to stock issue, customer feedback, etc.
├── booking:completed → Customer, technician, admin
├── booking:cancelled → All involved parties
└── technician:location-updated → Customer (if opt-in)

Order Events:
├── order:created → Vendor & admin
├── order:confirmed → Customer, vendor, admin
├── order:assigned-rider → Customer, rider, vendor, admin
├── order:rider-on-way → Customer & vendor
├── order:delivered → All parties
├── order:cancelled → All parties
└── rider:location-updated → Customer (if opt-in)

Notification Events:
├── notification:new → User (in-app badge)
├── notification:read → Update status
└── notification:deleted → Remove

System Events (Admin only):
├── system:alert → Critical alert (payment down, etc.)
├── system:maintenance → Scheduled maintenance notice
└── user:activity-alert → Suspicious activity, etc.
```

### 9.3 Socket.IO Rooms Strategy

```
Room Naming:
├── user:{userId} → Personal messages, notifications
├── booking:{bookingId} → All updates for specific booking
├── order:{orderId} → All updates for specific order
├── city:{cityId} → City-wide announcements
├── admin → Admin-only alerts & system events
└── technician:{technicianId}:jobs → Available jobs for technician
```

### 9.4 Message Queue for High-Volume Events

```
For events that might overwhelm WebSocket:
├── Location updates: Batch every 5 seconds (not real-time)
├── Notifications: Queue & deduplicate
├── Analytics events: Batch & process async
└── Audit logs: Write to queue, process async

Tool: Bull/RabbitMQ with Redis backing
```

---

## 10. File/Storage Architecture

### 10.1 File Types & Storage Strategy

```
File Type               Storage      Compression   CDN   Validation
─────────────────────────────────────────────────────────────────
KYC Documents (PDF)    S3           No           Yes   File type, size < 10MB
Selfies (JPEG)         S3           Yes (Sharp)  Yes   Face detection optional
Product Images (JPG)   S3           Yes          Yes   Size < 5MB each
Appliance Images       S3           Yes          Yes   Size < 5MB each
Warranty Docs          S3           No           Yes   PDF, < 20MB
Booking Invoice        S3           No           No    Temp link, 7-day expiry
Video Proof            S3           No           No    Size < 100MB, time-limited
```

### 10.2 S3/MinIO Structure

```
city-workshop-storage/
├── kyc/
│   ├── {technicianId}/
│   │   ├── pan_{timestamp}.pdf
│   │   ├── voter_id_{timestamp}.pdf
│   │   └── selfie_{timestamp}.jpg
│
├── products/
│   ├── {productId}/
│   │   ├── main_{timestamp}.jpg (resized: 800x600)
│   │   ├── main_{timestamp}_thumb.jpg (resized: 200x200)
│   │   ├── detail_1_{timestamp}.jpg
│   │   └── detail_2_{timestamp}.jpg
│
├── appliances/
│   ├── {bookingId}/
│   │   ├── before_1_{timestamp}.jpg
│   │   ├── before_2_{timestamp}.jpg
│   │   ├── after_1_{timestamp}.jpg
│   │   └── after_2_{timestamp}.jpg
│
├── invoices/
│   ├── {bookingId}_{timestamp}.pdf
│   └── {orderId}_{timestamp}.pdf
│
└── documents/
    ├── warranty/
    └── other/
```

### 10.3 Image Optimization Pipeline

```
Frontend (Client-side):
├── Resize to max 1200x900px (before upload)
├── Compress JPEG quality to 80%
├── Show preview to user

Backend (Server-side - Critical):
├── Validate file type & size
├── Process with Sharp:
│   ├── Main image: 800x600px @ 75% quality
│   ├── Thumbnail: 200x200px @ 70% quality
│   ├── Auto-orient based on EXIF
│   └── Strip EXIF data (privacy)
├── Upload to S3
├── Delete original after verification
└── Store S3 URL in database

Processing:
├── Background job (Bull queue)
├── Retry on failure (max 3 times)
├── Store in tmp folder until complete
└── Log all processing failures
```

### 10.4 File Upload Security

```typescript
// Server-side validation (NEVER trust client)

ValidateFile(file: Express.Multer.File) {
  const MAX_FILE_SIZE = {
    kyc: 10 * 1024 * 1024,           // 10MB
    product_image: 5 * 1024 * 1024,  // 5MB
    appliance_image: 5 * 1024 * 1024,
    video: 100 * 1024 * 1024,        // 100MB
    warranty_doc: 20 * 1024 * 1024,  // 20MB
  };

  const ALLOWED_MIMETYPES = {
    kyc: ['application/pdf', 'image/jpeg', 'image/png'],
    product_image: ['image/jpeg', 'image/png', 'image/webp'],
    appliance_image: ['image/jpeg', 'image/png', 'image/webp'],
  };

  // Check file size
  if (file.size > MAX_FILE_SIZE[fileType]) {
    throw new BadRequestException('File too large');
  }

  // Check MIME type
  if (!ALLOWED_MIMETYPES[fileType].includes(file.mimetype)) {
    throw new BadRequestException('Invalid file type');
  }

  // Check magic bytes (actual file content, not extension)
  const magicBytes = await checkMagicBytes(file.buffer);
  if (!validateMagicBytes(magicBytes, fileType)) {
    throw new BadRequestException('File content does not match type');
  }

  // Scan for virus (optional, ClamAV)
  await scanFile(file.buffer);
}
```

### 10.5 Signed URLs & Expiry

```typescript
// Generate signed URLs for file access
async getFileUrl(fileKey: string, expirySeconds: number = 3600) {
  const url = await s3.getSignedUrlPromise('getObject', {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Expires: expirySeconds,
  });
  return url;
}

// Usage:
Invoice: 7 days expiry (customer can download)
Warranty: No expiry (permanent)
Selfie/KYC: No public access (admin only via special endpoint)
Product images: 1 hour expiry + CDN caching
```

---

## 11. Marketplace Architecture

### 11.1 Core Concepts

```
Product Catalog:
├── Categories (system-defined, admin can add)
├── Products (created by vendors)
├── Stock (city-wise inventory)
└── Pricing (city-wise, dynamic)

Vendor Onboarding:
├── Registration & profile
├── Store setup
├── Business verification (admin approval)
├── Warehouse/pickup locations
└── Commission rate setup

Order Fulfillment:
├── Inventory reservation (5 min hold, then release)
├── Order confirmation (payment captured)
├── Vendor packing
├── Rider pickup & delivery
├── Delivery proof
└── Customer review
```

### 11.2 Inventory Model

```typescript
// Multi-city inventory

Inventory {
  product_id: string
  city_id: string
  vendor_id: string
  quantity_available: number
  quantity_reserved: number (in-transit orders)
  quantity_damaged: number
  reorder_level: number
  created_at: DateTime
  updated_at: DateTime
}

// When customer adds to cart:
├── Check quantity_available > 0
├── Don't reduce stock yet (just reserve)
├── 5-minute timeout on reservation

// When customer checks out:
├── Verify reservation still active
├── Create order
├── Mark stock as reserved (10-30 min for payment)
├── After payment confirmed: quantity_available -= ordered_qty

// When rider delivers:
├── Quantity_reserved -= delivered_qty
└── Update inventory

// If order cancelled before delivery:
└── Release reservation back to quantity_available
```

### 11.3 Pricing & Commissions

```
Order Total = Product Cost + Delivery Fee + Tax

Deductions:
├── Admin Commission (%)
├── Vendor Commission (if applicable)
├── Technician Commission (if order placed via technician recommendation)
└── Rider Earnings

Example:
Product: ₹1000
├── Admin commission: 15% = ₹150 → Admin earnings
├── Vendor keeps: 85% = ₹850
├── Delivery: ₹50
│   ├── Rider earnings: ₹40
│   └── Platform fee: ₹10
└── Technician recommendation bonus: ₹30 (if applicable)

All commissions configurable by Super Admin per:
├── City
├── Product category
├── Vendor tier
└── Delivery distance
```

### 11.4 Search & Filter

```
Search Capabilities:
├── Full-text search (Elasticsearch or DB LIKE)
├── Category filter
├── Price range filter
├── Rating filter
├── Vendor filter
├── Warranty filter
├── Availability filter (in-stock only)
└── Delivery time filter

Sorting:
├── Relevance (by search rank)
├── Price (low to high, high to low)
├── Rating (highest first)
├── Newest products
├── Most popular (order count)
└── Delivery time
```

### 11.5 Order Fulfillment Workflow

```
Customer Checkout
    ↓
Payment Processing (Payment Gateway)
    ↓
Order Created (status: pending_confirmation)
    ↓
Vendor Notified (real-time + email)
    ↓
Vendor Confirms (within 30 min or auto-cancel)
    ├─ Order status: confirmed
    ├─ Stock deducted from inventory
    └─ Inventory alert if reorder_level reached
    ↓
Vendor Packing (manual process)
    ↓
Rider Assigned (auto-assignment based on location, ratings)
    ├─ Rider notification
    └─ Order status: assigned_rider
    ↓
Rider Pickup
    ├─ Photo proof
    └─ Order status: picked_up
    ↓
Delivery in Progress (Rider location tracking)
    └─ Order status: in_delivery
    ↓
Delivery Attempt
    ├─ Success: photo proof → delivered
    ├─ Customer not available: next attempt / return to vendor
    └─ Failure: return to vendor, refund processed
    ↓
Order Completed / Cancelled
    ↓
Customer Review & Rating
    ↓
Settlement
    ├─ Vendor paid (daily, weekly, or monthly)
    ├─ Rider earnings recorded
    └─ Admin commission recorded
```

---

## 12. Booking Architecture

### 12.1 Booking Lifecycle

```
Customer Initiates Booking
    ↓
1. Location Selection
   └─ Detect/select service address

2. Service Selection
   ├─ Choose appliance (AC, Fridge, etc.)
   └─ Service type (repair, maintenance, etc.)

3. Problem Description
   ├─ Text description
   ├─ Optional photos (before state)
   └─ Available time slot

4. Review & Confirm
   ├─ Show inspection charge
   ├─ Show expected service charge (estimate)
   └─ T&C acceptance

5. Create Booking
   └─ Status: PENDING

Booking Created → Auto-Assignment Engine
    ↓
Technician Assignment (if configured)
    ├─ Priority: Rating, availability, distance
    ├─ Max jobs per technician (configurable)
    └─ Notification to technician

Technician Accept/Reject
    ├─ Accept → Status: ASSIGNED
    └─ Reject → Re-assign to next available

Technician Traveling
    ├─ ETA calculation
    ├─ Real-time location tracking
    └─ Status: ON_WAY

Technician Arrives
    ├─ Arrival confirmation
    └─ Status: ARRIVED

Service Inspection
    ├─ Technician inspects
    ├─ Takes photos (after photos optional at this stage)
    ├─ Explains cost to customer
    ├─ Customer approves or rejects
    └─ Status: INSPECTION_DONE or REJECTED

Service Repair (if approved)
    ├─ Technician performs work
    ├─ Takes before/after photos
    ├─ Records parts used (if applicable)
    └─ Status: IN_PROGRESS

Service Completion
    ├─ Technician marks complete
    ├─ Creates invoice
    ├─ Calls payment gateway (if online payment)
    └─ Status: COMPLETED or PAYMENT_PENDING

Customer Pays (if not paid upfront)
    ├─ Payment confirmation
    └─ Status: COMPLETED

Booking Closed
    ├─ Customer review/rating
    ├─ Technician rating
    └─ Archive
```

### 12.2 Assignment Algorithm

```typescript
// Auto-assignment logic

async findAvailableTechnicians(
  bookingDetails: {
    city_id: string
    appliance_type: string
    location: { lat: number; lng: number }
    preferred_time_slot: TimeSlot
  }
): Promise<Technician[]> {
  // Filters (in order of priority):
  // 1. Active technicians in same city
  // 2. Is available now (or within preferred time slot)
  // 3. Certified for appliance type
  // 4. Number of current jobs < max_jobs (configurable per technician)
  // 5. Minimum wallet balance (configurable)
  // 6. Performance score > minimum (configurable)
  
  // Scoring (rank by):
  // 1. Distance (nearest first)
  // 2. Current load (fewer jobs first)
  // 3. Rating (higher first)
  // 4. Last job completion time (recent = fresher)

  // Return top 3-5 candidates for assignment
}

// Assignment attempt:
for (let technician of availableTechnicians) {
  try {
    const assigned = await assignTechnician(booking, technician);
    if (assigned) return;
  } catch (e) {
    continue; // Try next technician
  }
}

// If no one accepts, fallback to manual assignment by admin
throw new NoTechniciansAvailableException();
```

### 12.3 Cancellation Policy

```
Customer Cancellation:
├─ Before technician assigned: No charge
├─ After technician assigned, before arrival: Cancellation fee (configurable %)
├─ After arrival: Full service charge
└─ Reason tracking (for analytics)

Technician Cancellation:
├─ Before arrival: Penalty (reduce wallet / mark as no-show)
├─ After arrival: Payment deduction
└─ Multiple rejections: Temporary suspension

Admin Cancellation:
├─ Reason required (system issue, customer request, etc.)
└─ Refund as per policy
```

### 12.4 Rating & Review

```typescript
// After completion, both parties can rate

CustomerReview {
  booking_id: string
  technician_id: string
  rating: 1-5
  review_text: string
  categories: {
    professionalism: 1-5
    speed: 1-5
    quality: 1-5
    cost_value: 1-5
  }
  created_at: DateTime
  flagged: boolean // Admin can flag inappropriate reviews
}

TechnicianReview {
  booking_id: string
  customer_id: string
  rating: 1-5
  review_text: string
  payment_timely: boolean
  behavior: 'professional' | 'rude' | 'inappropriate'
  created_at: DateTime
}

// Ratings influence:
├─ Technician: Affects assignment priority, availability score
├─ Customer: Affects technician willingness to accept (optional)
└─ Both: Public profile, trust score
```

---

## 13. Technician/Rider Architecture

### 13.1 Technician Onboarding

```
1. Basic Registration
   ├─ Name, phone, email
   ├─ City selection
   ├─ Service specialization (AC, Fridge, etc.)
   └─ Experience level

2. KYC Verification (required)
   ├─ PAN (upload + OCR validation)
   ├─ Voter ID or Aadhar (upload + OCR)
   ├─ Selfie (liveness detection optional)
   └─ Address verification

3. Banking Details
   ├─ Bank account
   ├─ IFSC code
   ├─ Account holder name
   └─ Verification (via micro deposits or Penny test)

4. Profile Setup
   ├─ Technician ID (auto-generated)
   ├─ Service categories
   ├─ Years of experience
   ├─ Languages spoken
   └─ Profile photo

5. Document Upload
   ├─ Certificates/Licenses (if any)
   ├─ Past work photos (samples)
   └─ Proof of tools/equipment

6. Admin Verification
   ├─ Background check (optional)
   ├─ Document verification
   ├─ Phone verification call
   └─ Status: VERIFIED or REJECTED

7. Agreement Acceptance
   ├─ T&C acceptance
   ├─ Commission structure confirmation
   └─ Status: ACTIVE
```

### 13.2 Technician Job Management

```
Job Availability:
├─ Time slots: 8 AM - 10 PM (configurable per city/season)
├─ Availability toggle: ON/OFF
├─ Break management: Set break times
├─ Leave management: Pre-planned leave (up to 30 days)
└─ Max jobs/day: Configurable (default: 6-8)

Job Assignment:
├─ Push notification: New job available
├─ Job details: Time slot, location, service type, customer name
├─ Accept/Reject: 30-second decision window
├─ Auto-assignment fallback: If rejected by top 3 candidates

Job Progress Tracking:
├─ Confirmed: Technician accepted
├─ On the way: Real-time location tracking
├─ Arrived: Geolocation check (within 100m radius)
├─ In progress: Time tracking
├─ Completed: Mark done + upload proof
└─ Status updates: Push notification to customer
```

### 13.3 Technician Wallet & Earnings

```
Wallet Structure:
├─ Balance: Available cash for withdrawal
├─ Pending: Earnings not yet settled
├─ Reserved: Payment holds (7-14 days post-completion)
└─ Transactions history: All credits/debits

Earnings Breakdown (per booking):
Service Charge = Total Cost - Material Cost
Commission = Service Charge × Commission %

Example:
Total Service Cost: ₹500
├─ Inspection charge: ₹50 (platform fee)
├─ Repair charge: ₹400 (technician earns 80% = ₹320)
└─ Material cost: ₹50 (technician reimburses)

Wallet Credit:
├─ After booking: Inspect charge + material reimbursement
├─ After completion: Service charge commission (held for 7 days)
├─ Auto-settlement: Daily/weekly (configurable)

Withdrawal:
├─ Minimum balance: ₹100 (configurable)
├─ Settlement period: T+2 days
├─ Bank transfer: Automated via payment gateway
└─ History: All withdrawals logged

Minimum Wallet Requirement:
├─ Technician must maintain min balance (e.g., ₹500)
├─ Below minimum: No new job assignments
├─ Warning at 2x threshold
└─ Reason: Absorb cancellation penalties, deposit for tools
```

### 13.4 Technician Performance Scoring

```
Metrics (calculated daily/weekly):

1. Completion Rate
   └─ % of accepted jobs completed / cancelled

2. On-Time Performance
   └─ % of jobs completed within promised time

3. Customer Rating (Aggregate)
   └─ Average rating from customer reviews

4. Response Time
   └─ Average time to accept job (seconds)

5. Cancellation Rate
   └─ % of jobs cancelled by technician

6. No-Show Rate
   └─ % of jobs where technician didn't appear

7. Re-work Rate
   └─ % of jobs requiring follow-up

Performance Score = Weighted average of above metrics
Example: 0.25 × completion + 0.25 × rating + 0.2 × on-time + ...

Usage:
├─ Job assignment priority (higher score = priority)
├─ Incentive payouts (bonus for >90% score)
├─ Suspension (score <40% for >2 weeks)
├─ Admin analytics & performance reports
└─ Customer visibility (optional)
```

### 13.5 Rider System (Delivery Personnel)

```
Rider Onboarding:
├─ Similar to technician (KYC required)
├─ Vehicle registration (bike/scooter/car)
├─ Delivery zones assignment
├─ Delivery partner insurance
└─ Status: ACTIVE

Rider Job Assignment (for marketplace orders):
├─ Available pickup locations (vendors)
├─ Delivery zones (city-wise coverage)
├─ Max deliveries/day
├─ Real-time location tracking
└─ Customer communication (masked phone)

Earnings:
├─ Per delivery fee (base)
├─ Distance bonus
├─ Time bonus (for fast delivery)
├─ Peak hour bonus
└─ Incentive for high rating

Rating Mechanism:
├─ Customer rating of rider (1-5)
├─ On-time delivery %
├─ Condition of items (photos)
└─ Behavior (professional, polite)

Suspension:
├─ Low rating: <3.5 stars → Warning
├─ Multiple late deliveries: Suspension
├─ Customer complaints: Investigation
└─ Auto-reactivation after improvement
```

---

## 14. Franchise/City Architecture

### 14.1 Multi-City Setup

```
Hierarchy:
├─ Country (single: India)
│  ├─ State (24 states)
│  │  └─ District (724 districts)
│  │     └─ City (3000+ cities)
│  │        └─ Delivery Zone (geo-polygon)
│
└─ Franchise
   ├─ Owner
   ├─ Assigned cities (1 to many)
   ├─ Subscription plan (Starter, Growth, Pro)
   ├─ Technician limit
   ├─ Vendor limit
   ├─ Active booking capacity
   └─ Billing cycle
```

### 14.2 City Configuration

```typescript
CityConfig {
  id: string
  state: string
  district: string
  name: string
  admin_id?: string
  franchise_id?: string
  
  // Operational
  status: 'active' | 'inactive' | 'maintenance'
  timezone: string
  language: string
  
  // Services enabled in this city
  enabled_services: string[] (e.g., ['ac', 'fridge', 'washing_machine'])
  
  // Pricing rules (can override global)
  inspection_charge: number (₹)
  booking_cancellation_fee: number (%)
  technician_commission: number (%)
  admin_commission: number (%)
  delivery_fee: number (₹)
  
  // Availability
  booking_hours: { start: '08:00', end: '22:00' }
  emergency_hours: boolean
  
  // Technician allocation
  min_technicians_required: number
  target_technicians: number
  
  // Delivery zones
  delivery_zones: DeliveryZone[] (polygons for coverage)
  
  created_at: DateTime
  updated_at: DateTime
}

DeliveryZone {
  id: string
  city_id: string
  name: string
  polygon_boundary: GeoJSON Polygon
  delivery_fee: number (override city default)
  estimated_delivery_time: number (minutes)
  active: boolean
}
```

### 14.3 City Admin Controls

```
What City Admin Can Do:
├─ View dashboard (city-specific metrics)
├─ Manage technicians (in city)
│  ├─ View list
│  ├─ Enable/disable
│  ├─ Resolve issues (payment, disputes)
│  └─ View performance analytics
├─ Manage vendors (in city)
│  ├─ Approve new vendors
│  ├─ Monitor inventory
│  └─ Resolve order issues
├─ Manage customers (in city)
│  ├─ View list
│  ├─ Handle complaints
│  └─ View behavior patterns
├─ View bookings & orders (city-only)
├─ Analytics (city-specific)
├─ Approve technicians (KYC)
├─ Manage city inventory (marketplace)
└─ Report issues to Super Admin

What City Admin CANNOT Do:
├─ Access other cities' data
├─ Manage global settings
├─ Create service categories
├─ Modify commission rules (preset by Super Admin)
├─ Manage other city admins
└─ Access financial reports beyond city
```

### 14.4 Franchise Management

```
Franchise Plans:

Starter Plan:
├─ 1 city
├─ Up to 10 technicians
├─ Up to 5 vendors
├─ Basic analytics
├─ ₹5,000/month

Growth Plan:
├─ Up to 5 cities
├─ Up to 50 technicians
├─ Up to 20 vendors
├─ Advanced analytics
├─ ₹20,000/month

Pro Plan:
├─ Up to 10 cities
├─ Up to 200 technicians
├─ Up to 100 vendors
├─ Full analytics + API access
├─ ₹50,000/month

Features per plan:
├─ API access (Pro only)
├─ Custom commission rates (Pro only)
├─ White-label option (Pro only)
└─ Dedicated account manager (Growth+ )

Billing:
├─ Auto-charge on 1st of month
├─ Payment method on file (card, bank transfer)
├─ Invoice generation
├─ Automated dunning for failed payments
└─ Suspension after 3 failed payment attempts
```

### 14.5 City-wise Data Isolation

```
// Row-level security at database level

// Every important table has city_id or relation to city
Booking → city_id
Technician → city_id
Vendor → city_id
Customer → default_city_id, authorized_cities[]
Order → city_id (via vendor or delivery location)
Product → city_id (inventory is per-city)

// Query patterns always filter by city
const bookings = await db.booking.find({
  city_id: user.current_city_id,
  created_at: { $gte: startDate }
})

// Authorization middleware ensures city access
@UseGuards(AuthGuard('jwt'), CityAuthorizationGuard)
@Get('/bookings')
async getBookings(
  @CurrentUser() user: User,
  @CityId() cityId: string
) {
  // Guard ensures cityId is in user.authorized_cities
  // Service queries filtered by cityId
}
```

---

## 15. Admin Architecture

### 15.1 Super Admin Dashboard

```
Main Dashboard Sections:

1. Overview (KPIs)
   ├─ Active cities
   ├─ Total users (customers, technicians, vendors, admins)
   ├─ Revenue (bookings + marketplace)
   ├─ Total orders (marketplace)
   ├─ Active technicians
   ├─ Platform availability %
   └─ Critical alerts (payment gateway down, etc.)

2. Users Management
   ├─ Search/filter by role, city, status
   ├─ User details & activity history
   ├─ Enable/disable users
   ├─ Reset password
   ├─ Assign roles
   ├─ Grant permissions
   └─ Audit trail (who did what)

3. Bookings Management
   ├─ List all bookings (filters: city, status, date, technician, customer)
   ├─ Booking details & timeline
   ├─ Re-assign technician
   ├─ Manual cancellation (with reason)
   ├─ View customer & technician ratings
   ├─ Resolve disputes
   └─ Invoice re-generation

4. Marketplace Management
   ├─ Products catalog
   │  ├─ Add/edit/deactivate products
   │  ├─ Manage images
   │  └─ Set pricing per city
   ├─ Vendors management
   │  ├─ Approve new vendors
   │  ├─ View performance
   │  ├─ Manage commissions
   │  └─ Wallet management
   ├─ Inventory management
   │  ├─ Stock levels per city
   │  ├─ Re-order management
   │  └─ Stock alerts
   └─ Orders management
      ├─ List all orders
      ├─ Order tracking
      ├─ Delivery management
      └─ Refund processing

5. Payments & Settlements
   ├─ Payment gateway status
   ├─ Transaction logs
   ├─ Failed payment retries
   ├─ Wallet transactions
   ├─ Settlement reports (technician, vendor, rider)
   ├─ Refund management
   └─ Commission collection

6. Services & Appliances
   ├─ Add/edit service (AC, Fridge, etc.)
   ├─ Enable/disable by city
   ├─ Appliance types per service
   ├─ Problem categories per appliance
   ├─ Pricing templates
   └─ Commission rules

7. System Settings
   ├─ Global configurations
   │  ├─ Inspection charge default
   │  ├─ Cancellation fees
   │  ├─ Commission rates
   │  ├─ Minimum wallet requirement
   │  └─ Job limits
   ├─ Business hours (global & per city)
   ├─ API integrations
   │  ├─ Payment gateway
   │  ├─ SMS provider
   │  ├─ Email provider
   │  ├─ Maps API
   │  └─ API keys (secure storage)
   ├─ Notifications settings
   ├─ Feature flags
   └─ Maintenance mode

8. Feature Management
   ├─ List all features
   ├─ Enable/disable features globally
   ├─ City-level feature toggle
   ├─ Feature release notes
   └─ Beta features

9. Cities Management
   ├─ Add new city
   ├─ City details (state, district, timezone)
   ├─ Assign city admin
   ├─ Assign franchise
   ├─ Enable/disable city
   ├─ Delivery zones management
   ├─ City-specific settings override
   └─ Activation status

10. Franchise Management
    ├─ List franchises
    ├─ Franchise details (owner, plan, cities)
    ├─ Subscription management
    ├─ Upgrade/downgrade plan
    ├─ Billing & payment history
    ├─ Usage limits monitoring
    └─ KPI reports per franchise

11. Analytics & Reports
    ├─ Revenue analytics
    │  ├─ By city, date range, service, vendor
    │  └─ Trend charts
    ├─ Booking analytics
    │  ├─ Completion rate, avg time, cancellation rate
    │  └─ Peak hours
    ├─ Technician analytics
    │  ├─ Performance scores
    │  ├─ Earnings
    │  ├─ Ratings
    │  └─ Utilization rate
    ├─ Customer analytics
    │  ├─ Retention rate
    │  ├─ Repeat booking rate
    │  ├─ Customer lifetime value
    │  └─ Churn analysis
    ├─ Marketplace analytics
    │  ├─ Top products
    │  ├─ Vendor performance
    │  ├─ Order trends
    │  └─ Return rate
    └─ Exportable reports (PDF, CSV)

12. Audit Logs
    ├─ User action log (login, logout, changes)
    ├─ Admin action log (who changed what)
    ├─ Database changes (soft-delete, updates)
    ├─ Financial transactions
    ├─ Search & filter
    └─ Export logs

13. Support & Complaints
    ├─ Customer complaints
    ├─ Technician complaints
    ├─ Vendor complaints
    ├─ Dispute resolution
    ├─ Refund processing
    ├─ Assign to support team
    └─ Track resolution status
```

### 15.2 Role Hierarchy in Admin

```
SuperAdmin
├─ Full access to all features
├─ Can create other admins & city admins
├─ Can enable/disable features
└─ Can modify system settings

CityAdmin (created by SuperAdmin)
├─ City-scoped access only
├─ Can manage city users (not admins)
├─ Can view city analytics
├─ Can approve technicians for city
├─ Cannot modify other cities
└─ Cannot access global settings

AdminOperations (created by SuperAdmin)
├─ Assigned to specific modules
├─ e.g., "Marketplace Admin", "Payments Admin"
├─ Cannot access other modules
└─ Cannot modify system settings
```

### 15.3 Feature Toggle System

```typescript
FeatureFlag {
  id: string
  name: string (e.g., 'booking_video_proof')
  description: string
  enabled_globally: boolean
  enabled_cities: string[] (specific cities enabled)
  beta: boolean (for beta features)
  rollout_percentage: number (0-100, for gradual rollout)
  config: JSON (feature-specific config)
  created_at: DateTime
  updated_at: DateTime
}

// Usage in code:
if (featureService.isEnabled('booking_video_proof', user.city_id)) {
  // Show video upload option
}

// Admin toggles feature:
await featureService.toggle('booking_video_proof', true)

// Gradual rollout:
await featureService.setRollout('new_marketplace', 20) // 20% of users
```

### 15.4 Admin Customization

```
Customizable by City Admin:
├─ Service availability (which services active in city)
├─ Pricing rules (inspection charge, etc.) - within preset ranges
├─ Business hours (when bookings accepted)
├─ Technician availability rules
├─ Delivery zones (geographic coverage)
├─ Vendor approval workflow
└─ Notification templates (city-specific messages)

Customizable by Super Admin Only:
├─ Service categories (AC, Fridge, etc.)
├─ Commission structure (can vary by city, but structure is global)
├─ Appliance types (what appliances exist)
├─ Payment gateway settings
├─ SMS/Email providers
├─ API integrations
└─ Feature releases
```

---

## 16. Security Architecture

### 16.1 Authentication & Authorization

```
JWT + OAuth2 + Multi-Factor Authentication

Implemented:
├─ Username/password hashing (bcrypt, salt: 12 rounds)
├─ JWT with strong secret (256-bit key)
├─ Token refresh mechanism (7-day refresh token)
├─ Social login (Google, Facebook)
├─ Email verification (OTP, 10-minute expiry)
├─ Phone verification (OTP via SMS)
├─ MFA (optional for users, mandatory for technicians & admins)
├─ Session timeout (30 minutes inactivity)
├─ CORS (only allow trusted domains)
├─ CSRF protection (SameSite cookies)
└─ Rate limiting on auth endpoints

Password Policy:
├─ Minimum 12 characters
├─ Mix of uppercase, lowercase, numbers, symbols
├─ No common patterns (dictionary words, sequential)
├─ Expiry: 90 days (for admins)
└─ History: Cannot reuse last 5 passwords
```

### 16.2 Data Protection

```
Encryption:
├─ In Transit:
│  ├─ HTTPS/TLS 1.3 (all endpoints)
│  ├─ Certificate pinning (mobile apps)
│  └─ Perfect forward secrecy (PFS)
│
├─ At Rest:
│  ├─ Database: Transparent Data Encryption (TDE)
│  ├─ Sensitive fields encrypted (encrypted_mobile, encrypted_pan)
│  ├─ S3: Server-side encryption (KMS managed keys)
│  ├─ Backups: Encrypted, stored in different region
│  └─ Redis: Optional encryption at rest (for sessions)
│
└─ Keys Management:
   ├─ Keys stored in AWS KMS or HashiCorp Vault
   ├─ Key rotation every 90 days
   ├─ No hardcoded keys in code/config
   └─ Environment variables for non-critical secrets
```

### 16.3 Sensitive Data Protection

```
PAN Number:
├─ Encrypted in database
├─ Masked in UI (show last 4 digits only)
├─ Access logged
└─ Not exposed in API responses (except for admin)

Aadhar/Voter ID:
├─ Encrypted in database
├─ OCR results stored separately (don't store image)
├─ File stored in private S3 bucket
├─ Access limited to KYC verification & compliance
└─ Automatic deletion after verification (unless legally required)

Phone Numbers:
├─ Encrypted in database
├─ Masked in UI (show last 4 digits)
├─ Used only for notifications (via service provider)
└─ WhatsApp masked calling (real number not exposed)

Customer Location:
├─ Precise coordinates stored (for pickup/delivery)
├─ Public API response: rounded to 100m precision
├─ Real-time tracking: WebSocket (encrypted, authorized only)
└─ Location history: Deleted after 30 days
```

### 16.4 Input Validation & Output Encoding

```
Server-side Validation:
├─ Whitelist validation (not blacklist)
├─ Type checking (TypeScript helps)
├─ Length limits
├─ Format validation (regex for email, phone, etc.)
├─ SQL injection prevention (parameterized queries)
├─ XSS prevention (sanitize HTML input)
├─ File upload validation (extension, MIME type, magic bytes)
└─ Rate limiting (per endpoint, per user)

Output Encoding:
├─ HTML context: HTML entity encoding
├─ JSON: No encoding needed (JSON is safe)
├─ URL: URL encoding
├─ CSV: Escape special characters
└─ Database: No encoding needed (using parameterized queries)
```

### 16.5 API Security

```
API Key Management (for integrations):
├─ Generated with unique UUID
├─ Can be regenerated
├─ Can be scoped (read-only, specific endpoints)
├─ Can be rate-limited per key
├─ Must be rotated annually
└─ Logged access: Every API key use logged

Request Validation:
├─ Content-Type check (application/json)
├─ Request size limit (100KB max for most endpoints)
├─ Payload signature (for critical operations)
└─ IP whitelisting (optional for admin APIs)

Response Security:
├─ No stack traces in error messages (logged internally)
├─ No sensitive data in error responses
├─ Security headers:
│  ├─ X-Content-Type-Options: nosniff
│  ├─ X-Frame-Options: DENY
│  ├─ Content-Security-Policy: strict
│  ├─ Strict-Transport-Security: max-age=31536000
│  └─ Referrer-Policy: no-referrer
└─ CORS headers properly configured
```

### 16.6 Third-party Integration Security

```
Payment Gateway:
├─ PCI DSS compliance (no card numbers stored)
├─ Tokenization (store token, not actual card)
├─ Payment webhook signature verification
├─ Encrypted communication
└─ Rate limiting on payment endpoints

SMS/Email Services:
├─ API keys in environment variables
├─ Separate credentials per environment
├─ Log all messages (no PII in logs)
└─ Automatic delivery confirmation

Map Services (Google Maps, Mapbox):
├─ API key restrictions (domain whitelisting)
├─ Usage monitoring & alerts
├─ Separate key per environment
└─ Encryption for map data in transit

OAuth Providers:
├─ Redirect URI whitelist
├─ State parameter for CSRF protection
├─ Scopes limited to required data
└─ Token validation before use
```

### 16.7 Logging & Monitoring

```
Logs Captured:
├─ Authentication events (login, logout, failures)
├─ Authorization failures (permission denied)
├─ Data access (sensitive data read)
├─ Data modification (create, update, delete)
├─ Financial transactions (payment, refund, settlement)
├─ Admin actions (settings change, user management)
├─ Security events (rate limit exceeded, failed validation)
├─ Error logs (all unhandled exceptions)
└─ Performance logs (slow queries, API latency)

Log Protection:
├─ Encrypted in transit & at rest
├─ Access restricted to authorized personnel
├─ Retention: 90 days for most logs, 1 year for audit logs
├─ No passwords or tokens in logs
├─ PII minimal (usually just user_id)
├─ Tamper-evident (immutable after creation)
└─ Centralized logging (ELK Stack or CloudWatch)

Monitoring & Alerts:
├─ Anomaly detection (unusual activity)
├─ Rate limit breaches
├─ Failed payment attempts
├─ System performance degradation
├─ Security events
└─ Alert escalation: P1 (immediate), P2 (1 hour), P3 (daily)
```

### 16.8 Compliance & Audits

```
Standards:
├─ OWASP Top 10 (security best practices)
├─ PCI DSS (if handling payments)
├─ GDPR-ready (data privacy)
├─ Data Protection Act (India)
└─ SOC 2 Type II (infrastructure security)

Regular Audits:
├─ Penetration testing (quarterly, third-party)
├─ Vulnerability scanning (automated, continuous)
├─ Code review (every PR reviewed)
├─ Dependency scanning (known CVEs)
├─ Access review (quarterly)
└─ Incident response testing (annual)

Documentation:
├─ Security policies
├─ Incident response plan
├─ Data retention policy
├─ Privacy policy
├─ Terms & conditions
└─ API security documentation
```

---

## 17. Testing Strategy

### 17.1 Unit Tests

```
Coverage: 80%+ of business logic

Framework: Jest (for NestJS backend)

Test Scope:
├─ Service methods (business logic)
├─ Guards & middleware
├─ Pipes (validation)
├─ Utilities & helpers
├─ Store reducers (Redux)
└─ Custom hooks (React)

Example:
// backend/src/modules/bookings/bookings.service.spec.ts

describe('BookingService', () => {
  describe('createBooking', () => {
    it('should create booking with valid input', async () => {
      // Arrange
      const dto = { ... }
      // Act
      const result = await service.createBooking(dto, customerId)
      // Assert
      expect(result).toMatchObject({ status: 'PENDING' })
    })

    it('should throw if customer has invalid city', async () => {
      // ...
      expect(() => service.createBooking(dto, invalidCustomerId))
        .toThrow('Customer not in authorized city')
    })
  })
})
```

### 17.2 Integration Tests

```
Framework: Test Database (PostgreSQL) + Supertest

Scope:
├─ API endpoints (request → response)
├─ Database transactions
├─ Event emission & handling
├─ Third-party service mocks
└─ Full user flows

Example:
describe('BookingController', () => {
  describe('POST /bookings', () => {
    it('should create booking and assign technician', async () => {
      // Create customer in test DB
      const customer = await createTestCustomer()
      
      // Make API call
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ ... })
      
      // Verify response
      expect(response.status).toBe(201)
      expect(response.body.data.status).toBe('PENDING')
      
      // Verify database
      const booking = await getBooking(response.body.data.id)
      expect(booking).toBeDefined()
      
      // Verify event emitted
      expect(bookingService.emit).toHaveBeenCalledWith('booking.created', ...)
    })
  })
})
```

### 17.3 End-to-End (E2E) Tests

```
Framework: Playwright / Cypress

Scope:
├─ Critical user journeys
├─ Customer booking flow
├─ Technician job acceptance
├─ Marketplace order checkout
├─ Admin settings management
└─ Error scenarios

Focus:
├─ Functionality (does it work?)
├─ UI responsiveness
├─ Performance (page load time < 3s)
└─ Accessibility (WCAG 2.1 AA)

Example:
test('Customer can create booking', async ({ page }) => {
  // Navigate to app
  await page.goto('https://localhost:3000')
  
  // Login
  await page.fill('input[name="email"]', 'customer@test.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Create booking
  await page.click('button:has-text("New Booking")')
  await page.selectOption('select[name="service"]', 'ac')
  await page.click('button:has-text("Next")')
  // ... more steps
  
  // Verify
  await expect(page).toHaveURL(/\/bookings\/\d+/)
  await expect(page.locator('text=Booking Confirmed')).toBeVisible()
})
```

### 17.4 Load & Performance Tests

```
Framework: Apache JMeter / k6

Scenarios:
├─ 100 concurrent customers browsing products
├─ 50 simultaneous booking creation
├─ 200 WebSocket connections (real-time tracking)
├─ Peak hour traffic (5x normal load)
└─ Search with complex filters

Acceptance Criteria:
├─ Response time p99 < 500ms
├─ Success rate > 99.5%
├─ No memory leaks (constant memory usage)
├─ DB connections pool stable
├─ WebSocket reconnection < 2 seconds
└─ Error rate < 0.5%

Run: Before each production release
```

### 17.5 Security Tests

```
Tools: OWASP ZAP / Burp Suite / SonarQube

Tests:
├─ SQL injection
├─ Cross-site scripting (XSS)
├─ Cross-site request forgery (CSRF)
├─ Authentication bypass
├─ Authorization bypass
├─ Sensitive data exposure
├─ Rate limiting evasion
├─ File upload vulnerabilities
├─ Dependency vulnerabilities (npm audit)
└─ Code quality (SonarQube)

Run: Before production release
```

---

## 18. Deployment Architecture

### 18.1 Environments

```
Development (Local):
├─ Docker Compose (backend, postgres, redis, elasticsearch)
├─ Vite dev server (frontend hot reload)
├─ Mock services for SMS, payment, maps
├─ Test data seeded automatically
└─ Port 3000 (frontend), 3001 (backend)

Staging:
├─ Cloud infrastructure (AWS)
├─ Real integrations (test credentials)
├─ Realistic data (anonymized production data)
├─ Performance monitoring enabled
├─ Staging domain: staging.cityworkshop.app
└─ CD pipeline: Auto-deploy on main branch

Production:
├─ Multi-region deployment (primary + failover)
├─ Auto-scaling (load-based)
├─ CDN for static assets
├─ Database backups (hourly)
├─ Real integrations (production credentials)
├─ Monitoring & alerts
├─ Domain: cityworkshop.app
└─ CD pipeline: Manual approval before deploy
```

### 18.2 Container & Orchestration

```
Docker:
├─ Separate Dockerfile for backend, frontend
├─ Multi-stage builds (optimize size)
├─ Non-root user for security
├─ Health checks included
└─ Image registry: ECR (AWS)

Docker Compose (local development):
├─ Backend container
├─ PostgreSQL container
├─ Redis container
├─ Elasticsearch container (optional)
├─ Nginx container (reverse proxy)
└─ Network: internal bridge

Kubernetes (Production):
├─ Deployment manifests (YAML)
├─ Service (ClusterIP for internal, LoadBalancer for public)
├─ Ingress (path-based routing to services)
├─ HorizontalPodAutoscaler (scale based on CPU/memory)
├─ ConfigMap (non-secret configs)
├─ Secrets (environment secrets)
├─ PersistentVolumeClaim (for stateful services)
├─ NetworkPolicy (restrict inter-pod traffic)
└─ Pod security policies (run as non-root, read-only FS)
```

### 18.3 Load Balancing & Failover

```
Frontend:
├─ CloudFront CDN (caches JS, CSS, images)
├─ Static assets from S3
└─ HTML from backend via origin

Backend:
├─ Application Load Balancer (ALB)
├─ Health checks every 30 seconds
├─ Sticky sessions (JWT, so not required)
├─ 3+ instances across AZs
└─ Auto-scaling: Scale up if CPU > 70%, scale down if < 20%

Database:
├─ Primary + Standby (Multi-AZ RDS)
├─ Automatic failover (< 2 minutes)
├─ Read replicas for analytics queries
├─ Automated backups (daily, 30-day retention)
└─ Point-in-time recovery enabled

Cache (Redis):
├─ Primary + Replicas
├─ ElastiCache with automatic failover
├─ Snapshot backup daily
└─ 6GB RAM (configurable)
```

### 18.4 CI/CD Pipeline

```
GitHub Actions Workflow:

1. Code Push to Repository
   ↓
2. Unit Tests
   ├─ Run: npm test
   ├─ Coverage report
   └─ Fail if coverage < 80%
   ↓
3. Build
   ├─ Backend: npm run build
   ├─ Frontend: npm run build
   └─ Artifact: Docker image
   ↓
4. Security Scanning
   ├─ SAST (SonarQube)
   ├─ Dependency check (npm audit)
   ├─ Docker image scan (Trivy)
   └─ Fail if critical vulnerabilities
   ↓
5. Integration Tests
   ├─ Spin up test environment
   ├─ Run API tests
   ├─ Run E2E tests
   └─ Cleanup
   ↓
6. Push to Registry
   └─ ECR (AWS Elastic Container Registry)
   ↓
7. Deploy to Staging
   ├─ Pull image from ECR
   ├─ Update Kubernetes deployments
   ├─ Run smoke tests
   ├─ Notify team
   └─ Ready for manual testing
   ↓
8. Manual Approval for Production
   ├─ Team reviews staging
   ├─ Approves deployment
   ↓
9. Deploy to Production
   ├─ Blue-green deployment (zero downtime)
   ├─ Gradual rollout (10% → 50% → 100%)
   ├─ Monitor error rates
   ├─ Auto-rollback if errors spike
   └─ Send deployment notification
```

### 18.5 Monitoring & Observability

```
Metrics (CloudWatch / Datadog):
├─ Application:
│  ├─ Request rate, latency (p50, p99)
│  ├─ Error rate (5xx, 4xx)
│  ├─ Active users
│  ├─ API endpoint performance
│  └─ WebSocket connection count
│
├─ Infrastructure:
│  ├─ CPU, memory, disk usage
│  ├─ Network I/O
│  ├─ Database connections
│  ├─ Redis evictions
│  └─ Container restart count
│
└─ Business:
   ├─ Bookings created/day
   ├─ Orders created/day
   ├─ Revenue/day
   ├─ Customer retention
   └─ Technician utilization

Logs:
├─ Application logs (stdout → CloudWatch)
├─ Access logs (all API requests)
├─ Error logs (stack traces, context)
├─ Audit logs (user actions)
└─ Retention: 30 days hot, archive to S3 for long-term

Alerts:
├─ Error rate > 1%
├─ Response time p99 > 1000ms
├─ Database CPU > 80%
├─ Low disk space (< 20%)
├─ Payment gateway down
├─ WebSocket connection errors
├─ OOM (out of memory)
└─ Escalation: Slack → PagerDuty → Phone call
```

---

## 19. Environment Configuration

### 19.1 Environment Variables

```
# .env.example (committed to Git)

# App
NODE_ENV=development
DEBUG=app:*

# Server
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=city_workshop
DB_SSL=false

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Search
ELASTICSEARCH_NODE=http://localhost:9200

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# File Storage
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=city-workshop-prod
AWS_S3_FOLDER_PREFIX=production/

# Payment Gateway
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=key_xxxx
RAZORPAY_KEY_SECRET=secret_xxxx

# SMS/Email
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC_xxxx
TWILIO_AUTH_TOKEN=token_xxxx

EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=key_xxxx

# WhatsApp
WHATSAPP_BUSINESS_PHONE_ID=123456789
WHATSAPP_ACCESS_TOKEN=token_xxxx

# Maps
GOOGLE_MAPS_API_KEY=key_xxxx
MAPBOX_API_TOKEN=token_xxxx

# External Services
ANALYTICS_TRACKING_ID=tracking_id
SENTRY_DSN=sentry_dsn

# Features
ENABLE_MARKETPLACE=true
ENABLE_VIDEO_BOOKING=false
ENABLE_BIKE_REPAIR=false
```

### 19.2 Secrets Management

```
Never commit secrets to Git.

Local Development:
├─ .env.local (git-ignored)
├─ .env.development.local
└─ Load with dotenv package

Staging/Production:
├─ AWS Secrets Manager
├─ HashiCorp Vault
├─ GitHub Secrets (for CI/CD)
└─ Kubernetes Secrets (for runtime)

Access Control:
├─ Read-only access for engineers
├─ Audit log of all secret access
├─ Rotate credentials every 90 days
└─ Separate secrets per environment
```

### 19.3 Configuration Files

```
src/config/
├── app.config.ts (port, environment)
├── database.config.ts (connection, pool size)
├── cache.config.ts (redis settings)
├── storage.config.ts (S3, file limits)
├── payment.config.ts (gateway settings)
├── notification.config.ts (SMS, email, WhatsApp)
└── business-rules.config.ts (fees, commissions - loaded from DB)

// ConfigService (from @nestjs/config)
@Injectable()
class ConfigService {
  get isDevelopment(): boolean { ... }
  get databaseUrl(): string { ... }
  get jwtSecret(): string { ... }
  // ... other getters
}

// Usage in services:
constructor(private configService: ConfigService) {}
const dbUrl = this.configService.databaseUrl;
```

---

## 20. Phase-by-Phase Roadmap

### Phase 1: Foundation & Infrastructure (Weeks 1-4)
**Goal:** Core backend, authentication, database structure ready

- [ ] Project setup (monorepo, Docker, CI/CD)
- [ ] Database schema design & migration setup
- [ ] Authentication system (JWT, OAuth2)
- [ ] User registration (customer, technician, admin)
- [ ] Basic API structure with error handling
- [ ] Admin panel foundation (auth, basic UI)
- [ ] Logging & monitoring setup
- [ ] Deployment to staging environment
- [ ] Documentation: API docs, database schema docs

**Deliverable:** Functional auth, empty admin panel, database ready

---

### Phase 2: Customer Booking System (Weeks 5-8)
**Goal:** Core booking lifecycle working end-to-end

- [ ] Booking model & database
- [ ] Booking creation API (multi-step form)
- [ ] Service & appliance selection
- [ ] Image upload for appliance
- [ ] Location selection (address)
- [ ] Booking status tracking
- [ ] Real-time booking status updates (WebSocket)
- [ ] Booking cancellation logic
- [ ] Customer booking history
- [ ] Frontend: Customer booking flow
- [ ] Frontend: Booking tracking page

**Deliverable:** Customers can create bookings, track status in real-time

---

### Phase 3: Technician System (Weeks 9-12)
**Goal:** Technician management and job assignment

- [ ] Technician registration & profile
- [ ] KYC document upload & validation
- [ ] Technician availability management
- [ ] Job assignment algorithm (auto-assign)
- [ ] Technician job list & details API
- [ ] Job acceptance/rejection
- [ ] Technician location tracking (WebSocket)
- [ ] Technician earnings/wallet system
- [ ] Technician performance scoring
- [ ] Frontend: Technician job dashboard
- [ ] Mobile app: Base structure for technician

**Deliverable:** Technicians can receive and accept jobs, track earnings

---

### Phase 4: Admin Dashboard - Core (Weeks 13-16)
**Goal:** Admin can manage platform basics

- [ ] Admin user dashboard (KPIs, overview)
- [ ] Technician management (list, enable/disable, KYC approval)
- [ ] Booking management (list, details, re-assign, cancel)
- [ ] Customer management (list, details, ban)
- [ ] Services management (add AC, Fridge, etc.)
- [ ] Appliances management (per service)
- [ ] City management (add city, enable/disable)
- [ ] Basic analytics (bookings, revenue by city)
- [ ] Audit logs
- [ ] System settings (inspection charge, cancellation fee)

**Deliverable:** Admin can manage core entities, view analytics

---

### Phase 5: Marketplace Foundation (Weeks 17-20)
**Goal:** Product catalog and vendor setup ready

- [ ] Product model & database
- [ ] Vendor registration & approval
- [ ] Vendor profile & store setup
- [ ] Product catalog management (vendor CRUD)
- [ ] Product images upload & optimization
- [ ] Inventory management (city-wise)
- [ ] Product search & filter
- [ ] Product details page (frontend)
- [ ] Shopping cart backend
- [ ] Frontend: Product browsing & cart

**Deliverable:** Vendors can list products, customers can browse & add to cart

---

### Phase 6: Marketplace Orders & Checkout (Weeks 21-24)
**Goal:** Complete order lifecycle

- [ ] Payment gateway integration (Razorpay)
- [ ] Checkout flow (cart → payment → order)
- [ ] Order creation & tracking
- [ ] Inventory reservation & deduction
- [ ] Order status updates
- [ ] Rider assignment for delivery
- [ ] Delivery tracking (WebSocket)
- [ ] Order fulfillment workflow
- [ ] Order completion & customer review
- [ ] Frontend: Checkout, order tracking

**Deliverable:** End-to-end marketplace order flow working

---

### Phase 7: Notifications & Communication (Weeks 25-28)
**Goal:** Real-time notifications across platform

- [ ] Notification service architecture
- [ ] Email notifications (transactional)
- [ ] SMS notifications (Twilio)
- [ ] WhatsApp notifications (WhatsApp Business API)
- [ ] In-app notifications (real-time via WebSocket)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Notification preferences (user can opt-in/out)
- [ ] Notification templates & customization
- [ ] Email queue & retry logic
- [ ] Notification audit log

**Deliverable:** Multi-channel notifications working, users receive timely updates

---

### Phase 8: Advanced Admin Features (Weeks 29-32)
**Goal:** Super Admin has full control & visibility

- [ ] Feature toggle system (enable/disable features)
- [ ] Business rules configuration (fees, commissions, etc.)
- [ ] Franchise management (plans, billing, limits)
- [ ] City Admin role (city-scoped access)
- [ ] Advanced analytics (revenue, technician performance, churn)
- [ ] Vendor commission management
- [ ] Settlement & payment reports
- [ ] Coupons & discounts management
- [ ] API key management (for integrations)
- [ ] System settings (comprehensive)

**Deliverable:** Super Admin has complete control via admin panel

---

### Phase 9: Payments & Financial (Weeks 33-36)
**Goal:** Payment processing, wallet, settlements

- [ ] Wallet system for technician
- [ ] Wallet system for customer (prepaid balance)
- [ ] Wallet transactions API & UI
- [ ] Payment refund handling
- [ ] Technician settlement (daily/weekly/monthly)
- [ ] Vendor settlement
- [ ] Rider earnings tracking
- [ ] Commission calculation & payouts
- [ ] Payment reconciliation
- [ ] Financial reports & export

**Deliverable:** Complete payment lifecycle, settlements automated

---

### Phase 10: Franchise & Multi-City (Weeks 37-40)
**Goal:** Multi-city platform fully operational

- [ ] Franchise system (subscription plans, limits)
- [ ] Franchise owner dashboard
- [ ] City-wise data isolation & filtering
- [ ] City Admin role & permissions
- [ ] City-specific configurations
- [ ] Delivery zones management
- [ ] Franchise billing & subscription
- [ ] Multi-city reporting & analytics
- [ ] Franchise KPI dashboard
- [ ] Expansion workflow (onboard new city)

**Deliverable:** Multiple franchises operating independently, Super Admin oversees all

---

### Phase 11: Testing & QA (Weeks 41-44)
**Goal:** High quality, production-ready code

- [ ] Unit test coverage (80%+)
- [ ] Integration test coverage
- [ ] E2E test suite (critical flows)
- [ ] Load testing (identify bottlenecks)
- [ ] Security testing (OWASP Top 10)
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile app E2E tests
- [ ] Bug fixes & refinement
- [ ] Documentation update

**Deliverable:** High-quality, well-tested codebase

---

### Phase 12: Launch & Monitoring (Weeks 45-48)
**Goal:** Production-ready, launch successfully

- [ ] Final security audit
- [ ] Penetration testing
- [ ] Production environment setup
- [ ] Data migration & seeding
- [ ] Runbook & documentation
- [ ] Incident response plan
- [ ] Go-live checklist
- [ ] Launch (soft launch in one city)
- [ ] Monitoring & incident response
- [ ] Post-launch support & fixes
- [ ] Gradual rollout to other cities

**Deliverable:** Live platform, operational, monitoring in place

---

### Phase 13+: Post-Launch Features
**Goal:** Continuous improvement & feature releases

**Short-term (1-3 months):**
- Video proof for bookings (technician captures video)
- Advanced technician matching (skills-based)
- Customer behavioral analytics
- Ride rating & feedback
- Loyalty program (repeat customer discounts)

**Medium-term (3-6 months):**
- Technician certification management
- Parts marketplace integration
- Technician training portal
- AI-powered demand forecasting
- Performance-based incentives

**Long-term (6+ months):**
- Predictive maintenance (customer alerts)
- Technician fleet management
- White-label platform
- International expansion
- AI chatbot for support
- Machine learning for fraud detection

---

## Supporting Sections

### List of Proposed Technologies

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Backend** | NestJS 10+ | Framework |
| | Node.js 20 LTS | Runtime |
| | PostgreSQL 15+ | Database |
| | Redis 7+ | Cache, sessions, real-time |
| | Bull/RabbitMQ | Job queue |
| **Frontend** | React 18+ | UI framework |
| | Redux Toolkit | State management |
| | MUI v5 + Tailwind | Components & styling |
| | Vite | Build tool |
| | Socket.IO | WebSockets, real-time |
| **Mobile** | React Native / Expo | iOS/Android apps |
| **API** | Passport.js | Authentication strategies |
| | TypeORM / Prisma | ORM |
| **File Storage** | AWS S3 / MinIO | File storage |
| | Sharp | Image processing |
| **Authentication** | JWT | Token-based auth |
| | OAuth2 | Social login |
| **DevOps** | Docker | Containerization |
| | Kubernetes | Orchestration |
| | GitHub Actions | CI/CD |
| | Terraform | IaC |
| **Monitoring** | DataDog / New Relic | APM |
| | CloudWatch / ELK | Logging |
| | Sentry | Error tracking |
| **External Services** | Razorpay | Payments |
| | Twilio | SMS |
| | SendGrid | Email |
| | WhatsApp Business API | WhatsApp notifications |
| | Google Maps / Mapbox | Location services |
| | Firebase | Push notifications, auth |

---

### List of Major Modules

**Backend Modules:**
1. Auth Module - JWT, OAuth, social login
2. Users Module - User CRUD, profiles
3. Customers Module - Customer-specific features
4. Technicians Module - Technician management, KYC, wallet
5. Bookings Module - Booking lifecycle, assignment, tracking
6. Marketplace Module - Products, vendors, inventory, orders
7. Payments Module - Payment gateway, wallet, settlements
8. Notifications Module - Email, SMS, WhatsApp, push
9. Franchise Module - City management, franchises
10. Admin Module - Dashboard, settings, analytics, reports
11. WebSocket Module - Real-time events & tracking
12. File Module - File upload, image optimization, S3
13. Config Module - Business rules, system settings
14. Audit Module - Audit logs, compliance

**Frontend Modules:**
1. Auth Pages - Login, register, forgot password
2. Customer Pages - Dashboard, bookings, marketplace, wallet, profile
3. Technician Pages - Job list, tracking, earnings, profile
4. Admin Pages - Dashboard, users, bookings, marketplace, settings, analytics
5. Shared Components - Buttons, modals, forms, notifications
6. Hooks - useAuth, usePermission, useBookingUpdates, useCart, etc.
7. State Management - Redux store with slices
8. Services - API client, storage, notifications, analytics

---

### List of Major Database Entities

**Core Entities:**
1. User (base entity: admin, customer, technician, vendor, etc.)
2. Customer (extends User)
3. Technician (extends User, with KYC, wallet, performance)
4. Vendor (extends User)
5. CityAdmin (extends User)
6. FranchiseOwner (extends User)
7. Rider (independent for delivery)

**Booking & Service:**
8. Booking (customer → technician → service)
9. BookingTimeline (audit trail)
10. Service (AC, Fridge, etc., configurable)
11. Appliance (specific to service)
12. ServiceProblem (issue types per appliance)

**Marketplace:**
13. Product (seller → product catalog)
14. ProductImage (multiple images per product)
15. Vendor (marketplace seller)
16. Inventory (product stock per city)
17. Order (marketplace order)
18. OrderItem (line items in order)
19. ProductCategory (marketplace categories)

**Franchise & Geography:**
20. Franchise (franchise owner → cities)
21. City (state → district → city)
22. DeliveryZone (geo-polygon coverage area)

**Financials:**
23. Wallet (technician, customer wallets)
24. WalletTransaction (credits/debits)
25. Payment (payment gateway transactions)
26. Invoice (booking & order invoices)
27. Commission (technician, vendor, admin splits)
28. Settlement (batch payouts)

**Configuration & Admin:**
29. BusinessRuleConfig (configurable fees, charges, commission)
30. SystemSettings (global platform settings)
31. FeatureFlag (feature toggle management)
32. AuditLog (all user actions)
33. Notification (notification records)
34. KYCDocument (technician verification docs)

---

### List of Major API Groups

1. **Authentication APIs** - /auth/*
   - Register, login, refresh, logout, forgot password, reset password, OTP verify

2. **Customer APIs** - /customers/*
   - Profile CRUD, bookings, orders, wallet, addresses, reviews

3. **Booking APIs** - /bookings/*
   - Create, read, update, cancel, track, assign technician, complete, review

4. **Marketplace APIs** - /products/*, /cart/*, /orders/*
   - Product search/filter, add to cart, checkout, order tracking

5. **Technician APIs** - /technicians/*
   - Profile, KYC, jobs, availability, location, earnings, wallet

6. **Vendor APIs** - /vendors/*
   - Products, inventory, orders, commissions, analytics

7. **Admin APIs** - /admin/*
   - Dashboard, users, bookings, marketplace, settings, analytics, audit logs, features

8. **Notification APIs** - /notifications/*
   - Get notifications, mark read, preferences

9. **Payment APIs** - /payments/*
   - Process payment, refund, wallet operations

10. **File APIs** - /files/*
    - Upload file, get signed URL, delete

11. **Analytics APIs** - /analytics/*
    - Metrics, trends, reports

12. **City APIs** - /cities/*
    - List, details, configuration

13. **Service APIs** - /services/*
    - List services (AC, Fridge, etc.), appliances per service

---

### Phase-by-Phase Development Roadmap (Summary)

```
Phase 1 (Wks 1-4):    Foundation & Infrastructure
Phase 2 (Wks 5-8):    Customer Booking System
Phase 3 (Wks 9-12):   Technician System
Phase 4 (Wks 13-16):  Admin Dashboard - Core
Phase 5 (Wks 17-20):  Marketplace Foundation
Phase 6 (Wks 21-24):  Marketplace Orders & Checkout
Phase 7 (Wks 25-28):  Notifications & Communication
Phase 8 (Wks 29-32):  Advanced Admin Features
Phase 9 (Wks 33-36):  Payments & Financial
Phase 10 (Wks 37-40): Franchise & Multi-City
Phase 11 (Wks 41-44): Testing & QA
Phase 12 (Wks 45-48): Launch & Monitoring
Phase 13+:            Post-Launch Features
```

**Total**: 12 months to production-ready platform

---

### Key Risks & Dependencies

#### Technical Risks
1. **Real-time Data Consistency**
   - Risk: WebSocket events can conflict with database updates
   - Mitigation: Event sourcing, idempotent operations, optimistic locking
   - Dependency: Redis for event queue reliability

2. **Payment Gateway Integration**
   - Risk: Payment failures, reconciliation issues
   - Mitigation: Automated reconciliation, retry logic, audit trails
   - Dependency: PCI DSS compliance, proper tokenization

3. **Multi-city Data Isolation**
   - Risk: Data leakage between cities, query performance at scale
   - Mitigation: Row-level security, proper indexing, query optimization
   - Dependency: Database schema designed correctly from start

4. **Image Processing at Scale**
   - Risk: Slow uploads, server resource exhaustion
   - Mitigation: Background job queue, CDN, client-side compression
   - Dependency: Bull/RabbitMQ setup, Sharp library, S3 access

5. **Location-based Queries**
   - Risk: Slow geospatial queries, PostGIS complexity
   - Mitigation: Proper indexing, query optimization, caching nearest technicians
   - Dependency: PostGIS extension, developer expertise

#### Business Risks
1. **Feature Scope Creep**
   - Risk: Adding features during development delays launch
   - Mitigation: Strict feature list per phase, defer to Phase 13+
   - Action: Phase gates with stakeholder approval before moving to next phase

2. **Technician Supply**
   - Risk: Insufficient technicians onboarded by launch
   - Mitigation: Parallel recruitment, aggressive onboarding incentives
   - Dependency: Hiring team starts early, payment mechanism ready

3. **Customer Adoption**
   - Risk: Customers don't use platform, prefer existing methods
   - Mitigation: Competitive pricing (low/no inspection charge), smooth UX, marketing
   - Dependency: Admin can quickly adjust pricing rules

4. **Franchise Viability**
   - Risk: Franchise owners can't make money
   - Mitigation: Configurable commission, volume discounts, support tools
   - Dependency: Analytics showing franchise profitability

5. **Regulatory Compliance**
   - Risk: Regulations around gig economy, consumer protection
   - Mitigation: Legal review, compliance checks, audit-ready architecture
   - Dependency: Legal team, compliance documentation

#### Infrastructure Risks
1. **Scalability**
   - Risk: System doesn't scale during peak hours
   - Mitigation: Load testing, auto-scaling, CDN, caching strategy
   - Dependency: Cloud infrastructure setup, monitoring ready

2. **Database Performance**
   - Risk: Queries slow down as data grows
   - Mitigation: Proper indexing, query optimization, read replicas
   - Dependency: Database architecture reviewed, performance tested

3. **Payment Gateway Downtime**
   - Risk: Customers can't pay when payment service is down
   - Mitigation: Fallback payment methods, offline order queue
   - Dependency: Multiple payment gateways integrated

#### Dependency Resolution (Before Phase 1)
- [ ] Confirm tech stack with team
- [ ] Secure AWS/cloud credits & account
- [ ] Payment gateway account & sandbox access
- [ ] SMS/Email provider accounts
- [ ] Google Maps API key
- [ ] Firebase project
- [ ] GitHub organization & repository setup
- [ ] Team roles assigned (backend, frontend, mobile, DevOps, QA)
- [ ] Design system & UI kit approved
- [ ] Database schema peer-reviewed
- [ ] Security checklist completed
- [ ] Legal review of T&C, Privacy Policy
- [ ] Hiring plan for technicians & vendors started

---

## Conclusion

This architecture provides a **solid, scalable foundation** for the CITY WORKSHOP platform. Key strengths:

✅ **Modular Design**: Features can be enabled/disabled by Super Admin  
✅ **Multi-tenancy**: Multiple franchises & cities operate independently  
✅ **Configurable Business Rules**: No hardcoding, all configurable via admin  
✅ **Security-First**: Enterprise-grade auth, encryption, audit logging  
✅ **Real-time Capability**: WebSocket for live tracking, notifications  
✅ **Cloud-Native**: Containerized, serverless-ready, scalable  
✅ **Tested**: Comprehensive testing strategy from unit to E2E  
✅ **Production-Ready**: Monitoring, logging, deployment strategy included  

**Next Step:** Phase 1 - Kickoff meeting with team to confirm architecture, assign roles, and begin foundation work.

---

*Document prepared for CITY WORKSHOP — Architecture Planning Phase*  
*Not for external distribution*
