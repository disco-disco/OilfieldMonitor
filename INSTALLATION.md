# PLINQO OILFIELD Monitoring Dashboard - Installation Guide

## Overview
This is a modern oil field monitoring dashboard built with Next.js 15, TypeScript, and Tailwind CSS v4. It provides real-time monitoring of wellpads and wells with AVEVA PI System integration for production data. Features include persistent configuration storage, development/production mode switching, and comprehensive connection testing.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### Optional (for Production)
- **AVEVA PI System**: PI AF Server and PI Data Archive
- **Network Access**: To PI System infrastructure
- **Windows Authentication**: For PI System access (typical setup)

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository (update with your actual repository URL)
git clone https://github.com/disco-disco/OilfieldMonitor.git

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

### 3. Environment Setup (Optional)

Create a `.env.local` file in the root directory for optional environment variables:

```bash
# Create environment file (optional)
touch .env.local
```

Add optional environment variables to `.env.local`:

```env
# Application Settings (optional)
NEXT_PUBLIC_APP_NAME=PLINQO OILFIELD
NEXT_PUBLIC_COMPANY_NAME=Your Company Name

# Optional: Authentication (for future implementation)
# NEXTAUTH_SECRET=your-secret-key
# NEXTAUTH_URL=http://localhost:3000
```

**Note**: PI System configuration is now handled through the web interface and stored in `pi-config.json` (automatically created).

### 4. Start Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000 (or http://localhost:3001 if 3000 is in use)
- **Network**: http://[your-ip]:3000

### 5. Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Configuration

### Application Modes

The application supports two operational modes that can be switched through the web interface:

#### 🔵 **Development Mode** (Default)
- Uses simulated data for all wellpads and wells
- No PI System connection required
- Perfect for testing, development, and demonstrations
- Generates realistic oil field data automatically

#### 🟢 **Production Mode**
- Connects to actual AVEVA PI System
- Reads real-time data from PI AF
- Requires valid PI System configuration
- Includes comprehensive connection testing

### PI System Configuration Interface

1. **Access Configuration**
   - Open the dashboard in your browser
   - Click the "Settings" (⚙️) button in the top-right corner
   - The configuration modal will open

2. **Mode Switching**
   - Use the toggle switch at the top-right of the configuration modal
   - **Development** ←→ **Production**
   - Mode changes are saved automatically
   - Dashboard header shows current mode

3. **Production Mode Configuration** (Only visible in Production Mode)
   
   **Server Settings:**
   - **AF Server Name**: Enter your PI AF Server hostname/IP (e.g., `PISERVER01.company.com`)
   - **AF Database Name**: Enter your Asset Framework database name (e.g., `PLINQO_OILFIELD`)
   - **Parent Element Path**: Path to wellpad elements (e.g., `\\PLINQO_OILFIELD\\Production`)
   - **Template Name**: Element template name (e.g., `WellPadTemplate`)
   
   **Authentication (Optional):**
   - **Username**: Domain username for PI System access
   - **Password**: Password for authentication
   - **Note**: Windows Authentication is typically used in production

4. **Attribute Mapping Configuration**
   Configure the PI AF attribute names for each measurement:
   - **Oil Rate**: Default `OilRate`
   - **Liquid Rate**: Default `LiquidRate`
   - **Water Cut**: Default `WaterCut`
   - **ESP Frequency**: Default `ESPFrequency`
   - **Plan Target**: Default `PlanTarget`
   
   *Note: In Development Mode, attribute mapping is optional*

5. **Save Configuration**
   - Click "Save Configuration" to persist all settings
   - Configuration is automatically saved to `pi-config.json`
   - Settings persist across application restarts

6. **Test Connection**
   - Click "Test Connection" to verify PI System connectivity
   - **4-Step Validation Process**:
     1. Server Reachability Test
     2. Database Existence Check
     3. Element Path Validation
     4. Attribute Accessibility Test
   - Detailed results show which steps pass/fail
   - Works in both Development (simulated) and Production modes

### Persistent Configuration Storage

- **Automatic Storage**: All configuration saved to `pi-config.json` in project root
- **Version Control**: `pi-config.json` is excluded from git (contains sensitive data)
- **Backup**: Configuration persists across application restarts and deployments
- **Format**: JSON structure with mode, server config, and attribute mappings

### Dashboard Status Indicators

The main dashboard header displays real-time status:

#### Mode Indicator
- 🔵 **Development Mode**: Blue dot with "Development Mode" label
- 🟢 **Production Mode**: Green dot with "Production Mode" label

#### Configuration Status
- 🟢 **PI Configured**: Green dot with "PI Configured" label
- 🟡 **Not Configured**: Yellow dot with "Not Configured" label

### Data Source Modes

#### 🔵 Development Mode
- **Purpose**: Testing, development, demonstrations
- **Data Source**: Simulated realistic wellpad data
- **PI System**: No connection required
- **Configuration**: Minimal setup needed
- **Benefits**: 
  - Instant startup
  - No network dependencies
  - Consistent test data
  - Safe for development environments

#### 🟢 Production Mode
- **Purpose**: Live operational monitoring
- **Data Source**: Real-time AVEVA PI System data
- **PI System**: Requires active connection
- **Configuration**: Full server and authentication setup
- **Benefits**:
  - Real production data
  - Live well monitoring
  - Historical data access
  - Integration with existing PI infrastructure

## Project Structure

