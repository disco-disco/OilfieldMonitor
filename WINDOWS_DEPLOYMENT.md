# 🚀 Windows PC Production Deployment Guide

This guide helps you deploy and test the PLINQO OILFIELD monitoring dashboard on your Windows PC where the actual PI Web API and PI AF servers are accessible.

## 📋 Prerequisites

Ensure you have installed on your Windows PC:
- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org/))
- **Git** (Download from [git-scm.com](https://git-scm.com/))
- **Network access** to your PI Web API server (`SRV-PIV0101`)

## 🔄 Deployment Steps

### 1. Clone/Pull Latest Changes

```cmd
# If first time, clone the repository
git clone [your-repo-url]
cd modern-website

# If already exists, pull latest changes
git pull origin main
```

### 2. Install Dependencies

```cmd
npm install
```

### 3. Start Development Server

```cmd
npm run dev
```

The application will be available at: **http://localhost:3000**

### 4. Test PI Web API Connectivity

1. **Open Debug Page**: http://localhost:3000/debug
2. **Enter your PI Web API server**: `SRV-PIV0101`
3. **Run both connection tests**:
   - Server-side debugger (top section)
   - Direct browser tester (bottom section)
4. **Check results** for successful connections

### 5. Configure PI System Settings

1. **Open Main Dashboard**: http://localhost:3000
2. **Click Settings** (gear icon)
3. **Configure your PI System**:
   - **PI AF Server Name**: `[Your-PI-AF-Server]`
   - **PI Web API Server Name**: `SRV-PIV0101`
   - **Database Name**: `[Your-PI-Database]`
   - **Element Template Path**: `[Your-WellPad-Path]`
4. **Test Connection** - should now succeed
5. **Switch to Production Mode**

## 🔍 Expected Results on Windows PC

### ✅ **Successful Connection Indicators:**
- **HTTP 200 OK** - Perfect! Full access to PI Web API
- **HTTP 401 Unauthorized** - Good! Server reachable, needs authentication
- **Connection tests pass** in the Settings configuration
- **Production mode** shows real well data

### ❌ **Troubleshooting on Windows:**

**Still getting connection errors?**

1. **Check PI Web API Service:**
   ```cmd
   # Check if PI Web API service is running
   sc query "PI Web API"
   ```

2. **Check Windows Firewall:**
   - Ensure ports 443, 5985, 80 are open for PI Web API
   - Try temporarily disabling Windows Firewall to test

3. **Check Network Connectivity:**
   ```cmd
   # Test basic connectivity
   ping SRV-PIV0101
   
   # Test specific ports
   telnet SRV-PIV0101 443
   telnet SRV-PIV0101 5985
   ```

4. **Check PI Web API Configuration:**
   - Verify PI Web API is configured to accept connections
   - Check CORS settings if needed
   - Verify SSL certificates

## 🎯 Production Configuration

Once connectivity is confirmed, configure for production use:

### 1. PI AF Server Settings
- **Server Name**: Your actual PI AF server name
- **Database**: Your production PI AF database
- **Element Path**: Path to your wellpad elements

### 2. Authentication (if required)
- Configure Windows Authentication
- Or set up PI Web API basic authentication
- Update fetch requests to include credentials

### 3. SSL Configuration
- Ensure proper SSL certificates are installed
- Or configure to use HTTP if in secure internal network

## 📊 Monitoring Setup

### Real-time Data Verification:
1. **Check PI Network Manager Statistics** - you should see API calls
2. **Verify wellpad data** updates in real-time
3. **Test connection status** indicators work correctly

### Performance Optimization:
- Configure refresh intervals for your needs
- Set up proper caching for large datasets
- Monitor memory usage with large well counts

## 🔧 Common Windows-Specific Issues

### Node.js Path Issues:
```cmd
# If npm commands fail, ensure Node.js is in PATH
echo %PATH%
```

### Port Conflicts:
```cmd
# If port 3000 is in use, specify different port
npm run dev -- -p 3001
```

### Git Line Ending Issues:
```cmd
# Configure Git for Windows line endings
git config core.autocrlf true
```

## 📝 Testing Checklist

- [ ] Node.js and npm installed
- [ ] Repository cloned/pulled successfully  
- [ ] Dependencies installed (`npm install`)
- [ ] Development server starts (`npm run dev`)
- [ ] Debug page accessible (http://localhost:3000/debug)
- [ ] Server connectivity tests pass
- [ ] PI System configuration saves successfully
- [ ] Connection tests pass in Settings
- [ ] Production mode shows real well data
- [ ] Network Manager shows API traffic

## 🎉 Success!

When everything works correctly, you should see:
- ✅ Green status indicators in dashboard header
- ✅ Real well data from your PI AF system
- ✅ Successful connection tests
- ✅ Production mode active
- ✅ Network traffic visible in PI Network Manager

**Ready for production use!** 🚀

---

## 📞 Support

If you encounter issues during Windows deployment:
1. Check the troubleshooting steps above
2. Review console logs for specific error messages
3. Verify PI Web API service status and configuration
4. Test network connectivity with the provided commands
