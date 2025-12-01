# DeliveryHub Host Mobile App

Mobile application for DeliveryHub delivery hosts to manage package deliveries, scan barcodes, submit proof of delivery, and optimize delivery routes.

## Features

- **Authentication**: Secure login for Hub Hosts with JWT
- **Package Scanning**: QR code and barcode scanner for packages
- **Delivery Management**: View and manage all hub deliveries
- **Proof of Delivery**: Capture photos with GPS coordinates
- **Route Optimization**: View optimized delivery routes on map
- **Mock Data**: Testing mode with 20-30 nearby mock packages
- **Navigation**: Turn-by-turn navigation integration with Google Maps

## Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Simplified development and deployment
- **TypeScript**: Type-safe development
- **React Navigation**: Screen navigation
- **Expo Camera**: Photo capture for POD
- **Expo Barcode Scanner**: QR/barcode scanning
- **Expo Location**: GPS tracking
- **React Native Maps**: Route visualization
- **Axios**: API communication

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing)
- Backend API running (see main project README)

## Setup

### 1. Install Dependencies

```bash
cd mobile/deliveryhub-host
npm install
```

### 2. Configure API Endpoint

Update the API base URL in `src/config/api.ts`:

```typescript
// For local development on physical device, use your computer's IP
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000';

// For iOS simulator
// export const API_BASE_URL = 'http://localhost:3000';

// For Android emulator
// export const API_BASE_URL = 'http://10.0.2.2:3000';

// For production
// export const API_BASE_URL = 'https://api.deliveryhub.com';
```

**Finding your IP address:**
- macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Linux: `ip addr show | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig | findstr IPv4`

### 3. Start the Development Server

```bash
npm start
```

This will start the Expo development server and show a QR code.

### 4. Run on Device/Emulator

**Option 1: Physical Device (Recommended)**
1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Scan the QR code with your camera (iOS) or Expo Go app (Android)

**Option 2: iOS Simulator (macOS only)**
```bash
npm run ios
```

**Option 3: Android Emulator**
```bash
npm run android
```

**Option 4: Web Browser**
```bash
npm run web
```

## Usage

### Login

Use credentials from your seeded database:
- Email: hubhost@example.com
- Password: password123

**Note**: Only users with `HUB_HOST` role can login to this app.

### Main Features

#### 1. Home Dashboard
- View all deliveries for your hub
- Quick stats (total, active, completed)
- Quick access to scanner and routes

#### 2. Package Scanner
- Tap "Scan Package" button
- Point camera at QR code or barcode
- Package status automatically updates
- GPS location recorded

#### 3. Delivery Details
- Tap any delivery to view details
- See package info, recipient, address
- Open address in Google Maps
- Submit proof of delivery or mark as failed

#### 4. Proof of Delivery
- Take photo or choose from library
- Enter recipient name
- Add optional notes
- GPS coordinates automatically captured
- Photo uploaded to backend

#### 5. Route Optimization
- View all deliveries on map
- Route optimized using nearest neighbor algorithm
- See total distance and estimated duration
- Toggle between map view and list view
- Tap any stop to navigate with Google Maps

### Mock Data Testing

The app includes a mock data generator for testing route optimization:
- Generates 20-30 packages within 10km of your hub
- Realistic addresses and recipient names
- Route optimization algorithm
- ETA calculations

This is automatically used in the Route Map screen for testing purposes.

## Project Structure

```
deliveryhub-host/
├── src/
│   ├── config/          # Configuration files
│   │   └── api.ts       # API endpoints and base URL
│   ├── screens/         # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ScannerScreen.tsx
│   │   ├── DeliveryDetailsScreen.tsx
│   │   ├── ProofOfDeliveryScreen.tsx
│   │   └── RouteMapScreen.tsx
│   ├── navigation/      # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── services/        # API and auth services
│   │   └── api.service.ts
│   ├── utils/          # Utilities
│   │   └── mockData.ts # Mock package generator & route optimization
│   └── types/          # TypeScript types
│       └── index.ts
├── App.tsx             # Main app component
├── app.json           # Expo configuration
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript configuration
```

## API Integration

The app communicates with the DeliveryHub backend API. Ensure your backend is running and accessible.

### Required Backend Endpoints

- `POST /auth/login` - Hub host authentication
- `GET /auth/me` - Get current user
- `GET /hubs/my-hub` - Get hub for logged-in host
- `GET /deliveries/hub/:hubId` - Get hub deliveries
- `GET /deliveries/:id` - Get delivery details
- `POST /scanning/package` - Scan package
- `POST /deliveries/:id/proof-of-delivery` - Submit POD
- `POST /deliveries/:id/mark-failed` - Mark delivery failed
- `POST /upload` - Upload images

## Permissions

The app requires the following permissions:

- **Camera**: For scanning barcodes and taking delivery photos
- **Location**: For GPS coordinates in scans and deliveries
- **Photo Library**: Optional, for choosing existing photos

Permissions are requested at runtime when needed.

## Troubleshooting

### Cannot connect to API
- Verify backend is running
- Check API_BASE_URL in `src/config/api.ts`
- Use your computer's IP address, not localhost
- Ensure phone and computer are on same network
- Check firewall settings

### Camera not working
- Grant camera permission when prompted
- On iOS simulator, camera is not available (use physical device)
- Check expo-camera is installed: `npm install expo-camera`

### Location not working
- Grant location permission when prompted
- Enable location services on device
- For iOS simulator, use Debug > Location > Custom Location

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start --clear
```

## Development

### Type Checking

```bash
npx tsc --noEmit
```

### Code Style

This project uses TypeScript with strict mode. Follow these conventions:
- Use functional components with hooks
- Define proper TypeScript interfaces
- Handle errors gracefully with try/catch
- Show user-friendly error messages

## Building for Production

### iOS (macOS required)

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

### Using EAS Build (Recommended)

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Future Enhancements

- [ ] Offline mode with local storage
- [ ] Push notifications for new deliveries
- [ ] Signature capture for POD
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Performance analytics
- [ ] Batch scanning
- [ ] Voice navigation

## License

Proprietary - DeliveryHub
