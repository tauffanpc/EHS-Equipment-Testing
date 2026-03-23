import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase, employeeIdToEmail } from '../lib/supabase';
import { QrCode, Eye, EyeOff, AlertCircle, Scan } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const LoginPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'pending') {
      setError('Akun Anda sedang menunggu persetujuan dari Superadmin.');
    } else if (status === 'rejected') {
      setError('Pendaftaran akun Anda ditolak. Hubungi Superadmin untuk informasi lebih lanjut.');
    }
    // Redirect if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const email = employeeIdToEmail(employeeId);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message.includes('Invalid login credentials')
        ? 'ID Karyawan atau sandi salah.'
        : signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single();

      if (!profile) {
        setError('Profil tidak ditemukan. Hubungi Superadmin.');
        await supabase.auth.signOut();
      } else if (profile.status === 'pending') {
        await supabase.auth.signOut();
        setError('Akun Anda sedang menunggu persetujuan Superadmin.');
      } else if (profile.status === 'rejected') {
        await supabase.auth.signOut();
        setError('Pendaftaran ditolak. Hubungi Superadmin.');
      } else {
        toast.success(`Selamat datang, ${profile.full_name}!`);
        navigate(profile.role === 'superadmin' ? '/admin' : '/dashboard', { replace: true });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex">
      {/* Left Panel - PC only */}
      <div className="hidden lg:flex w-[480px] bg-[#0D1117] flex-col justify-between p-12 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <QrCode size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">EHS Equipment Testing</p>
            <p className="text-blue-400 text-[10px] uppercase tracking-widest">Management System</p>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Sistem Manajemen<br />Peralatan K3
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Platform terpadu untuk manajemen inventaris, riksa uji, dan monitoring kondisi peralatan EHS secara real-time.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Riksa Uji', desc: 'Monitoring jadwal' },
              { label: 'QR Code', desc: 'Identifikasi cepat' },
              { label: 'Inventory', desc: 'Kelola aset' },
              { label: 'Laporan', desc: 'Export data' },
            ].map(f => (
              <div key={f.label} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/20 text-xs">© 2026 EHS Equipment Testing</p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <QrCode size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">EHS Equipment Testing</p>
              <p className="text-blue-600 text-[10px] uppercase tracking-widest">Management System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Masuk ke Sistem</h2>
          <p className="text-gray-500 text-sm mb-8">Gunakan ID Karyawan dan sandi Anda</p>

          {error && (
            <div className="notif-banner notif-danger mb-6">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label-xs text-gray-500 block mb-1.5">ID Karyawan</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Contoh: KRY001"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label-xs text-gray-500 block mb-1.5">Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 mt-2">
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">atau</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <button
              onClick={() => navigate('/public-scan')}
              className="btn btn-secondary w-full py-3"
            >
              <Scan size={16} />
              Scan QR Tanpa Login
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
