import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Equipment, mapDbToEquipment, getRiksaUjiStatus, getRiksaUjiColor, riksaUjiStatusLabel, formatDate } from '../types';
import { QrCode, LogIn, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';

export const EquipmentPublicPage: React.FC = () => {
  const { equipmentNo } = useParams<{ equipmentNo: string }>();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!equipmentNo) return;
      const { data, error } = await supabase.from('equipments').select('*').eq('equipment_no', equipmentNo).single();
      if (error || !data) { setError(true); } else { setEquipment(mapDbToEquipment(data)); }
      setLoading(false);
    };
    fetch();
  }, [equipmentNo]);

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={36} />
    </div>
  );

  if (error || !equipment) return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Peralatan Tidak Ditemukan</h1>
      <p className="text-gray-500 text-sm mb-6">Nomor peralatan "{equipmentNo}" tidak ada dalam sistem.</p>
      <button onClick={() => navigate('/public-scan')} className="btn btn-primary">Scan Ulang</button>
    </div>
  );

  const riksaStatus = getRiksaUjiStatus(equipment.nextInspectionDate);
  const riksaColor = getRiksaUjiColor(riksaStatus);

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <div className="bg-[#0D1117] px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white mr-1">
            <ChevronLeft size={20} />
          </button>
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <QrCode size={14} className="text-white" />
          </div>
          <p className="text-white font-bold text-sm">EHS Equipment Testing</p>
        </div>
        <button onClick={() => navigate('/login')} className="btn btn-secondary py-1.5 px-3 text-xs">
          <LogIn size={13} /> Login
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Status Banner */}
        <div className={`notif-banner ${riksaStatus === 'expired' ? 'notif-danger' : riksaStatus === 'warning' ? 'notif-warning' : 'notif-info'}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${riksaColor.dot}`} />
          <div>
            <p className="font-semibold text-sm">Status Riksa Uji: {riksaUjiStatusLabel[riksaStatus]}</p>
            {equipment.nextInspectionDate && (
              <p className="text-xs opacity-80 mt-0.5">
                {riksaStatus === 'expired' ? 'Sudah lewat' : 'Jatuh tempo'}: {formatDate(equipment.nextInspectionDate)}
              </p>
            )}
          </div>
        </div>

        {/* Equipment Info */}
        <div className="card p-5">
          <div className="mb-4">
            <p className="text-2xl font-bold text-gray-900 font-mono">{equipment.equipmentNo}</p>
            <p className="text-gray-500 font-medium">{equipment.equipmentName}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Kategori', value: equipment.category },
              { label: 'Departemen', value: equipment.department || '-' },
              { label: 'Tipe', value: equipment.equipmentType || '-' },
              { label: 'Merk', value: equipment.brand || '-' },
              { label: 'Riksa Uji Terakhir', value: formatDate(equipment.lastInspectionDate) },
              { label: 'Masa Berlaku', value: equipment.validityPeriod || '-' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Login CTA */}
        <div className="card p-4 border border-blue-100 bg-blue-50/50">
          <p className="text-sm font-semibold text-blue-800 mb-3">
            Anda seorang petugas? Login untuk mengupdate status dan riwayat riksa uji.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary w-full">
            <LogIn size={15} /> Login sebagai Petugas
          </button>
        </div>
      </div>
    </div>
  );
};
