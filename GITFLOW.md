# Bungie Hub - Git Workflow & Branch Strategy

## Branch Structure

### Main Branches (Permanent)

```
main (or master)
  ├── Production-ready code
  └── Protected branch (requires PR + review)

develop
  ├── Integration branch for features
  └── Latest development code
```

### Supporting Branches (Temporary)

```
feature/*
  ├── New features and enhancements
  └── Branch from: develop
  └── Merge into: develop

bugfix/*
  ├── Bug fixes for development
  └── Branch from: develop
  └── Merge into: develop

hotfix/*
  ├── Critical production fixes
  └── Branch from: main
  └── Merge into: main AND develop

release/*
  ├── Preparation for production release
  └── Branch from: develop
  └── Merge into: main AND develop

claude/*
  ├── Claude AI agent branches
  └── Branch from: develop (or main if specified)
  └── Merge into: develop
```

---

## Branch Naming Conventions

### Feature Branches
```
feature/hub-registration
feature/package-scanning
feature/proof-of-delivery
feature/ranking-system
feature/api-authentication
```

### Bugfix Branches
```
bugfix/fix-photo-upload
bugfix/database-connection-timeout
bugfix/jwt-expiration-issue
```

### Hotfix Branches
```
hotfix/security-patch-v1.0.1
hotfix/critical-data-loss-fix
hotfix/payment-processor-down
```

### Release Branches
```
release/v1.0.0
release/v1.1.0
release/v2.0.0-beta
```

### Claude Branches
```
claude/bungie-hub-requirements-01Ay3VG8vVpMXomuwS264QBw
claude/implement-auth-api-[session-id]
claude/fix-delivery-bug-[session-id]
```

---

## Gitflow Workflow

### 1. Feature Development

```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/hub-registration

# Work on feature, commit regularly
git add .
git commit -m "Add hub registration endpoint"

# Push to remote
git push -u origin feature/hub-registration

# Create Pull Request to develop
# After review and approval, merge to develop
# Delete feature branch after merge
git checkout develop
git branch -d feature/hub-registration
```

### 2. Bug Fixes (Development)

```bash
# Start a bugfix
git checkout develop
git pull origin develop
git checkout -b bugfix/fix-photo-upload

# Fix the bug, commit
git add .
git commit -m "Fix photo upload content-type issue"

# Push and create PR
git push -u origin bugfix/fix-photo-upload
```

### 3. Hotfix (Production)

```bash
# Start a hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/security-patch-v1.0.1

# Apply the fix
git add .
git commit -m "Security: Fix authentication bypass vulnerability"

# Push and create PR to BOTH main and develop
git push -u origin hotfix/security-patch-v1.0.1

# Merge to main first (creates release)
# Then merge to develop (keeps fix in development)
```

### 4. Release Process

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Bump version, update changelog, final testing
npm version 1.0.0
git add .
git commit -m "Bump version to 1.0.0"

# Push release branch
git push -u origin release/v1.0.0

# After QA approval:
# 1. Merge to main (production release)
# 2. Tag the release
# 3. Merge back to develop

git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# Delete release branch
git branch -d release/v1.0.0
```

---

## Commit Message Convention

Follow **Conventional Commits** specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT token refresh endpoint"

# Bug fix
git commit -m "fix(delivery): resolve photo upload timeout issue"

# Documentation
git commit -m "docs(api): update authentication endpoint documentation"

# Refactoring
git commit -m "refactor(database): optimize package query with indexes"

# Breaking change
git commit -m "feat(api)!: change package status enum values

BREAKING CHANGE: Package status values changed from integers to strings.
Migration required for existing data."
```

### Multi-line Commits

```bash
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

---

## Pull Request Guidelines

### PR Title Format
```
[TYPE] Brief description

Examples:
[FEATURE] Add hub registration system
[BUGFIX] Fix photo upload timeout
[HOTFIX] Security patch for authentication
[DOCS] Update API documentation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Hotfix
- [ ] Documentation
- [ ] Refactoring
- [ ] Performance improvement

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

---

## Branch Protection Rules

### `main` Branch
- ✅ Require pull request before merging
- ✅ Require 1+ approvals
- ✅ Require status checks to pass (CI/CD)
- ✅ Require branches to be up to date
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

### `develop` Branch
- ✅ Require pull request before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Do not allow force pushes

### `feature/*`, `bugfix/*`, `hotfix/*`, `release/*`
- No protection (allows force push for rebasing)
- Delete after merge

---

## Git Hooks

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run linter
npm run lint

# Run formatter check
npm run format:check

