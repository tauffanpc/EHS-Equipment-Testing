import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { Equipment, EquipmentCategory, ValidityPeriod, calculateNextInspectionDate, mapEquipmentToDb } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle2, Download, Upload, X, ChevronDown, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const CATEGORIES: EquipmentCategory[] = ['Fire Equipment', 'Heavy Equipment', 'Bejana Tekan', 'Tangki Timbun', 'Lain-lain'];
const VALIDITY_OPTIONS: ValidityPeriod[] = ['6 Bulan', '1 Tahun', '2 Tahun', '3 Tahun'];

const PRESSURE_CATEGORIES: EquipmentCategory[] = ['Bejana Tekan', 'Tangki Timbun'];

interface FormData {
  equipmentNo: string;
  equipmentName: string;
  equipmentType: string;
  brand: string;
  manufactureYear: string;
  category: EquipmentCategory;
  department: string;
  lastInspectionDate: string;
  validityPeriod: ValidityPeriod;
  capacity: string;
  volume: string;
  designPressure: string;
  workingPressure: string;
  customCategoryName: string;
}

const emptyForm: FormData = {
  equipmentNo: '', equipmentName: '', equipmentType: '',
  brand: '', manufactureYear: '', category: 'Fire Equipment',
  department: '', lastInspectionDate: '', validityPeriod: '1 Tahun',
  capacity: '', volume: '', designPressure: '', workingPressure: '',
  customCategoryName: '',
};

