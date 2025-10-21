# API Endpoints Reference
## Islamic Dating Platform

**Base URL:** `http://localhost:5000/api` (Development)
**Production URL:** `https://api.islamicdating.com/api`

**API Documentation (Swagger):** `http://localhost:5000/api-docs`

---

## Authentication Endpoints

### POST /auth/register
Register a new user account
- **Auth Required:** No
- **Request Body:**
  - email, password, firstName, lastName, dateOfBirth
  - gender, maritalStatus, religiousLevel, prayerFrequency
  - location (country, city, state)
  - wali (optional): hasWali, name, email, phone, relation
- **Response:** JWT token + user object

### POST /auth/login
Login to existing account
- **Auth Required:** No
- **Request Body:** email, password
- **Response:** JWT token + user object

### GET /auth/verify-email?token={token}
Verify email address
- **Auth Required:** No
- **Query Params:** token
- **Response:** Success message

### POST /auth/resend-verification
Resend verification email
- **Auth Required:** No
- **Request Body:** email
- **Response:** Success message

### POST /auth/forgot-password
Request password reset
- **Auth Required:** No
- **Request Body:** email
- **Response:** Success message

---

## User Management Endpoints

### GET /users/me
Get current user profile
- **Auth Required:** Yes
- **Response:** User object

### PUT /users/me
Update current user profile
- **Auth Required:** Yes
- **Request Body:** Fields to update
- **Response:** Updated user object

### DELETE /users/me
Delete user account
- **Auth Required:** Yes
- **Response:** Success message

### POST /users/upload-photo
Upload profile photo
- **Auth Required:** Yes
- **Request Body:** FormData with photo file
- **Response:** Photo URL

---

## Profile Endpoints

### GET /profiles/me
Get own profile
- **Auth Required:** Yes
- **Response:** Detailed profile object

### PUT /profiles/me
Update own profile
- **Auth Required:** Yes
- **Request Body:** Profile fields
- **Response:** Updated profile

### GET /profiles/:userId
Get user profile by ID
- **Auth Required:** Yes
- **URL Params:** userId
- **Response:** Public profile object

### GET /profiles
Browse profiles with filters
- **Auth Required:** Yes
- **Query Params:** page, limit, minAge, maxAge, location, education, maritalStatus, religiousLevel, etc.
- **Response:** Paginated profiles array

### POST /profiles/:userId/view
Record profile view
- **Auth Required:** Yes
- **URL Params:** userId
- **Response:** Success message

### POST /profiles/:userId/like
Like a profile
- **Auth Required:** Yes
- **URL Params:** userId
- **Response:** Success + match status

### POST /profiles/:userId/block
Block a user
- **Auth Required:** Yes
- **URL Params:** userId
- **Response:** Success message

### DELETE /profiles/:userId/block
Unblock a user
- **Auth Required:** Yes
- **URL Params:** userId
- **Response:** Success message

### POST /profiles/:userId/report
Report a user
- **Auth Required:** Yes
- **URL Params:** userId
- **Request Body:** reason, description
- **Response:** Success message

### GET /profiles/blocked/list
Get blocked users list
- **Auth Required:** Yes
- **Response:** Array of blocked users

---

## Matching Endpoints

### GET /matches
Get match suggestions
- **Auth Required:** Yes
- **Query Params:** page, limit
- **Response:** Array of matches with scores

### GET /matches/mutual
Get mutual matches
- **Auth Required:** Yes
- **Response:** Array of mutual matches

### POST /matches/like
Like a match
- **Auth Required:** Yes
- **Request Body:** matchId
- **Response:** Match status

### POST /matches/reject
Reject a match
- **Auth Required:** Yes
- **Request Body:** matchId
- **Response:** Success message

### GET /matches/stats
Get match statistics
- **Auth Required:** Yes
- **Response:** Match stats object

---

## Chat Endpoints

### GET /chat/conversations
Get user's conversations
- **Auth Required:** Yes
- **Response:** Array of conversations

### GET /chat/:chatId
Get conversation by ID
- **Auth Required:** Yes
- **URL Params:** chatId
- **Response:** Chat object with messages

### POST /chat
Create new conversation
- **Auth Required:** Yes
- **Request Body:** participantId
- **Response:** Chat object

### POST /chat/:chatId/message
Send a message
- **Auth Required:** Yes
- **URL Params:** chatId
- **Request Body:** content
- **Response:** Message object

### PUT /chat/:chatId/read
Mark messages as read
- **Auth Required:** Yes
- **URL Params:** chatId
- **Response:** Success message

