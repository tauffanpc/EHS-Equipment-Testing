import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { Equipment, Inspection, mapDbToEquipment, mapEquipmentToDb, getRiksaUjiStatus, getRiksaUjiColor, riksaUjiStatusLabel, formatDate, formatDateShort } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { ChevronLeft, Download, ShieldCheck, CheckCircle2, Clock, User, Package, Wrench, Calendar, Building2, Tag } from 'lucide-react';

export const EquipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<'Good' | 'Needs Repair' | 'Critical'>('Good');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('equipments').select('*').eq('id', id).single();
      if (error || !data) { toast.error('Peralatan tidak ditemukan'); navigate('/inventory'); return; }
      const mapped = mapDbToEquipment(data);
      setEquipment(mapped);
      setNewStatus(mapped.status);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const downloadQR = () => {
    if (!qrRef.current || !equipment) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const fc = document.createElement('canvas');
    const ctx = fc.getContext('2d');
    if (!ctx) return;
    const pad = 60;
    fc.width = canvas.width + pad * 2;
    fc.height = canvas.height + pad * 2 + 160;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, fc.width, fc.height);
    ctx.drawImage(canvas, pad, pad);
    ctx.fillStyle = '#0D1117';
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('EHS Equipment Testing', fc.width / 2, canvas.height + pad + 50);
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(equipment.equipmentNo, fc.width / 2, canvas.height + pad + 120);
    const a = document.createElement('a');
    a.download = `QR-${equipment.equipmentNo}.png`;
    a.href = fc.toDataURL('image/png', 1.0);
    a.click();
  };

  const handleUpdate = async () => {
    if (!equipment || !user) return;
    setSaving(true);
    const newInspection: Inspection = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      status: newStatus,
      notes,
      performedBy: user.fullName || user.employeeId,
      type: `Riksa Uji ${(equipment.inspections?.length || 0) + 1}`,
    };
    const updated: Equipment = {
      ...equipment,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user.fullName || user.employeeId,
      inspections: [newInspection, ...(equipment.inspections || [])],
    };
    const { error } = await supabase
      .from('equipments')
      .update(mapEquipmentToDb(updated, user.fullName || ''))
      .eq('id', equipment.id);
    if (error) {
      toast.error('Gagal menyimpan: ' + error.message);
    } else {
      toast.success('Status berhasil diperbarui');
      setEquipment(updated);
      setUpdating(false);
      setNotes('');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64"><div className="spinner" /></div>
      </Layout>
    );
  }

  if (!equipment) return null;

  const riksaStatus = getRiksaUjiStatus(equipment.nextInspectionDate);
  const riksaColor = getRiksaUjiColor(riksaStatus);
  const qrValue = `${window.location.origin}/scan/${equipment.equipmentNo}`;

  const infoItems = [
    { icon: Tag, label: 'Nomor Peralatan', value: equipment.equipmentNo },
    { icon: Package, label: 'Kategori', value: equipment.category },
    { icon: Wrench, label: 'Tipe / Model', value: equipment.equipmentType || '-' },
    { icon: Building2, label: 'Merk', value: equipment.brand || '-' },
    { icon: Calendar, label: 'Tahun Pembuatan', value: equipment.manufactureYear || '-' },
    { icon: Building2, label: 'Departemen', value: equipment.department || '-' },
  ];

  const specItems = Object.entries(equipment.specs).filter(([, v]) => v);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Back + Header */}
        <div>
          <button onClick={() => navigate('/inventory')} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm font-medium mb-4 transition-colors">
            <ChevronLeft size={16} /> Kembali ke Inventory
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900 font-mono">{equipment.equipmentNo}</h1>
                <span className={`badge badge-${riksaStatus}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${riksaColor.dot}`} />
                  {riksaUjiStatusLabel[riksaStatus]}
                </span>
              </div>
              <p className="text-gray-500 font-medium">{equipment.equipmentName}</p>
            </div>
            {!updating && (
              <button onClick={() => setUpdating(true)} className="btn btn-primary self-start">
                <ShieldCheck size={16} /> Update Status
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: Info + Inspeksi */}
          <div className="lg:col-span-2 space-y-5">

            {/* Info Grid */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-800 text-sm section-divider mb-4">Informasi Peralatan</h2>
              <div className="grid grid-cols-2 gap-4">
                {infoItems.map(item => (
                  <div key={item.label} className="space-y-1">
                    <p className="label-xs text-gray-400">{item.label}</p>
                    <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Riksa Uji Info */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-800 text-sm section-divider mb-4">Jadwal Riksa Uji</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="label-xs text-gray-400">Riksa Uji Terakhir</p>
                  <p className="font-semibold text-gray-800 text-sm">{formatDate(equipment.lastInspectionDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="label-xs text-gray-400">Masa Berlaku</p>
                  <p className="font-semibold text-gray-800 text-sm">{equipment.validityPeriod || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="label-xs text-gray-400">Riksa Uji Berikutnya</p>
                  <p className={`font-bold text-sm ${riksaStatus === 'expired' ? 'text-red-600' : riksaStatus === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatDate(equipment.nextInspectionDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Spesifikasi Teknis */}
            {specItems.length > 0 && (
              <div className="card p-5">
                <h2 className="font-bold text-gray-800 text-sm section-divider mb-4">Spesifikasi Teknis</h2>
                <div className="grid grid-cols-2 gap-4">
                  {specItems.map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="label-xs text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="font-semibold text-gray-800 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update Form */}
            {updating && (
              <div className="card p-5 border-blue-200 bg-blue-50/30 space-y-4">
                <h2 className="font-bold text-gray-800 text-sm section-divider">Update Kondisi</h2>
                <div className="grid grid-cols-3 gap-2">
                  {(['Good', 'Needs Repair', 'Critical'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        newStatus === s
                          ? s === 'Good' ? 'bg-emerald-500 border-emerald-500 text-white'
                          : s === 'Needs Repair' ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-red-500 border-red-500 text-white'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {s === 'Good' ? '✓ Baik' : s === 'Needs Repair' ? '⚠ Perlu Perbaikan' : '✕ Kritis'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="label-xs text-gray-400 block mb-1.5">Catatan Inspeksi</label>
                  <textarea
                    className="input-field min-h-[80px] resize-none"
                    placeholder="Catat hasil pemeriksaan..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setUpdating(false)} className="btn btn-secondary flex-1">Batal</button>
                  <button onClick={handleUpdate} disabled={saving} className="btn btn-primary flex-[2]">
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            )}

            {/* Riwayat Riksa Uji */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-800 text-sm section-divider mb-4">
                Riwayat Riksa Uji ({equipment.inspections?.length || 0})
              </h2>
              {equipment.inspections && equipment.inspections.length > 0 ? (
                <div className="space-y-3">
                  {equipment.inspections.map(insp => (
                    <div key={insp.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        insp.status === 'Good' ? 'bg-emerald-500' :
                        insp.status === 'Needs Repair' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-800">{insp.type}</p>
                          <p className="text-xs text-gray-400">{formatDateShort(insp.date)}</p>
                        </div>
                        <p className="text-xs text-gray-500">{insp.notes || 'Tidak ada catatan'}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <User size={10} /> {insp.performedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Clock size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Belum ada riwayat riksa uji</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: QR + System Log */}
          <div className="space-y-5">
            {/* QR Code */}
            <div className="card p-5 text-center">
              <h2 className="font-bold text-gray-800 text-sm section-divider mb-4 justify-center">QR Code</h2>
              <div ref={qrRef} className="inline-flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-200 mb-3">
                <QRCodeCanvas value={qrValue} size={160} level="H" includeMargin={false} />
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-3">EHS Equipment Testing</p>
                <p className="text-sm font-bold text-gray-900">{equipment.equipmentNo}</p>
              </div>
              <button onClick={downloadQR} className="btn btn-success w-full">
                <Download size={15} /> Download QR
              </button>
              <p className="text-[10px] text-gray-400 mt-2 break-all">{qrValue}</p>
            </div>

            {/* System Log */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-800 text-sm section-divider mb-4">Log Sistem</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Diperbarui oleh</span>
                  <span className="font-medium text-gray-700 text-xs">{equipment.updatedBy || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Terakhir diperbarui</span>
                  <span className="font-medium text-gray-700 text-xs">{formatDateShort(equipment.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Terdaftar pada</span>
                  <span className="font-medium text-gray-700 text-xs">{formatDateShort(equipment.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
