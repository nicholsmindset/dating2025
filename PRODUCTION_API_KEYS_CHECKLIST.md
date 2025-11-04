# 🚀 PRODUCTION API KEYS CHECKLIST - Islamic Dating Platform 2025

## 📋 Overview
This document outlines ALL API keys and services required for production deployment. Use this as your master checklist to get the platform production-ready.

---

## ✅ CRITICAL SERVICES (MUST HAVE)

### 1. 🗄️ DATABASE - MongoDB Atlas
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

**What you need:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/islamic-dating-app?retryWrites=true&w=majority
```

**How to get:**
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create a new cluster (M0 Free Tier for dev, M10+ for production)
4. Click "Database Access" → Add Database User (save username/password)
5. Click "Network Access" → Add IP Address (0.0.0.0/0 for testing, specific IPs for production)
6. Click "Connect" → "Connect your application" → Copy connection string
7. Replace `<username>`, `<password>`, and database name

**Cost:**
- Development: $0 (M0 Free Tier - 512MB)
- Production: $57/month (M10 - 2GB RAM, 10GB storage)
- Scale: $150/month+ (M20+)

**Production checklist:**
- [ ] Database user created with strong password
- [ ] Network access properly configured
- [ ] Automated backups enabled
- [ ] Connection string uses production credentials
- [ ] Database name is production-specific

---

### 2. 💳 PAYMENTS - Stripe
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

**Backend (.env):**
```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx
```

**Frontend (.env.production):**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
1. Go to: https://dashboard.stripe.com/register
2. Complete business verification (required for live mode)
3. Go to "Developers" → "API keys"
4. Toggle "Test mode" to OFF (production mode)
5. Copy:
   - **Secret key** (sk_live_...) - BACKEND only
   - **Publishable key** (pk_live_...) - FRONTEND only

**Webhook Setup (CRITICAL):**
1. Go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Endpoint URL: `https://your-backend-domain.com/api/subscription/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy "Signing secret" (whsec_...)

**Cost:**
- Free to use
- Transaction fees: 2.9% + $0.30 per successful charge
- Additional 1.5% for international cards

**Production checklist:**
- [ ] Business information completed in Stripe
- [ ] Live mode activated
- [ ] All three keys (secret, publishable, webhook) configured
- [ ] Webhook endpoint tested and working
- [ ] Test transactions completed successfully
- [ ] Payout bank account configured
- [ ] Tax settings configured

---

### 3. 🔐 SECURITY - JWT & Secrets
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

**What you need:**
```env
JWT_SECRET=your_super_secure_random_string_64_chars_minimum
CRON_SECRET=another_super_secure_random_string_32_chars_minimum
SESSION_SECRET=yet_another_secure_random_string
```

**How to generate (run in terminal):**
```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Cron Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**CRITICAL SECURITY NOTES:**
- ⚠️ NEVER commit these to git
- ⚠️ Different secrets for dev/staging/production
- ⚠️ Store in secure vault (AWS Secrets Manager, etc.)
- ⚠️ Rotate every 90 days

**Production checklist:**
- [ ] Secrets generated with sufficient entropy
- [ ] Secrets stored in secure vault
- [ ] Different secrets for each environment
- [ ] Secrets rotation schedule established
- [ ] Team access to secrets documented

---

### 4. 🖼️ IMAGE HOSTING - Cloudinary
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

**What you need:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

**How to get:**
1. Go to: https://cloudinary.com/users/register_free
2. Create account
3. Go to Dashboard
4. Copy all three values from "Account Details"

**Cost:**
- Free tier: 25 credits/month (25GB storage, 25GB bandwidth)
- Plus plan: $89/month (100 credits)
- Advanced plan: $249/month (300 credits)

**Production settings:**
1. Go to "Settings" → "Upload"
2. Enable "Auto backup"
3. Set upload presets (quality, format, transformations)
4. Configure auto-tagging for organization

**Production checklist:**
- [ ] Account created and verified
- [ ] Upload presets configured
- [ ] Auto-backup enabled
- [ ] Folder structure organized
- [ ] Transformation settings optimized
- [ ] CDN configured for your region

---

### 5. 📲 REAL-TIME NOTIFICATIONS - Pusher
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

**Backend (.env):**
```env
PUSHER_APP_ID=1234567
PUSHER_KEY=abcdef1234567890abcd
PUSHER_SECRET=1234567890abcdefghij
PUSHER_CLUSTER=us2
```

**Frontend (.env.production):**
```env
REACT_APP_PUSHER_KEY=abcdef1234567890abcd
REACT_APP_PUSHER_CLUSTER=us2
```

**How to get:**
1. Go to: https://dashboard.pusher.com/accounts/sign_up
2. Create account
3. Create new app (Channels product)
4. Choose cluster closest to your users:
   - `us2` - US East
   - `eu` - Europe
   - `ap1` - Asia Pacific
   - `ap3` - Singapore/Asia
5. Go to "App Keys" tab
6. Copy: App ID, Key, Secret, Cluster

**Cost:**
- Free tier: 200,000 messages/day, 100 max connections
- Standard: $49/month - Unlimited messages, 500 max connections
- Pro: $299/month - Unlimited messages, unlimited connections

**Production checklist:**
- [ ] App created in correct region
- [ ] All 4 values configured
- [ ] Connection limits reviewed
- [ ] Rate limiting configured
- [ ] Message encryption enabled (if handling sensitive data)

---

### 6. 📧 EMAIL SERVICE - SendGrid (Recommended)
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

**Option A: SendGrid (Recommended for production)**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Islamic Dating Platform
```

