import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { 
  Box, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  Calendar,
  Plus,
  QrCode,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Equipment } from '../types';
import { cn } from '../utils/cn';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState([
    { label: 'Total Assets', value: 0, icon: Box, color: 'text-slate-900' },
    { label: 'Operational', value: 0, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Attention', value: 0, icon: AlertTriangle, color: 'text-amber-600' },
    { label: 'Critical', value: 0, icon: Activity, color: 'text-red-600' },
  ]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: equipments } = await supabase
        .from('equipments')
        .select('*');
      
      if (equipments) {
        const total = equipments.length;
        const good = equipments.filter(e => e.status === 'Good').length;
        const warning = equipments.filter(e => e.status === 'Needs Repair').length;
        const danger = equipments.filter(e => e.status === 'Critical').length;

        setStats([
          { label: 'Total Assets', value: total, icon: Box, color: 'text-slate-900' },
          { label: 'Operational', value: good, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Attention', value: warning, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Critical', value: danger, icon: Activity, color: 'text-red-600' },
        ]);

        // Get recent activity
        const recent = [...equipments]
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)
          .map(e => ({
            id: e.id,
            equipmentNo: e.equipment_no,
            category: e.category,
            action: e.created_at === e.updated_at ? 'Registered' : 'Updated',
            timestamp: e.updated_at
          }));
        
        setRecentActions(recent);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full space-y-10">
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="label-micro text-emerald-600">System Online</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 font-medium">Welcome back. Here's what's happening with your assets today.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-2 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Date</p>
              <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Calendar size={20} />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-y border-slate-200 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group"
              >
                <div className="relative space-y-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:shadow-lg group-hover:-translate-y-1", 
                    stat.color.replace('text-', 'bg-').replace('600', '50')
                  )}>
                    <stat.icon size={28} className={stat.color} />
                  </div>
                  <div>
                    <p className="label-micro text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                      <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Units</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Recent Activity */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Recent Activity</h2>
              </div>
              <button 
                onClick={() => navigate('/inventory')} 
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest border-b border-emerald-200 pb-1"
              >
                View All Assets
              </button>
            </div>
            
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {recentActions.length > 0 ? (
                recentActions.map((action, idx) => (
                  <motion.div 
                    key={action.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="py-8 hover:bg-slate-50/50 transition-colors flex items-center gap-8 group cursor-pointer px-2"
                    onClick={() => navigate(`/inventory?id=${action.id}`)}
                  >
                    <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                      <QrCode size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-slate-900 tracking-tight">{action.equipmentNo}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-500 rounded uppercase tracking-widest">{action.category}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        {action.action === 'Registered' ? 'New asset successfully registered in the database' : 'Asset inspection status updated by personnel'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">
                        {new Date(action.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="label-micro text-slate-400">
                        {new Date(action.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <p className="label-micro">No recent activity recorded</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / System Health */}
          <div className="lg:col-span-4 space-y-12">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">System</h2>
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="label-micro text-slate-400 uppercase tracking-widest">Database Integrity</p>
                    <p className="text-xs font-bold text-emerald-500">SECURE</p>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="label-micro text-slate-400 uppercase tracking-widest">Uptime</p>
                    <p className="text-xl font-bold text-slate-900">99.9%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="label-micro text-slate-400 uppercase tracking-widest">Latency</p>
                    <p className="text-xl font-bold text-slate-900">24ms</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <button 
                    onClick={() => navigate('/register-equipment')}
                    className="w-full btn-primary py-5 text-sm rounded-2xl shadow-xl shadow-slate-200"
                  >
                    <Plus size={18} /> Register New Asset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
