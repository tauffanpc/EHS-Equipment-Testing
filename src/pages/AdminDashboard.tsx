import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { motion } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Search,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Layout } from '../components/Layout';

export const AdminDashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
    fetchProfiles();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'superadmin') {
      navigate('/inventory');
      return;
    }
    setCurrentUser(profile);
  };

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setProfiles(profiles.map(p => p.id === id ? { ...p, status } : p));
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;

    // In a real app, you'd also delete the auth user via an edge function or admin API.
    // For now, we'll just delete the profile.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (!error) {
      setProfiles(profiles.filter(p => p.id !== id));
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = profiles.filter(p => p.status === 'pending').length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Stats & Search */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Cari petugas berdasarkan nama atau ID..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl shadow-slate-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Menunggu Persetujuan</p>
              <h3 className="text-3xl font-bold">{pendingCount}</h3>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Clock size={24} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Users size={20} className="text-slate-400" />
            <h2 className="text-lg font-extrabold text-slate-900">Daftar Petugas</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Memuat Data...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100">
              <p className="text-slate-400 font-medium">Tidak ada petugas yang ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => (
                <motion.div 
                  layout
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                >
                  {profile.role === 'superadmin' && (
                    <div className="absolute top-0 right-0 bg-slate-900 text-white text-[8px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-widest">
                      Superadmin
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                      profile.status === 'approved' ? "bg-emerald-500" : 
                      profile.status === 'rejected' ? "bg-red-500" : "bg-amber-500"
                    )}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{profile.full_name}</h3>
                      <p className="text-xs font-mono text-slate-400 mt-1">{profile.employee_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest",
                      profile.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                      profile.status === 'rejected' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {profile.status}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">
                      Dibuat: {new Date(profile.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  {profile.role !== 'superadmin' && (
                    <div className="flex gap-2 pt-4 border-t border-slate-50">
                      {profile.status !== 'approved' && (
                        <button 
                          onClick={() => handleUpdateStatus(profile.id, 'approved')}
                          className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 size={14} /> Setuju
                        </button>
                      )}
                      {profile.status !== 'rejected' && (
                        <button 
                          onClick={() => handleUpdateStatus(profile.id, 'rejected')}
                          className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-1"
                        >
                          <XCircle size={14} /> Tolak
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(profile.id)}
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                        title="Hapus Akun"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
