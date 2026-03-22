import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Equipment, Inspection } from '../types';
import { EquipmentDetail } from '../components/EquipmentDetail';
import { QrCode, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const EquipmentPublicPage: React.FC = () => {
  const { equipmentNo } = useParams<{ equipmentNo: string }>();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const fetchEquipment = async () => {
      if (!equipmentNo) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('equipment_no', equipmentNo)
        .single();

      if (error || !data) {
        setError('Equipment not found');
      } else {
        const mappedData: Equipment = {
          id: data.id,
          equipmentNo: data.equipment_no,
          equipmentName: data.equipment_name || data.specs?.equipment_name || '',
          equipmentType: data.equipment_type || data.specs?.equipment_type || '',
          category: data.category,
          department: data.department || data.specs?.department || '',
          specs: data.specs || {},
          status: data.status || 'Good',
          qrUrl: data.qr_url,
          lastInspectionDate: data.last_inspection_date,
          validityPeriod: data.validity_period,
          nextInspectionDate: data.next_inspection_date,
          updatedAt: data.updated_at,
          updatedBy: data.updated_by,
          inspections: data.inspections || []
        };
        setEquipment(mappedData);
      }
      setLoading(false);
    };

    fetchEquipment();
  }, [equipmentNo]);

  const handleUpdate = async (updatedEquip: Equipment) => {
    if (!user) {
      alert('Please login to update equipment');
      navigate('/login');
      return;
    }

    const { error } = await supabase
      .from('equipments')
      .update({
        status: updatedEquip.status,
        department: updatedEquip.department,
        inspections: updatedEquip.inspections,
        updated_at: new Date().toISOString(),
        updated_by: user.user_metadata?.full_name || user.email
      })
      .eq('id', updatedEquip.id);

    if (error) {
      alert('Error updating equipment: ' + error.message);
    } else {
      setEquipment(updatedEquip);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={48} />
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Peralatan Tidak Ditemukan</h1>
        <p className="text-slate-500 mb-8">Maaf, kami tidak dapat menemukan data untuk nomor peralatan ini.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Kembali ke Beranda</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <QrCode size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none">EquipTrack</h1>
              <span className="label-micro text-emerald-600">Public Access</span>
            </div>
          </div>
          
          {!user ? (
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
            >
              <LogIn size={18} /> Login Petugas
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{user.user_metadata?.full_name || user.email}</p>
                <p className="label-micro text-emerald-600">Authenticated</p>
              </div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 bg-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Dashboard
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="p-4 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <EquipmentDetail 
            equipment={equipment} 
            onBack={() => navigate('/')} 
            onUpdate={handleUpdate}
            isPublicMode={!user}
          />
        </motion.div>
      </main>
    </div>
  );
};
