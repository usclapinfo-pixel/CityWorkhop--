# CITY WORKSHOP

A multi-city appliance repair and marketplace platform built with modern cloud-native technologies.

## Phase 1: Foundation & Infrastructure ✅

This is Phase 1 (Foundation & Infrastructure) of the CITY WORKSHOP project. Phase 1 establishes the core infrastructure, database schema, and project structure without implementing authentication, booking, or marketplace features.

### What's Included in Phase 1

- ✅ **Project Structure**: npm workspaces with modular architecture
- ✅ **Backend Foundation**: NestJS 11 application skeleton
- ✅ **Database Schema**: PostgreSQL with User entity and TypeORM setup
- ✅ **Environment Configuration**: All configuration files and templates
- ✅ **Docker Stack**: PostgreSQL, Redis, and development environment
- ✅ **Documentation**: Complete development and API guidelines
- ✅ **Code Standards**: ESLint, Prettier, TypeScript strict mode
- ✅ **Testing Setup**: Jest configuration ready (tests to be written in Phase 2+)

### What's NOT Included in Phase 1

- ❌ Authentication & Authorization (Phase 2)
- ❌ Booking System (Phase 2)
- ❌ Marketplace Features (Phase 3)
- ❌ Payment Processing (Phase 4)
- ❌ Mobile Apps (Phase 5)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp apps/backend/.env.example apps/backend/.env

# 3. Start Docker services
docker-compose up -d

# 4. Start development server
npm run dev --workspace=apps/backend

# Server runs on http://localhost:3001
```

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for complete setup instructions.

## Project Structure

```
city-workshop/
├── apps/
│   └── backend/                      # NestJS backend
│       ├── src/
│       │   ├── modules/              # Feature modules
│       │   ├── database/             # Database entities
│       │   ├── config/               # Configuration
│       │   └── main.ts               # Entry point
│       └── package.json
├── shared/                           # Shared code
│   └── src/
│       ├── types/                    # Common types
│       ├── constants/                # Constants
│       └── utils/                    # Utilities
├── docker/                           # Docker configuration
├── docs/                             # Documentation
└── package.json                      # Root workspace
```

## Technology Stack

### Backend
- **Framework**: NestJS 11.0.0 (TypeScript)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: TypeORM 0.3.17
- **Package Manager**: npm (native workspaces)

### Development
- **Language**: TypeScript 5.2.2
- **Testing**: Jest 29.7.0
- **Linting**: ESLint 8.53
- **Formatting**: Prettier 3.0.3
- **Containerization**: Docker & Docker Compose

## Documentation

- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Setup and development workflow
- **[DATABASE.md](./docs/DATABASE.md)** - Database schema and queries
- **[API.md](./docs/API.md)** - API design standards and patterns
- **[SECURITY.md](./docs/SECURITY.md)** - Security best practices
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and phases

## Key Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace configuration |
| `tsconfig.json` | TypeScript configuration |
| `.eslintrc.json` | ESLint rules |
| `.prettierrc.json` | Code formatting rules |
| `.gitignore` | Git ignore patterns |
| `docker-compose.yml` | Docker services |

## Development Commands

```bash
# Development
npm run dev                           # Start dev server with watch
npm run build                         # Production build
npm run build --workspace=apps/backend # Build specific workspace

# Testing
npm run test                          # Run tests
npm run test:cov                      # Test with coverage
npm run test -- --watch              # Watch mode

# Code Quality
npm run lint                          # Run ESLint
npm run format                        # Format with Prettier
npm run lint -- --fix                # Auto-fix lint issues

# Docker
docker-compose up -d                 # Start services
docker-compose down                  # Stop services
docker-compose logs -f               # View logs
```

## Database Setup

### Local Development

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Connect to database
docker exec -it cityworkhop-postgres psql -U postgres -d city_workshop

# Drop and recreate tables (development only)
# Uncomment dropSchema in database.config.ts, run dev server, then comment out
```

### Database Schema

The User entity is the foundation schema in Phase 1:

```sql
CREATE TABLE user_entity (
  id UUID PRIMARY KEY,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50),
  emailVerified BOOLEAN,
  phoneVerified BOOLEAN,
  kycVerified BOOLEAN,
  isActive BOOLEAN,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP  -- Soft delete
);
```

See [DATABASE.md](./docs/DATABASE.md) for complete schema documentation.

## Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
NODE_ENV=development              # Application environment
PORT=3001                          # Server port
DB_HOST=localhost                  # PostgreSQL host
DB_PORT=5432                       # PostgreSQL port
DB_USERNAME=postgres               # PostgreSQL user
DB_PASSWORD=postgres               # PostgreSQL password
DB_DATABASE=city_workshop          # Database name
REDIS_HOST=localhost               # Redis host
REDIS_PORT=6379                    # Redis port
JWT_SECRET=your_secret_here        # JWT secret (change in production)
```

## API Endpoints (Phase 1 Stubs)

### Health Check
```
GET /health
```

### Users (Implementation in Phase 2)
```
POST   /api/v1/users              # Create user
GET    /api/v1/users              # List users
GET    /api/v1/users/:id          # Get user
PATCH  /api/v1/users/:id          # Update user
DELETE /api/v1/users/:id          # Delete user
```

See [API.md](./docs/API.md) for complete API specification.

## User Roles

The system supports 7 user roles:

1. **SUPER_ADMIN** - Global system administrator
2. **CITY_ADMIN** - City-level administrator
3. **FRANCHISE_OWNER** - Franchise business owner
4. **CUSTOMER** - Service consumer
5. **TECHNICIAN** - Service provider
6. **RIDER** - Delivery/pickup specialist
7. **VENDOR** - Parts/accessories seller

## Security

### Authentication (Phase 2+)
- JWT-based authentication with 15-minute access tokens
- Refresh tokens with 7-day expiry
- Password hashing with bcrypt

### Authorization
- Role-Based Access Control (RBAC)
- City scoping for CITY_ADMIN and FRANCHISE_OWNER roles
- Resource-level access checks

### Database Security
- Soft deletes for data recovery
- Parameterized queries to prevent SQL injection
- Password hashes never selected in queries
- Audit logging for compliance

See [SECURITY.md](./docs/SECURITY.md) for detailed security guidelines.

## Testing

Unit tests are configured with Jest. Write tests in Phase 2+:

```bash
# Run tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage report
npm run test:cov
```

Test files: `src/**/*.spec.ts`

## Deployment (Phase 2+)

Deployment setup will be completed in Phase 2. Currently supports:
- Docker containerization (`Dockerfile` ready)
- Docker Compose for development
- Environment-based configuration

## Monitoring & Logging

### Logs
- Development: Console logs with timestamps
- Production: Structured JSON logs (to be implemented Phase 2+)

### Database Monitoring
```bash
# Database size
docker exec cityworkhop-postgres psql -U postgres -d city_workshop \
  -c "SELECT pg_size_pretty(pg_database_size('city_workshop'));"

# Connection count
docker exec cityworkhop-postgres psql -U postgres -d city_workshop \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

## Contributing

### Code Style
- Follow [Airbnb ESLint rules](https://github.com/airbnb/javascript)
- Format with Prettier (100 char line width)
- TypeScript strict mode enabled
- No console.log in production code

### Commits
Use conventional commits:
- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

### Pull Requests
1. Branch from `develop`
2. Create feature branch: `feature/feature-name`
3. Make changes and test
4. Push and create PR
5. Code review required before merge
6. CI/CD must pass (lint, test, build)

## Known Issues & Limitations (Phase 1)

- No authentication implemented yet
- No persistent token storage
- No email/SMS verification
- No payment processing
- No file upload endpoints
- Tests not yet written (templates in place)

These will be addressed in Phase 2+.

## Roadmap

### Phase 1: Foundation ✅
Core infrastructure and database setup

### Phase 2: Authentication & APIs
User management, authentication, RBAC

### Phase 3: Booking System
Service booking, technician assignment, tracking

### Phase 4: Payments
Payment processing, wallet system, commissions

### Phase 5: Marketplace
Product catalog, vendor management, inventory

### Phase 6: Mobile Apps
iOS and Android applications

## Getting Help

- **Development**: See [DEVELOPMENT.md](./docs/DEVELOPMENT.md)
- **Database**: See [DATABASE.md](./docs/DATABASE.md)
- **API**: See [API.md](./docs/API.md)
- **Security**: See [SECURITY.md](./docs/SECURITY.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)

## License

Copyright © 2024 CITY WORKSHOP. All rights reserved.

## Support

For questions or issues:
1. Check the documentation in `/docs` folder
2. Review existing GitHub issues
3. Create a new issue with detailed description

---

**Status**: Phase 1 Complete ✅
**Last Updated**: 2024-01-15
