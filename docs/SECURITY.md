# CITY WORKSHOP - Security Guidelines

## Overview

This document outlines security best practices for CITY WORKSHOP development and deployment. Security is a shared responsibility across all team members.

## Authentication & Authorization

### JWT (JSON Web Tokens)

**Implementation (Phase 2+):**
- Algorithm: HS256 (symmetric) or RS256 (asymmetric in production)
- Expiry: 15 minutes for access token, 7 days for refresh token
- Payload: User ID, email, role, authorized city IDs

**Best Practices:**
```typescript
// ✅ DO: Always validate token signature
const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

// ❌ DON'T: Skip validation
const decoded = jwt.decode(token);  // Doesn't verify signature!

// ✅ DO: Always check token expiry
if (decoded.exp < Date.now() / 1000) throw new UnauthorizedException();

// ✅ DO: Use secure, random JWT_SECRET
JWT_SECRET=generateRandomString(64)  // At least 32 characters
```

### Password Security

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Implementation (Phase 2+):**
```typescript
import * as bcrypt from 'bcrypt';

// Hash password before storing
const passwordHash = await bcrypt.hash(password, 10);  // 10 salt rounds

// Never store plain text passwords
// ❌ DON'T: userEntity.password = password;
// ✅ DO: userEntity.passwordHash = await bcrypt.hash(password, 10);

// Compare on login
const isValid = await bcrypt.compare(loginPassword, userEntity.passwordHash);
```

### Role-Based Access Control

```typescript
// Define roles clearly
enum UserRole {
  SUPER_ADMIN,      // Full system access
  CITY_ADMIN,       // Access to assigned cities only
  FRANCHISE_OWNER,  // Access to franchise cities only
  CUSTOMER,         // Access to own bookings only
  TECHNICIAN,       // Access to own jobs only
  RIDER,            // Access to deliveries assigned
  VENDOR,           // Access to own store only
}

// Always check authorization
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN)
@Delete('/admin/users/:id')
async deleteUser(@Param('id') userId: string) {
  // Only super admin or city admin can delete users
}

// City-scoped access
@Get('/cities/:cityId/users')
async getCityUsers(@Param('cityId') cityId: string, @User() user) {
  // Verify user has access to this city
  if (!user.authorizedCityIds.includes(cityId)) {
    throw new ForbiddenException('No access to this city');
  }
}
```

## Environment Variables

### Secrets Management

**Rules:**
1. Never commit `.env` file to Git (only `.env.example` without secrets)
2. Generate strong random values for all secrets
3. Rotate secrets regularly (especially in production)
4. Use different secrets per environment (dev, staging, production)

**Required Secrets:**
```bash
# Generated secrets (NOT checked into Git)
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
DB_PASSWORD=<strong password>
REDIS_PASSWORD=<random password if needed>
AWS_SECRET_ACCESS_KEY=<from AWS IAM>
```

**Secret Generation:**
```bash
# Generate 64-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use password generator
openssl rand -base64 32
```

### Environment Setup

```bash
# Development
export NODE_ENV=development
export DEBUG=app:*

# Staging
export NODE_ENV=staging

# Production
export NODE_ENV=production
export DEBUG=
```

## Database Security

### Connection Security

```typescript
// ✅ DO: Use environment variables
const host = process.env.DB_HOST;  // localhost (dev) or RDS endpoint (prod)
const password = process.env.DB_PASSWORD;

// ❌ DON'T: Hardcode credentials
const host = 'localhost';
const password = 'postgres';
```

### Soft Deletes

Never permanently delete user data. Use soft deletes for compliance:

```typescript
// ✅ DO: Use soft delete
user.deletedAt = new Date();
await userRepository.save(user);

// ❌ DON'T: Hard delete
await userRepository.remove(user);

// Queries automatically exclude soft-deleted records
const activeUsers = await userRepository.find();  // deletedAt IS NULL
```

### SQL Injection Prevention

Always use TypeORM query builder or parameterized queries:

```typescript
// ✅ DO: Use parameterized queries
const users = await userRepository.find({
  where: { email: userEmail }
});

// ✅ DO: Use query builder
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email: userEmail })
  .getMany();

// ❌ DON'T: String interpolation
const users = await userRepository.query(
  `SELECT * FROM user_entity WHERE email = '${userEmail}'`
);
```

### Password Handling

```typescript
// ✅ DO: Never select passwords
const user = await userRepository.findOne({
  where: { email },
  select: ['id', 'email', 'role', 'isActive']
  // passwordHash explicitly NOT selected
});

// ✅ DO: Handle password separately
const userWithPassword = await userRepository
  .createQueryBuilder('user')
  .addSelect('user.passwordHash')
  .where('user.id = :id', { id: userId })
  .getOne();

// ❌ DON'T: Select password in normal queries
const user = await userRepository.find();  // passwordHash returned!
```

## API Security

### Input Validation

Validate all user input:

```typescript
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

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

// Automatically validated on request
@Post('/users')
async createUser(@Body() dto: CreateUserDto) {
  // If validation fails, 400 error returned automatically
}
```

### CORS Configuration

Restrict origins to prevent unauthorized access:

