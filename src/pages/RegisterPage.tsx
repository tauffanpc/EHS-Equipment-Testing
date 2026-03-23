import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, employeeIdToEmail } from '../lib/supabase';
import { QrCode, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ employeeId: '', fullName: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) { setError('Sandi tidak cocok'); return; }
    if (form.password.length < 6) { setError('Sandi minimal 6 karakter'); return; }
    setLoading(true);

    const email = employeeIdToEmail(form.employeeId);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password: form.password,
      options: { data: { full_name: form.fullName, employee_id: form.employeeId } },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([{
        id: data.user.id,
        employee_id: form.employeeId,
        full_name: form.fullName,
        role: 'user',
        status: 'pending',
      }]);
      if (profileError) console.error('Profile error:', profileError);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <QrCode size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">EHS Equipment Testing</p>
            <p className="text-blue-600 text-[10px] uppercase tracking-widest">Daftar Akun</p>
          </div>
        </div>

        {success ? (
          <div className="card p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Pendaftaran Berhasil!</h2>
              <p className="text-gray-500 text-sm mt-1">Akun Anda sedang menunggu persetujuan Superadmin. Anda akan diarahkan ke halaman login.</p>
            </div>
          </div>
        ) : (
          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Buat Akun Baru</h2>
              <p className="text-gray-500 text-sm mt-0.5">Akun perlu disetujui Superadmin sebelum dapat digunakan</p>
            </div>

            {error && (
              <div className="notif-banner notif-danger">
                <AlertCircle size={15} className="flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">ID Karyawan *</label>
                <input className="input-field" placeholder="Contoh: KRY001" required value={form.employeeId} onChange={e => set('employeeId', e.target.value)} />
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Nama Lengkap *</label>
                <input className="input-field" placeholder="Nama sesuai ID karyawan" required value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Sandi *</label>
                <div className="relative">
                  <input className="input-field pr-11" type={showPass ? 'text' : 'password'} placeholder="Min. 6 karakter" required value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Konfirmasi Sandi *</label>
                <input className="input-field" type="password" placeholder="Ulangi sandi" required value={form.confirm} onChange={e => set('confirm', e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 mt-2">
                {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </button>
            </form>

            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft size={14} /> Kembali ke Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
