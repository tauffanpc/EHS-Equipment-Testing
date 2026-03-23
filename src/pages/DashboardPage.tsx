import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { useAuth } from '../App';
import { Equipment, mapDbToEquipment, getRiksaUjiStatus, formatDateShort, getRiksaUjiColor } from '../types';
import { 
  Package, CheckCircle2, AlertTriangle, XCircle, 
  Bell, ChevronRight, Calendar, Clock, TrendingUp
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('equipments').select('*').order('updated_at', { ascending: false });
      if (data) setEquipments(data.map(mapDbToEquipment));
      setLoading(false);
    };
    fetchData();
  }, []);

  const total = equipments.length;
  const good = equipments.filter(e => getRiksaUjiStatus(e.nextInspectionDate) === 'active').length;
  const warning = equipments.filter(e => getRiksaUjiStatus(e.nextInspectionDate) === 'warning').length;
  const expired = equipments.filter(e => getRiksaUjiStatus(e.nextInspectionDate) === 'expired').length;
  const unknown = equipments.filter(e => getRiksaUjiStatus(e.nextInspectionDate) === 'unknown').length;

  const warningEquipments = equipments.filter(e => getRiksaUjiStatus(e.nextInspectionDate) === 'warning');
  const expiredEquipments = equipments.filter(e => getRiksaUjiStatus(e.nextInspectionDate) === 'expired');
  const recentEquipments = [...equipments].slice(0, 6);

  const stats = [
    { label: 'Total Peralatan', value: total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Riksa Uji Aktif', value: good, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Segera Habis', value: warning, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Expired', value: expired, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selamat datang, {user?.fullName?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{today}</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <Calendar size={15} className="text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{today}</span>
          </div>
        </div>

        {/* Notifikasi Banner */}
        {(expiredEquipments.length > 0 || warningEquipments.length > 0) && (
          <div className="space-y-3">
            {expiredEquipments.length > 0 && (
              <div className="notif-banner notif-danger">
                <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {expiredEquipments.length} peralatan riksa uji sudah EXPIRED
                  </p>
                  <p className="text-xs mt-0.5 opacity-80">
                    {expiredEquipments.slice(0, 3).map(e => e.equipmentNo).join(', ')}
                    {expiredEquipments.length > 3 && ` dan ${expiredEquipments.length - 3} lainnya`}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/inventory?filter=expired')}
                  className="text-xs font-semibold underline flex-shrink-0"
                >
                  Lihat Semua
                </button>
              </div>
            )}
            {warningEquipments.length > 0 && (
              <div className="notif-banner notif-warning">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {warningEquipments.length} peralatan riksa uji kurang dari 3 bulan
                  </p>
                  <p className="text-xs mt-0.5 opacity-80">
                    {warningEquipments.slice(0, 3).map(e => e.equipmentNo).join(', ')}
                    {warningEquipments.length > 3 && ` dan ${warningEquipments.length - 3} lainnya`}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/inventory?filter=warning')}
                  className="text-xs font-semibold underline flex-shrink-0"
                >
                  Lihat Semua
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon size={18} className={stat.color} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{loading ? '-' : stat.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Peralatan perlu perhatian */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="section-divider">
                <h2 className="text-sm font-bold text-gray-900">Perlu Perhatian</h2>
              </div>
              <button
                onClick={() => navigate('/inventory')}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                Lihat Semua <ChevronRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : expiredEquipments.length === 0 && warningEquipments.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Semua riksa uji dalam kondisi baik</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...expiredEquipments, ...warningEquipments].slice(0, 6).map(e => {
                  const status = getRiksaUjiStatus(e.nextInspectionDate);
                  const color = getRiksaUjiColor(status);
                  return (
                    <div
                      key={e.id}
                      onClick={() => navigate(`/inventory/${e.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{e.equipmentNo}</p>
                        <p className="text-xs text-gray-500 truncate">{e.equipmentName} · {e.department}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`badge badge-${status === 'expired' ? 'expired' : 'warning'}`}>
                          {status === 'expired' ? 'Expired' : 'Segera Habis'}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDateShort(e.nextInspectionDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aktivitas terbaru */}
          <div className="card p-5">
            <div className="section-divider mb-4">
              <h2 className="text-sm font-bold text-gray-900">Aktivitas Terbaru</h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : recentEquipments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {recentEquipments.map(e => (
                  <div
                    key={e.id}
                    onClick={() => navigate(`/inventory/${e.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.equipmentNo}</p>
                      <p className="text-xs text-gray-400 truncate">{formatDateShort(e.updatedAt)}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/register-equipment')}
              className="btn btn-primary w-full mt-4 py-2.5 text-sm"
            >
              + Registrasi Peralatan
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {!loading && total > 0 && (
          <div className="card p-5">
            <div className="section-divider mb-4">
              <h2 className="text-sm font-bold text-gray-900">Ringkasan Riksa Uji</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Aktif', value: good, total, color: 'bg-emerald-500' },
                { label: 'Segera Habis', value: warning, total, color: 'bg-amber-500' },
                { label: 'Expired', value: expired, total, color: 'bg-red-500' },
                { label: 'Belum Diisi', value: unknown, total, color: 'bg-gray-300' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 font-medium">{item.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