**How to get:**
1. Go to: https://signup.sendgrid.com/
2. Complete registration and verification
3. Go to "Settings" → "API Keys"
4. Click "Create API Key"
5. Name it "Production API Key"
6. Select "Full Access"
7. Copy the key (starts with SG.)

**Domain Authentication (REQUIRED):**
1. Go to "Settings" → "Sender Authentication"
2. Click "Authenticate Your Domain"
3. Add DNS records to your domain registrar
4. Verify domain (increases deliverability)

**Cost:**
- Free: 100 emails/day forever
- Essentials: $19.95/month (50,000 emails)
- Pro: $89.95/month (1,500,000 emails)

**Option B: Gmail (NOT recommended for production)**
```env
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=your-email@gmail.com
```

**Gmail App Password Setup:**
1. Go to: https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy 16-character password

**Limits:**
- Free Gmail: 500 emails/day
- Google Workspace: 2,000 emails/day ($6/user/month)

**Production checklist:**
- [ ] SendGrid account created
- [ ] API key with full access created
- [ ] Domain authenticated via DNS
- [ ] Sender reputation monitored
- [ ] Unsubscribe links tested
- [ ] Email templates created
- [ ] Bounce handling configured

---

## 🔧 BACKEND ENVIRONMENT VARIABLES

Create `/backend/.env` file:

```env
# ======================
# Server Configuration
# ======================
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
CLIENT_URL=https://your-frontend-domain.com

# ======================
# Database
# ======================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/islamic-dating-app?retryWrites=true&w=majority

# ======================
# Security & Authentication
# ======================
JWT_SECRET=your_super_secure_random_string_64_chars_minimum
JWT_EXPIRE=7d
CRON_SECRET=another_super_secure_random_string_32_chars_minimum
SESSION_SECRET=yet_another_secure_random_string
BCRYPT_ROUNDS=12

# ======================
# Stripe Payment Processing
# ======================
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx

# ======================
# Pusher Real-Time Notifications
# ======================
PUSHER_APP_ID=1234567
PUSHER_KEY=abcdef1234567890abcd
PUSHER_SECRET=1234567890abcdefghij
PUSHER_CLUSTER=us2

# ======================
# Cloudinary Image Hosting
# ======================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz

# ======================
# Email Service
# ======================
# Option A: SendGrid (Recommended)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Islamic Dating Platform

# Option B: Gmail (NOT recommended for production)
# EMAIL_SERVICE=gmail
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your_app_specific_password

# ======================
# Admin Configuration
# ======================
ADMIN_EMAIL=admin@your-domain.com
ADMIN_NOTIFICATION_EMAIL=notifications@your-domain.com

# ======================
# Rate Limiting
# ======================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ======================
# File Upload Limits
# ======================
MAX_FILE_SIZE=5242880

# ======================
# Subscription Pricing (in cents)
# ======================
BASIC_PLAN_MONTHLY=999
PREMIUM_PLAN_MONTHLY=2300
VIP_PLAN_MONTHLY=4900
ANNUAL_DISCOUNT=20

# ======================
# Feature Flags
# ======================
ENABLE_EMAIL_VERIFICATION=true
ENABLE_2FA=false
ENABLE_WALI_SUPERVISION=true
MAINTENANCE_MODE=false

# ======================
# Production Settings
# ======================
FORCE_HTTPS=true
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
TRUST_PROXY=true

# ======================
# Logging & Monitoring (Optional)
# ======================
LOG_LEVEL=info
# SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 🎨 FRONTEND ENVIRONMENT VARIABLES

Create `/frontend/.env.production` file:

```env
# ======================
# API Configuration
# ======================
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_BACKEND_URL=https://your-backend-domain.com
REACT_APP_SOCKET_URL=https://your-backend-domain.com

# ======================
# Stripe Configuration
# ======================
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx

# ======================
# Pusher Configuration
# ======================
REACT_APP_PUSHER_KEY=abcdef1234567890abcd
REACT_APP_PUSHER_CLUSTER=us2

# ======================
# App Configuration
# ======================
REACT_APP_NAME=Islamic Dating
REACT_APP_DESCRIPTION=Halal way to find your life partner

