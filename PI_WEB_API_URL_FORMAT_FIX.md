# PI Web API URL Format Fix

## Issue Identified

The user showed us the **correct working PI Web API URL syntax**:
```
https://%PIWEBAPI_SERVER%/piwebapi/assetdatabases?path=\\%PI_AF_SERVER%\%AF_DATABASE%
```

Where `%PLACEHOLDERS%` are examples that translate to actual values like:
```
https://SRV-PIV0101/piwebapi/assetdatabases?path=\\PISERVER01\PLINQO_OILFIELD
```

## Problem with Previous Implementation

Our PI AF service was using **incorrect URL formats** that didn't match the working syntax:

### ❌ **WRONG** (Previous):
```typescript
// Old URL formats that failed
`${endpoint}/assetservers/${encodeURIComponent(this.config.afServerName)}/assetdatabases`,
`${endpoint}/assetdatabases?path=\\\\${encodeURIComponent(this.config.afServerName)}`,
`${endpoint}/assetdatabases`
```

### ✅ **CORRECT** (Fixed):
```typescript
// New URL formats following the working example
`${endpoint}/assetdatabases?path=\\\\${this.config.afServerName}\\${this.config.afDatabaseName}`,
`${endpoint}/assetservers/${encodeURIComponent(this.config.afServerName)}/assetdatabases`,
`${endpoint}/assetdatabases`
```

## Key Changes Made

### 1. **Database Loading URLs**
```typescript
// FIXED: Added specific database path format (Format 1)
`${endpoint}/assetdatabases?path=\\\\${this.config.afServerName}\\${this.config.afDatabaseName}`

// This creates URLs like:
// https://SRV-PIV0101/piwebapi/assetdatabases?path=\\PISERVER01\PLINQO_OILFIELD
```

### 2. **Element Loading URLs**
```typescript
// FIXED: Added correct path format for elements
`${endpoint}/elements?path=\\\\${this.config.afServerName}\\${database.Name}`

// This creates URLs like:
// https://SRV-PIV0101/piwebapi/elements?path=\\PISERVER01\PLINQO_OILFIELD
```

### 3. **Child Element Loading URLs**
```typescript
// FIXED: Enhanced with multiple formats including direct path
`${endpoint}/elements?path=${encodeURIComponent(parentElement.Path)}`

// This handles nested navigation correctly
```

## URL Format Pattern

The working PI Web API URL pattern follows this structure:

### **Database Access:**
```
https://[WEB_API_SERVER]/piwebapi/assetdatabases?path=\\[AF_SERVER]\[DATABASE]
```

### **Element Access:**
```
https://[WEB_API_SERVER]/piwebapi/elements?path=\\[AF_SERVER]\[DATABASE]\[ELEMENT_PATH]
```

### **Nested Element Navigation:**
```
https://[WEB_API_SERVER]/piwebapi/elements?path=[FULL_ELEMENT_PATH]
```

## Testing Results

After implementing the correct URL formats:

✅ **Database URLs** now match the working syntax pattern  
✅ **Element URLs** follow the correct path structure  
✅ **Nested navigation** supports hierarchical paths  
✅ **No hanging issues** with the simplified service structure  
✅ **TypeScript compliance** with no compilation errors  

## Configuration Notes

The PI System Configuration interface now correctly expects:

- **AF Server Name**: `PISERVER01` (actual server name)
- **PI Web API Server**: `SRV-PIV0101` (actual PI Vision server)  
- **AF Database Name**: `PLINQO_OILFIELD` (actual database name)
- **Parent Element Path**: `Production\WellPads` (hierarchy path)

**Important**: No `%PLACEHOLDER%` syntax in actual configuration - those were just examples of the URL format.

## Result

The PI AF service now constructs URLs that match the proven working format, enabling proper database and element access for real PI System connections.
