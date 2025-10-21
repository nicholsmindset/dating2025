# Deployment Guide
## Islamic Dating Platform

This guide provides step-by-step instructions for deploying the Islamic Dating Platform to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Third-Party Services](#third-party-services)
5. [Deployment Options](#deployment-options)
   - [Heroku Deployment](#heroku-deployment)
   - [AWS Deployment](#aws-deployment)
   - [DigitalOcean/Railway/Render](#other-platforms)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [x] Node.js 16+ installed locally
- [x] MongoDB Atlas account
- [x] Git installed
- [x] Domain name (recommended)
- [x] SSL certificate (automatic with most platforms)
- [x] Credit card for third-party services

**Estimated Setup Time:** 2-3 hours

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/islamic-dating?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secure-random-string-min-32-characters

# Email Service (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Pusher (Real-time features)
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=your-pusher-cluster

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Generating Secure Secrets

For JWT_SECRET, use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create Cluster**
   - Click "Build a Cluster"
   - Choose cloud provider (AWS/GCP/Azure)
   - Select region closest to your users
   - For production: M10 or higher recommended
   - Estimated cost: $57/month for M10

3. **Configure Security**
   - Database Access → Add User
   - Network Access → Add IP Address (0.0.0.0/0 for all, or specific IPs)

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password

5. **Create Database**
   - The app will create collections automatically
   - Database name: `islamic-dating`

6. **Create Indexes** (Optional but recommended)
   ```javascript
   // Connect to MongoDB shell or create via Atlas UI
   db.users.createIndex({ email: 1 }, { unique: true });
   db.users.createIndex({ "location.country": 1 });
   db.users.createIndex({ gender: 1, maritalStatus: 1 });
   db.chats.createIndex({ participants: 1 });
   db.chats.createIndex({ updatedAt: -1 });
   ```

---

## Third-Party Services

### 1. Email Service (Gmail)

**Option A: Gmail (Free for low volume)**

1. Enable 2FA on your Gmail account
2. Generate App Password:
   - Go to Google Account → Security
   - 2-Step Verification → App passwords
   - Select "Mail" and "Other"
   - Copy the 16-character password
3. Use this as `EMAIL_PASSWORD` in .env

**Option B: SendGrid (Recommended for production)**

1. Sign up at [SendGrid](https://sendgrid.com)
2. Verify your sender identity
3. Create API key
4. Update email service to use SendGrid

### 2. Pusher (Real-time Features)

1. Sign up at [Pusher.com](https://pusher.com)
2. Create a new app/channel
3. Copy credentials:
   - App ID
   - Key
   - Secret
   - Cluster
4. Free tier: 200k messages/day

### 3. Stripe (Payment Processing)

1. Sign up at [Stripe.com](https://stripe.com)
2. Complete business verification
3. Get API keys:
   - Dashboard → Developers → API keys
   - Copy both Publishable and Secret keys
4. Create webhook endpoint:
   - URL: `https://your-domain.com/api/subscription/webhook`
   - Events to listen: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret

### 4. Cloudinary (Image Storage)

1. Sign up at [Cloudinary.com](https://cloudinary.com)
2. Dashboard shows:
   - Cloud name
   - API Key
   - API Secret
3. Free tier: 25GB storage, 25GB bandwidth

---

## Deployment Options

## Heroku Deployment

### Prerequisites
- Heroku account
- Heroku CLI installed

### Step 1: Prepare Application

```bash
# Create Procfile in root directory
echo "web: node backend/server.js" > Procfile

# Update package.json in root
{
  "name": "islamic-dating-platform",
  "version": "1.0.0",
  "scripts": {
    "start": "node backend/server.js",
    "build": "cd frontend && npm install && npm run build"
  },
  "engines": {
    "node": "16.x",
    "npm": "8.x"
  }
}
```

### Step 2: Create Heroku App

```bash
# Login to Heroku
heroku login

# Create app
heroku create islamic-dating-app

# Add buildpack for Node.js
heroku buildpacks:add heroku/nodejs
```

### Step 3: Configure Environment Variables

```bash
# Set all environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-here
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set EMAIL_USER=your-email
heroku config:set EMAIL_PASSWORD=your-password
heroku config:set PUSHER_APP_ID=your-app-id
heroku config:set PUSHER_KEY=your-key
heroku config:set PUSHER_SECRET=your-secret
heroku config:set PUSHER_CLUSTER=your-cluster
heroku config:set STRIPE_SECRET_KEY=your-stripe-key
heroku config:set STRIPE_PUBLISHABLE_KEY=your-publishable-key
heroku config:set CLOUDINARY_CLOUD_NAME=your-cloud-name
heroku config:set CLOUDINARY_API_KEY=your-api-key
heroku config:set CLOUDINARY_API_SECRET=your-api-secret
```

### Step 4: Deploy

```bash
# Add Heroku remote
heroku git:remote -a islamic-dating-app

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=1

# Open app
heroku open
```

### Step 5: Setup Custom Domain (Optional)

```bash
# Add domain
heroku domains:add www.your-domain.com

# Get DNS target
heroku domains

# Update DNS records at your domain registrar
# Add CNAME record: www → [heroku-dns-target]
```

### Heroku Pricing
- **Hobby Dyno:** $7/month
- **Standard Dyno:** $25-50/month
- **Professional Dyno:** $250-500/month

---

## AWS Deployment

### Architecture
- **EC2:** Application server
- **RDS:** Optional (using MongoDB Atlas instead)
- **S3 + CloudFront:** Static files (optional)
- **Route 53:** DNS management

### Step 1: Launch EC2 Instance

1. **Create EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.small (minimum)
   - Storage: 20GB SSD
   - Security Group:
     - SSH (22) from your IP
     - HTTP (80) from anywhere
     - HTTPS (443) from anywhere
     - Custom (5000) from anywhere (initially, close later)

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

### Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Step 3: Clone and Setup Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/your-repo/islamic-dating.git
cd islamic-dating

# Install backend dependencies
cd backend
npm install --production

# Create .env file
sudo nano .env
# Paste all environment variables
```

### Step 4: Setup PM2

```bash
# Start application
pm2 start backend/server.js --name islamic-dating

# Configure PM2 to start on reboot
pm2 startup
pm2 save

# Monitor application
pm2 monit
```

### Step 5: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/islamic-dating

# Paste configuration:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/islamic-dating /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### AWS Pricing Estimate
- **EC2 t3.small:** ~$15/month
- **Data transfer:** ~$10-20/month
- **Route 53:** $0.50/month
- **Total:** ~$25-35/month

---

## Other Platforms

### Railway.app (Easiest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables via dashboard

# Deploy
railway up
```

**Pricing:** Pay-as-you-go, ~$5-20/month

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

**Pricing:** $12/month (Basic)

### Render.com

1. Connect GitHub repository
2. Set build command: `cd frontend && npm install && npm run build`
3. Set start command: `node backend/server.js`
4. Add environment variables

**Pricing:** $7/month (Starter)

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check API health
curl https://your-domain.com/api/health

# Check Swagger docs
open https://your-domain.com/api-docs
```

### 2. Test Critical Flows

- [ ] User registration
- [ ] Email verification
- [ ] Login
- [ ] Profile creation
- [ ] Image upload
- [ ] Chat functionality
- [ ] Payment processing
- [ ] Admin panel access

### 3. Configure Monitoring

**Recommended Tools:**
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay
- [UptimeRobot](https://uptimerobot.com) - Uptime monitoring
- [PM2 Plus](https://pm2.io) - Application monitoring

### 4. Setup Backups

**MongoDB Atlas:**
- Enable automated backups (included in paid tiers)
- Configure backup schedule
- Test restore procedure

**Code:**
- Ensure GitHub repository is private
- Enable branch protection on main
- Regular commits

---

## Monitoring & Maintenance

### Daily Tasks
- Check error logs
- Monitor uptime
- Review user reports

### Weekly Tasks
- Review analytics
- Check database performance
- Update dependencies (security patches)

### Monthly Tasks
- Full backup verification
- Performance optimization
- Security audit
- Cost review

### PM2 Monitoring Commands

```bash
# View logs
pm2 logs islamic-dating

# Monitor resources
pm2 monit

# Restart application
pm2 restart islamic-dating

# View process info
pm2 info islamic-dating
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs islamic-dating --lines 100

# Common issues:
# 1. Missing environment variables
pm2 env islamic-dating

# 2. Port already in use
sudo lsof -i :5000

# 3. MongoDB connection
# Check MONGODB_URI in .env
```

### Database Connection Errors

```bash
# Test MongoDB connection
mongo "mongodb+srv://your-connection-string"

# Check IP whitelist in MongoDB Atlas
# Ensure 0.0.0.0/0 is added or specific server IP
```

### Email Not Sending

```bash
# Test email credentials
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transport.verify().then(console.log).catch(console.error);
"
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart application
pm2 restart islamic-dating

# If persistent, upgrade server
```

### Slow API Responses

```bash
# Check database indexes
# Enable MongoDB slow query log
# Review application logs for bottlenecks
# Consider caching with Redis
```

---

## Security Checklist

- [ ] All environment variables are set
- [ ] JWT secret is strong (32+ characters)
- [ ] HTTPS/SSL is enabled
- [ ] MongoDB IP whitelist configured
- [ ] Stripe webhook secret configured
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers active
- [ ] Regular security updates
- [ ] Firewall configured (only necessary ports open)

---

## Performance Optimization

### 1. Enable Compression

Already enabled in `server.js`:
```javascript
app.use(compression());
```

### 2. Database Indexes

```javascript
// Create indexes in MongoDB
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ "location.country": 1 });
db.chats.createIndex({ participants: 1 });
```

### 3. Caching (Optional)

Install Redis:
```bash
sudo apt install redis-server
npm install redis
```

### 4. CDN for Static Files

Use Cloudinary for images (already configured)

### 5. Database Connection Pooling

Already configured in Mongoose connection

---

## Scaling Considerations

### Horizontal Scaling
- Load balancer (AWS ALB, Nginx)
- Multiple application instances
- Shared session storage (Redis)

### Database Scaling
- MongoDB sharding (for 1M+ users)
- Read replicas
- Connection pooling

### Cost Optimization
- Auto-scaling based on traffic
- Reserved instances (AWS)
- Optimize image storage

---

## Support & Resources

- **Documentation:** `/PRODUCTION_READINESS_REPORT.md`
- **API Docs:** `https://your-domain.com/api-docs`
- **Health Check:** `https://your-domain.com/api/health`

---

**Last Updated:** 2025-10-21
**Version:** 1.0.0
