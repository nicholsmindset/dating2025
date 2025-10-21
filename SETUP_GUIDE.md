# 🔑 API Keys & Setup Guide

## ⚠️ REQUIRED KEYS (Must Have)

These are **critical** - the app won't work without them:

### 1. **MongoDB** 🗄️
```bash
MONGO_URI=mongodb://localhost:27017/islamic-dating-app
```

**Options:**
- **Local**: Install MongoDB locally (free)
- **MongoDB Atlas** (Recommended): https://www.mongodb.com/cloud/atlas
  - Free tier: 512MB storage
  - Setup time: 5 minutes
  - Get connection string from Atlas dashboard

**How to Get (MongoDB Atlas)**:
```
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create a cluster (M0 free tier)
4. Click "Connect" → "Connect your application"
5. Copy connection string:
   mongodb+srv://username:password@cluster.mongodb.net/islamic-dating-app
```

---

### 2. **JWT Secret** 🔐
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**How to Generate**:
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 64

# Option 3: Just use a long random string
JWT_SECRET=8f4e7d9c2b1a6f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1
```

⚠️ **CRITICAL**: Never commit this to git! Must be unique per environment.

---

### 3. **Cron Secret** ⏰
```bash
CRON_SECRET=your-cron-secret-key-change-this
```

**What it's for**: Secures the `/api/subscription/check-expired` endpoint

**How to Generate**:
```bash
# Same as JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 💳 PAYMENT KEYS (Required for Revenue)

### 4. **Stripe** 💰
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**How to Get**:
```
1. Go to https://dashboard.stripe.com/register
2. Complete registration (free)
3. Go to "Developers" → "API keys"
4. Copy:
   - Secret key (starts with sk_test_)
   - Publishable key (starts with pk_test_)
5. For webhook secret:
   - Go to "Developers" → "Webhooks"
   - Click "Add endpoint"
   - URL: https://yourdomain.com/api/subscription/webhook
   - Select events:
     * payment_intent.succeeded
     * invoice.payment_succeeded
     * invoice.payment_failed
     * customer.subscription.deleted
   - Copy "Signing secret" (starts with whsec_)
```

**Cost**: Free (Stripe takes 2.9% + $0.30 per transaction)

**⚠️ Important**:
- Use **test keys** (sk_test_*) for development
- Use **live keys** (sk_live_*) only in production
- Test with card: 4242 4242 4242 4242

---

## 📲 REAL-TIME KEYS (Required for Chat/Notifications)

### 5. **Pusher** 🔔
```bash
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_cluster  # e.g., us2, eu, ap1
```

**How to Get**:
```
1. Go to https://dashboard.pusher.com/accounts/sign_up
2. Create free account
3. Create a new app (Channels product)
4. Select cluster closest to users (e.g., ap1 for Asia)
5. Go to "App Keys" tab
6. Copy all 4 values
```

**Cost**:
- Free tier: 200k messages/day, 100 concurrent connections
- Paid: $49/month for unlimited

**Alternative**: You can skip Pusher and use only Socket.io (already configured)
- Notifications won't work
- But chat will still work via Socket.io

---

## 🖼️ IMAGE HOSTING (Required for Profile Photos)

### 6. **Cloudinary** 📸
```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**How to Get**:
```
1. Go to https://cloudinary.com/users/register_free
2. Create free account
3. Go to Dashboard
4. Copy:
   - Cloud name
   - API Key
   - API Secret
```

**Cost**:
- Free tier: 25GB storage, 25GB bandwidth/month
- Paid: $89/month for 100GB

**Alternative**: Use AWS S3 (cheaper for high volume)
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

---

## 📧 EMAIL KEYS (Recommended)

### 7. **Email Service** ✉️

**Option A: Gmail** (Easy, but limited)
```bash
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password  # NOT your Gmail password!
EMAIL_FROM=noreply@islamicdating.com
```

**How to Get Gmail App Password**:
```
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy 16-character password
```

**Limits**:
- 500 emails/day (free Gmail)
- 2000 emails/day (Google Workspace - $6/user/month)

---

**Option B: SendGrid** (Recommended for production)
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@islamicdating.com
```

**How to Get**:
```
1. Go to https://signup.sendgrid.com/
2. Create free account
3. Go to "Settings" → "API Keys"
4. Create API key with "Full Access"
5. Copy key (starts with SG.)
```

**Cost**:
- Free tier: 100 emails/day forever
- Paid: $19.95/month for 40k emails

---

## 🔧 OPTIONAL KEYS

### Redis (Optional - for caching)
```bash
REDIS_URL=redis://localhost:6379
```

**When to use**: If you get 1000+ concurrent users
**Cost**: Free (local) or Redis Cloud $7/month

---

### Sentry (Optional - error tracking)
```bash
SENTRY_DSN=your_sentry_dsn_here
```

**When to use**: Production monitoring
**Cost**: Free tier, then $26/month

---

## 📋 QUICK SETUP CHECKLIST

### **Minimum to Start Development** (15 minutes):
```bash
# 1. Copy example env file
cp .env.example .env

# 2. Set these REQUIRED values:
MONGO_URI=mongodb://localhost:27017/islamic-dating-app  # Local MongoDB
JWT_SECRET=$(openssl rand -hex 64)  # Generate random
CRON_SECRET=$(openssl rand -hex 32)  # Generate random
NODE_ENV=development

# 3. Start the app
cd backend
npm install
npm start

# ✅ App will run, but no payments/images/emails
```

