import React, { useState, useEffect } from 'react';
import { supabase, employeeIdToEmail } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { QrCode, LogIn, Scan, AlertCircle, UserPlus } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/inventory');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const email = employeeIdToEmail(employeeId);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      // Show more specific error message to help debugging
      if (signInError.message.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Silakan matikan "Confirm email" di pengaturan Supabase.');
      } else if (signInError.message.includes('Invalid login credentials')) {
        setError('No ID atau Sandi salah');
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    if (signInData.user) {
      // Check profile status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileError || !profile) {
        // If profile doesn't exist, we might be in a state where table is missing 
        // or user was created without profile. For now, allow but log.
        console.warn('Profile not found for user:', signInData.user.id);
        navigate('/inventory');
      } else if (profile.status === 'pending') {
        await supabase.auth.signOut();
        setError('Akun Anda sedang menunggu persetujuan Superadmin.');
      } else if (profile.status === 'rejected') {
        await supabase.auth.signOut();
        setError('Pendaftaran akun Anda ditolak. Silakan hubungi Superadmin.');
      } else {
        // Approved!
        if (profile.role === 'superadmin') {
          navigate('/admin');
        } else {
          navigate('/inventory');
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-200">
            <QrCode size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">EquipTrack Pro</h1>
          <p className="text-slate-500 mt-2">Asset Management & Inspection System</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 rounded-[2.5rem] shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">No ID Karyawan</label>
              <input 
                type="text" 
                required
                className="input-field"
                placeholder="Masukkan No ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Sandi</label>
              <input 
                type="password" 
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 bg-slate-900 shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : <><LogIn size={20} /> Login Petugas</>}
            </button>

            <div className="text-center mt-4">
              <Link to="/register" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-2">
                <UserPlus size={16} /> Belum punya akun? Daftar
              </Link>
            </div>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-white px-4 text-slate-400">Quick Access</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/public-scan')}
            className="w-full py-4 rounded-2xl border-2 border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
          >
            <Scan size={20} /> Scan QR Tanpa Login
          </button>
        </motion.div>

        <p className="text-center mt-10 text-slate-400 text-xs">
          &copy; 2026 EquipTrack Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
};
