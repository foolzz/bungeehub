# DeliveryHub API E2E Tests

Comprehensive end-to-end tests covering all 6 phases of the DeliveryHub API.

## Test Coverage

### 1. Authentication Tests (`auth.e2e-spec.ts`)
**Phase 1: Authentication & User Management**

- ✅ User Registration
  - Valid registration with all roles (ADMIN, HUB_HOST, CUSTOMER)
  - Duplicate email prevention
  - Password strength validation
  - Email format validation
  - Required field validation

- ✅ User Login
  - Valid credentials authentication
  - Wrong password handling
  - Non-existent user handling
  - Missing credentials validation

- ✅ Current User Endpoint
  - Authenticated user retrieval
  - Unauthorized access prevention
  - Invalid token handling

### 2. Hub Management Tests (`hubs.e2e-spec.ts`)
**Phase 2: Hub Management**

- ✅ Hub Creation
  - Create hub as hub host
  - Unauthorized creation prevention
  - Invalid coordinates validation
  - Required field validation

- ✅ Hub Listing
  - Get all hubs
  - Filter by status (PENDING, ACTIVE, INACTIVE)
  - Filter by tier (NEW_HUB, ACTIVE_HUB, TOP_HUB, SUPER_HUB)
  - Pagination support

- ✅ Hub Details
  - Get hub by ID
  - Non-existent hub handling
  - Invalid ID format handling

- ✅ Hub Updates
  - Update as owner
  - Unauthorized update prevention

- ✅ Hub Activation/Deactivation
  - Activate hub (admin only)
  - Deactivate hub (admin only)

- ✅ My Hub
  - Get hub for logged-in host
  - Unauthorized access prevention

- ✅ Nearby Hubs
  - Search by coordinates and radius
  - Coordinate validation

### 3. Package Management Tests (`packages.e2e-spec.ts`)
**Phase 3: Package Management**

- ✅ Package Creation
  - Create package with all fields
  - Duplicate tracking number prevention
  - Duplicate barcode prevention
  - Authentication requirement

- ✅ Package Listing
  - Get all packages
  - Filter by status
  - Filter by hub
  - Pagination support

- ✅ Package Tracking
  - Track by tracking number (public)
  - Track by barcode (authenticated)
  - Non-existent package handling

- ✅ Package Updates
  - Update package details
  - Non-existent package handling

- ✅ Batch Management
  - Create batch
  - Assign packages to batch
  - List batches with filters
  - Get batch details with packages

- ✅ Package Deletion
  - Delete package
  - Non-existent package handling

### 4. Scanning & Deliveries Tests (`scanning-deliveries.e2e-spec.ts`)
**Phase 4: Scanning & Tracking + Phase 5: Proof of Delivery**

- ✅ Package Scanning
  - Scan package by barcode
  - Automatic status transitions
  - GPS coordinate recording
  - Non-existent barcode handling
  - Authentication requirement

- ✅ Scan History
  - Get package scan history
  - Event log retrieval
  - Non-existent package handling

- ✅ Delivery Creation
  - Create delivery for package
  - Non-existent package handling
  - Required field validation

- ✅ Delivery Retrieval
  - Get delivery details
  - Get all deliveries for hub
  - Non-existent hub/delivery handling

- ✅ Proof of Delivery
  - Submit POD with photo, GPS, and recipient
  - Required field validation
  - Status update to COMPLETED
  - Hub metrics increment

- ✅ Failed Deliveries
  - Mark delivery as failed
  - Reason requirement
  - Status update to FAILED

- ✅ Delivery Updates
  - Update delivery status and notes

### 5. Rankings Tests (`rankings.e2e-spec.ts`)
**Phase 6: Rankings & Leaderboard**

- ✅ Leaderboard
  - Get top hubs
  - Limit results
  - Sort by rating and deliveries
  - Rank calculation

- ✅ Tier Filtering
  - Filter leaderboard by tier
  - Invalid tier handling