---

### **For Full Functionality** (1 hour setup):
```bash
# Required for production:
✅ MongoDB (MongoDB Atlas - 5 min)
✅ JWT Secret (generate - 1 min)
✅ Cron Secret (generate - 1 min)
✅ Stripe (signup + test keys - 10 min)
✅ Pusher (signup - 5 min)
✅ Cloudinary (signup - 5 min)
✅ Email (Gmail or SendGrid - 10 min)

Total time: ~40 minutes
Total cost: $0 (all free tiers)
```

---

## 💰 COST SUMMARY

### **Free Forever Tier**:
```
MongoDB Atlas    : Free (512MB)
Stripe          : Free (2.9% + $0.30 per transaction)
Pusher          : Free (200k messages/day)
Cloudinary      : Free (25GB storage)
SendGrid        : Free (100 emails/day)
─────────────────────────────────────
Total Monthly   : $0
```

### **When You Scale** (1000+ users):
```
MongoDB Atlas   : $25/month (2GB)
Stripe          : 2.9% + $0.30 per transaction (only on revenue)
Pusher          : $49/month (unlimited)
Cloudinary      : $89/month (100GB)
SendGrid        : $19.95/month (40k emails)
─────────────────────────────────────
Total Monthly   : ~$183/month
Revenue Needed  : ~$750/month to break even
```

---

## 🚀 PRODUCTION DEPLOYMENT KEYS

### Additional for Production:
```bash
# Frontend URL
CLIENT_URL=https://yourapp.com

# Force HTTPS
FORCE_HTTPS=true

# CORS
CORS_ORIGINS=https://yourapp.com,https://www.yourapp.com

# Trust proxy (for Heroku, AWS, etc.)
TRUST_PROXY=true

# Switch to production Stripe keys
STRIPE_SECRET_KEY=sk_live_...  # NOT sk_test_
STRIPE_PUBLISHABLE_KEY=pk_live_...  # NOT pk_test_
```

---

## 🎯 RECOMMENDED SETUP ORDER

### **Phase 1: Local Development** (Start coding)
1. ✅ MongoDB (local or Atlas)
2. ✅ JWT Secret (generated)
3. ✅ Cron Secret (generated)
4. ⏭️ Skip: Stripe, Pusher, Cloudinary, Email

**You can build features without payment/images**

---

### **Phase 2: Feature Testing** (Test payments/uploads)
1. ✅ Stripe (test mode)
2. ✅ Cloudinary (free tier)
3. ✅ Pusher (free tier)
4. ⏭️ Skip: Email (console log instead)

**You can test full user flow**

---

### **Phase 3: Beta Launch** (Real users)
1. ✅ All keys from Phase 1 & 2
2. ✅ Email service (SendGrid free tier)
3. ✅ Production domain setup
4. ✅ Stripe webhook configured

**Ready for first users**

---

### **Phase 4: Production** (Sell the app)
1. ✅ Switch Stripe to live mode
2. ✅ Upgrade to paid tiers as needed
3. ✅ Add Sentry for monitoring
4. ✅ Add Redis for performance

**Enterprise ready**

---

## 🆘 TROUBLESHOOTING

### "MongoDB connection failed"
```bash
# Check MongoDB is running
sudo systemctl status mongodb  # Linux
brew services list  # Mac

# Or use MongoDB Atlas cloud (easier)
```

### "Stripe payment not working"
```bash
# Make sure using TEST keys in development
sk_test_...  ✅
sk_live_...  ❌ (only in production)

# Test with card: 4242 4242 4242 4242
```

### "Images not uploading"
```bash
# Check Cloudinary credentials
# Make sure CLOUDINARY_CLOUD_NAME doesn't have quotes
CLOUDINARY_CLOUD_NAME=mycloud  ✅
CLOUDINARY_CLOUD_NAME="mycloud"  ❌
```

### "Emails not sending"
```bash
# Gmail: Use App Password, NOT your account password
# SendGrid: Make sure API key has "Full Access"
# Check EMAIL_FROM is valid format
```

---

## 📝 FINAL .env TEMPLATE

```bash
# REQUIRED (Must set these)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/islamic-dating
JWT_SECRET=8f4e7d9c2b1a6f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c
CRON_SECRET=3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e

# PAYMENT (Required for revenue)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# REAL-TIME (Required for notifications)
PUSHER_APP_ID=123456
PUSHER_KEY=abcdef123456
PUSHER_SECRET=secret123456
PUSHER_CLUSTER=us2

# IMAGES (Required for profile photos)
CLOUDINARY_CLOUD_NAME=mycloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijk123456

# EMAIL (Recommended)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@islamicdating.com

# OPTIONAL
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## ✅ YOU'RE ALL SET!

**Quick Start**:
```bash
# 1. Get free MongoDB Atlas account (5 min)
# 2. Generate JWT & Cron secrets (1 min)
# 3. Copy .env.example to .env
# 4. Fill in the 3 required values
# 5. npm install && npm start
```

**Can add other keys later as you test features!**

Need help setting up any specific service? Let me know! 🚀
