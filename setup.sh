#!/bin/bash

# DeliveryHub Setup Script
# First-time setup for new installations

set -e

echo "🎉 DeliveryHub Setup"
echo "=================="
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Please update the following in .env:"
    echo "   - DATABASE_URL (your Neon PostgreSQL connection string)"
    echo "   - JWT_SECRET (change to a secure random string)"
    echo "   - Other configuration as needed"
    echo ""
    read -p "Press Enter to continue after updating .env..."
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install
echo "✅ Backend dependencies installed"
echo ""

echo "📦 Installing web dependencies..."
cd web && npm install && cd ..
echo "✅ Web dependencies installed"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
read -p "Have you updated DATABASE_URL in .env? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    echo "✅ Database migrations applied"
else
    echo "⚠️  Skipping migrations. Run 'npx prisma migrate deploy' after updating DATABASE_URL"
fi
echo ""

# Build web
echo "🌐 Building web frontend..."
npm run build:web
echo "✅ Web frontend built"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your configuration"
echo "  2. Run database migrations: npx prisma migrate deploy"
echo "  3. Start development: ./dev.sh"
echo "  4. Or build for production: ./build.sh"
echo ""
