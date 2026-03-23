import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { Profile } from '../types';
import { Users, CheckCircle2, XCircle, Trash2, Search, Clock, ShieldCheck } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) {
      setProfiles(data.map(p => ({
        id: p.id,
        employeeId: p.employee_id,
        fullName: p.full_name,
        role: p.role,
        status: p.status,
        createdAt: p.created_at,
      })));
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) { toast.error('Gagal memperbarui status'); return; }
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast.success(status === 'approved' ? 'Akun disetujui' : 'Akun ditolak');
  };

  const deleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Hapus akun ${name}?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus akun'); return; }
    setProfiles(prev => prev.filter(p => p.id !== id));
    toast.success('Akun berhasil dihapus');
  };

  const filtered = profiles.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const pending = profiles.filter(p => p.status === 'pending').length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola akses pengguna sistem</p>
          </div>
          {pending > 0 && (
            <div className="notif-banner notif-warning">
              <Clock size={16} />
              <span className="text-sm font-semibold">{pending} akun menunggu persetujuan</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total User', value: profiles.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
            { label: 'Aktif', value: profiles.filter(p => p.status === 'approved').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
            { label: 'Pending', value: pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          ].map(s => (
            <div key={s.label} className="stat-card flex items-center gap-4">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau ID karyawan..."
            className="input-field pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table - PC */}
        <div className="card hidden lg:block overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama & ID</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="cursor-default">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                          {p.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{p.fullName}</p>
                          <p className="text-xs text-gray-400 font-mono">{p.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.role === 'superadmin'
                        ? <span className="badge bg-blue-50 text-blue-700 border-blue-200"><ShieldCheck size={10} /> Superadmin</span>
                        : <span className="badge badge-unknown">User</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'approved' ? 'badge-active' :
                        p.status === 'rejected' ? 'badge-expired' : 'badge-warning'
                      }`}>
                        {p.status === 'approved' ? 'Aktif' : p.status === 'rejected' ? 'Ditolak' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      {p.role !== 'superadmin' && (
                        <div className="flex items-center gap-2">
                          {p.status !== 'approved' && (
                            <button onClick={() => updateStatus(p.id, 'approved')} className="btn btn-success py-1.5 px-3 text-xs">
                              <CheckCircle2 size={13} /> Setuju
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button onClick={() => updateStatus(p.id, 'rejected')} className="btn btn-danger py-1.5 px-3 text-xs">
                              <XCircle size={13} /> Tolak
                            </button>
                          )}
                          <button onClick={() => deleteUser(p.id, p.fullName)} className="btn-icon">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Card list - Mobile */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : filtered.map(p => (
            <div key={p.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold text-gray-500">
                    {p.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{p.fullName}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.employeeId}</p>
                  </div>
                </div>
                <span className={`badge ${
                  p.status === 'approved' ? 'badge-active' :
                  p.status === 'rejected' ? 'badge-expired' : 'badge-warning'
                }`}>
                  {p.status === 'approved' ? 'Aktif' : p.status === 'rejected' ? 'Ditolak' : 'Pending'}
                </span>
              </div>
              {p.role !== 'superadmin' && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {p.status !== 'approved' && (
                    <button onClick={() => updateStatus(p.id, 'approved')} className="btn btn-success flex-1 py-2 text-xs">
                      <CheckCircle2 size={13} /> Setuju
                    </button>
                  )}
                  {p.status !== 'rejected' && (
                    <button onClick={() => updateStatus(p.id, 'rejected')} className="btn btn-danger flex-1 py-2 text-xs">
                      <XCircle size={13} /> Tolak
                    </button>
                  )}
                  <button onClick={() => deleteUser(p.id, p.fullName)} className="btn-icon">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
};