interface SuccessModalProps {
  equipment: Equipment;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ equipment, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const downloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;
    const pad = 60;
    const textH = 160;
    finalCanvas.width = canvas.width + pad * 2;
    finalCanvas.height = canvas.height + pad * 2 + textH;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(canvas, pad, pad);
    ctx.fillStyle = '#0D1117';
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('EHS Equipment Testing', finalCanvas.width / 2, canvas.height + pad + 50);
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(equipment.equipmentNo, finalCanvas.width / 2, canvas.height + pad + 120);
    const url = finalCanvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.download = `QR-${equipment.equipmentNo}.png`;
    a.href = url;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-emerald-500 p-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-lg">Registrasi Berhasil!</h2>
          <p className="text-emerald-100 text-sm mt-1">{equipment.equipmentNo} telah didaftarkan</p>
        </div>
        <div className="p-6 space-y-4">
          <div ref={qrRef} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
            <QRCodeCanvas value={equipment.qrUrl} size={160} level="H" includeMargin={false} />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3">EHS Equipment Testing</p>
            <p className="text-base font-bold text-gray-900">{equipment.equipmentNo}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Nama</p>
              <p className="font-semibold text-gray-800 truncate">{equipment.equipmentName}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Kategori</p>
              <p className="font-semibold text-gray-800 truncate">{equipment.category}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadQR} className="btn btn-success flex-1">
              <Download size={15} /> Download QR
            </button>
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Tutup
            </button>
          </div>
          <button
            onClick={() => navigate(`/inventory/${equipment.id}`)}
            className="btn btn-primary w-full"
          >
            Lihat Detail Peralatan
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterEquipmentPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [successEquip, setSuccessEquip] = useState<Equipment | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [showImport, setShowImport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const nextDate = form.lastInspectionDate
    ? calculateNextInspectionDate(form.lastInspectionDate, form.validityPeriod)
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.equipmentNo || !form.equipmentName || !form.category || !form.department) {
      toast.error('Lengkapi field wajib: No. Peralatan, Nama, Kategori, Departemen');
      return;
    }
    setLoading(true);
    const qrUrl = `${window.location.origin}/scan/${form.equipmentNo}`;
    const newEquip: Equipment = {
      id: '',
      equipmentNo: form.equipmentNo,
      equipmentName: form.equipmentName,
      equipmentType: form.equipmentType,
      brand: form.brand,
      manufactureYear: form.manufactureYear,
      category: form.category,
      department: form.department,
      specs: {
        ...(PRESSURE_CATEGORIES.includes(form.category) && {
          capacity: form.capacity,
          volume: form.volume,
          designPressure: form.designPressure,
          workingPressure: form.workingPressure,
        }),
        ...(form.category === 'Lain-lain' && { customCategoryName: form.customCategoryName }),
      },
      status: 'Good',
      qrUrl,
      lastInspectionDate: form.lastInspectionDate || undefined,
      validityPeriod: form.lastInspectionDate ? form.validityPeriod : undefined,
      nextInspectionDate: nextDate || undefined,
      inspections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: user?.fullName || user?.employeeId || 'System',
    };

    const dbRow = mapEquipmentToDb(newEquip, user?.fullName || '');
    const { data, error } = await supabase.from('equipments').insert([dbRow]).select().single();

    if (error) {
      toast.error('Gagal menyimpan: ' + error.message);
    } else {
      const saved = { ...newEquip, id: data.id };
      setSuccessEquip(saved);
      setForm(emptyForm);
    }
    setLoading(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      if (rows.length < 2) { toast.error('File Excel kosong atau format tidak sesuai'); return; }
      const headers = rows[0];
      const preview = rows.slice(1).filter(r => r.some(Boolean)).map(r => ({
        equipmentNo: r[0] || '',
        equipmentName: r[1] || '',
        category: r[2] || 'Fire Equipment',
        equipmentType: r[3] || '',
        department: r[4] || '',
        brand: r[5] || '',
        manufactureYear: r[6]?.toString() || '',
      }));
      setImportPreview(preview);
      setShowImport(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleBulkImport = async () => {
    if (importPreview.length === 0) return;
    setLoading(true);
    let success = 0;
    for (const row of importPreview) {
      if (!row.equipmentNo) continue;
      const qrUrl = `${window.location.origin}/scan/${row.equipmentNo}`;
      const equip: Equipment = {
        id: '', equipmentNo: row.equipmentNo, equipmentName: row.equipmentName,
        equipmentType: row.equipmentType, brand: row.brand, manufactureYear: row.manufactureYear,
        category: row.category as EquipmentCategory, department: row.department,
        specs: {}, status: 'Good', qrUrl, inspections: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        updatedBy: user?.fullName || '',
      };
      const { error } = await supabase.from('equipments').insert([mapEquipmentToDb(equip, user?.fullName || '')]);
      if (!error) success++;
    }
    toast.success(`${success} peralatan berhasil diimpor`);
    setShowImport(false);
    setImportPreview([]);
    setLoading(false);
  };

  const isPressure = PRESSURE_CATEGORIES.includes(form.category);
  const isLainlain = form.category === 'Lain-lain';

  return (
    <Layout>
      {successEquip && (
        <SuccessModal equipment={successEquip} onClose={() => setSuccessEquip(null)} />
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Preview Import ({importPreview.length} data)</h2>
              <button onClick={() => { setShowImport(false); setImportPreview([]); }} className="btn-icon">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-5">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Peralatan</th><th>Nama</th><th>Kategori</th>
                    <th>Departemen</th><th>Merk</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((r, i) => (
                    <tr key={i}>
                      <td className="font-mono font-semibold">{r.equipmentNo}</td>
                      <td>{r.equipmentName}</td>
                      <td>{r.category}</td>
                      <td>{r.department}</td>
                      <td>{r.brand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => { setShowImport(false); setImportPreview([]); }} className="btn btn-secondary flex-1">Batal</button>
              <button onClick={handleBulkImport} disabled={loading} className="btn btn-primary flex-1">
                {loading ? 'Mengimpor...' : `Import ${importPreview.length} Data`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrasi Peralatan</h1>
            <p className="text-gray-500 text-sm mt-0.5">Daftarkan peralatan EHS baru ke sistem</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileImport} />
            <button onClick={() => fileRef.current?.click()} className="btn btn-secondary">
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span className="hidden sm:inline">Import Excel</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Bagian 1: Informasi Umum */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-gray-800 text-sm section-divider">Informasi Umum</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Nomor Peralatan *</label>
                <input className="input-field" placeholder="EQ-001" value={form.equipmentNo} onChange={e => set('equipmentNo', e.target.value)} required />
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Kategori *</label>
                <select className="input-field" value={form.category} onChange={e => set('category', e.target.value as EquipmentCategory)} required>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label-xs text-gray-400 block mb-1.5">Nama Peralatan *</label>
                <input className="input-field" placeholder="Contoh: APAR CO2 5KG" value={form.equipmentName} onChange={e => set('equipmentName', e.target.value)} required />
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Tipe / Model</label>
                <input className="input-field" placeholder="Contoh: MT5-CO2" value={form.equipmentType} onChange={e => set('equipmentType', e.target.value)} />
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Merk / Pabrikan</label>
                <input className="input-field" placeholder="Contoh: Yamato" value={form.brand} onChange={e => set('brand', e.target.value)} />
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Tahun Pembuatan</label>
                <input className="input-field" placeholder="2020" type="number" min="1900" max={new Date().getFullYear()} value={form.manufactureYear} onChange={e => set('manufactureYear', e.target.value)} />
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Departemen *</label>
                <input className="input-field" placeholder="Contoh: Produksi" value={form.department} onChange={e => set('department', e.target.value)} required />
              </div>
              {isLainlain && (
                <div className="sm:col-span-2">
                  <label className="label-xs text-gray-400 block mb-1.5">Nama Kategori Custom</label>
                  <input className="input-field" placeholder="Isi nama kategori" value={form.customCategoryName} onChange={e => set('customCategoryName', e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Bagian 2: Riksa Uji (opsional) */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-sm section-divider">Riksa Uji</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Opsional</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Tanggal Riksa Uji Terakhir</label>
                <input className="input-field" type="date" value={form.lastInspectionDate} onChange={e => set('lastInspectionDate', e.target.value)} />
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Masa Berlaku</label>
                <select className="input-field" value={form.validityPeriod} onChange={e => set('validityPeriod', e.target.value as ValidityPeriod)} disabled={!form.lastInspectionDate}>
                  {VALIDITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              {nextDate && (
                <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="label-xs text-blue-600 mb-1">Riksa Uji Berikutnya (otomatis)</p>
                  <p className="font-bold text-blue-900 text-base">
                    {new Date(nextDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bagian 3: Spesifikasi Teknis (dinamis) */}
          {isPressure && (
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-800 text-sm section-divider">Spesifikasi Teknis</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs text-gray-400 block mb-1.5">Kapasitas</label>
                  <input className="input-field" placeholder="Contoh: 5000 L" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
                </div>
                <div>
                  <label className="label-xs text-gray-400 block mb-1.5">Volume</label>
                  <input className="input-field" placeholder="Contoh: 4800 L" value={form.volume} onChange={e => set('volume', e.target.value)} />
                </div>
                <div>
                  <label className="label-xs text-gray-400 block mb-1.5">Design Pressure</label>
                  <input className="input-field" placeholder="Contoh: 15 bar" value={form.designPressure} onChange={e => set('designPressure', e.target.value)} />
                </div>
                <div>
                  <label className="label-xs text-gray-400 block mb-1.5">Working Pressure</label>
                  <input className="input-field" placeholder="Contoh: 10 bar" value={form.workingPressure} onChange={e => set('workingPressure', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" onClick={() => setForm(emptyForm)} className="btn btn-secondary flex-1">
              Reset
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-[2]">
              {loading ? 'Menyimpan...' : 'Simpan Peralatan'}
            </button>
          </div>

        </form>

        {/* Format Excel */}
        <div className="card p-4 bg-gray-50">
          <p className="label-xs text-gray-400 mb-2">Format Excel untuk Import</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Kolom: <span className="font-mono bg-white border border-gray-200 px-1 rounded text-gray-700">No. Peralatan</span>{' '}
            <span className="font-mono bg-white border border-gray-200 px-1 rounded text-gray-700">Nama Peralatan</span>{' '}
            <span className="font-mono bg-white border border-gray-200 px-1 rounded text-gray-700">Kategori</span>{' '}
            <span className="font-mono bg-white border border-gray-200 px-1 rounded text-gray-700">Tipe</span>{' '}
            <span className="font-mono bg-white border border-gray-200 px-1 rounded text-gray-700">Departemen</span>{' '}
            <span className="font-mono bg-white border border-gray-200 px-1 rounded text-gray-700">Merk</span>{' '}
            <span className="font-mono bg-white border border-gray-200 px-1 rounded text-gray-700">Tahun</span>
          </p>
        </div>
      </div>
    </Layout>
  );
};
