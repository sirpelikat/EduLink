import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { logout } from './firebase.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Reports from './pages/Reports.jsx';
import Announcements from './pages/Announcements.jsx';
import Wellbeing from './pages/Wellbeing.jsx';
import Admin from './pages/Admin.jsx';
import Profile from './pages/Profile.jsx'; // Import the new page

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-blue-600 flex items-center gap-2">
            EduLink
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/" className="text-sm font-medium hover:text-blue-600">Dashboard</Link>
                <Link to="/reports" className="text-sm font-medium hover:text-blue-600">Reports</Link>
                <Link to="/announcements" className="text-sm font-medium hover:text-blue-600">Announcements</Link>
                <Link to="/wellbeing" className="text-sm font-medium hover:text-blue-600">Well-being</Link>
                
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-purple-600 hover:text-purple-800">Admin</Link>
                )}

                <div className="h-4 w-px bg-gray-300 mx-1"></div>

                {/* Profile Link */}
                <Link to="/profile" className="text-sm font-medium hover:text-blue-600">
                  Profile
                </Link>

                <button onClick={handleLogout} className="text-sm text-red-600 font-medium hover:text-red-800">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium hover:text-blue-600">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/wellbeing" element={<Wellbeing />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} /> {/* Add Route */}
        </Routes>
      </main>
    </div>
  );
}