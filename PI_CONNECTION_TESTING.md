# PI System Connection Testing Guide

## Overview
The PLINQO OILFIELD monitoring dashboard now implements **real** PI System connection testing that makes actual HTTP requests to your PI AF server. This replaces the previous simulated connection tests.

## What Changed

### Previous Behavior (Simulated)
- All connection tests returned `true` without making network calls
- No actual verification of PI AF server accessibility
- No network traffic visible in PI Network Manager

### New Behavior (Real Testing)
- Makes actual HTTP requests to PI Web API endpoints
- Tests multiple common PI Web API ports and protocols
- Provides detailed 4-step validation process
- Generates real network traffic that should appear in PI Network Manager

## Connection Test Process

The system now performs these **real** connection tests:

### 1. Server Reachability Test
Tests multiple PI Web API endpoints in order:
- `https://{server}/piwebapi`
- `https://{server}:443/piwebapi`
- `http://{server}/piwebapi`
- `http://{server}:5985/piwebapi`

**What it does:**
- Makes HTTP GET requests with 10-second timeout
- Checks for successful response (200) or auth required (401)
- 401 responses are considered successful (server is reachable but requires authentication)

### 2. Database Existence Test
**What it does:**
- Queries `/assetservers` endpoint to get list of asset servers
- For each server, queries `/assetservers/{serverName}/assetdatabases`
- Searches for your specified database name (case-insensitive)

### 3. Element Path Validation
**What it does:**
- Constructs element path URL: `/elements?path=\\\\{server}\\{database}\\{elementPath}`
- Verifies the parent element exists in PI AF
- Checks for valid WebId in response

### 4. Attribute Accessibility Test
**What it does:**
- Gets the parent element using the element path
- Retrieves child elements (wellpads)
- Attempts to read attributes from first child element
- Verifies attribute access permissions

## Testing Your PI Connection

### Prerequisites
1. **PI Web API must be installed and running** on your PI AF server
2. **Network connectivity** from your web browser/server to PI AF server
3. **Proper firewall configuration** allowing HTTP/HTTPS traffic

### Common PI Web API Ports
- **HTTPS**: 443 (default)
- **HTTP**: 5985 (common alternative)
- **Custom ports** as configured in your environment

### To Test Connection:

1. **Open the dashboard** at `http://localhost:3000`
2. **Click the Settings button** to open PI System Configuration
3. **Switch to Production mode** (important - development mode uses simulated data)
4. **Enter your PI system details:**
   - **AF Server Name**: Your PI AF server hostname (e.g., `PIAF-SERVER01`)
   - **PI Web API Server Name**: Server hosting PI Web API (e.g., `SRV-PIV0101` - often the PI Vision server)
   - **AF Database Name**: Your PI AF database name (e.g., `WWDB`)
   - **Parent Element Path**: Path to your wellpad parent element (e.g., `\\WWDB\\SLM\\WellPads\\102\\`)
   - **Template Name**: Your wellpad template name (e.g., `Well`)
5. **Click "Test Connection"**

### Important: Separate PI Web API Server Configuration

**NEW FEATURE**: The system now supports separate configuration for:
- **PI AF Server**: Hosts the Asset Framework database and elements
- **PI Web API Server**: Provides the REST API interface (commonly hosted on PI Vision server)

This addresses the common enterprise setup where:
- PI AF Server: `PIAF-SERVER01` (Asset Framework)
- PI Web API Server: `SRV-PIV0101` (PI Vision server with Web API)

### Expected Results

#### Successful Connection
- All 4 test steps show green checkmarks
- Success message appears
- **Network traffic visible in PI Network Manager Statistics**

#### Failed Connection
- Specific error messages for each failed step
- Red X marks for failed tests
- Detailed error information in browser console

### Troubleshooting

#### No Network Traffic in PI Network Manager
- Verify PI Web API is installed and running **on the PI Web API server** (not necessarily the AF server)
- Check firewall settings on the **PI Web API server**
- Confirm the **PI Web API server name** is correct (e.g., `SRV-PIV0101`)
- Try different ports if default doesn't work

#### Common Configuration Issues

**Problem**: "Failed to connect" but server is reachable from browser
**Solution**: Ensure you're using the correct **PI Web API Server Name** field
- ✅ **Correct**: PI Web API Server Name = `SRV-PIV0101` (PI Vision server)
- ❌ **Incorrect**: Using AF server name for PI Web API endpoints

**Problem**: "fetch failed" errors in logs
**Cause**: PI Web API hosted on different server than PI AF
**Solution**: 
1. Set **AF Server Name** to your Asset Framework server
2. Set **PI Web API Server Name** to your PI Vision/Web API server
3. These are often different servers in enterprise environments

#### Your Configuration Example:
Based on your setup:
- **AF Server Name**: `MES-PIAF01CPF` (or actual AF server)
- **PI Web API Server Name**: `SRV-PIV0101` (PI Vision server)
- **AF Database Name**: `WWDB`
- **Parent Element Path**: `\\WWDB\\SLM\\WellPads\\102\\`

#### Authentication Errors (401)
- This is actually **expected** and indicates the server is reachable
- The system treats 401 as successful (server accessible but requires auth)
- Full authentication implementation can be added later

#### Timeout Errors
- Server may be unreachable
- Firewall blocking connections
- PI Web API service not running
- Network connectivity issues

#### CORS Errors
- The system uses server-side API routes to avoid browser CORS restrictions
- If you see CORS errors, there may be an issue with the API route configuration

### Network Security Notes

The connection tests are performed **server-side** to avoid browser CORS restrictions. This means:
- Your PI AF server only sees connections from the Next.js server
- No direct browser-to-PI connections
- Better security and compatibility

### Logging and Debugging

Check the browser console and server logs for detailed connection attempt information:
- Connection attempt URLs
- Response status codes
- Error messages
- Timing information

## Development vs Production Modes

- **Development Mode**: Uses simulated data, no real PI connections
- **Production Mode**: Makes real PI Web API calls, generates network traffic

Make sure you're in **Production mode** when testing real connections!

## Next Steps

Once connection testing is successful, you can:
1. Configure authentication credentials
2. Set up attribute mapping for your specific PI AF structure
3. Deploy to production environment
4. Connect to live PI AF data
