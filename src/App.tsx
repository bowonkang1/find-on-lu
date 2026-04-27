import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Layout } from './components/Dashboard';
import { AuthForm } from './components/auth/AuthForm';
import { DashboardPage } from './pages/DashboardPage';
import { LostFoundPage } from './pages/LostFoundPage';
import { ThriftPage } from './pages/ThriftPage';
import { MyPostsPage } from './pages/MyPostsPage';
import { HelpPage } from './pages/HelpPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

interface User {
  email: string;
  id: string
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          id: session.user.id,
        });
      }
      setLoading(false);
    });

   const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          id: session.user.id,
        });
      } else {
        setUser(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lu-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
              <AuthForm />
            </div>
          } />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lost-found" element={<LostFoundPage />} />
          <Route path="/thrift" element={<ThriftPage />} />
          <Route path="/my-posts" element={<MyPostsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;