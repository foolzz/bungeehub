# Contributing to Bungie Hub

Thank you for your interest in contributing to Bungie Hub! This document provides guidelines and best practices for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and constructive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory comments
- Publishing others' private information
- Any other conduct inappropriate in a professional setting

---

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
1. Check existing issues to avoid duplicates
2. Gather relevant information (OS, Node version, error messages)
3. Create a minimal reproduction case

**Bug Report Template:**
```markdown
**Description**: Clear description of the bug

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. ...

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Environment**:
- OS: [e.g., macOS 13.0]
- Node.js: [e.g., v18.16.0]
- Database: [e.g., Neon PostgreSQL]

**Screenshots/Logs**: (if applicable)
```

### Suggesting Features

Feature requests are welcome! Please:
1. Check if the feature has already been requested
2. Clearly describe the feature and its benefits
3. Provide examples or mockups if applicable

**Feature Request Template:**
```markdown
**Feature Description**: Clear description

**Problem It Solves**: What problem does this address?

**Proposed Solution**: How should it work?

**Alternatives Considered**: Other approaches you've thought about

**Additional Context**: Screenshots, examples, etc.
```

### Contributing Code

1. **Find an issue** to work on (or create one)
2. **Comment** on the issue to claim it
3. **Fork** the repository (if external contributor)
4. **Create a branch** following our naming conventions
5. **Write code** following our coding standards
6. **Write tests** for your changes
7. **Submit a PR** following our PR template

---

## Development Workflow

### Setting Up Development Environment

See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed setup instructions.

### Branch Strategy

See [GITFLOW.md](./GITFLOW.md) for complete branching workflow.

**Quick Reference:**
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features (branch from develop)
- `bugfix/*` - Bug fixes (branch from develop)
- `hotfix/*` - Critical fixes (branch from main)

### Creating a Feature Branch

```bash
# Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/descriptive-name

# Examples:
# feature/hub-registration
# feature/package-scanning
# feature/proof-of-delivery
```

---

## Coding Standards

### General Principles

