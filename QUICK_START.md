# Quick Start Guide - BookFlow SaaS Platform

## 🚀 Setup Summary

✅ **Completed:**
- Environment files created with secure JWT secrets
- All dependencies installed (Node.js, npm, pnpm)
- Project structure verified

⏳ **Remaining:**
- Set up PostgreSQL database (Supabase recommended)
- Apply database schema
- Start development servers

## 📊 Database Setup Options

### Option 1: Supabase (Recommended - Free)
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Wait for the project to be ready (2-3 minutes)
5. Get your DATABASE_URL:
   - Go to Settings → Database
   - Scroll to "Connection string" 
   - Copy the "Pool" connection string
6. Update `server/.env`:
   ```env
   DATABASE_URL=your_actual_supabase_connection_string
   ```
7. Apply the schema:
   - In Supabase dashboard, go to SQL Editor
   - Copy contents of `server/db/schema.sql`
   - Paste and run the script

### Option 2: Local PostgreSQL
If you prefer local development:
```bash
# Install PostgreSQL (requires admin rights)
choco install postgresql --yes

# Create database
psql -U postgres -c "CREATE DATABASE saas_booking;"

# Apply schema
psql -U postgres -d saas_booking -f server/db/schema.sql

# Update server/.env with your local credentials
```

## 🎯 Once Database is Ready

### 1. Update Environment
Edit `server/.env` and replace:
```env
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres
```
With your actual connection string.

### 2. Start Development Servers
```bash
npm run dev
```

This will start:
- **Backend API**: http://localhost:5000 (Blue output)
- **Frontend**: http://localhost:3000 (Green output)

### 3. Verify Setup
Open these URLs in your browser:
- http://localhost:3000 → BookFlow landing page
- http://localhost:5000/health → API health check
- http://localhost:5000/ready → Database connection check

## 🔧 Optional Integrations

For full functionality, you can also configure:
- **Stripe payments**: Get keys from [stripe.com](https://stripe.com)
- **Email notifications**: Configure SMTP settings
- **SMS reminders**: Get Twilio credentials
- **Google Calendar**: Set up OAuth2

These are optional - the app works without them for development.

## 🐛 Troubleshooting

### Server won't start
- Check DATABASE_URL is correct
- Verify database schema is applied
- Check logs for specific error messages

### Frontend connection errors
- Ensure backend is running on port 5000
- Check `client/.env.local` has correct API URL
- Verify CORS_ORIGIN in server/.env matches frontend URL

### Database connection issues
- Test connection: `curl http://localhost:5000/ready`
- Check Supabase project is active
- Verify connection string format

## 📱 What You'll Get

Once running, you'll have:
- **Customer booking flow** - Browse services, book appointments
- **Provider dashboard** - Manage bookings and availability
- **Admin panel** - Analytics and user management
- **Payment integration** - Stripe checkout (optional)
- **Real-time features** - Availability checking, conflict prevention

## 🎉 Success!

When both servers are running, you'll see:
```
[blue] [API] Server listening on port 5000
[green] [WEB] Ready on http://localhost:3000
```

Your SaaS booking platform is ready for development! 🚀
