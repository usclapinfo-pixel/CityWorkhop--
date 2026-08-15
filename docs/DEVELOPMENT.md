# CITY WORKSHOP - Development Guide

## Overview

CITY WORKSHOP is a multi-city appliance repair and marketplace platform built with:
- **Backend**: NestJS 11 (Node.js)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Package Manager**: npm with native workspaces

This guide covers Phase 1 (Foundation & Infrastructure) setup and local development.

## Prerequisites

- **Node.js 20+** (download from [nodejs.org](https://nodejs.org))
- **Docker Desktop 4.20+** (download from [docker.com](https://docker.com))
- **Git 2.40+**
- **Visual Studio Code** (recommended)

## Quick Start

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Verify installation
npm --version  # Should be 10+
node --version # Should be 20+
```

### 2. Setup Environment

```bash
# Copy environment template
cp apps/backend/.env.example apps/backend/.env

# Edit .env with your values (for local development, defaults work fine)
code apps/backend/.env
```

### 3. Start Docker Services

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify services are running
docker-compose ps

# Check database is ready
docker exec cityworkhop-postgres pg_isready -U postgres -d city_workshop
```

### 4. Run Migrations (Phase 1: TypeORM sync)

```bash
# TypeORM will auto-sync entities in development mode
# This creates tables from entity definitions
# Production: Use TypeORM migrations (implement in Phase 2)
```

### 5. Start Development Server

```bash
# Start backend in watch mode
npm run dev --workspace=apps/backend

# Verify server is running
curl http://localhost:3001

# Check logs for startup confirmation
```

### 6. Run Tests (Phase 1: Template only)

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --workspace=apps/backend

# Run with coverage
npm run test:cov --workspace=apps/backend
```

## Project Structure

```
city-workshop/
├── apps/
│   └── backend/                      # NestJS backend API
│       ├── src/
│       │   ├── main.ts               # Application entry point
│       │   ├── app.module.ts         # Root module
│       │   ├── config/               # Configuration files
│       │   ├── database/             # Database entities and migrations
│       │   └── modules/              # Feature modules
│       ├── dist/                     # Compiled output
│       ├── Dockerfile                # Container image
│       └── package.json
├── shared/                           # Shared utilities package
│   ├── src/
│   │   ├── types/                    # TypeScript interfaces
│   │   ├── constants/                # Application constants
│   │   └── utils/                    # Utility functions
│   └── package.json
├── docker/                           # Docker configuration
│   ├── docker-compose.yml            # Development stack
│   └── postgres-init.sql             # Database initialization
├── docs/                             # Documentation
│   ├── DEVELOPMENT.md                # This file
│   ├── DATABASE.md                   # Schema documentation
│   ├── API.md                        # API design standards
│   └── SECURITY.md                   # Security guidelines
└── package.json                      # Root workspace file
```

## Development Workflow

### Running Commands

All npm scripts run from the root directory and apply to all workspaces:

```bash
# Dev server (watches for changes)
npm run dev

# Production build
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run specific workspace
npm run dev --workspace=apps/backend
```

### Debugging

#### Debug in VS Code

1. Set breakpoint in code (click line number)
2. Open Run & Debug view (Ctrl+Shift+D)
3. Select "Debug Backend" configuration
4. Press F5 to start debugger
5. Step through code using controls

#### Debug TypeORM Queries

Add to `.env`:
```bash
TYPEORM_LOGGING=true
```

This logs all SQL queries to console.

### Database Access

#### Direct Connection

```bash
# Connect to PostgreSQL
docker exec -it cityworkhop-postgres psql -U postgres -d city_workshop

# List tables
\dt

# View schema
\d user_entity

# Exit
\q
```

#### Admin UI (pgAdmin - optional)

Add to docker-compose.yml and access at http://localhost:5050

#### TypeORM CLI

```bash
# Not implemented in Phase 1 - will be added in Phase 2
```

## Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- user.entity.spec.ts

# Generate coverage report
npm run test:cov
```

### API Testing

Use tools like:
- **Postman** - GUI collection-based testing
- **Thunder Client** - VS Code extension
- **cURL** - Command-line tool
- **Jest** - Automated API integration tests (Phase 2+)

## Common Issues

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check Docker containers
docker ps

# Check database logs
docker logs cityworkhop-postgres

# Verify .env has correct DB credentials
cat apps/backend/.env | grep DB_
```

### Node Modules Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeORM Sync Issues

```bash
# Drop all tables (development only!)
# Uncomment in database.config.ts: dropSchema: true
npm run dev

# Then comment it out again to prevent data loss
```

## Environment Variables

See [apps/backend/.env.example](../apps/backend/.env.example) for complete list.

Key variables for development:

```bash
NODE_ENV=development              # Enable debug output
DB_HOST=localhost                 # PostgreSQL container
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=city_workshop
REDIS_HOST=localhost              # Redis container
REDIS_PORT=6379
JWT_SECRET=your_dev_secret_here   # Change in production
PORT=3001
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres

# Rebuild images
docker-compose up -d --build

# Remove all data (careful!)
docker-compose down -v
```

## Production Deployment (Phase 2+)

Documentation will be updated when Phase 2 deployment is implemented.

## Troubleshooting

### Can't connect to database
- Verify Docker is running: `docker ps`
- Check database is healthy: `docker-compose ps`
- Verify .env values match docker-compose.yml

### Backend won't start
- Check Node version: `node --version` (should be 20+)
- Check port 3001 is free
- Check database is ready: wait 10+ seconds after `docker-compose up`

### Tests fail with "Cannot find module"
- Run `npm install` from root directory
- Verify tsconfig paths are set correctly
- Check workspace structure is correct

## Getting Help

- Check [DATABASE.md](./DATABASE.md) for schema questions
- Check [API.md](./API.md) for API design patterns
- Check [SECURITY.md](./SECURITY.md) for security concerns
- Open an issue in the GitHub repository
