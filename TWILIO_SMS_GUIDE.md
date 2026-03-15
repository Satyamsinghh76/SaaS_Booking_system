# 📱 Twilio SMS Integration Setup Guide

## 🎯 **Overview**
Enable SMS notifications for appointment reminders, booking confirmations, and customer communications using Twilio.

---

## 🔧 **Step 1: Twilio Account Setup**

### **1.1 Create Twilio Account**
1. Visit [Twilio Console](https://www.twilio.com/console)
2. Click **"Sign up"** or **"Log in"**
3. Choose **"Trial account"** (free to start)
4. Verify your email address
5. Verify your phone number (required for sending SMS)

### **1.2 Get Account Credentials**
From your Twilio Dashboard:
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: your_auth_token_here
```

### **1.3 Get a Phone Number**
1. Go to **"Phone Numbers"** → **"Manage"** → **"Buy a number"**
2. Choose **"SMS"** capabilities
3. Select a number (or get a free trial number)
4. Click **"Buy"**

Your Twilio phone number will look like:
```
+1234567890
```

---

## ⚙️ **Step 2: Environment Configuration**

### **2.1 Backend Environment (`server/.env`)**
Add these Twilio variables:
```env
# Twilio SMS Integration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# SMS Templates (optional)
SMS_CONFIRMATION_TEMPLATE=Your booking for {service} on {date} at {time} is confirmed!
SMS_REMINDER_TEMPLATE=Reminder: Your {service} appointment is tomorrow at {time}. Reply STOP to unsubscribe.
SMS_CANCELLATION_TEMPLATE=Your booking has been cancelled. We'll miss you!
SMS_PAYMENT_CONFIRMATION_TEMPLATE=Payment of ${amount} received for your {service} booking on {date}.
```

### **2.2 Frontend Environment (`client/.env.local`)**
```env
# Twilio (optional - for phone number formatting)
NEXT_PUBLIC_TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🗄️ **Step 3: Database Setup**

### **3.1 Create SMS Tables**
Run this SQL in Supabase:
```sql
-- SMS logs and preferences
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'confirmation', 'reminder', 'cancellation'
  message_content TEXT NOT NULL,
  twilio_sid VARCHAR(100), -- Twilio message SID
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User SMS preferences
CREATE TABLE IF NOT EXISTS user_sms_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enable_confirmations BOOLEAN DEFAULT true,
  enable_reminders BOOLEAN DEFAULT true,
  enable_cancellations BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_sms_preferences_user_id_unique UNIQUE (user_id)
);

-- Add phone number to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_booking_id ON sms_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
```

---

## 📦 **Step 4: Install Dependencies**

### **4.1 Backend Installation**
```bash
cd server
npm install twilio
```

---

## 🔌 **Step 5: Integration Files Created**

### **5.1 Backend Files**
- ✅ `server/services/twilioService.js` - Twilio service layer
- ✅ `server/controllers/smsController.js` - SMS API controllers
- ✅ `server/routes/sms.js` - SMS API routes

### **5.2 Frontend Files**
- ✅ `client/components/SMSPreferences.tsx` - SMS preferences UI

---

## 🚀 **Step 6: Register SMS Routes**

Add SMS routes to your main server file:

### **6.1 Update `server/server.js`**
```javascript
// Add SMS routes
const smsRoutes = require('./routes/sms');
app.use('/api/sms', smsRoutes);
```

---

## 📱 **Step 7: API Endpoints Available**

### **SMS Management**
- `POST /api/sms/send` - Send custom SMS
- `GET /api/sms/preferences` - Get user SMS preferences
- `PUT /api/sms/preferences` - Update SMS preferences
- `GET /api/sms/logs` - Get SMS history

### **Booking-Related SMS**
- `POST /api/sms/booking/:bookingId/confirm` - Send confirmation
- `POST /api/sms/booking/:bookingId/reminder` - Send reminder
- `POST /api/sms/booking/:bookingId/cancel` - Send cancellation

### **Webhooks & Status**
- `POST /api/sms/webhook` - Twilio delivery status webhook
- `GET /api/sms/status/:messageId` - Get message delivery status

---

## 🎨 **Step 8: Frontend Integration**

### **8.1 Add SMS Preferences Component**
```tsx
import SMSPreferences from '@/components/SMSPreferences';

// In your settings or profile page
<SMSPreferences />
```

### **8.2 Add SMS to Booking Flow**
```tsx
// After successful booking
const sendConfirmationSMS = async (bookingId) => {
  try {
    await api.post(`/sms/booking/${bookingId}/confirm`);
    console.log('Confirmation SMS sent');
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
};
```

---

## ⏰ **Step 9: Automated SMS Triggers**

### **9.1 Booking Confirmation**
Add to your booking confirmation flow:
```javascript
// In booking controller after successful booking
if (user.sms_preferences?.enable_confirmations) {
  await twilioService.sendBookingConfirmation(booking, user);
}
```

### **9.2 Payment Confirmation**
Add to your payment success flow:
```javascript
// In payment controller after successful payment
if (user.sms_preferences?.enable_payment_notifications) {
  await twilioService.sendPaymentConfirmation(booking, user, amount);
}
```

### **9.3 Daily Reminders (Cron Job)**
```javascript
// Create cron job for daily reminders
const cron = require('node-cron');

cron.schedule('0 9 * * *', async () => {
  // Send reminders for appointments tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const bookings = await getBookingsForDate(tomorrow);
  
  for (const booking of bookings) {
    const user = await getUser(booking.user_id);
    if (user.sms_preferences?.enable_reminders) {
      await twilioService.sendAppointmentReminder(booking, user);
    }
  }
});
```

---

## 🔍 **Step 10: Testing**

### **10.1 Test SMS Sending**
```bash
# Test API endpoint
curl -X POST http://localhost:5000/api/sms/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Test message from BookFlow!",
    "messageType": "test"
  }'
```

### **10.2 Test Booking SMS**
1. Create a test booking
2. Send confirmation SMS:
```bash
curl -X POST http://localhost:5000/api/sms/booking/BOOKING_ID/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🛡️ **Step 11: Security & Best Practices**

### **11.1 Phone Number Validation**
```javascript
// Validate phone numbers before sending
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};
```

### **11.2 Rate Limiting**
```javascript
// Add rate limiting to SMS endpoints
const rateLimit = require('express-rate-limit');

const smsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 SMS per 15 minutes
  message: 'Too many SMS requests, please try again later.'
});

router.post('/send', smsRateLimit, sendSMS);
```

### **11.3 Opt-Out Handling**
```javascript
// Handle STOP messages in webhook
if (webhookData.Body && webhookData.Body.toLowerCase() === 'stop') {
  await updateUserSMSPreferences(webhookData.From, {
    enable_all: false
  });
}
```

---

## 🚨 **Step 12: Troubleshooting**

### **Common Issues**

#### **"Invalid phone number" Error**
- **Cause**: Phone number not in E.164 format
- **Fix**: Ensure numbers include country code (+1 for US)

#### **"Trial account cannot send to unverified numbers"**
- **Cause**: Twilio trial account restrictions
- **Fix**: Verify recipient phone numbers in Twilio console

#### **"Insufficient funds"**
- **Cause**: Trial balance exhausted
- **Fix**: Upgrade to paid account or add credits

#### **Webhook not working**
- **Cause**: Ngrok/tunnel not configured for local testing
- **Fix**: Use ngrok for local webhook testing

---

## 📊 **Step 13: Monitoring & Analytics**

### **13.1 SMS Analytics Dashboard**
Track these metrics:
- SMS sent vs delivered rates
- Opt-in/opt-out rates
- Cost per message
- Failed delivery reasons

### **13.2 Logging**
All SMS activities are logged in:
- `sms_logs` table
- Application logs
- Twilio console

---

## 💰 **Step 14: Cost Management**

### **14.1 SMS Pricing**
- **US/Canada**: ~$0.0079 per SMS segment
- **International**: Varies by country
- **Phone Number**: $1/month per number

### **14.2 Cost Optimization**
- Combine multiple notifications in single SMS
- Use email for non-urgent notifications
- Implement smart reminder timing

---

## 🎉 **Step 15: Production Deployment**

### **15.1 Environment Variables**
```env
# Production
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### **15.2 Webhook Configuration**
1. In Twilio console, configure webhook URL:
   ```
   https://api.yourdomain.com/api/sms/webhook
   ```
2. Enable webhook status callbacks
3. Test webhook delivery

---

## ✅ **Success Indicators**

✅ **SMS Sending**: Messages sent successfully to users  
✅ **Delivery Tracking**: Real-time delivery status updates  
✅ **User Preferences**: Users can control SMS notifications  
✅ **Automated Triggers**: Booking confirmations and reminders  
✅ **Compliance**: Opt-out handling and rate limiting  
✅ **Analytics**: SMS performance tracking  

---

## 📞 **Support Resources**

- **Twilio Docs**: [https://www.twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- **Error Codes**: [Twilio SMS Error Codes](https://www.twilio.com/docs/sms/errors)
- **Pricing**: [Twilio SMS Pricing](https://www.twilio.com/sms/pricing)

---

**Your Twilio SMS integration is now ready!** 📱

Users will receive timely SMS notifications for their bookings, improving engagement and reducing no-shows.