```typescript
// ✅ DO: Whitelist specific origins
const cors = {
  origin: ['http://localhost:3000', 'https://cityworkhop.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ❌ DON'T: Allow all origins
const cors = { origin: '*' };
```

### Rate Limiting

Prevent brute force attacks and DoS:

```typescript
// Implementation in Phase 2+
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // Time window: 60 seconds
      limit: 10,    // Max 10 requests per window
    }),
  ],
})
export class AppModule {}

// Apply to endpoints
@UseGuards(ThrottlerGuard)
@Post('/auth/login')
async login(@Body() dto: LoginDto) { ... }
```

## File Upload Security

### Validation

```typescript
// ✅ DO: Validate file type, size, and content
const MAX_SIZE = 10 * 1024 * 1024;  // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

if (file.size > MAX_SIZE) {
  throw new BadRequestException('File too large');
}

if (!ALLOWED_TYPES.includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}

// ❌ DON'T: Trust file extension alone
if (file.originalname.endsWith('.jpg')) {  // Can be spoofed!
  // Process file
}
```

### Storage

```typescript
// ✅ DO: Use secure file paths and names
import { v4 as uuidv4 } from 'uuid';
const filename = uuidv4() + '.jpg';  // Random name, no user input
const filepath = `/uploads/kyc/${filename}`;

// ✅ DO: Store outside web root
// Not: /public/uploads/  (directly accessible)
// But: /secure/uploads/ (served through download endpoint)

// ❌ DON'T: Store user-controlled filenames
const filename = file.originalname;  // "../../etc/passwd.jpg" possible
```

## Logging & Monitoring

### What to Log

```typescript
// ✅ DO: Log security events
logger.warn('Failed login attempt', { email, ip });
logger.warn('Unauthorized access attempt', { userId, resource, ip });
logger.info('User role changed', { userId, oldRole, newRole, changedBy });

// ✅ DO: Log API errors
logger.error('Database connection failed', error, { dbHost, port });

// ❌ DON'T: Log passwords or tokens
logger.debug('User', { password: '...' });  // NEVER!
logger.debug('Auth', { token: 'eyJhb...' });  // NEVER!
```

### Sensitive Data Redaction

```typescript
function redactSensitiveData(data: any): any {
  const sensitive = ['password', 'passwordHash', 'token', 'secret'];
  return JSON.parse(
    JSON.stringify(data),
    (key, value) => (sensitive.includes(key) ? '[REDACTED]' : value)
  );
}

logger.debug('User object', redactSensitiveData(user));
```

## Dependency Security

### Vulnerability Scanning

```bash
# Check for known vulnerabilities
npm audit

# Automatically fix issues where possible
npm audit fix

# Force major version updates
npm audit fix --force
```

### Keep Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update to latest minor/patch versions
npm update

# Regularly review and test updates
npm update --save
```

## HTTPS & TLS

### Development
- Use HTTP (localhost only)
- Disable SSL verification if needed for testing

### Staging & Production
- Enforce HTTPS (TLS 1.3)
- Use valid SSL certificate from trusted CA
- Redirect HTTP → HTTPS
- Set secure cookie flag

```typescript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.protocol !== 'https') {
      res.redirect(`https://${req.get('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Error Handling

### Don't Expose Internal Details

```typescript
// ✅ DO: Generic error messages to users
if (!user) {
  throw new UnauthorizedException('Invalid email or password');
}

// ❌ DON'T: Reveal specific information
if (!user) {
  throw new UnauthorizedException('User with email ' + email + ' not found');
}

// ❌ DON'T: Return stack traces to clients
catch (error) {
  res.status(500).json({ error: error.stack });  // Reveals code structure!
}
```

## Third-Party Services

### API Keys

```bash
# ✅ DO: Store in environment variables
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# ❌ DON'T: Hardcode or check into Git
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
```

### Least Privilege

- Create separate API keys for different services
- Limit permissions to only what's needed
- Rotate keys regularly
- Revoke unused keys

## Security Checklist

Before deploying to production:

- [ ] All secrets in `.env`, not checked into Git
- [ ] HTTPS/TLS enabled
- [ ] Password requirements enforced
- [ ] Input validation on all endpoints
- [ ] CORS configured for allowed origins only
- [ ] Rate limiting enabled
- [ ] SQL injection protected
- [ ] Authentication guards on protected routes
- [ ] Authorization checks on city-scoped resources
- [ ] No sensitive data in logs
- [ ] Error messages don't expose internal details
- [ ] Dependencies scanned for vulnerabilities
- [ ] Regular backups enabled
- [ ] Monitoring and alerting configured

## Incident Response

### If You Suspect a Breach

1. **Stop the servers** to prevent further compromise
2. **Secure the credentials**
   - Rotate all secrets
   - Reset passwords
   - Revoke tokens
3. **Analyze logs** to understand the incident
4. **Notify users** if personal data was exposed
5. **Report to authorities** if required by law

### Common Vulnerabilities to Watch For

- SQL Injection (use parameterized queries)
- XSS (validate and sanitize input)
- CSRF (use CSRF tokens, same-site cookies)
- XXE (disable XML external entities)
- Insecure deserialization (validate data)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
