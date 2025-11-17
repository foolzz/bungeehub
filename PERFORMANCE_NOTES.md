# Performance Notes

## Known Performance Characteristics

### Route Optimization Page (`/hubs/route`)

**What it does:**
- Calculates optimal delivery routes for packages
- Uses OpenStreetMap Routing Machine (OSRM) API for real driving routes
- Makes external HTTP requests to `https://router.project-osrm.org`

**Performance:**
- **Expected Load Time**: 2-5 seconds depending on number of packages
- **Network Requests**: 1 request per package for route calculation
- **Why it's slower**:
  - External API calls to OSRM (free public service)
  - Route optimization calculations
  - Map rendering with Leaflet library

**Optimization Applied:**
- Lazy loading of map components
- Prefetching disabled for route pages
- Dynamic imports to reduce initial bundle size

### Home Page

**Current Performance:**
- Should load quickly (< 1 second)
- Makes only 1 API call to check authentication
- No external dependencies

**If slow:**
- Check browser console for errors
- Ensure backend API is responding quickly
- Clear browser cache (Ctrl+Shift+R)

## Tips for Better Performance

1. **Use the single-port dev mode** (`./dev.sh`) to avoid CORS and connection issues
2. **Keep DevTools open** with "Disable cache" checked during development
3. **Database connection**: App works without database, but API responses will be faster with one

## Future Improvements

- [ ] Cache OSRM responses in backend
- [ ] Batch route calculations
- [ ] Add service worker for offline support
- [ ] Optimize JavaScript bundle splitting
