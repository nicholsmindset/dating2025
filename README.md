# 🕌 Islamic Dating & Marriage Platform

> A faith-centered, halal matchmaking platform designed for Muslim singles seeking marriage, with a special focus on widows and divorced individuals.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Docker Deployment](#-docker-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Islamic Features](#-islamic-features)
- [Security](#-security)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

Islamic Dating Platform is a comprehensive web application that provides a safe, respectful, and halal environment for Muslim singles to find their life partners. The platform emphasizes Islamic values, privacy, and modesty while offering modern matchmaking features.

### Mission

To facilitate halal marriages by connecting Muslims worldwide in a safe, Islamic-compliant environment that respects traditional values while leveraging modern technology.

### Target Audience

- Muslim singles seeking marriage
- Widows looking for companionship
- Divorced individuals seeking a second chance
- Parents/Walis helping their children find suitable matches

---

## ✨ Key Features

### 🎯 Core Matchmaking Features

- **Advanced Profile System**
  - Comprehensive Islamic profiles (religious practices, prayer frequency, hijab preferences)
  - Photo uploads with privacy controls (blurred for free users)
  - Bio and personality descriptions
  - Education, occupation, and lifestyle information
  - Family background and expectations

- **Intelligent Matching Algorithm**
  - AI-powered compatibility scoring (100-point system) based on:
    - Religious compatibility (30 points)
    - Location and willingness to relocate (15 points)
    - Age preferences (15 points)
    - Education level (10 points)
    - Marital status compatibility (10 points)
    - Compatibility quiz results (20 points)
  - Custom filter options (age, location, marital status, religious level)
  - "Discover" page with swipe functionality (like/pass)
  - Daily top 5 curated matches

- **Real-Time Communication**
  - Instant messaging with Socket.io
  - Real-time notifications via Pusher
  - Read receipts and typing indicators
  - Chat history and conversation management
  - Photo sharing in conversations

### 🕌 Islamic-Compliant Features

- **Wali (Guardian) System**
  - Optional Wali profile for female users
  - Wali contact information for marriage inquiries
  - Wali supervision and involvement options
  - Direct Wali communication channels

- **Privacy & Modesty Controls**
  - Photo privacy settings (blurred until matched for free users)
  - Profile visibility controls
  - Gender-based content filtering
  - Halal interaction guidelines

- **Islamic Profile Fields**
  - Prayer frequency tracking (5 times daily, regularly, sometimes, rarely)
  - Religious practice level (Practicing, Moderate, Learning)
  - Hijab preferences (for females: always, sometimes, no)
  - Marital status (never married, widow, divorced, separated)
  - Islamic education background

### 💳 Subscription & Monetization

- **Flexible Pricing Tiers**
  - **Free Plan**: 10 profile views/month, basic features, blurred photos
  - **Basic Plan** (USD $9.99/month): 50 profile views, super likes, read receipts
  - **Premium Plan** (SGD $19.99/month):
    - Unlimited profile views
    - Unblurred high-resolution photos
    - Advanced search filters
    - Priority customer support
    - Read receipts
    - Profile boosting (1/month)
    - "Who viewed your profile" feature
    - Profile analytics
  - **VIP Plan** (USD $49/month): All Premium features + priority support

- **Stripe Integration**
  - Secure payment processing
  - Subscription management (upgrade, downgrade, cancel)
  - Stripe Customer Portal for self-service billing
  - Webhook integration for real-time subscription updates
  - Multiple payment methods support
  - Invoice generation and history

- **À La Carte Purchases**
  - Profile Boosts ($4.99) - 30-minute visibility increase
  - Super Likes Pack ($9.99) - 10 super likes
  - Read Receipts ($2.99/month)
  - Verification Badge ($19.99)
  - Background Check Integration ($29.99)

- **Virtual Gifts System**
  - 15+ Islamic-themed virtual gifts
  - Categories: Flowers, Chocolates, Islamic items, Jewelry
  - Gifts include: Prayer beads, Quran, Dates, Lanterns, Roses
  - Prices range from $1.99 to $29.99

### 👥 User Experience

- **Comprehensive Onboarding**
  - Step-by-step profile creation wizard
  - Islamic values questionnaire
  - Profile completion progress tracking (percentage meter)
  - Guided photo upload with moderation

- **Dashboard**
  - Match suggestions based on compatibility
  - Recent profile views
  - New likes and super likes
  - Subscription status and limits
  - Quick statistics (matches, views, messages)

- **Notifications System**
  - Real-time push notifications (Pusher)
  - Email notifications for important events
  - In-app notification center
  - Customizable notification preferences

### 🔍 Advanced Features

- **Compatibility Quiz**
  - 20-question personality assessment
  - Values and lifestyle questionnaire
  - Automatic compatibility scoring
  - Match insights and explanations

- **Profile Boosting**
  - Temporary visibility increase (appear at top of search results)
  - Featured profile placement
  - 30-minute boost duration
  - Premium feature (1 boost/month included)

- **Icebreakers**
  - 30+ pre-written conversation starters
  - Islamic-themed questions
  - Categories: Religious, Family, Interests, Lifestyle, Food
  - Customizable templates
  - Premium exclusive icebreakers
  - Personalized suggestions based on profile

- **Search & Discovery**
  - Advanced filtering (location, age, education, religious level)
  - Saved searches
  - "Discover" mode with swipe interface
  - "Recently Active" sorting
  - Distance-based search

### 🛡️ Safety & Security

- **Account Security**
  - JWT-based authentication (7-day expiration)
  - Password encryption (bcrypt with 12 salt rounds)
  - Two-factor authentication (optional)
  - Email verification
  - Secure password reset flow

- **Content Moderation**
  - Photo verification and moderation
  - Inappropriate content reporting
  - User blocking and reporting
  - Admin moderation dashboard
  - Automated spam detection

- **Privacy Protection**
  - GDPR-compliant data handling
  - Data encryption at rest and in transit
  - Privacy policy and terms of service
  - User data export options
  - Account deletion with complete data removal

### 📱 Responsive Design

- **Mobile-First Approach**
  - Fully responsive Material-UI components
  - Progressive Web App (PWA) capabilities
  - Touch-optimized interactions
  - Mobile-specific UI patterns

### 📊 Admin Dashboard

- **User Management**
  - User account overview
  - Profile verification
  - Subscription management
  - User statistics and analytics

- **Content Moderation**
  - Photo approval queue
  - Reported content review
  - User flagging system
  - Ban and warning system

- **Analytics & Reporting**
  - User growth metrics
  - Revenue tracking
  - Subscription analytics
  - Engagement statistics

### 🎨 SEO & Marketing

- **Search Engine Optimization**
  - Dynamic meta tags with react-helmet-async
  - Open Graph tags for social sharing
  - Twitter Card integration
  - Schema.org structured data (Organization, Product, FAQ, Breadcrumbs)
  - XML sitemap
  - robots.txt configuration
  - Canonical URLs

- **Performance Optimization**
  - Code splitting and lazy loading
  - Image optimization with Cloudinary
  - Compression middleware
  - Redis caching (optional)
  - CDN-ready architecture

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **React Router** | 6.15.0 | Client-side routing |
| **Material-UI** | 5.14.5 | Component library |
| **Emotion** | 11.11.1 | CSS-in-JS styling |
| **Formik** | 2.4.3 | Form management |
| **Yup** | 1.2.0 | Schema validation |
| **Axios** | 1.5.0 | HTTP client |
| **Socket.io Client** | 4.7.2 | Real-time communication |
| **Pusher.js** | 8.4.0 | Push notifications |
| **React Toastify** | 9.1.3 | Toast notifications |
| **Framer Motion** | 10.16.1 | Animations |
| **React Helmet Async** | 2.0.5 | SEO meta tags |
| **Stripe.js** | 2.1.6 | Payment processing |
| **date-fns** | 2.30.0 | Date utilities |
| **React Image Crop** | 10.1.8 | Image cropping |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express** | 4.18.2 | Web framework |
| **MongoDB** | 7.0 | Database |
| **Mongoose** | 7.5.0 | ODM (Object Data Modeling) |
| **JWT** | 9.0.2 | Authentication |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Stripe** | 13.5.0 | Payment processing |
| **Socket.io** | 4.7.2 | WebSocket server |
| **Pusher** | 5.2.0 | Real-time notifications |
| **Nodemailer** | 7.0.9 | Email service |
| **Cloudinary** | 1.40.0 | Image hosting/CDN |
| **Winston** | 3.18.3 | Logging |
| **Helmet** | 7.0.0 | Security headers |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **Express Validator** | 7.0.1 | Input validation |
| **Express Rate Limit** | 6.10.0 | Rate limiting/DDoS protection |
| **Compression** | 1.7.4 | Response compression |
| **Multer** | 1.4.5 | File upload handling |

### DevOps & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **MongoDB 7.0** | Document database |
| **Redis 7** | Caching & session store |
| **Nginx** | Reverse proxy & load balancing |
| **Git** | Version control |
| **GitHub** | Code hosting |
| **Jest** | Testing framework |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Nodemon** | Development server |
| **Concurrently** | Run multiple scripts |

### Third-Party Services

| Service | Purpose |
|---------|---------|
| **Stripe** | Payment processing & subscriptions |
| **Pusher** | Real-time push notifications |
| **Cloudinary** | Image storage, optimization & CDN |
| **MongoDB Atlas** | Cloud database (optional) |
| **Redis Cloud** | Cloud caching (optional) |
| **SendGrid/Gmail** | Email delivery |
| **Sentry** | Error tracking (optional) |

---

## 📋 Prerequisites

Before installing the application, ensure you have the following:

### Required Software

- **Node.js** (v18.0.0 or higher)
  ```bash
  node --version  # Should be >= 18.0.0
  ```

- **npm** (v8.0.0 or higher) or **yarn**
  ```bash
  npm --version
  ```

- **MongoDB** (v6.0 or higher)
  - Local installation OR
  - MongoDB Atlas account (cloud)

- **Git**
  ```bash
  git --version
  ```

### Optional (for Docker deployment)

- **Docker** (v20.0.0+)
- **Docker Compose** (v2.0.0+)

### Required Third-Party Accounts

1. **Stripe Account** (for payments)
   - Sign up at https://stripe.com
   - Get API keys from Dashboard

2. **Pusher Account** (for real-time notifications)
   - Sign up at https://pusher.com
   - Create a new Channels app
   - Get app credentials

3. **Cloudinary Account** (for image hosting)
   - Sign up at https://cloudinary.com
   - Get cloud name and API credentials

4. **Email Service** (optional)
   - Gmail with App Password OR
   - SendGrid account

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nicholsmindset/dating2025.git
cd dating2025
```

### 2. Install Dependencies

#### Option A: Install All at Once (Recommended)
```bash
npm run install-deps
```

#### Option B: Manual Installation
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

#### Backend Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

**⚠️ IMPORTANT:** Edit `.env` and replace placeholder values:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/islamic-dating-app

# Authentication (REQUIRED - generate with: openssl rand -base64 64)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=7d

# Stripe (REQUIRED for subscriptions)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Pusher (REQUIRED for real-time features)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=us2

# Cloudinary (REQUIRED for photos)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend
FRONTEND_URL=http://localhost:3000

# Admin
ADMIN_EMAILS=admin@islamicdating.com
```

#### Frontend Environment Variables

Create `frontend/.env` file:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
# API
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Stripe (must match backend)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Pusher (must match backend)
REACT_APP_PUSHER_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=us2
```

### 4. Generate Secure Keys

```bash
# Generate JWT secret
openssl rand -base64 64
```

---

## 🏃 Running the Application

### Development Mode

#### Option 1: Run Both Simultaneously (Recommended)

```bash
# From root directory
npm run dev
```

This starts:
- Backend API on http://localhost:5000
- Frontend on http://localhost:3000

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Run backend in production
cd ../backend
NODE_ENV=production npm start
```

### Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Seed Database (Optional)

```bash
cd backend
npm run seed
```

---

## 🐳 Docker Deployment

### Quick Start

1. **Configure `.env` file** (see Configuration section)

2. **Build and run:**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Included

- **Backend API** - Port 5000
- **Frontend** - Port 3000
- **MongoDB** - Port 27017
- **Redis** - Port 6379
- **Nginx** - Port 80/443

### Individual Service Management

```bash
# Start specific service
docker-compose up -d backend

# View logs
docker-compose logs -f backend

# Restart
docker-compose restart backend

# Execute commands
docker-compose exec backend npm run seed
```

---

## 📁 Project Structure

```
dating2025/
├── backend/                    # Backend API
│   ├── middleware/            # Express middleware
│   ├── models/               # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/              # Utilities
│   ├── tests/             # Test files
│   ├── server.js         # Entry point
│   └── package.json
│
├── frontend/              # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── contexts/    # Context providers
│   │   ├── pages/      # Page components
│   │   ├── utils/     # Utilities
│   │   └── App.js
│   └── package.json
│
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## 📚 API Documentation

### Authentication

```http
# Register
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePass123",
  "firstName": "Ahmed",
  "lastName": "Ali",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePass123"
}
```

### Matching

```http
# Get smart matches
GET /api/v1/matching/smart-matches
Authorization: Bearer {token}

# Get compatibility score
GET /api/v1/matching/compatibility/:userId
Authorization: Bearer {token}

# Get top picks
GET /api/v1/matching/top-picks
Authorization: Bearer {token}
```

### Subscriptions

```http
# Get plans
GET /api/subscription/plans

# Create payment intent
POST /api/subscription/create-payment-intent
Authorization: Bearer {token}

# Stripe portal
POST /api/subscription/create-portal-session
Authorization: Bearer {token}
```

### Virtual Gifts

```http
# Get gifts
GET /api/v1/virtual-gifts

# Send gift
POST /api/v1/virtual-gifts/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "user123",
  "giftSlug": "prayer-beads"
}
```

---

## 🕌 Islamic Features

### Wali System

Female users can provide guardian (Wali) information:
- Wali name and relationship
- Contact information
- Email for formal inquiries

### Halal Principles

- **Modesty**: Photos blurred for free users
- **Intention**: Marriage-focused platform
- **Privacy**: Profile visibility controls
- **Values**: Religious compatibility prioritized

### Compatibility Factors

- Prayer frequency
- Religious practice level
- Hijab preferences
- Family values
- Marital status
- Islamic education

---

## 🔒 Security

- **JWT Authentication**: 7-day token expiration
- **Password Hashing**: bcrypt (12 salt rounds)
- **Rate Limiting**: 100 requests/15 minutes
- **Input Validation**: express-validator
- **Security Headers**: Helmet.js
- **CORS**: Restricted origins
- **File Upload**: Size/type restrictions

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm test -- --coverage
```

---

## 👥 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m "Add amazing feature"`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/nicholsmindset/dating2025/issues)
- **Email**: support@islamicdating.com

---

## 🗺️ Roadmap

### Phase 1 (Completed) ✅
- [x] User authentication
- [x] Profile management
- [x] Matching algorithm
- [x] Real-time chat
- [x] Stripe subscriptions
- [x] Admin dashboard
- [x] SEO optimization

### Phase 2 (In Progress) 🚧
- [ ] Mobile apps (React Native)
- [ ] Video calls
- [ ] AI compatibility algorithm
- [ ] Multi-language support

### Phase 3 (Planned) 📅
- [ ] Wedding planning resources
- [ ] Community forums
- [ ] Events organization
- [ ] Referral program

---

<div align="center">

**Made with ❤️ for the Muslim Community**

*May Allah bless all seeking righteous companionship*

---

**⭐ Star this repo if you find it helpful!**

[Report Bug](https://github.com/nicholsmindset/dating2025/issues) •
[Request Feature](https://github.com/nicholsmindset/dating2025/issues)

</div>
