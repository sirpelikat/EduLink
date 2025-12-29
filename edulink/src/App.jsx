import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { logout } from './firebaseRTDB.js';
import { Menu, X, Github, Linkedin, Code } from 'lucide-react';

// Import the Logo
import edulinkLogo from './assets/edulink_logo.png'; 
import slide1 from './assets/slide1.png';
import slide2 from './assets/slide2.png';
import slide3 from './assets/slide3.png';

// Page Imports
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Reports from './pages/Reports.jsx';
import Announcements from './pages/Announcements.jsx';
import Wellbeing from './pages/Wellbeing.jsx';
import Admin from './pages/Admin.jsx';
import Profile from './pages/Profile.jsx';

// --- CONFIG: CAROUSEL IMAGES ---
const CAROUSEL_IMAGES = [
  { url: slide1, alt: "Classroom" },
  { url: slide2, alt: "School" },
  { url: slide3, alt: "Parent-Teacher Meeting" },
];

// --- UPDATED WELCOME COMPONENT (Split Screen) ---
function Welcome() {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % CAROUSEL_IMAGES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] w-full">
      
      {/* LEFT HALF: CONTENT */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-white order-2 lg:order-1">
        <div className="max-w-xl space-y-8 animate-fade-in-up">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
            Welcome to EduLink
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 tracking-tight leading-tight">
             The Future of <br /> 
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">School Management</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            EduLink bridges the gap between teachers, parents, and students with real-time insights, seamless communication, and automated reporting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
             <Link to={user ? "/dashboard" : "/login"} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 hover:-translate-y-1 text-center">
               {user ? "Go to Dashboard" : "Sign In to Portal"}
             </Link>
          </div>
        </div>
      </div>

      {/* RIGHT HALF: CAROUSEL BACKGROUND */}
      <div className="w-full lg:w-1/2 relative h-[50vh] lg:h-auto bg-slate-900 overflow-hidden order-1 lg:order-2">
         {CAROUSEL_IMAGES.map((img, index) => (
            <img 
              key={index} 
              src={img.url} 
              alt={img.alt} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`} 
            />
          ))}
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent lg:bg-gradient-to-l"></div>
          
          <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg max-w-xs hidden lg:block animate-fade-in">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">EduLink Platform</p>
            <p className="text-sm font-bold text-slate-800">Connecting Teachers and Parents</p>
          </div>
      </div>

    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
    setIsMenuOpen(false);
  }

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Check if we are on the Welcome page to adjust layout
  const isWelcomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* --- RESPONSIVE HEADER --- */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo Section */}
            <Link to="/" className="font-extrabold text-2xl text-blue-600 tracking-tight flex items-center gap-3">
              <img src={edulinkLogo} alt="EduLink" className="h-8 w-8 object-contain" />
              EduLink
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Dashboard</Link>
                  <Link to="/reports" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Reports</Link>
                  <Link to="/announcements" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Announcements</Link>
                  <Link to="/wellbeing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Well-being</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-bold text-purple-600 hover:text-purple-800 transition">Admin</Link>
                  )}
                  <div className="h-5 w-px bg-slate-200"></div>
                  <Link to="/profile" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Profile</Link>
                  <button onClick={handleLogout} className="text-sm font-semibold text-red-500 hover:text-red-700 transition">Sign out</button>
                </>
              ) : (
                <Link to="/login" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">Sign in</Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-slate-600 hover:text-blue-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-slate-100 animate-fade-in-down">
              <nav className="flex flex-col gap-4 mt-4">
                {user ? (
                  <>
                    <Link to="/dashboard" className="text-slate-600 font-semibold hover:text-blue-600 hover:pl-2 transition-all">Dashboard</Link>
                    <Link to="/reports" className="text-slate-600 font-semibold hover:text-blue-600 hover:pl-2 transition-all">Reports</Link>
                    <Link to="/announcements" className="text-slate-600 font-semibold hover:text-blue-600 hover:pl-2 transition-all">Announcements</Link>
                    <Link to="/wellbeing" className="text-slate-600 font-semibold hover:text-blue-600 hover:pl-2 transition-all">Well-being</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="text-purple-600 font-bold hover:pl-2 transition-all">Admin Panel</Link>
                    )}
                    <hr className="border-slate-100" />
                    <Link to="/profile" className="text-slate-600 font-semibold hover:text-blue-600 hover:pl-2 transition-all">My Profile</Link>
                    <button onClick={handleLogout} className="text-red-500 font-semibold text-left hover:pl-2 transition-all">Sign out</button>
                  </>
                ) : (
                  <Link to="/login" className="bg-blue-50 text-blue-600 font-bold text-center py-3 rounded-xl">Sign in Portal</Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      {/* Dynamic Class: If Welcome page, go full width. Else, keep standard container. */}
      <main className={isWelcomePage ? "w-full flex-grow" : "max-w-7xl mx-auto px-6 py-8 flex-grow w-full"}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/wellbeing" element={<Wellbeing />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white p-2 rounded-lg">
                <Code size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Developed by Fantastic 404</p>
                <p className="text-xs text-slate-500">© {new Date().getFullYear()} EduLink Systems. All rights reserved.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-slate-800 transition"><Github size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition"><Linkedin size={20} /></a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}