### POST /chat/:chatId/report
Report a conversation
- **Auth Required:** Yes
- **URL Params:** chatId
- **Request Body:** reason, description
- **Response:** Success message

### DELETE /chat/:chatId
Delete a conversation
- **Auth Required:** Yes
- **URL Params:** chatId
- **Response:** Success message

---

## Subscription Endpoints

### GET /subscription/plans
Get available subscription plans
- **Auth Required:** No
- **Response:** Array of subscription plans

### POST /subscription/create-checkout
Create Stripe checkout session
- **Auth Required:** Yes
- **Request Body:** planId
- **Response:** Checkout session URL

### POST /subscription/webhook
Stripe webhook handler
- **Auth Required:** No (Webhook signature)
- **Request Body:** Stripe event
- **Response:** Success message

### POST /subscription/cancel
Cancel subscription
- **Auth Required:** Yes
- **Response:** Success message

### GET /subscription/status
Get subscription status
- **Auth Required:** Yes
- **Response:** Subscription object

---

## Wali (Guardian) Endpoints

### POST /wali/setup
Create wali account
- **Auth Required:** Yes
- **Request Body:** Wali details
- **Response:** Success message

### POST /wali/verify-email
Verify wali email and set password
- **Auth Required:** No
- **Request Body:** token, password
- **Response:** Success message

### POST /wali/login
Wali login
- **Auth Required:** No
- **Request Body:** email, password
- **Response:** JWT token + wali object

### GET /wali/dashboard
Get wali dashboard data
- **Auth Required:** Yes (Wali)
- **Response:** Dashboard data with stats

### POST /wali/chats/:chatId/approve
Approve conversation
- **Auth Required:** Yes (Wali)
- **URL Params:** chatId
- **Response:** Success message

### POST /wali/chats/:chatId/reject
Reject conversation
- **Auth Required:** Yes (Wali)
- **URL Params:** chatId
- **Request Body:** reason
- **Response:** Success message

### PUT /wali/permissions
Update wali permissions
- **Auth Required:** Yes (Wali)
- **Request Body:** permissions object
- **Response:** Updated wali object

### PUT /wali/notifications
Update notification preferences
- **Auth Required:** Yes (Wali)
- **Request Body:** notifications object
- **Response:** Updated wali object

### GET /wali/actions
Get wali action history
- **Auth Required:** Yes (Wali)
- **Response:** Array of actions

### POST /wali/actions
Record wali action
- **Auth Required:** Yes (Wali)
- **Request Body:** actionType, targetId, notes
- **Response:** Success message

---

## Search Endpoints

### POST /search
Advanced search with filters
- **Auth Required:** Yes
- **Request Body:** filters object, pagination
- **Response:** Search results with pagination

### GET /search/suggested-filters
Get suggested filters based on preferences
- **Auth Required:** Yes
- **Response:** Suggested filters object

### GET /search/popular-filters
Get popular filter statistics
- **Auth Required:** Yes
- **Response:** Popular filters data

### POST /search/save
Save a search query
- **Auth Required:** Yes
- **Request Body:** name, filters
- **Response:** Saved search object

### GET /search/saved
Get saved searches
- **Auth Required:** Yes
- **Response:** Array of saved searches

### DELETE /search/saved/:searchId
Delete saved search
- **Auth Required:** Yes
- **URL Params:** searchId
- **Response:** Success message

### PUT /search/saved/:searchId
Update saved search
- **Auth Required:** Yes
- **URL Params:** searchId
- **Request Body:** name, filters
- **Response:** Updated search object

### GET /search/filter-options
Get available filter options
- **Auth Required:** Yes
- **Response:** Filter options object

### POST /search/quick
Quick keyword search
- **Auth Required:** Yes
- **Request Body:** keyword, limit
- **Response:** Search results

---

## Analytics Endpoints

### GET /analytics/my-activity
Get personal activity statistics
- **Auth Required:** Yes
- **Query Params:** period (day/week/month/year)
- **Response:** Activity stats object

### POST /analytics/track
Track user action
- **Auth Required:** Yes
- **Request Body:** action, metadata
- **Response:** Success message

### GET /analytics/platform
Get platform-wide analytics (Admin)
- **Auth Required:** Yes (Admin)
- **Query Params:** period
- **Response:** Platform analytics object

### GET /analytics/retention
Get retention metrics (Admin)
- **Auth Required:** Yes (Admin)
- **Query Params:** cohortPeriod
- **Response:** Retention data

### GET /analytics/features
Get feature usage statistics (Admin)
- **Auth Required:** Yes (Admin)
- **Response:** Feature usage object

### GET /analytics/match-success
Get match success metrics (Admin)
- **Auth Required:** Yes (Admin)
- **Query Params:** period
- **Response:** Match success data