1. **DRY** (Don't Repeat Yourself)
2. **KISS** (Keep It Simple, Stupid)
3. **SOLID** principles
4. Write self-documenting code
5. Favor readability over cleverness

### TypeScript/JavaScript Style

#### Use TypeScript

```typescript
// ✅ Good - Type-safe
interface User {
  id: string;
  email: string;
  role: 'hub_host' | 'customer' | 'admin';
}

function createUser(data: User): User {
  // Implementation
}

// ❌ Bad - No types
function createUser(data) {
  // Implementation
}
```

#### Naming Conventions

```typescript
// Classes: PascalCase
class PackageService {}

// Functions/Variables: camelCase
const getUserById = () => {}
const packageCount = 10

// Constants: UPPER_SNAKE_CASE
const MAX_BATCH_SIZE = 100
const API_VERSION = 'v1'

// Interfaces: PascalCase with 'I' prefix (optional)
interface IPackage {}  // or just Package

// Enums: PascalCase
enum PackageStatus {
  Created = 'created',
  InTransit = 'in_transit',
  Delivered = 'delivered'
}
```

#### File Naming

```
controllers/  → package.controller.ts
services/     → package.service.ts
models/       → package.model.ts
routes/       → package.routes.ts
utils/        → validation.util.ts
```

#### Code Organization

```typescript
// ✅ Good - Organized imports
// 1. External libraries
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// 2. Internal modules
import { PackageService } from '../services/package.service';
import { validatePackage } from '../utils/validation';

// 3. Types
import { Package } from '../types';

// ❌ Bad - Disorganized
import { validatePackage } from '../utils/validation';
import { Request, Response } from 'express';
import { Package } from '../types';
```

#### Error Handling

```typescript
// ✅ Good - Proper error handling
async function getPackage(id: string): Promise<Package> {
  try {
    const package = await db.package.findUnique({ where: { id } });
    if (!package) {
      throw new NotFoundError(`Package ${id} not found`);
    }
    return package;
  } catch (error) {
    logger.error('Error fetching package', { id, error });
    throw error;
  }
}

// ❌ Bad - Silent failures
async function getPackage(id: string) {
  const package = await db.package.findUnique({ where: { id } });
  return package; // Could be null/undefined
}
```

#### Async/Await over Promises

```typescript
// ✅ Good - Async/await
async function fetchPackages() {
  const packages = await db.package.findMany();
  return packages;
}

// ❌ Bad - Promise chains (avoid when possible)
function fetchPackages() {
  return db.package.findMany()
    .then(packages => packages);
}
```

### API Design

#### RESTful Conventions

```
GET    /api/v1/packages          - List packages
GET    /api/v1/packages/:id      - Get single package
POST   /api/v1/packages          - Create package
PUT    /api/v1/packages/:id      - Update package (full)
PATCH  /api/v1/packages/:id      - Update package (partial)
DELETE /api/v1/packages/:id      - Delete package
```

#### Response Format

```typescript
// ✅ Good - Consistent response structure
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Package created successfully"
}

// Error response
{
  "success": false,
  "error": {
    "code": "PACKAGE_NOT_FOUND",
    "message": "Package with ID abc123 not found"
  }
}

// ❌ Bad - Inconsistent
{ "package": { /* data */ } }  // Sometimes
{ "data": { /* data */ } }     // Other times
```

---

## Commit Guidelines

### Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `build` - Build system changes

**Examples:**

```bash
# Simple feature
git commit -m "feat(auth): add JWT token refresh endpoint"

# Bug fix
git commit -m "fix(delivery): resolve photo upload timeout issue"

# Breaking change
git commit -m "feat(api)!: change package status enum values

BREAKING CHANGE: Package status values changed from integers to strings.
Migration script: npm run migrate:package-status"

# Multi-line with body
git commit -m "$(cat <<'EOF'
feat(scanning): implement barcode scanning API

Add endpoints for:
- Individual package scanning
- Batch scanning with validation
- Duplicate scan prevention

Resolves #123
EOF
)"
```

### Commit Best Practices

1. ✅ **Write clear, descriptive messages**
2. ✅ **Use present tense** ("add" not "added")
3. ✅ **Keep subject line under 72 characters**
4. ✅ **Separate subject from body with blank line**
5. ✅ **Reference issues** in footer (e.g., "Resolves #123")
6. ✅ **One logical change per commit**

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated (if needed)
- [ ] No merge conflicts with develop
- [ ] Commits follow conventional commit format

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests pass locally

## Related Issues
Closes #123
Relates to #456

## Screenshots (if applicable)
[Add screenshots]

## Additional Notes
[Any additional context]
```

### PR Review Process

1. **Create PR** to `develop` branch
2. **Automated checks** must pass (linting, tests, build)
3. **Code review** by at least 1 team member
4. **Address feedback** and push updates
5. **Approval** required before merge
6. **Squash and merge** or **Merge commit** (team preference)

### Getting Your PR Merged Faster

- Keep PRs small and focused (< 400 lines changed)
- Write clear PR descriptions
- Respond promptly to review feedback
- Ensure CI/CD passes
- Tag relevant reviewers

---

## Testing Guidelines

### Testing Pyramid

```
    /\
   /  \  E2E Tests (few, critical paths)
  /____\
 /      \ Integration Tests (moderate)
/________\ Unit Tests (many, comprehensive)
```

### Writing Tests

#### Unit Tests

```typescript
// package.service.test.ts
describe('PackageService', () => {
  describe('createPackage', () => {
    it('should create a package with valid data', async () => {
      const data = {
        trackingNumber: 'TEST123',
        recipientName: 'John Doe',
        deliveryAddress: '123 Main St'
      };

      const package = await packageService.create(data);

      expect(package).toBeDefined();
      expect(package.trackingNumber).toBe('TEST123');
    });

    it('should throw error with invalid data', async () => {
      const data = { /* invalid */ };

      await expect(packageService.create(data))
        .rejects
        .toThrow('Invalid package data');
    });
  });
});
```

#### Integration Tests

```typescript
// package.routes.test.ts
describe('POST /api/v1/packages', () => {
  it('should create package and return 201', async () => {
    const response = await request(app)
      .post('/api/v1/packages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trackingNumber: 'TEST123',
        recipientName: 'John Doe',
        deliveryAddress: '123 Main St'
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### Test Coverage

- Aim for **80%+ code coverage**
- Focus on critical paths
- Test edge cases and error conditions
- Don't test external libraries

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific file
npm test -- package.service.test.ts
```

---

## Documentation

### Code Comments

```typescript
// ✅ Good - Explain WHY, not WHAT
// Calculate tier upgrade threshold using exponential growth
// to incentivize long-term engagement
const threshold = baseThreshold * Math.pow(multiplier, tier);

// ❌ Bad - Obvious comment
// Set the threshold
const threshold = calculateThreshold();
```

### JSDoc for Public APIs

```typescript
/**
 * Creates a new package in the system
 *
 * @param data - Package creation data
 * @returns Created package with generated ID
 * @throws {ValidationError} If package data is invalid
 * @throws {DuplicateError} If tracking number already exists
 *
 * @example
 * const package = await createPackage({
 *   trackingNumber: 'PKG123',
 *   recipientName: 'John Doe',
 *   deliveryAddress: '123 Main St'
 * });
 */
async function createPackage(data: CreatePackageDto): Promise<Package> {
  // Implementation
}
```

### API Documentation

- Update OpenAPI/Swagger spec when adding endpoints
- Provide request/response examples
- Document error codes
- Keep API docs in sync with implementation

### README Updates

Update README.md when:
- Adding new major features
- Changing setup process
- Updating dependencies
- Modifying project structure

---

## Review Checklist

Before requesting review, ensure:

### Code Quality
- [ ] No console.log() statements (use logger)
- [ ] No hardcoded values (use config/env vars)
- [ ] No commented-out code
- [ ] No TODO comments without issue reference
- [ ] Error handling implemented
- [ ] Input validation added

### Performance
- [ ] Database queries optimized
- [ ] N+1 queries avoided
- [ ] Proper indexing used
- [ ] Caching implemented (if needed)

### Security
- [ ] No credentials in code
- [ ] User input sanitized
- [ ] SQL injection prevented (use ORM/parameterized queries)
- [ ] Authentication/authorization checked
- [ ] Sensitive data encrypted

### Testing
- [ ] Unit tests written
- [ ] Integration tests written (for API endpoints)
- [ ] Edge cases covered
- [ ] Error cases tested

---

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, general discussion
- **Team Chat**: Day-to-day communication (Slack/Discord)
- **Email**: For private/sensitive matters

### Asking Questions

Before asking:
1. Search existing issues and documentation
2. Try to solve it yourself
3. Prepare a clear description of the problem

When asking:
- Provide context and what you've tried
- Include error messages and logs
- Share relevant code snippets
- Be specific about what you need help with

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Significant contributions may lead to:
- Maintainer status
- Write access to repository
- Involvement in project decisions

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (TBD).

---

## Questions?

If you have questions about contributing, please:
- Open a GitHub Discussion
- Ask in team chat
- Email the maintainers

**Thank you for contributing to Bungie Hub! 🎉**
