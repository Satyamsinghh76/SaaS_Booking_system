# PostgreSQL Setup Guide

## 🔧 Option 1: Quick Fix - Find Your Current Password

### Step 1: Open pgAdmin
1. Search for "pgAdmin" in Windows Start Menu
2. Open pgAdmin 4
3. Right-click on "Servers" → "Create" → "Server"
4. Enter:
   - Name: localhost
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: [Your password from PostgreSQL installation]

### Step 2: Test Connection
Once connected, your password is correct. Update it in `.env` file.

---

## 🔧 Option 2: Reinstall PostgreSQL (Clean Solution)

### Step 1: Download PostgreSQL
1. Go to: https://www.postgresql.org/download/windows/
2. Download PostgreSQL 16 or later
3. Run the installer

### Step 2: Installation Settings
During installation, set:
- **Password**: `Satyam0408()` (exactly this)
- **Port**: `5432`
- **Username**: `postgres`
- **Install pgAdmin 4** (optional but helpful)

### Step 3: Verify Installation
```bash
# Test connection
psql -U postgres -h localhost
# Enter password: Satyam0408()

# Should see: postgres=#
```

---

## 🔧 Option 3: Use SQLite (Alternative for Development)

### Step 1: Install SQLite
```bash
npm install sqlite3
```

### Step 2: Use SQLite Configuration
I can create a SQLite-based version for you if PostgreSQL is problematic.

---

## 🚀 After Database Setup

### Step 1: Apply Schema
```bash
# Create database
psql -U postgres -c "CREATE DATABASE saas_booking;"

# Apply schema
psql -U postgres -d saas_booking -f ../fixed_supabase_schema.sql
```

### Step 2: Update Environment
```bash
# Use working configuration
copy .env.local-working .env
```

### Step 3: Start System
```bash
npm run dev
```

---

## 🎯 Expected Result

After fixing database connection:
- ✅ Server starts on http://localhost:5000
- ✅ Frontend starts on http://localhost:3002
- ✅ Health check: http://localhost:5000/health
- ✅ Full booking system working

---

## 📞 If You Need Help

1. **Try Option 1 first** - Find your current PostgreSQL password
2. **If that fails, use Option 2** - Reinstall PostgreSQL
3. **If both fail, tell me** - I'll create SQLite alternative

Your SaaS platform is perfect - only database connection needs fixing!
