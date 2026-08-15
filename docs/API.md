# CITY WORKSHOP - API Design Standards

## Overview

This document defines API design standards for CITY WORKSHOP backend. All endpoints follow REST conventions with JSON request/response formats.

## Base URL

```
Development:  http://localhost:3001/api/v1
Production:   https://api.cityworkhop.com/api/v1
```

## API Response Format

### Success Response (HTTP 200, 201)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "technician",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

### List Response with Pagination (HTTP 200)

```json
{
  "success": true,
  "data": [
    { "id": "...", "firstName": "John", "lastName": "Doe" },
    { "id": "...", "firstName": "Jane", "lastName": "Smith" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response (HTTP 4xx, 5xx)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "constraint": "isEmail",
      "value": "invalid-email"
    }
  }
}
```

## HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| `200` | OK | Request succeeded, data returned |
| `201` | Created | Resource created successfully |
| `204` | No Content | Request succeeded, no data returned |
| `400` | Bad Request | Invalid input validation failed |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Authenticated but not authorized |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists (duplicate email, etc.) |
| `422` | Unprocessable Entity | Request is well-formed but has semantic errors |
| `500` | Internal Server Error | Server error occurred |
| `503` | Service Unavailable | Database/external service down |

## Error Codes

Standard error codes used in API responses:

```typescript
VALIDATION_ERROR      // Input validation failed
UNAUTHORIZED         // Missing authentication
FORBIDDEN            // Insufficient permissions
NOT_FOUND            // Resource doesn't exist
CONFLICT             // Resource already exists
INTERNAL_ERROR       // Unexpected server error
SERVICE_UNAVAILABLE  // External service/database down
```

## Authentication

### JWT Bearer Token

All authenticated endpoints require Bearer token in `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiry:**
- Access Token: 15 minutes (shorter-lived)
- Refresh Token: 7 days (use to get new access token)

### Token Payload

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "technician",
  "iat": 1705315800,
  "exp": 1705316700
}
```

### Refresh Token Flow

```
1. Login → Get access_token (15m) + refresh_token (7d)
2. After 15m, access_token expires
3. POST /auth/refresh with refresh_token → Get new access_token
4. Continue using new access_token
5. After 7d, refresh_token expires → Require login again
```

## Authorization

### Role-Based Access Control (RBAC)

Endpoints protected by role requirements:

```typescript
@UseGuards(AuthGuard(), RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN)
@Get('/admin/users')
async getUsers() { ... }
```

### City Scoping

Users with `CITY_ADMIN` or `FRANCHISE_OWNER` role access only their authorized cities:

```typescript
// User can access /cities/{cityId} only if
// cityId is in user.authorizedCityIds array

GET /api/v1/cities/550e8400-e29b-41d4-a716-446655440000
→ Check if user.authorizedCityIds includes this cityId
→ If yes, return data; if no, return 403 Forbidden
```

## Pagination

List endpoints support pagination via query parameters:

```
GET /api/v1/users?page=1&limit=20&sort=createdAt:desc
```

**Query Parameters:**
- `page` - Page number (1-based, default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field and direction (field:asc|desc, default: createdAt:desc)

**Response Meta:**
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Request/Response Validation

### Request Validation

All request bodies validated using DTOs:

```typescript
// apps/backend/src/modules/users/dto/user.dto.ts

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
```

### Common Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "constraints": { "isEmail": "email must be an email" }
      },
      {
        "field": "password",
        "constraints": { "minLength": "password must be longer than 7" }
      }
    ]
  }
}
```

## Common Endpoints (Phase 1 Stubs)

### Health Check

```
GET /health
Response: { "status": "ok", "timestamp": "2024-01-15T10:35:00Z" }
```

### Users (Implementation in Phase 2)

```
POST   /api/v1/users                    Create user
GET    /api/v1/users                    List users (paginated)
GET    /api/v1/users/{id}               Get user by ID
PATCH  /api/v1/users/{id}               Update user
DELETE /api/v1/users/{id}               Soft-delete user
```

### Authentication (Implementation in Phase 2)

```
POST   /api/v1/auth/register            Register new user
POST   /api/v1/auth/login               Login user
POST   /api/v1/auth/logout              Logout user
POST   /api/v1/auth/refresh             Refresh access token
POST   /api/v1/auth/verify-email        Verify email OTP
POST   /api/v1/auth/resend-otp          Resend email OTP
```

## Handling Soft Deletes

Soft-deleted records are excluded from queries by default:

```typescript
// Query automatically filters deleted_at IS NULL
const users = await userRepository.find();  // Only active users

// To include deleted records (admin use only)
const users = await userRepository.find({ withDeleted: true });

// To query only deleted records
const deleted = await userRepository.find({ 
  where: { deletedAt: Not(IsNull()) }
});
```

## Rate Limiting (Phase 2+)

Rate limiting will be implemented for public endpoints:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705316700

HTTP 429 Too Many Requests
Retry-After: 60
```

## File Upload API (Phase 2+)

```
POST /api/v1/upload
Content-Type: multipart/form-data

Form Fields:
  file: <binary>
  type: "kyc" | "product_image" | "appliance_image" | "video"
  
Response:
{
  "success": true,
  "data": {
    "fileId": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://storage.example.com/uploads/file.jpg",
    "size": 2048576,
    "type": "image/jpeg"
  }
}
```

## WebSocket Events (Phase 3+)

Real-time updates via Socket.IO:

```javascript
// Connect
io.connect('ws://localhost:3001', { 
  auth: { token: 'bearer-token' } 
});

// Listen to events
io.on('booking:created', (data) => {
  console.log('New booking:', data);
});

// Emit events
io.emit('technician:status', { status: 'busy' });
```

## Timestamp Format

All timestamps in ISO 8601 format with UTC timezone:

```
2024-01-15T10:35:00Z
2024-01-15T10:35:00.123Z  (with milliseconds)
```

## API Versioning

Current version: **v1**

```
GET /api/v1/users          ← Current version
GET /api/v2/users          ← Future version (backward compatibility)
```

New versions will be released without breaking existing v1 endpoints.

## CORS Policy

```
Allowed Origins:
  - http://localhost:3000 (development)
  - https://cityworkhop.com (production)

Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

Allowed Headers: 
  - Content-Type
  - Authorization
  - X-Requested-With

Credentials: true (cookies allowed)

Max Age: 3600 (preflight cache)
```

## Testing the API

### Using cURL

```bash
# Get health status
curl http://localhost:3001/api/v1/health

# Create user (Phase 2+)
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "role": "technician"
  }'
```

### Using Postman/Thunder Client

1. Import collection from `docs/postman-collection.json` (Phase 2+)
2. Set environment variables (base_url, auth_token)
3. Run requests and test response formats

## Backward Compatibility

- Existing endpoints will not change
- New functionality added via new endpoints
- Deprecated endpoints marked with sunset headers (Phase 2+)
- Deprecation notice 6+ months before removal

## Performance Guidelines

- Response time target: < 200ms for most queries
- Pagination: Max 100 items per page (protect database)
- Timeout: 30 seconds for long-running operations
- Connection pooling: 20 connections per backend instance

## Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## Documentation

See [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions.
See [SECURITY.md](./SECURITY.md) for security guidelines.