# ======================
# Image Upload
# ======================
REACT_APP_MAX_FILE_SIZE=5242880
REACT_APP_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# ======================
# Features
# ======================
REACT_APP_FREE_PROFILE_LIMIT=10
REACT_APP_PREMIUM_PRICE=23
REACT_APP_PREMIUM_CURRENCY=SGD
```

---

## 📊 OPTIONAL SERVICES (Recommended for Production)

### 7. 🚨 ERROR MONITORING - Sentry (Highly Recommended)
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

```env
SENTRY_DSN=https://xxxxxxxxxxxxx@xxxxxx.ingest.sentry.io/xxxxxxx
```

**How to get:**
1. Go to: https://sentry.io/signup/
2. Create account
3. Create new project (Node.js for backend, React for frontend)
4. Copy DSN

**Cost:**
- Developer: Free (5,000 events/month)
- Team: $26/month (50,000 events)
- Business: $80/month (200,000 events)

---

### 8. 📈 ANALYTICS - Google Analytics (Optional)
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

```env
REACT_APP_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
# or for GA4:
REACT_APP_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

**How to get:**
1. Go to: https://analytics.google.com/
2. Create account and property
3. Get tracking ID

**Cost:** Free

---

### 9. 🗄️ CACHING - Redis (Optional, for 1000+ concurrent users)
**Status**: [ ] Not Started [ ] In Progress [ ] Complete

```env
REDIS_URL=redis://username:password@host:port
```

**Options:**
- Local: Free (install Redis locally)
- Redis Cloud: Free tier available, $7/month for production
- AWS ElastiCache: $15/month minimum

---

## 💰 TOTAL COST BREAKDOWN

### Minimum Production Setup:
```
Service                     Cost/Month      Status
------------------------------------------------
MongoDB Atlas (M10)         $57            ✅ Required
Stripe                      $0*            ✅ Required (2.9% + $0.30 per transaction)
Cloudinary (Free)           $0             ✅ Required
Pusher (Free)               $0             ✅ Required
SendGrid (Free)             $0             ✅ Required
Secrets                     $0             ✅ Required
Domain + SSL                $15            ✅ Required
Hosting (DigitalOcean)      $12-60         ✅ Required
------------------------------------------------
TOTAL (Minimum)             $84-132/month
```

### Recommended Production Setup:
```
Service                     Cost/Month      Status
------------------------------------------------
MongoDB Atlas (M10)         $57            ✅ Required
Stripe                      $0*            ✅ Required
Cloudinary (Plus)           $89            ⚠️ As needed
Pusher (Standard)           $49            ⚠️ As needed
SendGrid (Essentials)       $19.95         ⚠️ As needed
Sentry (Team)               $26            🎯 Recommended
Domain + SSL                $15            ✅ Required
Hosting (DigitalOcean)      $60-120        ✅ Required
------------------------------------------------
TOTAL (Recommended)         $315-395/month
```

*Stripe charges 2.9% + $0.30 per successful transaction

---

## 🚀 DEPLOYMENT INFRASTRUCTURE

### Hosting Options:

#### Option 1: DigitalOcean (Recommended)
- Droplet: $12-60/month
- App Platform: $12/month (includes SSL)
- Managed Database: Included or $15/month extra

#### Option 2: AWS
- EC2: $20-100/month
- RDS: $30-200/month
- Load Balancer: $20/month
- Total: $70-320/month

#### Option 3: Heroku
- Dyno (Basic): $7/dyno/month × 2 = $14/month
- Postgres: $9/month (or use MongoDB Atlas)
- Total: $23/month minimum

### Domain & SSL:
- Domain: $10-15/year (Namecheap, Google Domains)
- SSL: Free (Let's Encrypt) or included with hosting

---

## ✅ FINAL PRODUCTION CHECKLIST

### Pre-Launch:
- [ ] All required API keys obtained and tested
- [ ] Environment variables set in production
- [ ] Database migrated and backed up
- [ ] Stripe webhooks configured and tested
- [ ] Email deliverability tested
- [ ] Image uploads working
- [ ] Real-time features (chat, notifications) tested
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Monitoring and logging set up

### Post-Launch:
- [ ] Monitor error rates (Sentry)
- [ ] Monitor API response times
- [ ] Monitor database performance
- [ ] Check email deliverability rates
- [ ] Review Stripe dashboard daily
- [ ] Monitor server resources
- [ ] Set up automated backups
- [ ] Create incident response plan

---

## 🆘 SUPPORT RESOURCES

### Service Support:
- MongoDB Support: https://support.mongodb.com/
- Stripe Support: https://support.stripe.com/
- Cloudinary Support: https://support.cloudinary.com/
- Pusher Support: https://support.pusher.com/
- SendGrid Support: https://support.sendgrid.com/

### Documentation:
- API Setup Guide: `/SETUP_GUIDE.md`
- README: `/README.md`
- Backend README: `/backend/README.md`

---

## 📝 NOTES

1. **Security**: Never commit .env files to version control
2. **Secrets Management**: Use environment variables or secret management services
3. **Testing**: Test all integrations in staging before production
4. **Backups**: Set up automated database backups
5. **Monitoring**: Set up alerts for critical failures
6. **Scaling**: Review costs and upgrade plans as user base grows

---

**Last Updated**: 2025-11-04
**Version**: 1.0.0
**Status**: Ready for Production Deployment

---

Need help setting up any specific service? Refer to `/SETUP_GUIDE.md` for detailed instructions!