# Run tests
npm run test:staged
```

### Pre-push Hook
```bash
#!/bin/sh
# .git/hooks/pre-push

# Run all tests
npm run test

# Check for security vulnerabilities
npm audit
```

### Commit-msg Hook (Optional)
```bash
#!/bin/sh
# .git/hooks/commit-msg
# Validate commit message format

commit_msg=$(cat "$1")

# Check if commit message follows conventional commits
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?: .+"; then
  echo "❌ Invalid commit message format"
  echo "Format: <type>(<scope>): <subject>"
  echo "Example: feat(auth): add login endpoint"
  exit 1
fi
```

---

## Version Numbering (Semantic Versioning)

```
MAJOR.MINOR.PATCH

Example: 1.2.3
```

- **MAJOR**: Incompatible API changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward-compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward-compatible (1.0.0 → 1.0.1)

### Pre-release Versions
```
1.0.0-alpha.1
1.0.0-beta.1
1.0.0-rc.1
```

---

## Release Process

### 1. Create Release Branch
```bash
git checkout develop
git checkout -b release/v1.0.0
```

### 2. Bump Version
```bash
npm version 1.0.0
# or
npm version minor  # 1.0.0 → 1.1.0
npm version patch  # 1.0.0 → 1.0.1
```

### 3. Update Changelog
```markdown
# CHANGELOG.md

## [1.0.0] - 2025-11-14

### Added
- Hub registration system
- Package scanning API
- Proof of delivery with photo upload
- Basic ranking system

### Changed
- Improved authentication flow
- Optimized database queries

### Fixed
- Photo upload timeout issue
- JWT token expiration bug

### Security
- Fixed authentication bypass vulnerability
```

### 4. Merge to Main & Develop
```bash
# Merge to main
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop
```

### 5. Deploy to Production
```bash
# Trigger deployment (via CI/CD)
# Or manual deployment
gcloud run deploy bungeehub-api --image gcr.io/PROJECT_ID/bungeehub-api:v1.0.0
```

---

## Tag Naming

```bash
# Production releases
v1.0.0
v1.1.0
v2.0.0

# Pre-releases
v1.0.0-alpha.1
v1.0.0-beta.2
v1.0.0-rc.1
```

### Creating Tags
```bash
# Annotated tag (recommended)
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin v1.0.0
# or push all tags
git push origin --tags
```

---

## Useful Git Commands

### Check Branch Status
```bash
# List all branches
git branch -a

# Show branch tracking
git branch -vv

# Show merged branches
git branch --merged
git branch --no-merged
```

### Clean Up Branches
```bash
# Delete local branch
git branch -d feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature

# Prune stale remote branches
git remote prune origin
```

### Sync with Remote
```bash
# Fetch all branches
git fetch --all

# Pull with rebase
git pull --rebase origin develop

# Update all remote tracking branches
git remote update
```

### Stash Work
```bash
# Stash changes
git stash save "Work in progress"

# List stashes
git stash list

# Apply stash
git stash apply stash@{0}

# Pop stash (apply and remove)
git stash pop
```

---

## Troubleshooting

### Merge Conflicts
```bash
# When merge conflict occurs
git status  # see conflicted files

# Resolve conflicts in editor
# Then:
git add <resolved-files>
git commit -m "Resolve merge conflicts"
```

### Undo Last Commit (Before Push)
```bash
# Undo commit, keep changes
git reset --soft HEAD~1

# Undo commit and changes
git reset --hard HEAD~1
```

### Fix Wrong Branch
```bash
# Move last commit to different branch
git checkout correct-branch
git cherry-pick wrong-branch
git checkout wrong-branch
git reset --hard HEAD~1
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

---

## Quick Reference

| Task | Command |
|------|---------|
| New feature | `git checkout -b feature/name` |
| Bug fix | `git checkout -b bugfix/name` |
| Hotfix | `git checkout -b hotfix/name` |
| Update branch | `git pull origin develop` |
| Check status | `git status` |
| Stage changes | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push -u origin branch-name` |
| Create PR | Via GitHub/GitLab UI |
| Sync develop | `git checkout develop && git pull` |

---

**Best Practices Summary**:
1. ✅ Always branch from `develop` for new work
2. ✅ Keep commits small and focused
3. ✅ Write meaningful commit messages
4. ✅ Pull before push to avoid conflicts
5. ✅ Delete branches after merge
6. ✅ Never commit secrets or credentials
7. ✅ Use `.gitignore` properly
8. ✅ Tag all production releases
9. ✅ Keep `main` always deployable
10. ✅ Code review before merging

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
