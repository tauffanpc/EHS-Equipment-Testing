import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode } from 'lucide-react';
import { QRScanner } from '../components/QRScanner';
import { EquipmentDetail } from '../components/EquipmentDetail';
import { Equipment } from '../types';

export const PublicScannerPage: React.FC = () => {
  const [view, setView] = useState<'scan' | 'detail'>('scan');
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const navigate = useNavigate();

  const handleScan = React.useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .eq('equipment_no', id)
      .single();

    if (error || !data) {
      alert('Equipment not found');
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
        lastInspectionDate: data.last_inspection_date || data.specs?.last_inspection_date,
        validityPeriod: data.validity_period || data.specs?.validity_period,
        nextInspectionDate: data.next_inspection_date || data.specs?.next_inspection_date,
        updatedAt: data.updated_at,
        updatedBy: data.updated_by
      };
      setSelectedEquip(mappedData);
      setView('detail');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <header className="max-w-7xl mx-auto w-full py-6 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-emerald-200">
            <QrCode size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight leading-none">EquipTrack</h1>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Public Scanner</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2"
        >
          <ChevronLeft size={18} /> Back to Login
        </button>
      </header>

      <main className="max-w-5xl mx-auto w-full">
        {view === 'scan' ? (
          <QRScanner onScan={handleScan} onBack={() => navigate('/login')} />
        ) : selectedEquip ? (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-700 text-sm flex items-center gap-3">
              <QrCode size={18} />
              Viewing in Public Mode. Login to update inspection status.
            </div>
            <EquipmentDetail 
              equipment={selectedEquip} 
              onBack={() => setView('scan')} 
              onUpdate={() => alert('Please login to update status')} 
            />
          </div>
        ) : null}
      </main>
    </div>
  );
};
