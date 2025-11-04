# 🚀 LOCAL DEVELOPMENT GUIDE

## 📍 Your Localhost URLs

Once the app is running, you can access it at:

### Frontend (Main App)
```
http://localhost:3000
```
**This is your main URL** - Open this in your browser to view the app!

### Backend API
```
http://localhost:5000
```

### API Health Check
```
http://localhost:5000/api/health
```

---

## ⚡ Quick Start (3 Steps)

### ✅ Step 1: Set Up Database

You need a MongoDB database. Choose ONE option:

#### Option A: MongoDB Atlas (RECOMMENDED - Free Cloud Database)
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free account (5 minutes)
3. Create a cluster (M0 Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Edit `/backend/.env` and replace this line:
   ```env
   MONGODB_URI=mongodb://localhost:27017/islamic-dating
   ```
   With your connection string:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/islamic-dating?retryWrites=true&w=majority
   ```

#### Option B: Local MongoDB (If already installed)
If you have MongoDB installed locally, the default config will work:
```bash
# Start MongoDB (Mac)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod

# Start MongoDB (Windows)
net start MongoDB
```

---

### ✅ Step 2: Start the Backend

Open a terminal and run:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 5000
✅ MongoDB connected successfully
```

If you see errors about MongoDB, make sure you completed Step 1.

---

### ✅ Step 3: Start the Frontend

Open a NEW terminal (keep backend running) and run:

```bash
cd frontend
npm start
```

The app will automatically open in your browser at:
```
http://localhost:3000
```

---

## 🎉 You're Ready!

### What You Can Do Now:
- ✅ Create user accounts
- ✅ Login/logout
- ✅ Browse profiles
- ✅ View matches
- ✅ Use basic features
- ✅ Test the UI/UX

### What Won't Work Yet (Optional Services):
- ❌ Image uploads (need Cloudinary)
- ❌ Payments/subscriptions (need Stripe)
- ❌ Real-time notifications (need Pusher)
- ❌ Email sending (need SendGrid/Gmail)
- ❌ Chat functionality (need Socket.io + Pusher)

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to MongoDB"

**Solution**: You need to set up MongoDB first (see Step 1 above)

The easiest option is MongoDB Atlas (free cloud database):
1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Get your connection string
3. Update `/backend/.env` with your connection string

---

### Problem: "Port 3000 already in use"

**Solution**: Something is already running on port 3000

```bash
# Kill the process (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

---

### Problem: "Port 5000 already in use"

**Solution**: Change the backend port

Edit `/backend/.env`:
```env
PORT=5001
```

Then edit `/frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_BACKEND_URL=http://localhost:5001
REACT_APP_SOCKET_URL=http://localhost:5001
```

---

### Problem: Backend crashes with "cannot read property of undefined"

**Solution**: Make sure your `.env` file is properly configured

Check that `/backend/.env` exists and has:
- `MONGODB_URI` (must be valid)
- `JWT_SECRET` (already generated)
- `CRON_SECRET` (already generated)

---

## 🔑 Adding Optional Services (Later)

Want to test payments, image uploads, or real-time features?

See `PRODUCTION_API_KEYS_CHECKLIST.md` for step-by-step setup of:
- Stripe (payments) - 10 minutes
- Cloudinary (images) - 5 minutes
- Pusher (notifications) - 5 minutes
- SendGrid (email) - 10 minutes

Each service has a free tier you can use for testing!

---

## 📱 Test the App

### 1. Create a Test Account
Go to: http://localhost:3000/register

Fill in:
- Email: test@example.com
- Password: Test123!
- Name: Test User
- Gender: Male/Female
- Date of Birth: 1990-01-01

### 2. Login
Go to: http://localhost:3000/login

Use the credentials you just created.

### 3. Browse the App
Explore:
- Dashboard: http://localhost:3000/dashboard
- Browse Profiles: http://localhost:3000/browse
- Settings: http://localhost:3000/settings
- Subscription Plans: http://localhost:3000/subscription

---

## 🛑 Stopping the App

### Stop Frontend
In the frontend terminal, press: `Ctrl + C`

### Stop Backend
In the backend terminal, press: `Ctrl + C`

---

## 📁 Project Structure

```
dating2025/
├── backend/                 # Express.js API
│   ├── .env                # ✅ Created (your config)
│   ├── server.js           # Main entry point
│   ├── routes/             # API endpoints
│   ├── models/             # Database models
│   └── services/           # Business logic
│
├── frontend/               # React app
│   ├── .env                # ✅ Created (your config)
│   ├── public/             # Static files
│   └── src/                # React components
│
└── PRODUCTION_API_KEYS_CHECKLIST.md  # Full production guide
```

---

## 🚀 Next Steps

### For Local Development:
1. ✅ You're all set! Just start coding.
2. The app will auto-reload when you make changes.
3. Check the browser console for errors.

### For Production:
1. Review `PRODUCTION_API_KEYS_CHECKLIST.md`
2. Sign up for all required services
3. Get production API keys
4. Deploy to hosting service

---

## 📚 Useful Commands

### Backend:
```bash
cd backend

# Start dev server (auto-reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Seed database with test data
npm run seed
```

### Frontend:
```bash
cd frontend

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Both (from root):
```bash
# Start both frontend + backend
npm run dev

# Install all dependencies
npm run install-deps
```

---

## 💡 Development Tips

1. **Use Browser DevTools**: Open with F12 to see console errors
2. **Check Network Tab**: See API requests and responses
3. **Use React DevTools**: Install browser extension for React debugging
4. **Check Backend Logs**: Watch the terminal for API errors
5. **Test in Private Mode**: To test without cached data

---

## 🆘 Need Help?

### Quick Checks:
- [ ] Is MongoDB running/connected?
- [ ] Are both backend and frontend running?
- [ ] Are you using the correct URLs (localhost:3000 and localhost:5000)?
- [ ] Check browser console for errors (F12)
- [ ] Check backend terminal for errors

### Documentation:
- README.md - Project overview
- SETUP_GUIDE.md - Detailed setup instructions
- PRODUCTION_API_KEYS_CHECKLIST.md - Production deployment guide

---

**🎯 Your Main URL: http://localhost:3000**

Open this in your browser after starting both backend and frontend!

Happy coding! 🚀
