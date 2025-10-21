import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ChatProvider } from './contexts/ChatContext';
import { PusherProvider } from './contexts/PusherContext';
import { WaliProvider } from './contexts/WaliContext';
import { SearchProvider } from './contexts/SearchContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ResendVerification from './pages/auth/ResendVerification';
import Onboarding from './pages/onboarding/Onboarding';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import Chat from './pages/chat/Chat';
import Subscription from './pages/subscription/Subscription';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';

// Wali Pages
import WaliLogin from './pages/wali/WaliLogin';
import WaliDashboard from './pages/wali/WaliDashboard';
import WaliVerifyEmail from './pages/wali/WaliVerifyEmail';

// Search Pages
import AdvancedSearch from './pages/search/AdvancedSearch';
import SavedSearches from './pages/search/SavedSearches';



function App() {
  return (
    <WaliProvider>
      <SubscriptionProvider>
        <SearchProvider>
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
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/resend-verification" element={<ResendVerification />} />

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

                    {/* Search Routes */}
                    <Route path="/search" element={
                      <ProtectedRoute>
                        <AdvancedSearch />
                      </ProtectedRoute>
                    } />

                    <Route path="/saved-searches" element={
                      <ProtectedRoute>
                        <SavedSearches />
                      </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin/*" element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />

                    {/* Wali Routes */}
                    <Route path="/wali/login" element={<WaliLogin />} />
                    <Route path="/wali/verify" element={<WaliVerifyEmail />} />
                    <Route path="/wali/dashboard" element={<WaliDashboard />} />

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
        </SearchProvider>
      </SubscriptionProvider>
    </WaliProvider>
  );
}

export default App;