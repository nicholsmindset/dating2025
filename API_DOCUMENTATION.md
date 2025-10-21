# Islamic Dating App - API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Versioning](#api-versioning)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)

---

## Overview

Base URL: `http://localhost:5000/api`

All API requests must include appropriate headers:
```
Content-Type: application/json
Authorization: Bearer <token>  (for authenticated routes)
```

---

## Authentication

### Register New User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "gender": "male",
  "dateOfBirth": "1990-01-15",
  "maritalStatus": "never_married"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4f5a",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": { ... }
}
```

### Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

### Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

---

## API Versioning

### V1 Routes (New Features)
All v1 routes are prefixed with `/v1/`:
- `/api/v1/subscription-plans`
- `/api/v1/purchases`
- `/api/v1/virtual-gifts`
- `/api/v1/matching`
- `/api/v1/compatibility`
- `/api/v1/profile`
- `/api/v1/icebreakers`

### Legacy Routes (Backward Compatible)
- `/api/auth`
- `/api/users`
- `/api/profiles`
- `/api/chat`
- `/api/subscription`
- `/api/admin`

---

## Rate Limiting

**Global Limit:** 100 requests per 15 minutes per IP

**Specific Limits:**
- Profile Operations: 50 requests per 15 minutes
- Chat Messages: 10 messages per minute
- Subscription Operations: 20 requests per 15 minutes

**Response when limit exceeded (429):**
```json
{
  "message": "Too many requests, please try again later"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Optional validation errors
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Endpoints

## Subscription Plans

### Get All Plans
**GET** `/v1/subscription-plans`

**Response (200):**
```json
{
  "success": true,
  "plans": [
    {
      "name": "free",
      "displayName": "Free",
      "price": { "monthly": { "amount": 0, "currency": "SGD" } },
      "features": {
        "profileViewsPerMonth": 10,
        "canSeeWhoLikedYou": false,
        ...
      }
    },
    {
      "name": "premium",
      "displayName": "Premium",
      "price": { "monthly": { "amount": 2300, "currency": "SGD" } },
      "features": { ... }
    }
  ]
}
```

### Get Specific Plan
**GET** `/v1/subscription-plans/:planName`

---

## Virtual Gifts

### Get All Gifts
**GET** `/v1/virtual-gifts`
*Requires Authentication*

**Query Parameters:**
- `category` (optional): Filter by category (flowers, islamic, chocolates, etc.)

**Response (200):**
```json
{
  "success": true,
  "gifts": [
    {
      "_id": "...",
      "name": "rose",
      "displayName": "Single Rose",
      "category": "flowers",
      "price": { "amount": 199, "currency": "SGD" },
      "icon": "🌹"
    }
  ]
}
```

### Send Gift
**POST** `/v1/virtual-gifts/send`
*Requires Authentication & Premium*

**Request Body:**
```json
{
  "giftId": "60d5ec49f1b2c72b8c8e4f5a",
  "recipientId": "60d5ec49f1b2c72b8c8e4f5b",
  "message": "Thinking of you!"
}
```

**Response (200):**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_yyy",
  "purchaseId": "60d5ec49f1b2c72b8c8e4f5c"
}
```

### Confirm Gift Purchase
**POST** `/v1/virtual-gifts/confirm/:purchaseId`
*Requires Authentication*

### Get Received Gifts
**GET** `/v1/virtual-gifts/received`
*Requires Authentication*

### Get Sent Gifts
**GET** `/v1/virtual-gifts/sent`
*Requires Authentication*

---

## Matching & Compatibility

### Get Smart Matches
**GET** `/v1/matching/smart-matches`
*Requires Authentication*

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `minAge`, `maxAge`
- `location`
- `religiousLevel`

**Response (200):**
```json
{
  "success": true,
  "matches": [
    {
      "user": { ... },
      "compatibilityScore": 85,
      "scoreBreakdown": {
        "religious": 28,
        "location": 15,
        "age": 14,
        ...
      }
    }
  ],
  "pagination": { ... }
}
```

### Get Compatibility Score
**GET** `/v1/matching/compatibility/:userId`
*Requires Authentication*

**Response (200):**
```json
{
  "success": true,
  "score": 85,
  "breakdown": { ... }
}
```

### Get Today's Top Picks
**GET** `/v1/matching/top-picks`
*Requires Authentication*

**Query Parameters:**
- `limit` (default: 5, max: 10)

---

## Compatibility Quiz

### Get Quiz Questions
**GET** `/v1/compatibility/quiz/questions`
*Requires Authentication*

**Response (200):**
```json
{
  "success": true,
  "questions": [
    {
      "_id": "q1",
      "question": "How important is daily prayer in your life?",
      "category": "religious_practice",
      "options": [
        {
          "value": "very_important",
          "label": "Very important - I pray 5 times daily",
          "points": 10
        }
      ],
      "weight": 2
    }
  ]
}
```

### Submit Quiz
**POST** `/v1/compatibility/quiz/submit`
*Requires Authentication*

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q1",
      "answer": "very_important"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Quiz completed successfully!",
  "quiz": {
    "scores": {
      "religious_practice": 28,
      "family_values": 25,
      ...
    },
    "overallScore": 85
  }
}
```

