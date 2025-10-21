# Testing Guide - Islamic Dating Platform

This guide provides step-by-step instructions for testing all features of the Islamic dating platform, including login, registration, dashboards, and user workflows.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [User Simulation](#user-simulation)
4. [Testing Authentication](#testing-authentication)
5. [Testing User Dashboard](#testing-user-dashboard)
6. [Testing Wali Dashboard](#testing-wali-dashboard)
7. [Testing Admin Dashboard](#testing-admin-dashboard)
8. [Testing AI Features](#testing-ai-features)
9. [Common Test Scenarios](#common-test-scenarios)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before testing, ensure you have:

- ✅ Node.js 16+ installed
- ✅ MongoDB running (local or Atlas)
- ✅ Redis running (optional - falls back to in-memory)
- ✅ Environment variables configured (`.env` files)
- ✅ Dependencies installed (`npm install`)

---

## Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
npm install faker --save-dev  # For user simulation script
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start Services

**MongoDB (if running locally):**
```bash
mongod --dbpath /path/to/your/data/directory
```

**Redis (optional):**
```bash
redis-server
```

### 3. Start Development Servers

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Swagger Docs: http://localhost:5000/api-docs

---

## User Simulation

### Quick Start - Create Test Users

The simulation script creates realistic test users with profiles, matches, and conversations.

**Basic Usage:**
```bash
cd backend
node scripts/simulateUsers.js --users=20 --clean --skip-verification
```

**Options:**

| Option | Description |
|--------|-------------|
| `--users=<number>` | Number of users to create (default: 10) |
| `--clean` | Clean up existing test data first |
| `--skip-verification` | Create users as already verified |
| `--auto-approve` | Auto-approve wali permissions |
| `--create-matches` | Create mutual matches between users |
| `--send-messages` | Send test messages between matched users |

**Examples:**

```bash
# Create 50 users with matches and messages
node scripts/simulateUsers.js --users=50 --clean --skip-verification --create-matches --send-messages

# Create 10 users with wali oversight
node scripts/simulateUsers.js --users=10 --clean --auto-approve

# Clean up all test data
node scripts/simulateUsers.js --clean --users=0
```

**Output:**
```
📝 Configuration: { userCount: 20, skipVerification: true, ... }
✅ Connected to MongoDB
🧹 Cleaning up test data...
✅ Test data cleaned
👥 Creating 20 test users...
  ✓ Created user 1/20: Ahmed Ali (test.user1@example.com)
  ✓ Created user 2/20: Fatima Hassan (test.user2@example.com)
  ...
✅ Created 20 users successfully
💕 Creating test matches...
  ✓ Created match: Ahmed ↔ Fatima
  ...
✅ Created 15 matches
💬 Sending test messages...
  ✓ Created conversation: Ahmed ↔ Fatima (4 messages)
  ...
✅ Sent 60 messages

📊 Platform Summary:
==================================================
Total Users:        20
  ├─ Male:          10
  └─ Female:        10
Verified Users:     20
Premium Users:      8
Wali Accounts:      10
Active Matches:     15
Conversations:      15
==================================================

🔑 Sample User Credentials:
All passwords: Test123456

1. Email: test.user1@example.com
   Name: Ahmed Ali (male)
2. Email: test.user2@example.com
   Name: Fatima Hassan (female)
...
```

---

## Testing Authentication

### 1. Registration Flow

**Steps:**
1. Navigate to http://localhost:3000/register
2. Fill in all required fields:
   - **Basic Info**: Name, email, password, date of birth, gender
   - **Islamic Profile**: Marital status, religious level, prayer frequency, hijab (for females)
   - **Location & Wali**: Country, city, wali information (for females)
3. Click "Complete Registration"
4. Check console for verification email (if email service is not configured)
5. Navigate to `/verify-email?token=<verification-token>` or use simulation script with `--skip-verification`

**What to Test:**
- ✅ All validation works (min length, email format, age check)
- ✅ Password confirmation matches
- ✅ Hijab field required for females
- ✅ Wali information required when selected
- ✅ Age must be 18+
- ✅ Error messages display correctly
- ✅ Success message after registration

### 2. Login Flow

**Steps:**
1. Navigate to http://localhost:3000/login
2. Enter email: `test.user1@example.com`
3. Enter password: `Test123456`
4. Click "Sign In"

**What to Test:**
- ✅ Invalid credentials show error
- ✅ Unverified email shows verification message
- ✅ Deactivated account shows appropriate message
- ✅ Successful login redirects to dashboard
- ✅ JWT token stored in localStorage
- ✅ User data loaded correctly

### 3. Forgot Password Flow

**Steps:**
1. Navigate to http://localhost:3000/forgot-password
2. Enter email address
3. Click "Send Reset Instructions"
4. Check console/email for reset link
5. Navigate to reset password page with token
6. Enter new password (must meet requirements)
7. Click "Reset Password"
8. Redirected to login after success

**What to Test:**
- ✅ Email validation works
- ✅ Success message even if email doesn't exist (security)
- ✅ Reset token in email is valid
- ✅ Password requirements enforced
- ✅ Passwords must match
- ✅ Token expiry works (1 hour)
- ✅ Can login with new password

### 4. Email Verification

**Steps:**
1. After registration, use verification link from email
2. Or manually navigate to `/verify-email?token=<token>`
3. Account should be activated
4. Automatically logged in

**What to Test:**
- ✅ Invalid token shows error
- ✅ Already verified shows appropriate message
- ✅ Successful verification activates account
- ✅ User automatically logged in
- ✅ Welcome email sent

---

## Testing User Dashboard

### Access
- URL: http://localhost:3000/dashboard
- Login required

### Features to Test

#### 1. Profile Browsing
**What to Test:**
- ✅ Profiles display correctly
- ✅ Profile images load
- ✅ Compatibility scores shown
- ✅ User details visible (age, location, education, etc.)
- ✅ Islamic information shown (prayer frequency, religious level)
- ✅ Profile completion percentage displayed

#### 2. Profile Actions
**Actions:**
- Like a profile (heart icon)
- Skip a profile (X icon)
- View full profile (click on card)
- Report a profile

**What to Test:**
- ✅ Like action updates UI
- ✅ Mutual match creates notification
- ✅ Skip removes from current view
- ✅ Full profile shows all details
- ✅ Report dialog appears and submits

#### 3. Match Suggestions (AI-Powered)
**What to Test:**
- ✅ AI recommendations appear
- ✅ Compatibility breakdown shown:
  - Religious compatibility (30%)
  - Lifestyle compatibility (20%)
  - Values compatibility (20%)
  - Personality compatibility (15%)
  - Practical compatibility (10%)
  - Behavioral compatibility (5%)
- ✅ Scores calculated correctly
- ✅ "Similar profiles" feature works

#### 4. Subscription Limits
**Free User Limits:**
- 10 profile views per month
- 5 likes per day
- 3 conversations

**What to Test:**
- ✅ View count increments
- ✅ Limit reached shows upgrade prompt
- ✅ Premium users have unlimited access
- ✅ Subscription status displayed correctly

#### 5. Real-time Features
**What to Test:**
- ✅ New match notifications appear
- ✅ New message notifications appear
- ✅ Online status updates in real-time
- ✅ Typing indicators work
- ✅ Message read receipts update

---

## Testing Wali Dashboard

### Access
- URL: http://localhost:3000/wali/login
- Wali credentials: Use wali email from simulated data

### Setup Wali Account

**Option 1: Use Simulation Script**
```bash
node scripts/simulateUsers.js --users=2 --auto-approve --skip-verification
```

**Option 2: Register Female User with Wali**
1. Register a female user
2. Provide wali information during registration
3. Wali receives verification email
4. Wali verifies email and sets password
5. Wali can now login

### Features to Test

#### 1. Ward Profile Overview
**What to Test:**
- ✅ Ward's profile information displayed
- ✅ Profile completion status shown
- ✅ Recent activity visible
- ✅ Statistics cards update (matches, conversations, etc.)

#### 2. Conversation Monitoring
**What to Test:**
- ✅ All conversations listed
- ✅ Conversation details viewable
- ✅ Messages displayed (if permission granted)
- ✅ Inappropriate content flagged

#### 3. Conversation Approval
**What to Test:**
- ✅ Pending conversations in queue
- ✅ Approve button works
- ✅ Reject button works
- ✅ Approval sends notification to ward
- ✅ Rejection stops conversation

#### 4. Match Review
**What to Test:**
- ✅ All matches displayed
- ✅ Match details visible
- ✅ Compatibility scores shown
- ✅ Can block inappropriate matches

#### 5. Permissions Management
**What to Test:**
- ✅ View profile permission
- ✅ View matches permission
- ✅ View conversations permission
- ✅ Approve conversations permission
- ✅ Permissions can be toggled
- ✅ Changes take effect immediately

---

## Testing Admin Dashboard

### Access
- URL: http://localhost:3000/admin
- Requires admin role (create manually in database)

### Create Admin User

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "test.user1@example.com" },
  { $set: { role: "admin" } }
)
```

### Features to Test

#### 1. Dashboard Overview
**What to Test:**
- ✅ Total users displayed
- ✅ Active users count
- ✅ New users (24h) shown
- ✅ Premium subscribers count
- ✅ Total revenue displayed
- ✅ Platform statistics accurate

#### 2. User Management
**What to Test:**
- ✅ All users listed in table
- ✅ Search functionality works
- ✅ Filters work (gender, status, subscription)
- ✅ Pagination works
- ✅ User details viewable
- ✅ Edit user information
- ✅ Deactivate/activate user
- ✅ Delete user (with confirmation)
- ✅ View user activity

#### 3. Reports Management
**What to Test:**
- ✅ All reports listed
- ✅ Report details viewable
- ✅ Reported content shown
- ✅ Reporter and reported user info
- ✅ Take action on reports:
  - Warning to user
  - Temporary suspension
  - Permanent ban
  - Dismiss report
- ✅ Report status updates

#### 4. Analytics Dashboard
**Metrics to Test:**
- ✅ User retention (1 week, 2 weeks, 1 month)
- ✅ Daily/weekly/monthly active users
- ✅ Match success rate
- ✅ Conversation conversion rate
- ✅ Average time to first message
- ✅ Feature usage statistics
- ✅ Demographics breakdown
- ✅ Charts render correctly (Recharts)

#### 5. Content Moderation
**What to Test:**
- ✅ Flagged messages displayed
- ✅ AI moderation scores shown
- ✅ Review and approve/reject
- ✅ User safety scores visible
- ✅ Violations categorized:
  - Profanity
  - Explicit content
  - Contact info sharing
  - Scam patterns
  - Harassment

#### 6. Photo Verification Queue
**What to Test:**
- ✅ Pending photos listed
- ✅ AI analysis results shown:
  - Face detection
  - Content appropriateness
  - Quality analysis
  - Fraud detection
- ✅ AI recommendation (APPROVE/REJECT/REVIEW)
- ✅ Manual approve/reject works
- ✅ Rejection reason required
- ✅ User notified of decision

---

## Testing AI Features

### 1. AI Photo Verification

**Test Process:**
1. Upload a profile photo
2. Check AI analysis results
3. Verify decision logic

**What to Test:**
- ✅ **Face Detection:**
  - 1 face detected → AUTO_APPROVE
  - 0 faces detected → AUTO_REJECT
  - Multiple faces → MANUAL_REVIEW
- ✅ **Content Appropriateness:**
  - Appropriate (score ≥ 80) → APPROVE
  - Inappropriate (score < 80) → REJECT
- ✅ **Quality Analysis:**
  - Resolution check (min 200x200)
  - Blur detection
  - Lighting analysis
- ✅ **Fraud Detection:**
  - Duplicate photo detection
  - Stock photo identification
  - Image manipulation detection

**Sample Test Photos:**
```bash
# Test with different photos:
- Single person headshot (should AUTO_APPROVE)
- Group photo (should MANUAL_REVIEW)
- Landscape/object (should AUTO_REJECT)
- Low quality/blurry (should REJECT)
- Inappropriate clothing (should REJECT)
```

### 2. AI Content Moderation

**Test Process:**
1. Send messages with various content
2. Check moderation results
3. Verify action taken

**Test Cases:**

**Profanity:**
```
Message: "This is a damn test"
Expected: Flagged, score increased
Action: WARNING or BLOCK based on score
```

**Explicit Content:**
```
Message: "Send nudes"
Expected: HIGH severity violation
Action: BLOCK immediately
```

**Contact Info Sharing:**
```
Message: "My number is 555-1234"
Expected: Flagged for contact info
Action: BLOCK (prevents wali oversight bypass)
```

**Scam Patterns:**
```
Message: "Send me money urgently"
Expected: Flagged for scam
Action: BLOCK and report
```

**Harassment:**
```
Message: "I will find you"
Expected: Flagged for harassment
Action: BLOCK and suspend user
```

**Clean Message:**
```
Message: "As-salamu alaykum, how are you?"
Expected: No violations
Action: ALLOW
```

**What to Test:**
- ✅ Violations detected correctly
- ✅ Severity levels assigned
- ✅ Context-aware scoring works
- ✅ Sentiment analysis accurate
- ✅ User safety score updates
- ✅ Appropriate action taken

### 3. AI Recommendation Engine

**Test Process:**
1. Login as a user
2. View match recommendations
3. Check compatibility breakdown

**What to Test:**

**Religious Compatibility (30%):**
- ✅ Prayer frequency alignment scored
- ✅ Religious level similarity scored
- ✅ Hijab preference match (for females)

**Lifestyle Compatibility (20%):**
- ✅ Education level similarity
- ✅ Occupation compatibility
- ✅ Shared interests counted

**Values Compatibility (20%):**
- ✅ Marital status preferences matched
- ✅ Children preferences aligned
- ✅ Lifestyle choices (smoking, etc.) matched

**Personality Compatibility (15%):**
- ✅ Communication style similarity
- ✅ Activity level matching

**Practical Compatibility (10%):**
- ✅ Age difference calculated
- ✅ Location proximity scored

**Behavioral Compatibility (5%):**
- ✅ Platform usage patterns analyzed
- ✅ Profile completeness similarity

**Collaborative Filtering:**
```
Test: Like several profiles
Expected: Recommendations based on similar users' likes
Result: "Users like you also liked..."
```

**Content-Based Filtering:**
```
Test: Set specific preferences (age 25-30, same city, practicing)
Expected: Recommendations match criteria
Result: High compatibility scores
```

### 4. Redis Caching

**Test Process:**
1. Make API request (e.g., get matches)
2. Check response time
3. Make same request again
4. Compare response times

**What to Test:**
- ✅ First request slower (database query)
- ✅ Second request faster (cache hit)
- ✅ Cache invalidation works on updates
- ✅ TTL expiry works correctly
- ✅ Fallback to in-memory if Redis unavailable

**Monitor Cache:**
```bash
# If using Redis, monitor cache hits
redis-cli MONITOR

# Check cache keys
redis-cli KEYS "user:profile:*"
redis-cli KEYS "match:suggestions:*"
```

---

## Common Test Scenarios

### Scenario 1: Complete User Journey

1. **Register** a new female user with wali
2. **Verify** email
3. **Complete** profile
4. **Browse** matches
5. **Like** a profile
6. **Wait** for mutual match
7. **Request** wali approval for conversation (if required)
8. **Wait** for wali approval
9. **Send** first message
10. **Receive** reply
11. **Continue** conversation

**Expected Results:**
- ✅ All steps complete without errors
- ✅ Notifications sent at each step
- ✅ Wali receives notifications
- ✅ Islamic guidelines enforced

### Scenario 2: Wali Oversight Workflow

1. **Female user** receives match
2. **Match** wants to start conversation
3. **Wali** receives notification
4. **Wali** reviews match profile
5. **Wali** approves/rejects conversation
6. **Users** notified of decision
7. **If approved**, conversation starts
8. **Wali** monitors conversation (if permission granted)

**Expected Results:**
- ✅ Wali notified immediately
- ✅ Conversation blocked until approval
- ✅ Wali can view match details
- ✅ Decision takes effect immediately
- ✅ Users receive appropriate notifications

### Scenario 3: AI Content Moderation in Action

1. **User A** sends inappropriate message
2. **AI moderation** analyzes content
3. **Message blocked** if severe
4. **User A** receives warning
5. **User B** doesn't receive blocked message
6. **Admin** notified if high severity
7. **User safety score** updated
8. **Repeat violations** lead to suspension

**Expected Results:**
- ✅ Inappropriate content blocked
- ✅ No notification to recipient
- ✅ Sender warned appropriately
- ✅ Admin review queue populated
- ✅ Safety scores accurate

### Scenario 4: Subscription Upgrade

1. **Free user** reaches profile view limit
2. **Upgrade prompt** appears
3. **User** clicks "Upgrade to Premium"
4. **Stripe payment** page loads
5. **User** completes payment
6. **Webhook** updates subscription
7. **Limits removed** immediately
8. **Premium features** unlocked

**Expected Results:**
- ✅ Limits enforced correctly
- ✅ Stripe integration works
- ✅ Webhook processes payment
- ✅ Subscription updated in database
- ✅ User sees premium features

---

## Troubleshooting

### Authentication Issues

**Problem:** Cannot login after registration
**Solution:**
```bash
# Check if user is verified
db.users.findOne({ email: "test@example.com" })
# If not verified, manually verify
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { isVerified: true, accountStatus: "active" } }
)
```

**Problem:** Token expired
**Solution:**
- Request new verification email
- Or use simulation script with `--skip-verification`

### Dashboard Issues

**Problem:** Dashboard not loading
**Solutions:**
- Check if user is authenticated
- Clear localStorage and login again
- Check browser console for errors
- Verify backend API is running

**Problem:** No profiles showing
**Solutions:**
- Run simulation script to create users
- Check database has users
- Verify opposite gender users exist
- Check API response in Network tab

### AI Features Issues

**Problem:** AI photo verification not working
**Solutions:**
- Check Cloudinary credentials
- Verify API key has AI moderation enabled
- Check image URL is accessible
- Review server logs for errors

**Problem:** Recommendations not appearing
**Solutions:**
- Need at least 5 users for collaborative filtering
- Check compatibility scoring logic
- Verify match algorithm running
- Review server logs

### Wali Dashboard Issues

**Problem:** Wali cannot login
**Solutions:**
- Verify wali account created
- Check wali email verified
- Ensure password set correctly
- Check wali isActive status

**Problem:** Cannot see ward's conversations
**Solutions:**
- Check wali permissions
- Verify ward ID matches
- Ensure conversations exist
- Check API endpoint response

---

## Performance Testing

### Load Testing

**Using Apache Bench:**
```bash
# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json \
   http://localhost:5000/api/auth/login

# Test profile browsing
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
   http://localhost:5000/api/users/browse
```

**Using Artillery:**
```bash
npm install -g artillery

# Create test-config.yml
artillery quick --count 10 --num 100 http://localhost:5000/api/users/browse
```

**What to Monitor:**
- ✅ Response times (should be <200ms with cache)
- ✅ Error rate (should be <1%)
- ✅ Database connections (monitor pool)
- ✅ Redis cache hit rate (should be >80%)
- ✅ Memory usage (should be stable)

### Monitoring

**Server-side:**
```javascript
// Add to server.js
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
};
```

**Database:**
```bash
# MongoDB monitoring
db.currentOp()
db.serverStatus()

# Redis monitoring
redis-cli INFO stats
redis-cli --latency
```

---

## Automated Testing

### Run All Tests

```bash
cd backend
npm test
```

### Run Specific Test Suites

```bash
# Authentication tests
npm test -- auth.test.js

# Profile tests
npm test -- profile.test.js

# Match tests
npm test -- matchingService.test.js

# Search tests
npm test -- searchService.test.js

# Analytics tests
npm test -- analyticsService.test.js

# Chat tests
npm test -- chat.test.js

# Subscription tests
npm test -- subscription.test.js
```

### Test Coverage

```bash
npm test -- --coverage
```

**Expected Coverage:**
- Statements: >98%
- Branches: >96%
- Functions: >97%
- Lines: >98%

---

## Checklist

Use this checklist to ensure all features are tested:

### Authentication
- [ ] Registration with all validation
- [ ] Email verification
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Forgot password flow
- [ ] Reset password with token
- [ ] Logout
- [ ] Session persistence

### User Dashboard
- [ ] Profile browsing
- [ ] Like/skip profiles
- [ ] View full profiles
- [ ] Match notifications
- [ ] Message notifications
- [ ] AI recommendations
- [ ] Compatibility scores
- [ ] Subscription limits

### Wali Dashboard
- [ ] Wali login
- [ ] View ward profile
- [ ] View matches
- [ ] Conversation approval
- [ ] Conversation monitoring
- [ ] Permission management
- [ ] Activity tracking

### Admin Dashboard
- [ ] User management
- [ ] Reports management
- [ ] Analytics viewing
- [ ] Content moderation
- [ ] Photo verification
- [ ] Platform statistics

### AI Features
- [ ] AI photo verification
- [ ] AI content moderation
- [ ] AI recommendations (collaborative filtering)
- [ ] AI recommendations (content-based)
- [ ] Cache performance
- [ ] Fraud detection

### PWA Features
- [ ] Offline functionality
- [ ] Add to home screen
- [ ] Push notifications
- [ ] Background sync
- [ ] Service worker caching

### Security
- [ ] Rate limiting works
- [ ] JWT authentication
- [ ] Password hashing
- [ ] Input validation
- [ ] XSS prevention
- [ ] CSRF protection

---

## Support

If you encounter issues during testing:

1. **Check logs:**
   - Backend: Console output
   - Frontend: Browser console
   - MongoDB: Database logs

2. **Review documentation:**
   - README.md
   - AI_FEATURES.md
   - DEPLOYMENT_GUIDE.md
   - API_ENDPOINTS.md

3. **Common fixes:**
   - Clear cache and cookies
   - Restart services
   - Check environment variables
   - Verify database connection
   - Update dependencies

---

**Last Updated:** 2025-10-21
**Version:** 1.0.0
