import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginWithEmail, getUserProfile } from '../firebaseRTDB';
import { User, Briefcase, Shield, HeartHandshake, CheckCircle } from 'lucide-react'; // Added icons

const Login = () => {
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent'); // Default selection
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const { setUser } = useAuth();

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Log in via Firebase Auth
      const cred = await loginWithEmail(email, password);
      const uid = cred.user.uid;

      // 2. Fetch the user's profile from Realtime Database
      const profile = await getUserProfile(uid);

      if (profile) {
        // --- NEW: Verify Role Match ---
        if (profile.role !== role) {
          setError(`Error: This account is not registered as a ${role.charAt(0).toUpperCase() + role.slice(1)}.`);
          setLoading(false);
          return;
        }

        // 3. Set full user context
        setUser({ uid, email, ...profile });
        nav('/dashboard'); // Redirect to dashboard
      } else {
        setError("Profile not found. Contact administrator.");
      }

    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  // Helper for role buttons
  const RoleButton = ({ id, label, icon: Icon, color }) => (
    <button
      type="button"
      onClick={() => setRole(id)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
        role === id 
          ? `border-${color}-500 bg-${color}-50 text-${color}-700 shadow-sm` 
          : 'border-slate-100 hover:border-slate-200 text-slate-500'
      }`}
    >
      <div className={`mb-1 ${role === id ? '' : 'opacity-50'}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      {role === id && <div className={`absolute top-2 right-2 text-${color}-500`}><CheckCircle size={14} className="opacity-0"/></div>} 
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
             <div className="bg-blue-600 p-2 rounded-lg">
               <Shield className="text-white" size={32} />
             </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">EduLink Portal</h1>
          <p className="text-slate-500 font-medium">Select your role to continue</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          
          {/* Role Selector */}
          <div className="grid grid-cols-4 gap-2">
            <RoleButton id="parent" label="Parent" icon={User} color="amber" />
            <RoleButton id="teacher" label="Teacher" icon={Briefcase} color="blue" />
            <RoleButton id="counselor" label="Counselor" icon={HeartHandshake} color="pink" />
            <RoleButton id="admin" label="Admin" icon={Shield} color="purple" />
          </div>

          {/* Inputs */}
          <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <input
                type="email" required
                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={`Enter ${role} email`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <input
                type="password" required
                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl border border-red-100 flex items-center gap-2">
               <Shield size={16} /> {error}
            </div>
          )}

          <button
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
              role === 'admin' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' :
              role === 'teacher' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' :
              role === 'counselor' ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-200' :
              'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
            }`}
          >
            {loading ? 'Verifying Access...' : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-bold text-slate-400">
          Need help? Contact <span className="text-blue-600 cursor-pointer hover:underline">support@edulink.com</span>
        </div>
      </div>
    </div>
  );
};

export default Login;