---

## Profile Management

### Get Profile Completion
**GET** `/v1/profile/completion`
*Requires Authentication*

**Response (200):**
```json
{
  "success": true,
  "percentage": 75,
  "missingFields": ["occupation", "bio"],
  "suggestions": [ ... ]
}
```

### Who Liked Me (Premium)
**GET** `/v1/profile/who-liked-me`
*Requires Premium*

**Response (200):**
```json
{
  "success": true,
  "likes": [
    {
      "user": { ... },
      "likedAt": "2025-10-20T10:30:00.000Z",
      "isSeen": false
    }
  ]
}
```

### Request Verification
**POST** `/v1/profile/verification/request`
*Requires Authentication*

### Get Profile Analytics (Premium)
**GET** `/v1/profile/analytics`
*Requires Premium*

---

## À la Carte Purchases

### Get Pricing
**GET** `/v1/purchases/pricing`

**Response (200):**
```json
{
  "success": true,
  "pricing": {
    "profile_boost": { "amount": 499, "currency": "SGD", "duration": 30 },
    "super_likes_pack": { "amount": 999, "currency": "SGD", "quantity": 5 },
    ...
  }
}
```

### Create Purchase
**POST** `/v1/purchases/create-payment-intent`
*Requires Authentication*

**Request Body:**
```json
{
  "itemType": "profile_boost"
}
```

### Confirm Purchase
**POST** `/v1/purchases/:purchaseId/confirm`
*Requires Authentication*

### Get Purchase History
**GET** `/v1/purchases/history`
*Requires Authentication*

---

## Icebreakers

### Get Random Icebreakers
**GET** `/v1/icebreakers`
*Requires Authentication*

**Query Parameters:**
- `count` (default: 5)
- `category` (optional): religious, hobbies, values, lifestyle, family

**Response (200):**
```json
{
  "success": true,
  "icebreakers": [
    {
      "id": 1,
      "category": "religious",
      "question": "What's your favorite Surah from the Quran and why?",
      "icon": "📖"
    }
  ]
}
```

### Get Personalized Icebreakers
**GET** `/v1/icebreakers/for-user/:userId`
*Requires Authentication*

---

## Chat System

### Get All Chats
**GET** `/chat`
*Requires Authentication*

### Get Specific Chat
**GET** `/chat/:chatId`
*Requires Authentication*

### Send Message
**POST** `/chat/:chatId/messages`
*Requires Authentication*

**Request Body:**
```json
{
  "content": "Hello!",
  "type": "text"
}
```

**Rate Limit:** 10 messages per minute

### Get Messages
**GET** `/chat/:chatId/messages`
*Requires Authentication*

**Query Parameters:**
- `limit` (default: 50)
- `before` (message ID for pagination)

### Mark Messages as Read
**PUT** `/chat/:chatId/read`
*Requires Authentication*

### Send Typing Indicator
**POST** `/chat/:chatId/typing`
*Requires Authentication*

**Request Body:**
```json
{
  "isTyping": true
}
```

---

## User Profiles

### Browse Profiles
**GET** `/profiles`
*Requires Authentication*

**Query Parameters:**
- `page`, `limit`
- `minAge`, `maxAge`
- `location`
- `education`
- `maritalStatus`
- `religiousLevel`
- `sortBy` (lastSeen, createdAt)

**Response includes:**
- Profile list
- Pagination info
- Remaining views (for free users)

### Get Profile by ID
**GET** `/profiles/:userId`
*Requires Authentication*

### View Profile (Track)
**POST** `/profiles/:userId/view`
*Requires Authentication*

### Like Profile
**POST** `/profiles/:userId/like`
*Requires Authentication*

### Block User
**POST** `/profiles/:userId/block`
*Requires Authentication*

### Unblock User
**DELETE** `/profiles/:userId/block`
*Requires Authentication*

### Report User
**POST** `/profiles/:userId/report`
*Requires Authentication*

**Request Body:**
```json
{
  "reason": "inappropriate_content",
  "description": "Optional detailed description"
}
```

---

## Health Check

### Check API Health
**GET** `/health`

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-10-21T10:30:00.000Z",
  "uptime": 12345.67,
  "environment": "production",
  "services": {
    "database": "connected",
    "memory": {
      "used": "45 MB",
      "total": "128 MB"
    }
  }
}
```

---

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.js

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Environment
Create `.env.test` file with test database:
```
TEST_MONGO_URI=mongodb://localhost:27017/islamic-dating-test
JWT_SECRET=test-secret
```

---

## Notes

1. **Authentication:** Most endpoints require `Authorization: Bearer <token>` header
2. **Premium Features:** Some features require active premium subscription
3. **Pagination:** Most list endpoints support `page` and `limit` parameters
4. **Error Handling:** All errors follow standard format with `success: false`
5. **Rate Limiting:** Respect rate limits to avoid 429 errors
6. **CORS:** Configured for `process.env.CLIENT_URL` origin

---

## Support & Contact

For API issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://docs.yourapp.com
- Support Email: support@islamicdating.com
