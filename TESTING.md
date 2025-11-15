# Testing Guide - Package Generation & Routing

This guide explains how to generate test packages and simulate routing for testing the Bungie Hub application.

## 📋 Quick Reference

```bash
# Setup
npm run prisma:seed                    # Initial seed (users, hubs, packages)
npm run seed:packages 100              # Generate 100 test packages

# Routing
npm run seed:routes list               # List all packages
npm run seed:routes progress 20        # Move 20 packages forward
npm run seed:routes status DELIVERED 10  # Mark 10 as delivered
npm run seed:routes reassign <hub-id> 15 # Reassign 15 packages to hub
```

**Test Users:**
- Admin: `admin@bungiehub.com` / `Admin123!`
- Hub Host: `john.doe@example.com` / `Password123!`
- Customer: `customer1@example.com` / `Password123!`

**URLs:**
- Dashboard: http://localhost:8080/dashboard
- Packages: http://localhost:8080/packages
- Admin: http://localhost:8080/admin

---

## Prerequisites

Make sure you've run the main seed first:
```bash
npm run prisma:seed
```

This creates:
- Admin user (admin@bungiehub.com / Admin123!)
- Hub hosts (john.doe@example.com / Password123!)
- Customer users
- Active hubs
- Initial test data

## Generate Test Packages

### Generate Custom Number of Packages

Generate a specific number of packages (default is 50):

```bash
# Generate 50 packages (default)
npm run seed:packages

# Generate 100 packages
npm run seed:packages 100

# Generate 200 packages
npm run seed:packages 200
```

This will:
- Create packages with random statuses (PENDING, IN_TRANSIT, AT_HUB, OUT_FOR_DELIVERY, DELIVERED)
- Distribute packages across all active hubs
- Assign realistic San Francisco delivery addresses
- Generate unique tracking numbers and barcodes
- Set expected delivery dates

## Package Routing Management

Use the routing script to simulate package movement and status updates:

### List All Packages

```bash
npm run seed:routes list
```

Shows:
- All packages with current status
- Hub assignments
- Summary by status

### Progress Packages to Next Status

Move packages through the delivery pipeline:

```bash
# Progress 10 packages (default)
npm run seed:routes progress

# Progress 20 packages
npm run seed:routes progress 20
```

Status progression:
- PENDING → IN_TRANSIT
- IN_TRANSIT → AT_HUB
- AT_HUB → OUT_FOR_DELIVERY
- OUT_FOR_DELIVERY → DELIVERED

### Set Specific Status

Set packages to a specific status:

```bash
# Mark 5 packages as DELIVERED
npm run seed:routes status DELIVERED 5

# Mark 10 packages as AT_HUB
npm run seed:routes status AT_HUB 10

# Mark 3 packages as OUT_FOR_DELIVERY
npm run seed:routes status OUT_FOR_DELIVERY 3
```

Valid statuses:
- PENDING
- IN_TRANSIT
- AT_HUB
- OUT_FOR_DELIVERY
- DELIVERED
- FAILED
- RETURNED

### Reassign Packages to Hub

Move packages to a different hub:

```bash
# First, list available hubs
npm run seed:routes reassign

# Reassign 10 packages to a specific hub
npm run seed:routes reassign <hub-id> 10

# Reassign 5 packages
npm run seed:routes reassign <hub-id> 5
```

## Testing Workflow Example

Here's a typical testing workflow:

```bash
# 1. Seed initial data
npm run prisma:seed

# 2. Generate 100 test packages
npm run seed:packages 100

# 3. View current status
npm run seed:routes list

# 4. Simulate some deliveries
npm run seed:routes progress 30

# 5. Mark some as delivered
npm run seed:routes status DELIVERED 20

# 6. Reassign packages to test load balancing
npm run seed:routes reassign <hub-id> 15

# 7. View updated status
npm run seed:routes list
```

## Testing the UI

After generating packages, you can test:

### Packages Page
http://localhost:8080/packages
- View all packages
- Filter by status
- See hub assignments

### Hub Details
http://localhost:8080/hubs/details?id=<hub-id>
- View hub information
- Click "View Packages" to see packages assigned to that hub

### Dashboard (as Hub Host)
http://localhost:8080/dashboard
Login as: john.doe@example.com / Password123!
- View total deliveries
- See earnings estimates
- View hub ratings
- Click on hubs to see details

### Admin Dashboard
http://localhost:8080/admin
Login as: admin@bungiehub.com / Admin123!
- View total packages across all hubs
- See system-wide statistics

## Package Data Structure

Each generated package includes:
- **Tracking Number**: TRK-YYYYMMDD-XXXXXX
- **Barcode**: BCXXXXXXXXXX
- **Sender**: Random from (Amazon, eBay, Walmart, etc.)
- **Recipient**: Random from test names
- **Delivery Address**: Realistic SF addresses with lat/lng
- **Status**: Random initial status
- **Weight**: 0.5 - 10 kg
- **Dimensions**: Random (LxWxH in cm)
- **Expected Delivery**: 1-5 days from creation
- **Hub Assignment**: Distributed across active hubs

## Tips

1. **Reset and Start Fresh**: Run `npm run prisma:seed` to reset all data
2. **Large Dataset Testing**: Generate 500+ packages to test pagination and performance
3. **Status Distribution**: The seed generates random statuses, so run `npm run seed:routes progress` multiple times to simulate realistic delivery flow
4. **Hub Load Testing**: Use reassign to test how the system handles hub capacity and load balancing

## Troubleshooting

### "No active hubs found"
Run the main seed first: `npm run prisma:seed`

### Packages not showing in UI
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check API is returning data: `curl http://localhost:8080/api/v1/packages`

### Want to clear all packages
```bash
# Run the main seed (it clears packages first)
npm run prisma:seed
```
