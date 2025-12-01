# DeliveryHub Web Frontend

User-facing web interface for the DeliveryHub community delivery network.

## Features

- **Landing Page**: Information about DeliveryHub and how it works
- **Authentication**: Login and registration for hub hosts and customers
- **Dashboard**: User profile and quick actions
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Axios**: API client for backend communication

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on http://localhost:8080

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Pages

- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard (requires authentication)

## API Integration

The web frontend connects to the backend API at `http://localhost:8080/api/v1`.

You can configure the API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Project Structure

```
web/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable React components
├── lib/                  # Utilities and API client
│   └── api.ts           # API client configuration
└── public/              # Static assets

```

## Development Notes

- All pages under `/dashboard` require authentication
- Authentication uses JWT tokens stored in localStorage
- API responses are handled with Axios interceptors
- Forms include client-side validation

## Next Steps

- [ ] Add package tracking page
- [ ] Build hub registration flow
- [ ] Add hub directory/search
- [ ] Implement real-time notifications
- [ ] Add mobile responsiveness improvements
- [ ] Create admin dashboard

## License

Part of the DeliveryHub project.
