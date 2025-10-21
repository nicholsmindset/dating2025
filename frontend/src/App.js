import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ChatProvider } from './contexts/ChatContext';
import { PusherProvider } from './contexts/PusherContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Onboarding from './pages/onboarding/Onboarding';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import Chat from './pages/chat/Chat';
import Subscription from './pages/subscription/Subscription';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';



function App() {
  return (
    <SubscriptionProvider>
      <ChatProvider>
        <PusherProvider>
          <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <main style={{ flex: 1, paddingTop: '80px' }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="/onboarding" element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/profile/:userId" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />

                <Route path="/subscription" element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Catch all route */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </main>

            <Footer />

            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </PusherProvider>
      </ChatProvider>
    </SubscriptionProvider>
  );
}

export default App;
