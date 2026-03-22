import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ChevronLeft, Scan, Info } from 'lucide-react';

interface QRScannerProps {
  onScan: (id: string) => void;
  onBack: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onBack }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 280, height: 280 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Silent error for continuous scanning
      }
    );

    return () => {
      scanner.clear().catch(e => console.error("Scanner cleanup failed", e));
    };
  }, [onScan]);

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="btn-secondary mb-8 border-none bg-transparent hover:bg-slate-100">
        <ChevronLeft size={20} /> Cancel Scan
      </button>

      <div className="glass-card p-10 rounded-[3rem] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <Scan size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Asset Identification</h2>
          <p className="text-slate-500 mt-2 text-sm">Align the QR code within the frame to verify equipment.</p>
        </div>

        <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-900 aspect-square">
          <div id="reader" className="w-full h-full" />
          
          {/* Overlay corners */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl" />
            <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl" />
            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl" />
            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl" />
          </div>
        </div>

        <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 shrink-0">
              <Info size={16} />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scanning allows for instant retrieval of maintenance logs and technical specifications. Ensure adequate lighting for best results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
