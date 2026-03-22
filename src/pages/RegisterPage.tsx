import React, { useState } from 'react';
import { supabase, employeeIdToEmail } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { QrCode, UserPlus, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Sandi tidak cocok');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Sandi minimal 6 karakter');
      setLoading(false);
      return;
    }

    const email = employeeIdToEmail(employeeId);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          employee_id: employeeId,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (signUpData.user) {
      // Create profile record
      const isInitialAdmin = employeeId.toLowerCase() === 'admin001' || employeeId.toLowerCase() === 'admin';
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: signUpData.user.id,
            employee_id: employeeId,
            full_name: fullName,
            role: isInitialAdmin ? 'superadmin' : 'user',
            status: isInitialAdmin ? 'approved' : 'pending',
          }
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Even if profile creation fails (e.g. table doesn't exist yet), 
        // we'll proceed but warn in console. In a real app, this should be handled better.
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
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
          <p className="text-slate-500 mt-2">Daftar Akun Petugas Baru</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 rounded-[2.5rem] shadow-2xl"
        >
          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Berhasil!</h2>
              <p className="text-slate-500">Akun Anda telah dibuat. Mengalihkan ke halaman login...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">No ID Karyawan</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  placeholder="Contoh: KRY001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  placeholder="Nama Lengkap Anda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Konfirmasi Sandi</label>
                <input 
                  type="password" 
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Mendaftarkan...' : <><UserPlus size={20} /> Daftar Sekarang</>}
              </button>

              <div className="text-center mt-6">
                <Link to="/login" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-2">
                  <ArrowLeft size={16} /> Kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </motion.div>

        <p className="text-center mt-10 text-slate-400 text-xs">
          &copy; 2026 EquipTrack Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
};
