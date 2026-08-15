# CITY WORKSHOP - Database Schema Documentation

## Overview

The database uses PostgreSQL 15 with TypeORM as the ORM layer. Phase 1 implements the foundation schema with the User entity and support structures.

## Connection Details

**Development Environment:**
- Host: localhost
- Port: 5432
- Database: city_workshop
- User: postgres
- Password: postgres (development only)

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/city_workshop
```

## Database Extensions

The following PostgreSQL extensions are enabled:

### uuid-ossp
Provides `uuid_generate_v4()` function for auto-generating UUIDs.

```sql
CREATE EXTENSION "uuid-ossp";
SELECT uuid_generate_v4(); -- Returns: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

### postgis
Provides geographic data types and functions (planned for Phase 2 location queries).

```sql
CREATE EXTENSION "postgis";
SELECT ST_Distance(point1, point2); -- Calculate distance between two points
```

## Schema Design Principles

1. **UUID Primary Keys**: All tables use UUID v4 for globally unique, distributed IDs
2. **Soft Deletes**: `DeleteDateColumn` for logical deletion (data recovery)
3. **Audit Timestamps**: `CreateDateColumn` and `UpdateDateColumn` on all entities
4. **Indexing**: Strategic indexes on frequently queried columns (email, role, createdAt)
5. **JSONB Columns**: Flexible metadata storage without schema modification
6. **Normalization**: Proper relationships and constraints (Phase 2+)

## Base Entity

All entities extend `BaseEntity` which provides common fields:

```typescript
abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
```

**Table Name:** `base_entity` (abstract, not directly instantiated)

## User Entity

**Table Name:** `user_entity`

**Purpose:** Foundation user model supporting all user types (admin, technician, customer, etc.)

### Columns

| Column | Type | Nullable | Unique | Indexed | Notes |
|--------|------|----------|--------|---------|-------|
| `id` | UUID | No | Yes | Yes | Primary key, generated via uuid_generate_v4() |
| `firstName` | VARCHAR(255) | No | No | No | First name |
| `lastName` | VARCHAR(255) | No | No | No | Last name |
| `email` | VARCHAR(255) | No | Yes | Yes | Email address, unique per user |
| `phone` | VARCHAR(20) | Yes | No | No | Phone number (formatted) |
| `passwordHash` | VARCHAR(255) | No | No | No | Bcrypt hash, never selected in queries |
| `role` | ENUM | No | No | Yes | User role type |
| `emailVerified` | BOOLEAN | No | No | No | Email verification status |
| `phoneVerified` | BOOLEAN | No | No | No | Phone verification status |
| `kycVerified` | BOOLEAN | No | No | No | KYC document verification status |
| `isActive` | BOOLEAN | No | No | Yes | Account active status |
| `lastLoginAt` | TIMESTAMP | Yes | No | No | Last login timestamp |
| `authorizedCityIds` | UUID[] | Yes | No | No | Array of authorized city UUIDs |
| `defaultCityId` | UUID | Yes | No | No | Default city for operations |
| `metadata` | JSONB | Yes | No | No | Flexible metadata storage |
| `createdAt` | TIMESTAMP | No | No | Yes | Record creation timestamp |
| `updatedAt` | TIMESTAMP | No | No | No | Record last update timestamp |
| `deletedAt` | TIMESTAMP | Yes | No | No | Soft delete timestamp |

### Indexes

```sql
CREATE INDEX idx_user_email ON user_entity(email);
CREATE INDEX idx_user_role ON user_entity(role);
CREATE INDEX idx_user_created_at ON user_entity(created_at DESC);
CREATE INDEX idx_user_is_active ON user_entity(is_active);
```

