# Dashboard API Testing Guide

## Issue Checklist

Before testing the frontend, verify these backend issues:

### 1. Test if john.doe has hubs in the database

```bash
# Connect to your database and run:
SELECT h.id, h.name, h.status, h.tier, h.totalDeliveries, h.rating, u.email
FROM Hub h
JOIN User u ON h.hostId = u.id
WHERE u.email = 'john.doe@example.com';
```

### 2. Test the API endpoint directly

```bash
# Step 1: Login and get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"Password123!"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Step 2: Test the my-hubs endpoint
curl -s -X GET http://localhost:8080/api/v1/hubs/my-hubs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

Expected response:
```json
{
  "data": [
    {
      "id": "...",
      "name": "Downtown Hub",
      "address": "...",
      "status": "ACTIVE",
      "tier": "SUPER_HUB",
      "rating": 4.8,
      "totalDeliveries": 523,
      "_count": {
        "packages": 45,
        "deliveries": 523,
        "reviews": 128
      }
    },
    // ... more hubs
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 3. Browser Console Debugging

After logging in as john.doe and navigating to /dashboard, open browser console (F12) and look for:

```
User data: { id: '...', email: 'john.doe@example.com', role: 'HUB_HOST', ... }
Fetching hubs for hub host...
Hubs response: { data: [...], meta: {...} }
User hubs: [...]
```

If you see errors instead, share them for debugging.

### 4. Check Network Tab

1. Open DevTools → Network tab
2. Go to http://localhost:8080/dashboard
3. Look for request to `/api/v1/hubs/my-hubs`
4. Check:
   - Status code (should be 200)
   - Response preview (should show hubs array)
   - Request headers (should have `Authorization: Bearer ...`)

## Common Issues

### Issue 1: Empty hubs array but no error
**Cause:** User has no hubs in database
**Solution:** Either:
- Run `npm run seed` to populate test data, OR
- Register a new hub at /hubs/register

### Issue 2: 401 Unauthorized
**Cause:** Token is invalid or expired
**Solution:**
- Logout and login again
- Check browser localStorage for 'token' key

### Issue 3: Network error / CORS
**Cause:** Backend server not running or on different port
**Solution:**
- Ensure backend is running on port 8080
- Check `web/lib/api.ts` API_URL configuration

### Issue 4: Token not being sent
**Cause:** axios interceptor not working
**Solution:**
- Check browser console for errors
- Verify token exists: `localStorage.getItem('token')`

## Frontend Debugging Features Added

The dashboard now includes:
1. Console logs showing:
   - User data after login
   - Hub fetch attempts
   - API responses
   - Any errors

2. Visual error messages displayed on page

3. Empty state showing when no hubs exist

4. Hub count displayed in "My Hubs" heading
