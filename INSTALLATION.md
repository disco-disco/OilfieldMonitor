# PLINQO OILFIELD Monitoring Dashboard - Installation Guide

## Overview
This is a modern oil field monitoring dashboard built with Next.js 15, TypeScript, and Tailwind CSS v4. It provides real-time monitoring of wellpads and wells with AVEVA PI System integration for production data.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### Optional (for Production)
- **AVEVA PI System**: PI AF Server and PI Data Archive
- **Network Access**: To PI System infrastructure

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Navigate to the project directory
cd modern-website
```

### 2. Install Dependencies

```bash
# Install all Node.js dependencies
npm install

# This will install:
# - Next.js 15.3.3
# - React 19
# - TypeScript
# - Tailwind CSS v4
# - Lucide React icons
# - ESLint and other dev tools
```

### 3. Environment Setup

Create a `.env.local` file in the root directory for environment variables:

```bash
# Create environment file
touch .env.local
```

Add the following environment variables to `.env.local`:

```env
# Development/Production Mode
NODE_ENV=development

# PI System Configuration (Optional - for production)
PI_AF_SERVER=your-pi-af-server.company.com
PI_AF_DATABASE=your-asset-database
PI_DATA_ARCHIVE=your-pi-da-server.company.com

# Application Settings
NEXT_PUBLIC_APP_NAME=PLINQO OILFIELD
NEXT_PUBLIC_COMPANY_NAME=Your Company Name

# Optional: Authentication (for future implementation)
# NEXTAUTH_SECRET=your-secret-key
# NEXTAUTH_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000

### 5. Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Configuration

### PI System Integration

1. **Access Configuration Interface**
   - Open the dashboard in your browser
   - Click the "Settings" (⚙️) button in the top-right corner

2. **Configure PI AF Server**
   - **AF Server**: Enter your PI AF Server hostname/IP
   - **AF Database**: Enter your Asset Framework database name
   - **PI Data Archive**: Enter your PI Data Archive server
   - **Element Template**: Default is "WellTemplate" (adjust as needed)

3. **Attribute Mapping**
   Configure the PI AF attribute names for each measurement:
   - **Oil Rate**: `OilRate` (default)
   - **Liquid Rate**: `LiquidRate` (default)
   - **Water Cut**: `WaterCut` (default)
   - **ESP Frequency**: `ESPFrequency` (default)
   - **Plan Target**: `PlanTarget` (default)

4. **Test Connection**
   - Click "Test Connection" to verify PI System connectivity
   - Ensure your network allows access to PI System servers

### Data Source Modes

The application supports two modes:

#### Development Mode (Default)
- Uses simulated data for testing
- No PI System connection required
- Generates realistic wellpad and well data

#### Production Mode
- Connects to actual AVEVA PI System
- Reads real-time data from PI AF
- Requires proper PI System configuration

## Project Structure

```
modern-website/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx           # Main dashboard
│   │   ├── layout.tsx         # Root layout
│   │   └── api/               # API routes
│   │       └── pi-system/     # PI System integration APIs
│   ├── components/            # React components
│   │   └── PISystemConfig.tsx # PI configuration interface
│   ├── services/              # Business logic
│   │   └── pi-system.ts       # PI System service
│   └── types/                 # TypeScript definitions
│       └── pi-system.ts       # PI System types
├── public/                    # Static assets
├── package.json              # Dependencies and scripts
└── tailwind.config.ts        # Tailwind CSS configuration
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript checks

# Utilities
npm run clean       # Clean build artifacts
```

## Features

### Dashboard Overview
- **10 WellPads**: WellPad 01 through WellPad 10
- **10-20 Wells per Pad**: Dynamically generated
- **Real-time Monitoring**: Live data updates
- **Status Indicators**: Color-coded well status

### Well Monitoring
Each well displays:
- **Well Name**: Format PL-XXX
- **Oil Rate**: barrels per day (bbl/day)
- **Liquid Rate**: total liquid production
- **Plan Deviation**: percentage from target
- **Water Cut**: water percentage
- **ESP Frequency**: pump frequency in Hz
- **Status**: Good (green), Warning (yellow), Alert (red)

### Status Logic
- **Good**: Deviation < 10%, Water Cut < 20%
- **Warning**: Deviation 10-15%, Water Cut 20-25%
- **Alert**: Deviation > 15%, Water Cut > 25%

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# If port 3000 is busy, Next.js will automatically use 3001
# Or specify a different port:
npm run dev -- --port 3002
```

#### Build Errors
```bash
# Clean build cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### PI System Connection Issues
1. Verify network connectivity to PI servers
2. Check firewall settings
3. Validate PI AF server and database names
4. Ensure proper authentication (Windows Authentication typically required)

#### TypeScript Errors
```bash
# Check for type errors
npm run type-check

# Fix common issues
npm run lint --fix
```

### Performance Optimization

#### For Large Numbers of Wells
- Consider pagination for wellpads with >50 wells
- Implement data caching for PI System responses
- Use React.memo for well components

#### For Production Deployment
- Enable compression in Next.js config
- Configure CDN for static assets
- Set up monitoring and logging

## Deployment

### Development Deployment
```bash
npm run build
npm start
```

### Production Deployment Options

#### 1. Traditional Server
```bash
# Build the application
npm run build

# Copy files to server
# Install Node.js on server
# Run: npm start
```

#### 2. Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### 3. Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Security Considerations

### PI System Access
- Use Windows Authentication for PI System connections
- Implement proper network security (VPN, firewalls)
- Consider PI Web API for secure external access

### Application Security
- Keep dependencies updated: `npm audit fix`
- Use environment variables for sensitive data
- Implement authentication for production use

## Support and Maintenance

### Monitoring
- Monitor PI System connectivity
- Set up alerts for data feed interruptions
- Track application performance metrics

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Update Next.js
npm install next@latest react@latest react-dom@latest
```

## API Reference

### PI System Endpoints

#### GET /api/pi-system/wellpads
Returns all wellpad and well data

#### GET /api/pi-system/config
Returns current PI System configuration

#### POST /api/pi-system/config
Updates PI System configuration

#### GET /api/pi-system/test
Tests PI System connectivity

## License

This project is proprietary software for PLINQO OILFIELD operations.

## Contact

For technical support or questions:
- Development Team: [your-email@company.com]
- PI System Admin: [pi-admin@company.com]
- Operations: [operations@company.com]
