import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginWithEmail, getUserProfile } from '../firebaseRTDB';
import { User, Briefcase, Shield, HeartHandshake, CheckCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent'); // Default selection
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      // 2. Fetch user profile
      const profile = await getUserProfile(uid);

      if (profile) {
        // Verify Role Match
        if (profile.role !== role) {
          setError(`Error: Account not registered as ${role.charAt(0).toUpperCase() + role.slice(1)}.`);
          setLoading(false);
          return;
        }

        // 3. Set user context and redirect
        setUser({ uid, email, ...profile });
        nav('/dashboard'); 
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
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95 ${
        role === id 
          ? `border-${color}-500 bg-${color}-50 text-${color}-700 shadow-sm ring-1 ring-${color}-200` 
          : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-white'
      }`}
    >
      <div className={`mb-1 ${role === id ? '' : 'opacity-50'}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      {role === id && (
        <div className={`absolute top-1 right-1 text-${color}-500`}>
          <CheckCircle size={14} />
        </div>
      )} 
    </button>
  );

  return (
    // Use 'min-h-[100dvh]' to handle mobile browser address bars correctly
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-4 sm:p-6">
      
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3">
             <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
               <Shield className="text-white" size={32} />
             </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">EduLink Portal</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">Select your role to continue</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          
          {/* Role Selector: 2 Cols on Mobile, 4 on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <RoleButton id="parent" label="Parent" icon={User} color="amber" />
            <RoleButton id="teacher" label="Teacher" icon={Briefcase} color="blue" />
            <RoleButton id="counselor" label="Counselor" icon={HeartHandshake} color="pink" />
            <RoleButton id="admin" label="Admin" icon={Shield} color="purple" />
          </div>

          {/* Inputs Section */}
          <div className="space-y-4 bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <input
                type="email" required
                // 'text-base' prevents iOS zoom. 'h-12' ensures large touch target.
                className="w-full h-12 pl-4 pr-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 text-base shadow-sm"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={`Enter ${role} email`}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} 
                  required
                  // 'text-base' prevents iOS zoom. 'h-12' ensures large touch target.
                  className="w-full h-12 pl-4 pr-12 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 text-base shadow-sm"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none active:text-blue-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
               <Shield size={18} className="shrink-0 mt-0.5" /> 
               <span className="leading-tight">{error}</span>
            </div>
          )}

          <button
            disabled={loading}
            className={`w-full h-12 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] text-base flex items-center justify-center ${
              role === 'admin' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' :
              role === 'teacher' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' :
              role === 'counselor' ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-200' :
              'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-bold text-slate-400 pb-2">
          Need help? <button className="text-blue-600 hover:underline focus:outline-none">Contact Support</button>
        </div>
      </div>
    </div>
  );
};

export default Login;