```
modern-website/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx           # Main dashboard with mode indicators
│   │   ├── layout.tsx         # Root layout
│   │   └── api/               # API routes
│   │       └── pi-system/     # PI System integration APIs
│   │           ├── config/    # Configuration management
│   │           ├── test/      # Connection testing
│   │           └── wellpads/  # Data retrieval
│   ├── components/            # React components
│   │   └── PISystemConfig.tsx # Enhanced PI configuration interface
│   ├── services/              # Business logic
│   │   ├── pi-system.ts       # PI System service with mode support
│   │   └── config-manager.ts  # Persistent configuration management
│   └── types/                 # TypeScript definitions
│       └── pi-system.ts       # PI System types and interfaces
├── public/                    # Static assets
├── pi-config.json            # Persistent configuration file (auto-created)
├── package.json              # Dependencies and scripts
├── .gitignore               # Excludes pi-config.json for security
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
- **10-20 Wells per Pad**: Dynamically generated or from PI System
- **Real-time Monitoring**: Live data updates with refresh capability
- **Mode Indicators**: Visual display of current operational mode
- **Status Indicators**: Color-coded well status and configuration status

### Well Monitoring
Each well displays:
- **Well Name**: Format PL-XXX (PLINQO wells)
- **Oil Rate**: barrels per day (bbl/day)
- **Liquid Rate**: total liquid production (bbl/day)
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
- **Configuration**: Persistent storage reduces API calls

#### For Production Deployment
- Enable compression in Next.js config
- Configure CDN for static assets
- Set up monitoring and logging
- **PI System**: Use dedicated network connections for reliability

## Deployment

### Quick Start (Development)
```bash
# Clone, install, and run in development mode
git clone https://github.com/disco-disco/OilfieldMonitor.git
cd modern-website
npm install
npm run dev
# Open http://localhost:3000 - Ready to use with simulated data!
```

### Development Deployment
```bash
npm run build
npm start
```

### Production Deployment

#### 1. Traditional Server
```bash
# Build the application
npm run build

# Copy files to server including pi-config.json for settings persistence
# Install Node.js on server
# Configure PI System connectivity
# Run: npm start
```

#### 2. Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Note: pi-config.json will be created at runtime
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### 3. Vercel (Recommended for Development/Demo)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (note: PI System connections may require additional setup)
vercel
```

**Important for Production**: Ensure your deployment environment can:
- Access AVEVA PI System servers
- Persist the `pi-config.json` file across deployments
- Handle Windows Authentication if required by your PI System

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
- **Purpose**: Returns all wellpad and well data
- **Mode Handling**: Automatically serves simulated data (development) or PI data (production)
- **Response**: Array of wellpad objects with wells and production metrics

#### GET /api/pi-system/config
- **Purpose**: Returns current system configuration
- **Response**: Mode, PI server config, attribute mappings, configuration status
- **Format**: Includes `isPIConfigured` flag and current operational mode

#### POST /api/pi-system/config
- **Purpose**: Updates PI System configuration and mode
- **Body**: `{ config, attributeMapping, mode }`
- **Persistence**: Automatically saves to `pi-config.json`
- **Validation**: Checks required fields for production mode

#### GET /api/pi-system/test
- **Purpose**: Tests PI System connectivity with detailed validation
- **Response**: 4-step test results with detailed status for each step
- **Modes**: Simulated testing (development) or real testing (production)

### Configuration File Format

The `pi-config.json` file structure:

```json
{
  "mode": "development|production",
  "piServerConfig": {
    "afServerName": "PISERVER01.company.com",
    "afDatabaseName": "PLINQO_OILFIELD",
    "parentElementPath": "\\PLINQO_OILFIELD\\Production",
    "templateName": "WellPadTemplate",
    "username": "optional",
    "password": "optional"
  },
  "attributeMapping": {
    "oilRate": "OilRate",
    "liquidRate": "LiquidRate",
    "waterCut": "WaterCut",
    "espFrequency": "ESPFrequency",
    "planTarget": "PlanTarget"
  },
  "lastUpdated": "2025-06-11T19:45:00.000Z"
}
```

## Quick Start Guide

### For Development/Testing
1. `git clone https://github.com/disco-disco/OilfieldMonitor.git`
2. `cd modern-website && npm install`
3. `npm run dev`
4. Open http://localhost:3000
5. **Ready!** Dashboard loads with simulated data

### For Production PI System
1. Complete development setup above
2. Click "Settings" button in dashboard
3. Toggle to "Production Mode"
4. Fill in PI AF server details
5. Configure attribute mappings
6. Click "Test Connection" to verify
7. Save configuration
8. **Ready!** Dashboard loads with live PI data

## Troubleshooting

### Configuration Issues
- **Settings Lost**: Check if `pi-config.json` exists and has correct permissions
- **Mode Not Switching**: Clear browser cache and reload
- **Configuration Not Saving**: Check file system write permissions

### PI System Connection Issues
1. **Server Unreachable**: Verify network connectivity and server name
2. **Database Not Found**: Confirm AF database name and access permissions
3. **Authentication Failed**: Check username/password or Windows Authentication setup
4. **Element Path Invalid**: Verify the path exists in PI AF Explorer

### Development Issues
- **Port Already in Use**: App automatically uses port 3001 if 3000 is busy
- **Build Errors**: Run `rm -rf .next && npm run build` to clean and rebuild
- **Type Errors**: Run `npm run type-check` to see TypeScript issues

## License

This project is proprietary software for PLINQO OILFIELD operations.

## Contact

For technical support or questions:
- Development Team: [your-email@company.com]
- PI System Admin: [pi-admin@company.com]
- Operations: [operations@company.com]

---

**Last Updated**: June 2025 - Version with persistent configuration and mode switching