- ✅ Hub Rank
  - Get hub rank and position
  - Next tier requirements
  - Non-existent hub handling

- ✅ Tier Updates
  - Recalculate single hub tier (admin only)
  - Recalculate all hub tiers (admin only)
  - Unauthorized access prevention

- ✅ Tier Calculation Logic
  - NEW_HUB tier (< 50 deliveries)
  - ACTIVE_HUB tier (50-199 deliveries, 4.0+ rating)
  - TOP_HUB tier (200-499 deliveries, 4.5+ rating)
  - SUPER_HUB tier (500+ deliveries, 4.8+ rating)

## Test Statistics

- **Total Test Suites**: 5
- **Total Test Cases**: 100+
- **Coverage Areas**: Authentication, Authorization, CRUD Operations, Business Logic, Error Handling

## Running Tests

### Prerequisites

1. Database must be running (Neon PostgreSQL or local)
2. Environment variables configured (.env file)
3. Dependencies installed

```bash
npm install
```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
# Authentication tests
npm run test:e2e -- auth.e2e-spec

# Hub management tests
npm run test:e2e -- hubs.e2e-spec

# Package management tests
npm run test:e2e -- packages.e2e-spec

# Scanning and deliveries tests
npm run test:e2e -- scanning-deliveries.e2e-spec

# Rankings tests
npm run test:e2e -- rankings.e2e-spec
```

### Run Tests in Watch Mode

```bash
npm run test:e2e -- --watch
```

### Run Tests with Coverage

```bash
npm run test:e2e -- --coverage
```

### Run Tests Verbosely

```bash
npm run test:e2e -- --verbose
```

## Test Database

Tests create their own test data and should clean up after themselves. However, for a clean slate:

```bash
# Reset database
npx prisma migrate reset --force

# Run migrations
npx prisma migrate dev

# Optionally seed with test data
npm run prisma:seed
```

## Environment Configuration

Create a `.env.test` file for test-specific configuration:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="test-jwt-secret-key"
JWT_EXPIRES_IN="1h"
```

## Test Structure

Each test suite follows this pattern:

1. **Setup** (`beforeAll`): Create test users, hubs, packages as needed
2. **Tests**: Organized by endpoint/feature
3. **Teardown** (`afterAll`): Close application

## Debugging Tests

### View Test Output

```bash
npm run test:e2e -- --verbose
```

### Debug Specific Test

```bash
npm run test:e2e -- --testNamePattern="should create a new package"
```

### Run Single File

```bash
npm run test:e2e -- test/auth.e2e-spec.ts
```

## Common Issues

### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Solution**: Ensure database is running and DATABASE_URL is correct

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Stop other instances of the app or use different port

### Test Timeout

```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solution**: Increase timeout in test or check database connection

## Test Data

Tests create unique data using timestamps to avoid conflicts:

- Emails: `test-${Date.now()}@example.com`
- Tracking numbers: `TRK-${Date.now()}`
- Barcodes: `BAR-${Date.now()}`

This allows tests to run multiple times without cleanup.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - run: npm install
      - run: npx prisma migrate deploy
      - run: npm run test:e2e
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use unique identifiers to avoid conflicts
3. **Assertions**: Test both success and failure cases
4. **Coverage**: Test all endpoints and edge cases
5. **Documentation**: Comment complex test scenarios

## Future Improvements

- [ ] Add performance/load tests
- [ ] Add integration with mock external services
- [ ] Add test data factories
- [ ] Add visual regression tests for Swagger UI
- [ ] Add security/penetration tests
- [ ] Add API contract tests

## Contributing

When adding new features:

1. Add corresponding E2E tests
2. Follow existing test patterns
3. Test both success and error cases
4. Update this README if adding new test suite

## Support

For issues with tests:
- Check test output for specific error messages
- Verify database connection
- Ensure all migrations are applied
- Check test/README.md for troubleshooting