### GET /analytics/dashboard
Get comprehensive dashboard (Admin)
- **Auth Required:** Yes (Admin)
- **Query Params:** period
- **Response:** Complete analytics dashboard

---

## Photo Verification Endpoints

### POST /photo-verification/submit
Submit photo for verification
- **Auth Required:** Yes
- **Request Body:** FormData with photo
- **Response:** Verification request object

### GET /photo-verification/status
Check verification status
- **Auth Required:** Yes
- **Response:** Verification status object

### GET /photo-verification/admin/pending
Get pending verifications (Admin)
- **Auth Required:** Yes (Admin)
- **Response:** Array of pending requests

### POST /photo-verification/admin/approve/:id
Approve verification (Admin)
- **Auth Required:** Yes (Admin)
- **URL Params:** id
- **Request Body:** notes
- **Response:** Success message

### POST /photo-verification/admin/reject/:id
Reject verification (Admin)
- **Auth Required:** Yes (Admin)
- **URL Params:** id
- **Request Body:** reason, notes
- **Response:** Success message

### GET /photo-verification/admin/stats
Get verification statistics (Admin)
- **Auth Required:** Yes (Admin)
- **Response:** Statistics object

---

## Moderation Endpoints

### GET /moderation/queue
Get moderation queue (Admin)
- **Auth Required:** Yes (Admin)
- **Response:** Array of reported items

### POST /moderation/user/:userId/suspend
Suspend user (Admin)
- **Auth Required:** Yes (Admin)
- **URL Params:** userId
- **Request Body:** reason, duration
- **Response:** Success message

### POST /moderation/user/:userId/unsuspend
Unsuspend user (Admin)
- **Auth Required:** Yes (Admin)
- **URL Params:** userId
- **Response:** Success message

### POST /moderation/report/:reportId/review
Review report (Admin)
- **Auth Required:** Yes (Admin)
- **URL Params:** reportId
- **Request Body:** action, notes
- **Response:** Success message

### POST /moderation/content/check
Check content for violations
- **Auth Required:** Yes (Admin)
- **Request Body:** text
- **Response:** Content analysis object

### GET /moderation/stats
Get moderation statistics (Admin)
- **Auth Required:** Yes (Admin)
- **Response:** Statistics object

---

## Admin Endpoints

### GET /admin/users
Get all users (Admin)
- **Auth Required:** Yes (Admin)
- **Query Params:** page, limit, filters
- **Response:** Paginated users array

### GET /admin/stats
Get platform statistics (Admin)
- **Auth Required:** Yes (Admin)
- **Response:** Platform stats object

### PUT /admin/user/:userId
Update user (Admin)
- **Auth Required:** Yes (Admin)
- **URL Params:** userId
- **Request Body:** Fields to update
- **Response:** Updated user object

### DELETE /admin/user/:userId
Delete user (Admin)
- **Auth Required:** Yes (Admin)
- **URL Params:** userId
- **Response:** Success message

### GET /admin/reports
Get all reports (Admin)
- **Auth Required:** Yes (Admin)
- **Response:** Array of reports

### POST /admin/broadcast
Send broadcast notification (Admin)
- **Auth Required:** Yes (Admin)
- **Request Body:** message, targetUsers
- **Response:** Success message

---

## Pusher Endpoints

### POST /pusher/auth
Authorize Pusher channel
- **Auth Required:** Yes
- **Request Body:** socket_id, channel_name
- **Response:** Pusher auth object

### POST /pusher/webhook
Pusher webhook handler
- **Auth Required:** No (Webhook signature)
- **Request Body:** Pusher events
- **Response:** Success message

---

## Utility Endpoints

### GET /health
Health check
- **Auth Required:** No
- **Response:** Status object with timestamp

---

## Authentication Headers

All authenticated endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

## Pagination Format

Endpoints that return lists typically include:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalResults": 200,
    "resultsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Rate Limits

- **Global:** 100 requests per 15 minutes
- **Profile Operations:** 50 requests per 15 minutes
- **Free Users:** 10 profile views per month
- **Premium Users:** Unlimited profile views

---

## Total Endpoints: 83

**By Category:**
- Authentication: 5
- Users: 4
- Profiles: 10
- Matches: 5
- Chat: 7
- Subscription: 5
- Wali: 10
- Search: 9
- Analytics: 7
- Photo Verification: 6
- Moderation: 6
- Admin: 6
- Pusher: 2
- Utility: 1

---

**For interactive API documentation, visit:** `http://localhost:5000/api-docs`

**Last Updated:** 2025-10-21
