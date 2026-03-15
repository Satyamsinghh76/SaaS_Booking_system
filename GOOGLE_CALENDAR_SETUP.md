# 📅 Google Calendar Integration Setup Guide

## 🎯 **Overview**
Enable automatic Google Calendar event creation when bookings are confirmed in your SaaS platform.

---

## 🔧 **Step 1: Google Cloud Console Setup**

### **1.1 Create Project**
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"NEW PROJECT"**
3. Project name: `BookFlow SaaS`
4. Click **"CREATE"**

### **1.2 Enable Required APIs**
1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search and enable these APIs:
   - ✅ **Google Calendar API**
   - ✅ **Google+ API** (for user info)

### **1.3 Configure OAuth Consent Screen**
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** → **"CREATE"**
3. Fill in the form:
   ```
   App name: BookFlow SaaS
   User support email: your-email@your-domain.com
   Developer contact: your-email@your-domain.com
   ```
4. Click **"SAVE AND CONTINUE"** through all steps

### **1.4 Add Scopes**
1. In the "Scopes" section, click **"ADD OR REMOVE SCOPES"**
2. Add these scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Click **"UPDATE"**

---

## 🔑 **Step 2: Create OAuth Credentials**

### **2.1 Generate Client ID**
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Configure:
   ```
   Name: BookFlow Web Client
   Authorized JavaScript origins: http://localhost:3002
   Authorized redirect URIs: http://localhost:5000/api/calendar/oauth/callback
   ```
5. Click **"CREATE"**

### **2.3 Get Your Credentials**
You'll receive:
```
Client ID: 123456789-abcdef.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxx
```

---

## ⚙️ **Step 3: Environment Configuration**

### **3.1 Backend Environment (`server/.env`)**
Add these variables to your backend environment:
```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth/callback
GOOGLE_CALENDAR_ID=primary
TOKEN_ENCRYPTION_KEY=GENERATE_32_BYTE_HEX_KEY
```

### **3.2 Generate Encryption Key**
```bash
# Generate secure 32-byte hex key for token encryption
openssl rand -hex 32
# Example: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8
```

### **3.3 Frontend Environment (`client/.env.local`)**
```env
# Google OAuth (optional - for client-side features)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
```

---

## 🗄️ **Step 4: Database Setup**

### **4.1 Create Google Tokens Table**
Run this SQL in your Supabase SQL Editor:
```sql
-- Google OAuth tokens storage
CREATE TABLE IF NOT EXISTS google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT google_tokens_user_id_unique UNIQUE (user_id)
);

-- Add Google Calendar event ID to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_google_event_id ON bookings(google_calendar_event_id);
```

---

## 🚀 **Step 5: Integration Testing**

### **5.1 Start Your Application**
```bash
# Backend
cd server && npm run dev

# Frontend  
cd client && npm run dev
```

### **5.2 Test OAuth Flow**
1. Navigate to your dashboard
2. Find the Google Calendar integration section
3. Click **"Connect Google Calendar"**
4. You'll be redirected to Google's consent screen
5. Click **"Allow"** to grant permissions
6. You'll be redirected back to your app

### **5.3 Test Event Creation**
1. Create a new booking in your app
2. Confirm the booking
3. Check your Google Calendar - you should see a new event!
4. Event will include:
   - Service name
   - Customer information
   - Booking time
   - 1-hour reminder

---

## 🔍 **Available API Endpoints**

### **OAuth Flow**
- `GET /api/calendar/oauth/url` - Get Google OAuth URL
- `GET /api/calendar/oauth/callback` - Handle OAuth callback

### **Calendar Management**
- `GET /api/calendar/status` - Check connection status
- `POST /api/calendar/sync/:bookingId` - Create calendar event for booking
- `DELETE /api/calendar/event/:bookingId` - Remove calendar event

---

## 📱 **Frontend Integration**

### **Add Google Calendar Button**
```tsx
import GoogleCalendarButton from '@/components/GoogleCalendarButton';

// In your dashboard or settings page
<GoogleCalendarButton 
  bookingId={booking.id}
  onConnected={() => console.log('Calendar connected!')}
/>
```

### **Check Connection Status**
```tsx
// Show connection status in your UI
const { data } = await api.get('/calendar/status');
if (data.connected) {
  // Show "Connected" status
} else {
  // Show "Connect" button
}
```

---

## 🛡️ **Security Features**

### **Token Encryption**
- Access tokens are encrypted in database
- 32-byte AES-256-CBC encryption
- Tokens never exposed in logs

### **OAuth Security**
- State parameter validation prevents CSRF
- Secure redirect URI validation
- Token expiration handling

### **Permission Scopes**
- Minimal required scopes only
- Read/write calendar events
- Basic user profile information

---

## 🔧 **Configuration Options**

### **Calendar ID Options**
```env
# Primary calendar (default)
GOOGLE_CALENDAR_ID=primary

# Specific calendar by ID
GOOGLE_CALENDAR_ID=c_1234567890abcdef@group.calendar.google.com

# Email address calendar
GOOGLE_CALENDAR_ID=your-email@your-domain.com
```

### **Redirect URI (Production)**
```env
# Production
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/calendar/oauth/callback

# Development
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth/callback
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"redirect_uri_mismatch" Error**
- **Cause**: Redirect URI doesn't match Google Cloud Console
- **Fix**: Ensure `GOOGLE_REDIRECT_URI` exactly matches your console settings

#### **"invalid_client" Error**
- **Cause**: Client ID incorrect or not configured
- **Fix**: Verify `GOOGLE_CLIENT_ID` matches your console

#### **"access_denied" Error**
- **Cause**: User denied consent
- **Fix**: User must grant permissions

#### **Token Not Found**
- **Cause**: Database token missing or expired
- **Fix**: Re-connect Google Calendar

#### **Event Creation Fails**
- **Cause**: Insufficient permissions or token expired
- **Fix**: Check calendar permissions and token validity

---

## 📊 **Monitoring & Logging**

### **Server Logs**
Your app will log:
```
INFO: Google Calendar connected successfully
INFO: Google Calendar event created
ERROR: Failed to create calendar event
```

### **Database Monitoring**
Monitor `google_tokens` table:
- Token expiration dates
- Failed connection attempts
- User adoption rates

---

## 🎉 **Success Indicators**

✅ **OAuth Flow Works**: Users can connect Google Calendar  
✅ **Events Created**: Bookings appear in Google Calendar  
✅ **Tokens Secure**: Encrypted storage in database  
✅ **Auto Sync**: No manual calendar entry required  
✅ **Error Handling**: Graceful failure and recovery  

---

## 🚀 **Production Deployment**

### **Environment Variables**
```env
# Production
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/calendar/oauth/callback
GOOGLE_CALENDAR_ID=primary
TOKEN_ENCRYPTION_KEY=your-production-encryption-key
```

### **Domain Configuration**
- Update `Authorized JavaScript origins` to your frontend domain
- Update `Authorized redirect URIs` to your backend domain
- Ensure HTTPS in production

---

**Your Google Calendar integration is now ready!** 📅

Users can connect their calendars and automatically get events created for every confirmed booking.
