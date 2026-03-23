import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Equipment, mapDbToEquipment, getRiksaUjiStatus, getRiksaUjiColor, riksaUjiStatusLabel, formatDate } from '../types';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, LogIn, X, AlertCircle, CheckCircle2, Camera, Upload } from 'lucide-react';

type ViewState = 'scan' | 'result' | 'error';

export const PublicScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('scan');
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScan(decodedText),
        () => {}
      );
    } catch (err) {
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {}
  };

  const handleScan = async (text: string) => {
    await stopScanner();
    setScanning(false);
    // Extract equipment number from URL or use text directly
    const eqNo = text.includes('/scan/') ? text.split('/scan/').pop() : text;
    await fetchEquipment(eqNo || text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;
    try {
      const result = await Html5Qrcode.scanFile(file, false);
      await handleScan(result);
    } catch {
      setErrorMsg('QR code tidak dapat dibaca dari gambar ini.');
      setView('error');
    }
    e.target.value = '';
  };

  const fetchEquipment = async (eqNo: string) => {
    const { data, error } = await supabase
      .from('equipments').select('*').eq('equipment_no', eqNo).single();
    if (error || !data) {
      setErrorMsg(`Peralatan dengan nomor "${eqNo}" tidak ditemukan dalam sistem.`);
      setView('error');
    } else {
      setEquipment(mapDbToEquipment(data));
      setView('result');
    }
  };

  const resetScan = () => {
    setView('scan');
    setEquipment(null);
    setErrorMsg('');
    setTimeout(() => startScanner(), 300);
  };

  const riksaStatus = equipment ? getRiksaUjiStatus(equipment.nextInspectionDate) : 'unknown';
  const riksaColor = equipment ? getRiksaUjiColor(riksaStatus) : getRiksaUjiColor('unknown');

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <div className="bg-[#0D1117] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <QrCode size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">EHS Equipment Testing</p>
            <p className="text-blue-400 text-[10px] uppercase tracking-widest">Public Scanner</p>
          </div>
        </div>
        <button onClick={() => navigate('/login')} className="btn btn-secondary py-2 px-4 text-xs">
          <LogIn size={14} /> Login
        </button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* Scan View */}
        {view === 'scan' && (
          <div className="space-y-4">
            <div className="text-center pt-2">
              <h1 className="text-xl font-bold text-gray-900">Scan QR Peralatan</h1>
              <p className="text-gray-500 text-sm mt-1">Arahkan kamera ke QR code pada peralatan</p>
            </div>

            <div className="card overflow-hidden">
              <div className="relative bg-gray-900 aspect-square">
                <div id="qr-reader" className="w-full h-full" />
                {/* Corner guides */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-blue-500 rounded-tl-lg" style={{borderWidth: '3px'}} />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-blue-500 rounded-tr-lg" style={{borderWidth: '3px'}} />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-blue-500 rounded-bl-lg" style={{borderWidth: '3px'}} />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-blue-500 rounded-br-lg" style={{borderWidth: '3px'}} />
                  </div>
                </div>
                {scanning && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white text-[10px] font-semibold">Scanning</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileRef.current?.click()} className="btn btn-secondary w-full">
                  <Upload size={15} /> Upload Gambar QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result View */}
        {view === 'result' && equipment && (
          <div className="space-y-4">
            <div className={`card p-4 border-l-4 ${riksaStatus === 'expired' ? 'border-red-500' : riksaStatus === 'warning' ? 'border-amber-500' : 'border-emerald-500'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xl font-bold text-gray-900 font-mono">{equipment.equipmentNo}</p>
                  <p className="text-gray-500 font-medium">{equipment.equipmentName}</p>
                </div>
                <span className={`badge badge-${riksaStatus}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${riksaColor.dot}`} />
                  {riksaUjiStatusLabel[riksaStatus]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Kategori', value: equipment.category },
                  { label: 'Departemen', value: equipment.department || '-' },
                  { label: 'Riksa Uji Terakhir', value: formatDate(equipment.lastInspectionDate) },
                  { label: 'Riksa Uji Berikutnya', value: formatDate(equipment.nextInspectionDate) },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                    <p className="font-semibold text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="notif-banner notif-info text-sm">
              <LogIn size={16} className="flex-shrink-0" />
              Login sebagai petugas untuk mengupdate status inspeksi
            </div>

            <div className="flex gap-3">
              <button onClick={resetScan} className="btn btn-secondary flex-1">
                Scan Lagi
              </button>
              <button onClick={() => navigate('/login')} className="btn btn-primary flex-1">
                <LogIn size={15} /> Login
              </button>
            </div>
          </div>
        )}

        {/* Error View */}
        {view === 'error' && (
          <div className="space-y-4">
            <div className="card p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h2 className="font-bold text-gray-900 mb-1">Tidak Ditemukan</h2>
              <p className="text-sm text-gray-500">{errorMsg}</p>
            </div>
            <button onClick={resetScan} className="btn btn-primary w-full">
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