### User Roles (ENUM)

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',        // Global system administrator
  CITY_ADMIN = 'city_admin',          // City-level administrator
  FRANCHISE_OWNER = 'franchise_owner', // Franchise business owner
  CUSTOMER = 'customer',               // Service consumer
  TECHNICIAN = 'technician',          // Service provider
  RIDER = 'rider',                     // Delivery/pickup specialist
  VENDOR = 'vendor',                   // Parts/accessories seller
}
```

### Metadata JSONB Schema

Flexible storage for user-specific data:

```json
{
  "profileImage": "https://...",
  "bio": "...",
  "preferredLanguage": "en",
  "notificationPreferences": {
    "email": true,
    "sms": true,
    "push": true
  },
  "technician": {
    "specializations": ["washing_machine", "refrigerator"],
    "experience_years": 5,
    "certifications": [...]
  },
  "vendor": {
    "shopName": "...",
    "catalogUrl": "..."
  }
}
```

### Sample Queries

#### Create User
```sql
INSERT INTO user_entity (
  first_name, last_name, email, phone,
  password_hash, role, email_verified, phone_verified,
  kyc_verified, is_active, default_city_id
) VALUES (
  'John', 'Doe', 'john@example.com', '+919876543210',
  '$2b$10$...', 'technician', false, false,
  false, true, '550e8400-e29b-41d4-a716-446655440000'
);
```

#### Find User by Email
```sql
SELECT id, first_name, last_name, email, role, is_active
FROM user_entity
WHERE email = 'john@example.com'
AND deleted_at IS NULL;
```

#### Find Active Users by Role
```sql
SELECT id, first_name, last_name, email, role
FROM user_entity
WHERE role = 'technician'
AND is_active = true
AND deleted_at IS NULL
ORDER BY created_at DESC;
```

#### Soft Delete User
```sql
UPDATE user_entity
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

#### Search Users
```sql
SELECT id, first_name, last_name, email, role
FROM user_entity
WHERE (first_name ILIKE '%john%' OR last_name ILIKE '%doe%')
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

## Audit Logs Table

**Table Name:** `audit_logs`

**Purpose:** Track all data modifications for compliance and debugging.

### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary key |
| `entity_type` | VARCHAR(255) | No | Entity being modified (e.g., 'user_entity') |
| `entity_id` | UUID | Yes | ID of modified entity |
| `action` | VARCHAR(50) | No | 'create', 'update', 'delete' |
| `changed_fields` | JSONB | Yes | Before/after values of changed columns |
| `changed_by_user_id` | UUID | Yes | User who made the change |
| `timestamp` | TIMESTAMP | No | When change occurred |
| `ip_address` | VARCHAR(45) | Yes | IP address of requester |

### Sample Query

```sql
SELECT entity_type, action, COUNT(*) as count
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY entity_type, action
ORDER BY count DESC;
```

## Future Schema (Phase 2+)

The following entities will be added in later phases:

### Phase 2: Booking & Services
- `ServiceCategory` - Appliance repair categories
- `Booking` - Service requests
- `Technician` - Technician profiles with ratings

### Phase 3: Marketplace
- `Product` - Marketplace products
- `Inventory` - Stock management

### Phase 4: Payments
- `Transaction` - Payment records
- `Wallet` - User wallet balance
- `PaymentMethod` - Saved payment methods

## TypeORM Configuration

### Development (Auto-Sync)

```typescript
// apps/backend/src/config/database.config.ts
synchronize: true,        // Auto-create tables from entities
dropSchema: false,        // Don't delete tables on sync
logging: true,            // Log SQL queries
```

This automatically creates/updates tables based on entity definitions.

### Production (Migrations)

Migration system will be implemented in Phase 2 using TypeORM migrations CLI.

## Backup & Recovery

### Backup Database

```bash
# Create backup
docker exec cityworkhop-postgres pg_dump -U postgres -d city_workshop > backup.sql

# With compression
docker exec cityworkhop-postgres pg_dump -U postgres -d city_workshop | gzip > backup.sql.gz
```

### Restore Database

```bash
# Restore from backup
docker exec -i cityworkhop-postgres psql -U postgres -d city_workshop < backup.sql

# From compressed backup
gunzip -c backup.sql.gz | docker exec -i cityworkhop-postgres psql -U postgres -d city_workshop
```

## Performance Considerations

### Indexing Strategy

1. **Equality filters** - Indexed (email, role, is_active)
2. **Range queries** - Indexed (createdAt)
3. **Soft deletes** - WHERE deletedAt IS NULL - ensure deletedAt is indexed
4. **JOIN keys** - Indexed when adding relationships in Phase 2

### Query Optimization Tips

```sql
-- ✅ Good: Uses indexes
SELECT * FROM user_entity
WHERE email = 'john@example.com' AND deleted_at IS NULL;

-- ❌ Avoid: Full table scan
SELECT * FROM user_entity
WHERE first_name LIKE '%john%';

-- ✅ Better: Use ILIKE with indexes where possible
SELECT * FROM user_entity
WHERE email ILIKE 'john%' AND deleted_at IS NULL;
```

## Monitoring

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('city_workshop'));
```

### Check Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

### Check Connection Count

```sql
SELECT count(*) as connections FROM pg_stat_activity;
```

## Documentation References

- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/)
