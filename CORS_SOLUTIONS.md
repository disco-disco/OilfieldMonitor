# 🔧 CORS Solutions for PI Web API

## Problem
CORS (Cross-Origin Resource Sharing) blocks browser requests from your Next.js app (`http://localhost:3000`) to PI Web API (`https://SRV-PIV0101/piwebapi`).

## Solution 1: Configure PI Web API Server (Recommended)

### On your PI Web API Server (SRV-PIV0101):

1. **Open IIS Manager**
2. **Navigate to** PI Web API site
3. **Add CORS headers** via web.config or IIS settings:

```xml
<!-- Add to web.config in PI Web API directory -->
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="Access-Control-Allow-Origin" value="*" />
      <add name="Access-Control-Allow-Methods" value="GET,POST,OPTIONS" />
      <add name="Access-Control-Allow-Headers" value="Content-Type,Authorization" />
    </customHeaders>
  </httpProtocol>
</system.webServer>
```

### Or configure via IIS HTTP Response Headers:
1. Select PI Web API site in IIS
2. Double-click "HTTP Response Headers"
3. Add these headers:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET,POST,OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type,Authorization`

## Solution 2: Next.js Proxy (Current Implementation)

Use Next.js API routes as a proxy to bypass CORS (already implemented in your app).

## Solution 3: Development Bypass

For development only, disable CORS checking in browser:
```bash
# Windows - Chrome with disabled security (DEVELOPMENT ONLY!)
chrome.exe --user-data-dir=/tmp/chrome_dev_session --disable-web-security --disable-features=VizDisplayCompositor
```

## Solution 4: Production Deployment

Deploy your Next.js app to the same domain/subdomain as PI Web API to avoid CORS entirely.

## Recommended Approach

1. **Development**: Use Next.js proxy (current setup)
2. **Production**: Configure PI Web API CORS headers
3. **Enterprise**: Deploy to same domain or use reverse proxy
