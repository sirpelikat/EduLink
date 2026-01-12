import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { logout } from './firebaseRTDB.js';
import { Menu, X, Github, Linkedin, Code } from 'lucide-react'; // Import Menu/X icons

// Import Logo & Assets
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

// --- WELCOME COMPONENT ---
function Welcome() {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % CAROUSEL_IMAGES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] w-full bg-white">
      {/* LEFT HALF: CONTENT */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 order-2 lg:order-1">
        <div className="max-w-3xl space-y-6 animate-fade-in-up">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
            Welcome to EduLink
          </div>
          {/* Responsive Text Size: text-5xl on mobile, text-7xl on desktop */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 tracking-tight leading-tight">
             The Future of <br /> 
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">School Management</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed">
            EduLink bridges the gap between teachers, parents, and students with real-time insights, seamless communication, and automated reporting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
             {/* UPDATED LINKS WITH /EduLink PREFIX */}
             <Link to={user ? "/EduLink/dashboard" : "/EduLink/login"} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 hover:-translate-y-1 text-center">
               {user ? "Go to Dashboard" : "Sign In to Portal"}
             </Link>
          </div>
        </div>
      </div>

      {/* RIGHT HALF: CAROUSEL */}
      <div className="w-full lg:w-1/2 relative h-[40vh] lg:h-auto bg-slate-900 overflow-hidden order-1 lg:order-2">
         {CAROUSEL_IMAGES.map((img, index) => (
            <img 
              key={index} 
              src={img.url} 
              alt={img.alt} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`} 
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent lg:bg-gradient-to-l"></div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for Mobile Menu

  async function handleLogout() {
    await logout();
    navigate('/EduLink/login'); // UPDATED REDIRECT
    setIsMenuOpen(false); // Close menu on logout
  }

  // Close mobile menu whenever route changes
  useEffect(() => { setIsMenuOpen(false); }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/EduLink" className="font-extrabold text-2xl text-blue-600 tracking-tight flex items-center gap-3">
              <img src={edulinkLogo} alt="EduLink" className="h-8 w-8 object-contain" /> EduLink
            </Link>

            {/* Desktop Navigation (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  {/* UPDATED LINKS WITH /EduLink PREFIX */}
                  <Link to="/EduLink/dashboard" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Dashboard</Link>
                  <Link to="/EduLink/reports" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Reports</Link>
                  <Link to="/EduLink/announcements" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Announcements</Link>
                  <Link to="/EduLink/wellbeing" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Well-being</Link>
                  {user.role === 'admin' && <Link to="/EduLink/admin" className="text-sm font-bold text-purple-600 hover:text-purple-800">Admin</Link>}
                  <div className="h-5 w-px bg-slate-200"></div>
                  <Link to="/EduLink/profile" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Profile</Link>
                  <button onClick={handleLogout} className="text-sm font-semibold text-red-500 hover:text-red-700">Sign out</button>
                </>
              ) : (
                <Link to="/EduLink/login" className="text-sm font-bold text-blue-600 hover:text-blue-800">Sign in</Link>
              )}
            </nav>

            {/* Mobile Menu Button (Visible only on small screens) */}
            <button 
              className="md:hidden text-slate-600 hover:text-blue-600 p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-slate-100 animate-fade-in">
              <nav className="flex flex-col gap-4 mt-4 text-center">
                {user ? (
                  <>
                    {/* UPDATED LINKS WITH /EduLink PREFIX */}
                    <Link to="/EduLink/dashboard" className="text-slate-600 font-semibold py-2 hover:bg-slate-50 rounded-lg">Dashboard</Link>
                    <Link to="/EduLink/reports" className="text-slate-600 font-semibold py-2 hover:bg-slate-50 rounded-lg">Reports</Link>
                    <Link to="/EduLink/announcements" className="text-slate-600 font-semibold py-2 hover:bg-slate-50 rounded-lg">Announcements</Link>
                    <Link to="/EduLink/wellbeing" className="text-slate-600 font-semibold py-2 hover:bg-slate-50 rounded-lg">Well-being</Link>
                    {user.role === 'admin' && <Link to="/EduLink/admin" className="text-purple-600 font-bold py-2 hover:bg-purple-50 rounded-lg">Admin Panel</Link>}
                    <hr className="border-slate-100 my-2" />
                    <Link to="/EduLink/profile" className="text-slate-600 font-semibold py-2">My Profile</Link>
                    <button onClick={handleLogout} className="text-red-500 font-semibold py-2">Sign out</button>
                  </>
                ) : (
                  <Link to="/EduLink/login" className="bg-blue-50 text-blue-600 font-bold py-3 rounded-xl">Sign in Portal</Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full flex-grow px-4 md:px-6 py-6 md:py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/EduLink" replace />} />
          <Route path="/EduLink" element={<Welcome />} />
          
          {/* UPDATED ROUTES WITH /EduLink PREFIX */}
          <Route path="/EduLink/dashboard" element={<Dashboard />} />
          <Route path="/EduLink/login" element={<Login />} />
          <Route path="/EduLink/reports" element={<Reports />} />
          <Route path="/EduLink/announcements" element={<Announcements />} />
          <Route path="/EduLink/wellbeing" element={<Wellbeing />} />
          <Route path="/EduLink/admin" element={<Admin />} />
          <Route path="/EduLink/profile" element={<Profile />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="w-full px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="bg-slate-900 text-white p-2 rounded-lg"><Code size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Developed by Fantastic 404</p>
              <p className="text-xs text-slate-500">© {new Date().getFullYear()} EduLink Systems.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <a href="https://github.com/sirpelikat/EduLink" className="text-slate-400 hover:text-slate-800"><Github size={20} /></a>
            <a href="https://www.linkedin.com/in/dannimiqhail/" className="text-slate-400 hover:text-blue-600"><Linkedin size={20} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}