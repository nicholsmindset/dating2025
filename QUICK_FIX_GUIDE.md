# QUICK FIX GUIDE - Apply These Fixes Immediately

## 🔥 Critical Fixes (DO THESE FIRST!)

### 1. Fix Chat Model - Add Missing Methods & Fields

**File**: `backend/models/Chat.js`

**Add after line 227 (after `canUserSendMessage` method)**:

```javascript
// Method to check if user can view messages
chatSchema.methods.canUserViewMessages = function(userId) {
  // Check if user is a participant
  if (!this.participants.some(p => p.toString() === userId.toString())) {
    return false;
  }

  // If wali supervision is required but not approved, only wali can view
  if (this.waliSupervision.isRequired && !this.waliSupervision.isApproved) {
    // Check if user is the wali
    if (this.waliSupervision.waliUser && this.waliSupervision.waliUser.toString() === userId.toString()) {
      return true;
    }
    return false;
  }

  return true;
};
```

**Add after line 288 (after `createChat` static method)**:

```javascript
// Alias for createChat (for backward compatibility with chat routes)
chatSchema.statics.createNewChat = function(participant1Id, participant2Id, requireWaliApproval = false) {
  return this.createChat(participant1Id, participant2Id, requireWaliApproval);
};
```

**Add to schema (around line 159, before the closing `}, {`)**:

```javascript
  // Soft delete tracking
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Chat status (in addition to isActive)
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active'
  }
```

### 2. Fix Subscription Check - Replace `isPremium` Property with Method

**Search and replace in ALL route files**:

❌ **WRONG**: `user.subscription.isPremium` or `req.user.subscription.isPremium`

✅ **CORRECT**: Use one of these:

```javascript
// Option 1: Use the isPremium() method we created
const user = await User.findById(req.user.userId);
if (user.isPremium()) {
  // premium logic
}

// Option 2: Direct check
if (['basic', 'premium', 'vip'].includes(user.subscription.plan)) {
  // premium logic
}

// Option 3: For free users
if (user.subscription.plan === 'free') {
  // free user logic
}
```

**Files to fix**:
- `backend/routes/profiles.js` - Lines 92, 199, 218, 262, 302, 312, 368, 381
- `backend/routes/users.js` - Lines 199, 248, 304
- `backend/routes/subscription.js` - Lines 38, 42, 119, 154

### 3. Standardize User ID Access

**Current Problem**: Some routes use `req.user.id`, others use `req.user.userId`

**Solution**: Auth middleware sets BOTH, but `userId` is the ObjectId. Use `req.user.userId` everywhere for database queries.

**Quick Find & Replace**:
```bash
# In all route files, replace:
req.user.id  →  req.user.userId
```

**BUT** keep using `req.user.id` for string comparisons:
```javascript
// String comparison (keep as is)
if (req.params.userId === req.user.id) {  // OK
  return res.status(400).json({ message: 'Cannot view your own profile' });
}

// Database query (use userId)
const user = await User.findById(req.user.userId);  // Use userId
```

### 4. Add Response Helpers to Existing Routes

**Add to the top of each route file**:

```javascript
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
  serverErrorResponse
} = require('../utils/responses');
```

**Then replace**:

❌ **OLD**:
```javascript
res.json({ success: true, message: 'Success', data: result });
```

✅ **NEW**:
```javascript
successResponse(res, result, 'Success');
```

❌ **OLD**:
```javascript
res.status(404).json({ message: 'Not found' });
```

✅ **NEW**:
```javascript
notFoundResponse(res, 'Not found');
```

### 5. Add Validation to Critical Routes

**Example - Add to chat message sending** (`backend/routes/chat.js`):

```javascript
const { validate, validationRules } = require('../middleware/validate');

// BEFORE (line 148):
router.post('/:chatId/messages', auth, messageRateLimit, async (req, res) => {

// AFTER:
router.post('/:chatId/messages',
  auth,
  messageRateLimit,
  [...validationRules.chatId, ...validationRules.message],
  validate,
  async (req, res) => {
```

**Do the same for**:
- User registration: Add `validationRules.registration`
- Profile update: Add `validationRules.profileUpdate`
- Report user: Add `validationRules.report`
- Search: Add `validationRules.searchQuery`

## 🛠️ Apply Fixes Script

Run this command to apply common fixes automatically:

```bash
# Navigate to backend directory
cd backend

# Find all instances of isPremium property usage
grep -r "subscription\.isPremium" routes/

# Find all instances of req.user.id (to manually review)
grep -r "req\.user\.id" routes/
```

## ✅ Testing After Fixes

### Test 1: User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "dateOfBirth": "1995-01-01",
    "gender": "male",
    "maritalStatus": "never_married",
    "religiousLevel": "practicing",
    "prayerFrequency": "5_times_daily",
    "location": {"country": "Singapore", "city": "Singapore"},
    "wali": {"hasWali": false}
  }'
```

### Test 2: Start Chat
```bash
curl -X POST http://localhost:5000/api/chat/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId": "USER_ID_HERE"}'
```

### Test 3: Send Message
```bash
curl -X POST http://localhost:5000/api/chat/CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message", "type": "text"}'
```

## 📝 Verification Checklist

After applying fixes:

- [ ] Chat creation works without errors
- [ ] Message sending works without errors
- [ ] Premium/Free user checks work correctly
- [ ] Profile viewing respects view limits
- [ ] Validation errors show proper format
- [ ] All responses use consistent format

## 🚨 If You See These Errors:

### "Cannot read property 'isPremium' of undefined"
**Fix**: User model doesn't have `.isPremium` property. Use the method: `user.isPremium()`

### "Chat.createNewChat is not a function"
**Fix**: Add the `createNewChat` static method to Chat model (see step 1 above)

### "Cannot read property 'canUserViewMessages'"
**Fix**: Add the `canUserViewMessages` method to Chat model (see step 1 above)

### "User not found" when accessing routes
**Fix**: Check that you're using `req.user.userId` not `req.user.id` for database queries

## 📚 Reference Files Created

These helper files are already created and ready to use:
- ✅ `backend/middleware/validate.js` - Validation helpers
- ✅ `backend/utils/responses.js` - Response helpers
- ✅ `ROUTING_ISSUES.md` - Detailed issue documentation

## 🎯 Priority Order

1. **CRITICAL** (Do first): Fix Chat model methods (Steps 1-3)
2. **HIGH** (Do next): Fix isPremium checks (Step 2)
3. **MEDIUM**: Add validation (Step 5)
4. **MEDIUM**: Standardize responses (Step 4)
5. **LOW**: Code quality improvements

---

**After applying these fixes, your routing layer will be production-ready!**
