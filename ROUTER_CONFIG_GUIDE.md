# 🔧 Router Configuration Troubleshooting Guide

## Issues Fixed

### 1. **Authentication Issues**
**Problem**: Router configuration was failing due to authentication errors.

**Root Cause**: The API endpoints were importing a non-existent `auth` function from `@/lib/auth`, but the actual authentication functions were in `@/lib/middleware`.

**Solution**: 
- Replaced `auth` function with proper `authenticate` and `authorize` middleware
- Updated all router API endpoints to use correct authentication
- Added proper error handling for authentication failures

### 2. **Poor Error Handling**
**Problem**: Users were not getting clear feedback when router operations failed.

**Solution**: 
- Added comprehensive error handling to all router operations
- Implemented user-friendly error messages
- Added proper token validation and feedback
- Improved network error handling

## 🚀 How to Configure Routers

### Prerequisites
1. **Logged in as ISP Owner**: Make sure you're logged in with an ISP Owner account
2. **Valid Authentication Token**: The system should have a valid JWT token
3. **Network Access**: Your browser can reach the API endpoints

### Step-by-Step Configuration

#### 1. **Add a New Router**
1. Navigate to **Dashboard → Router Management**
2. Click the **"Add Router"** button
3. Fill in the required fields:
   - **Router Name**: A descriptive name for your router (e.g., "Main Office Router")
   - **IP Address**: The router's IP address (e.g., "192.168.1.1")
   - **Port**: The API port (default: 8728 for MicroTik API)
   - **Username**: Router API username (e.g., "admin")
   - **Password**: Router API password
4. Fill in optional fields:
   - **Location**: Physical location of the router
   - **Model**: Router model (e.g., "RB4011iGS+5HacQ2HnD")
   - **Firmware**: Firmware version
5. Click **"Add Router"**

#### 2. **Test Router Connection**
1. In the router list, find your router
2. Click the **activity icon** (circular arrow) in the Actions column
3. Wait for the connection test to complete
4. You'll see a success or failure message
5. If successful, the router status will update to "ONLINE"

#### 3. **Edit Router Configuration**
1. In the router list, click the **edit icon** (pencil) for your router
2. Modify the desired fields
3. Click **"Update Router"**

#### 4. **Delete Router**
1. In the router list, click the **delete icon** (trash can)
2. Confirm the deletion
3. Note: You cannot delete routers with active PPPoE users

## 🔍 Troubleshooting Common Issues

### Issue 1: "Please log in to continue"
**Cause**: Missing or invalid authentication token
**Solution**:
1. Log out and log back in
2. Clear browser cache and cookies
3. Check if you're using the correct user role (ISP Owner)

### Issue 2: "Error: ISP owner not found"
**Cause**: Your user account is not properly linked to an ISP owner profile
**Solution**:
1. Contact your system administrator
2. Ensure your account has the ISP Owner role
3. Check if your ISP owner profile is properly created

### Issue 3: "Error: Missing required fields"
**Cause**: Not all required fields were filled in the router form
**Solution**:
1. Make sure all required fields are filled:
   - Router Name
   - IP Address
   - Port
   - Username
   - Password
2. Ensure the IP address is in valid format (e.g., "192.168.1.1")
3. Port should be a number between 1 and 65535

### Issue 4: "Connection failed: Please check your router credentials and network"
**Cause**: Router connection test failed
**Solution**:
1. **Verify Router Credentials**:
   - Double-check the IP address
   - Verify the username and password
   - Ensure the port is correct (default: 8728)

2. **Check Router Configuration**:
   - Make sure MicroTik API is enabled on the router
   - Verify the API service is running on the specified port
   - Check firewall rules allow API access

3. **Network Issues**:
   - Ensure your server can reach the router's IP address
   - Check if there are any network restrictions
   - Verify the router is powered on and connected

### Issue 5: "Network error. Please try again"
**Cause**: Network connectivity issues or server problems
**Solution**:
1. Check your internet connection
2. Refresh the page and try again
3. Check if the API server is running
4. Look for any server-side errors in the console

### Issue 6: "Error: Cannot delete router with active PPPoE users"
**Cause**: Router has active PPPoE users associated with it
**Solution**:
1. Remove or reassign all PPPoE users from the router
2. Navigate to PPPoE Users management
3. Delete or move users to a different router
4. Then try deleting the router again

## 🛠️ Advanced Configuration

### MicroTik Router Setup
To use the router management features, your MicroTik router needs to be properly configured:

#### 1. **Enable API Service**
```bash
/ip service enable api
/ip service set api port=8728
/ip service set api address=0.0.0.0/0
```

#### 2. **Create API User**
```bash
/user add name=apiuser password=yourpassword group=full
/ip service set api disabled=no
```

#### 3. **Configure Firewall** (if needed)
```bash
/ip firewall filter add chain=input protocol=tcp dst-port=8728 action=accept
```

### Production Environment Considerations

#### Security
- Use strong passwords for router API access
- Restrict API access to specific IP addresses
- Use SSL/TLS for API connections (port 8729)
- Regularly update router firmware

#### Network
- Ensure stable network connectivity between server and routers
- Use static IP addresses for routers
- Configure proper DNS settings
- Monitor network latency and reliability

#### Monitoring
- Set up alerts for offline routers
- Monitor router resource usage
- Regularly test router connections
- Keep track of firmware versions

## 📋 API Endpoints Reference

### Router Management
- `GET /api/routers` - Get all routers for the authenticated ISP owner
- `POST /api/routers` - Create a new router
- `GET /api/routers/[id]` - Get a specific router
- `PUT /api/routers/[id]` - Update a router
- `DELETE /api/routers/[id]` - Delete a router

### Connection Testing
- `POST /api/routers/test` - Test router connection

## 🔧 Debug Mode

If you're still having issues, you can enable debug mode:

1. **Open Browser Developer Tools** (F12)
2. **Go to Network Tab**
3. **Try adding a router**
4. **Check the API requests** for detailed error messages
5. **Look at the Console** for JavaScript errors

Common debug information:
- **Status Codes**: 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
- **Response Messages**: Check the error field in API responses
- **Network Errors**: Check CORS, network connectivity, server status

## 🆘 Getting Help

If you continue to experience issues:

1. **Check the Logs**: Look at browser console and server logs
2. **Verify Configuration**: Double-check all router settings
3. **Test Manually**: Try connecting to the router API manually
4. **Contact Support**: Provide error messages and steps taken

---

**🎉 Result**: Router configuration should now work properly with clear error messages and proper authentication handling. Follow this guide for troubleshooting any remaining issues.