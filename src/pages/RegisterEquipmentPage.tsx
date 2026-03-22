import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AddEquipmentForm } from '../components/AddEquipmentForm';
import { Equipment } from '../types';
import { motion } from 'motion/react';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { cn } from '../utils/cn';

export const RegisterEquipmentPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const addEquipment = async (newEquip: Equipment) => {
    const { error } = await supabase
      .from('equipments')
      .insert([{
        equipment_no: newEquip.equipmentNo,
        category: newEquip.category,
        specs: {
          ...newEquip.specs,
          equipment_name: newEquip.equipmentName,
          equipment_type: newEquip.equipmentType,
          department: newEquip.department,
          last_inspection_date: newEquip.lastInspectionDate,
          validity_period: newEquip.validityPeriod,
          next_inspection_date: newEquip.nextInspectionDate,
        },
        status: newEquip.status,
        qr_url: newEquip.qrUrl,
        updated_by: user?.user_metadata?.full_name || user?.user_metadata?.employee_id || 'Admin'
      }]);

    if (error) {
      console.error('Error adding equipment:', error);
      alert('Error adding equipment: ' + error.message);
    }
  };

  if (loading) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 shrink-0">
              <PlusCircle size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none mb-2">Register Asset</h1>
              <p className="text-slate-500 font-medium text-lg">Kelola pendaftaran aset peralatan baru Anda secara efisien.</p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-50">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-400" />
            <span className="label-micro text-emerald-700">Sistem Siap</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <AddEquipmentForm 
            onAdd={addEquipment} 
            onCancel={() => navigate('/inventory')} 
            isMobile={isMobile}
          />
        </motion.div>
      </div>
    </Layout>
  );
};
