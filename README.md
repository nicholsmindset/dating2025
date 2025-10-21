# Islamic Dating Platform 2025

A modern, full-featured Islamic dating and matchmaking platform built with React and Node.js.

## 🌟 Features

### Core Features
- ✅ User authentication with JWT
- ✅ Comprehensive Islamic profile system (prayer frequency, hijab, wali information)
- ✅ Smart matching algorithm with compatibility scores
- ✅ Real-time chat with Socket.io and Pusher
- ✅ Profile browsing with advanced filters
- ✅ Like/match system
- ✅ Block and report functionality

### Premium Revenue Features (NEW! 🚀)
#### Tiered Subscriptions
- **Free**: 10 profile views/month
- **Basic** ($9.99/month): 50 views, super likes, read receipts
- **Premium** ($23/month): Unlimited views, profile boosts, verification badge
- **VIP** ($49/month): All features + priority support

#### À La Carte Purchases
- Profile Boosts ($4.99) - 30 min spotlight
- Super Likes Pack ($9.99) - 10 super likes
- Read Receipts ($2.99/month)
- Verification Badge ($19.99)
- Background Check Integration ($29.99)

#### Virtual Gifts System
- 15+ Islamic-themed virtual gifts
- Categories: Flowers, Chocolates, Islamic items, Jewelry
- Gifts include: Prayer beads, Quran, Dates, Lanterns, Roses
- Prices range from $1.99 to $29.99

### Enhanced Matching & Discovery
- **Smart Matching Algorithm**: 100-point compatibility scoring based on:
  - Religious compatibility (30 points)
  - Location (15 points)
  - Age preferences (15 points)
  - Education (10 points)
  - Marital status (10 points)
  - Compatibility quiz results (20 points)

- **Today's Top Picks**: 5 daily curated matches
- **Islamic Compatibility Quiz**: 20-question assessment
- **Advanced Filters**: Premium users get enhanced filtering

### Profile Features
- **Profile Completion Meter**: Shows completion percentage
- **Verification Badges**: ID, photo, and phone verification
- **Who Liked Me** (Premium): See who liked your profile
- **Profile Analytics** (Premium): Views, likes, response rates
- **Profile Boost**: Appear at top of search results

### Engagement Features
- **30 Icebreaker Questions**: Islamic-themed conversation starters
- **Categories**: Religious, Family, Interests, Lifestyle, Food
- **Personalized Suggestions**: Based on user's profile

## 🏗️ Technical Architecture

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with 7-day expiration
- **Payments**: Stripe integration
- **Real-time**: Pusher + Socket.io
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting, bcrypt

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Context API
- **Forms**: Formik + Yup validation
- **HTTP Client**: Axios
- **Real-time**: Pusher-js, Socket.io-client
- **Routing**: React Router v6

### DevOps
- **Containerization**: Docker & Docker Compose
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest
- **Version Control**: Git
- **API Versioning**: v1 routes

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB 7.0+
- Stripe Account
- Cloudinary Account
- Pusher Account

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd dating2025
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Variables**

Backend `.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/islamic-dating
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password
ADMIN_EMAILS=admin@example.com
```

Frontend `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_PUSHER_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=your_cluster
```

4. **Seed the database**
```bash
cd backend
npm run seed
```

5. **Run the application**

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm start
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 API Documentation

### V1 API Endpoints

#### Subscription Plans
- `GET /api/v1/subscription-plans` - Get all plans
- `GET /api/v1/subscription-plans/:planName` - Get specific plan
- `GET /api/v1/subscription-plans/compare/all` - Compare all plans

#### Purchases
- `POST /api/v1/purchases/create-payment-intent` - Create payment
- `POST /api/v1/purchases/:purchaseId/confirm` - Confirm purchase
- `GET /api/v1/purchases` - Get purchase history
- `GET /api/v1/purchases/pricing` - Get pricing info

#### Virtual Gifts
- `GET /api/v1/virtual-gifts` - Get available gifts
- `POST /api/v1/virtual-gifts/send` - Send gift
- `POST /api/v1/virtual-gifts/confirm/:purchaseId` - Confirm gift
- `GET /api/v1/virtual-gifts/received` - Get received gifts
- `GET /api/v1/virtual-gifts/sent` - Get sent gifts

#### Matching
- `GET /api/v1/matching/smart-matches` - Get smart matches
- `GET /api/v1/matching/compatibility/:userId` - Get compatibility score
- `GET /api/v1/matching/top-picks` - Get today's top picks
- `POST /api/v1/matching/refresh-picks` - Refresh top picks

#### Compatibility Quiz
- `GET /api/v1/compatibility/quiz/questions` - Get quiz questions
- `POST /api/v1/compatibility/quiz/submit` - Submit quiz
- `GET /api/v1/compatibility/quiz/my-results` - Get results
- `PUT /api/v1/compatibility/quiz/retake` - Retake quiz

#### Profile
- `GET /api/v1/profile/completion` - Get completion status
- `GET /api/v1/profile/who-liked-me` - See who liked you
- `GET /api/v1/profile/new-likes` - Get unseen likes count
- `POST /api/v1/profile/verification/request` - Request verification
- `GET /api/v1/profile/analytics` - Get profile analytics

#### Icebreakers
- `GET /api/v1/icebreakers` - Get random icebreakers
- `GET /api/v1/icebreakers/categories` - Get categories
- `GET /api/v1/icebreakers/for-user/:userId` - Get personalized icebreakers

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🔧 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 📊 Database Models

### User Model (Enhanced)
- Basic info (email, name, DOB, gender)
- Islamic fields (prayer, hijab, religious level)
- Wali information
- Subscription details (plan, billing cycle, features usage)
- Verification status
- Profile completion tracking
- Top picks history
- Who liked me tracking

### New Models
- **SubscriptionPlan**: Tiered plan definitions
- **Purchase**: À la carte purchases tracking
- **VirtualGift**: Gift catalog
- **ProfileBoost**: Boost scheduling and analytics
- **CompatibilityQuiz**: Quiz responses and scores

## 🚀 Deployment Checklist

- [ ] Set up production MongoDB (MongoDB Atlas recommended)
- [ ] Configure production environment variables
- [ ] Set up Stripe webhook endpoints
- [ ] Configure Cloudinary for production
- [ ] Set up production Pusher app
- [ ] Configure email service (SendGrid/AWS SES)
- [ ] Set up SSL certificates
- [ ] Configure domain DNS
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics (Google Analytics)
- [ ] Set up CI/CD pipeline
- [ ] Run security audit
- [ ] Load testing
- [ ] Backup strategy

## 💰 Revenue Optimization Tips

1. **A/B Test Pricing**: Test different price points
2. **Annual Discounts**: Offer 20% off annual plans
3. **Limited Time Offers**: Create urgency
4. **Gift During Peak Times**: Ramadan, Eid special gifts
5. **Referral Program**: Coming soon!
6. **Corporate Packages**: For matchmakers
7. **Success Story Incentives**: Free months for marriages

## 🔐 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT authentication
- Rate limiting (IP-based and user-based)
- Helmet security headers
- CORS configuration
- Input validation
- XSS protection
- CSRF protection (implement)
- Blocked user enforcement

## 📈 Analytics & Metrics

Track these KPIs:
- Monthly Recurring Revenue (MRR)
- Churn Rate
- Lifetime Value (LTV)
- Conversion Rate (Free → Paid)
- Daily/Monthly Active Users (DAU/MAU)
- Match Rate
- Message Response Rate
- Profile Completion Rate

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

Proprietary - All rights reserved

## 📞 Support

For support, email support@example.com

---

**Built with ❤️ for the Muslim community**
