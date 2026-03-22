import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Equipment } from '../types';
import { cn } from '../utils/cn';
import { EquipmentCard } from '../components/EquipmentCard';
import { AddEquipmentForm } from '../components/AddEquipmentForm';
import { QRScanner } from '../components/QRScanner';
import { EquipmentDetail } from '../components/EquipmentDetail';
import { Layout } from '../components/Layout';
import { useLocation } from 'react-router-dom';

export const InventoryPage: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'add' | 'scan' | 'detail'>('list');
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    if (viewParam === 'scan') {
      setView('scan');
    } else if (viewParam === 'add') {
      setView('add');
    } else {
      setView('list');
    }
  }, [location.search]);

  const fetchEquipments = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching equipments:', error);
    } else {
      // Map database fields to our Equipment type
      const mappedData: Equipment[] = data.map(item => ({
        id: item.id,
        equipmentNo: item.equipment_no,
        equipmentName: item.equipment_name || item.specs?.equipment_name || '',
        equipmentType: item.equipment_type || item.specs?.equipment_type || '',
        category: item.category,
        department: item.department || item.specs?.department || '',
        specs: item.specs || {},
        status: item.status || 'Good',
        qrUrl: item.qr_url,
        lastInspectionDate: item.last_inspection_date || item.specs?.last_inspection_date,
        validityPeriod: item.validity_period || item.specs?.validity_period,
        nextInspectionDate: item.next_inspection_date || item.specs?.next_inspection_date,
        updatedAt: item.updated_at,
        updatedBy: item.updated_by,
        inspections: item.inspections || []
      }));
      setEquipments(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
        fetchEquipments();
      }
    };

    checkUser();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate, fetchEquipments]);

  const addEquipment = async (newEquip: Equipment) => {
    const { error } = await supabase
      .from('equipments')
      .insert([{
        equipment_no: newEquip.equipmentNo,
        equipment_name: newEquip.equipmentName,
        equipment_type: newEquip.equipmentType,
        category: newEquip.category,
        department: newEquip.department,
        specs: newEquip.specs,
        status: newEquip.status,
        qr_url: newEquip.qrUrl,
        last_inspection_date: newEquip.lastInspectionDate,
        validity_period: newEquip.validityPeriod,
        next_inspection_date: newEquip.nextInspectionDate,
        updated_at: new Date().toISOString(),
        updated_by: user?.user_metadata?.full_name || user?.user_metadata?.employee_id || 'Admin',
        inspections: newEquip.inspections || []
      }]);

    if (error) {
      alert('Error adding equipment: ' + error.message);
    } else {
      fetchEquipments();
      setView('list');
    }
  };

  const updateEquipment = async (updated: Equipment) => {
    const { error } = await supabase
      .from('equipments')
      .update({
        status: updated.status,
        department: updated.department,
        inspections: updated.inspections,
        updated_at: new Date().toISOString(),
        updated_by: user?.user_metadata?.full_name || user?.user_metadata?.employee_id || 'Petugas'
      })
      .eq('id', updated.id);

    if (error) {
      alert('Error updating equipment: ' + error.message);
    } else {
      fetchEquipments();
      setSelectedEquip(updated);
    }
  };

  const handleScan = React.useCallback((id: string) => {
    const found = equipments.find(e => e.equipmentNo === id);
    if (found) {
      setSelectedEquip(found);
      setView('detail');
    } else {
      alert('Equipment not found');
    }
  }, [equipments]);

  const handleBack = React.useCallback(() => setView('list'), []);

  const filteredEquipments = equipments.filter(e => 
    e.equipmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedEquipments = filteredEquipments.reduce((acc, equip) => {
    if (!acc[equip.category]) {
      acc[equip.category] = [];
    }
    acc[equip.category].push(equip);
    return acc;
  }, {} as Record<string, Equipment[]>);

  const DesktopTableView = ({ items }: { items: Equipment[] }) => (
    <div className="border-t border-slate-100">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-6 label-micro text-slate-400 uppercase tracking-widest">No. Alat</th>
            <th className="px-4 py-6 label-micro text-slate-400 uppercase tracking-widest">Nama Peralatan</th>
            <th className="px-4 py-6 label-micro text-slate-400 uppercase tracking-widest">Tipe</th>
            <th className="px-4 py-6 label-micro text-slate-400 uppercase tracking-widest">Departemen</th>
            <th className="px-4 py-6 label-micro text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-4 py-6 label-micro text-slate-400 uppercase tracking-widest">Next Inspection</th>
            <th className="px-4 py-6 label-micro text-slate-400 uppercase tracking-widest text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((equip) => (
            <tr 
              key={equip.id} 
              className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
              onClick={() => {
                setSelectedEquip(equip);
                setView('detail');
              }}
            >
              <td className="px-4 py-6">
                <span className="font-bold text-slate-900 tracking-tight text-lg">{equip.equipmentNo}</span>
              </td>
              <td className="px-4 py-6">
                <span className="font-bold text-slate-600">{equip.equipmentName}</span>
              </td>
              <td className="px-4 py-6">
                <span className="text-sm font-medium text-slate-500">{equip.equipmentType || '-'}</span>
              </td>
              <td className="px-4 py-6">
                <span className="text-sm font-medium text-slate-500">{equip.department || '-'}</span>
              </td>
              <td className="px-4 py-6">
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  equip.status === 'Good' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                  equip.status === 'Needs Repair' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {equip.status}
                </div>
              </td>
              <td className="px-4 py-6">
                <span className="text-sm font-bold text-slate-900">
                  {equip.nextInspectionDate ? new Date(equip.nextInspectionDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                </span>
              </td>
              <td className="px-4 py-6 text-right">
                <button className="p-2 text-slate-300 group-hover:text-slate-900 transition-colors">
                  <Plus size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full space-y-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[2px] bg-emerald-500 rounded-full" />
              <span className="label-micro text-emerald-600">Asset Management</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Inventory List</h1>
            <p className="text-slate-500 font-medium max-w-md">
              Monitor and manage your equipment assets in real-time. Use the search and filters to find specific units.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by ID or Category..."
                className="input-field pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => navigate('/register-equipment')}
              className="btn-primary"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Register Asset</span>
              <span className="sm:hidden">Register</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-16"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                    <div className="w-16 h-16 border-4 border-t-emerald-500 rounded-full animate-spin absolute top-0 left-0" />
                  </div>
                  <p className="label-micro">Synchronizing Database...</p>
                </div>
              ) : Object.keys(groupedEquipments).length > 0 ? (
                (Object.entries(groupedEquipments) as [string, Equipment[]][]).map(([category, items], idx) => (
                  <motion.div 
                    key={category} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-6">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
                        {category}
                      </h2>
                      <div className="h-px flex-1 bg-slate-100" />
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                          {items.length} UNITS
                        </span>
                      </div>
                    </div>
                    
                    {isMobile ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {items.map(equip => (
                          <EquipmentCard 
                            key={equip.id} 
                            equipment={equip} 
                            onClick={() => {
                              setSelectedEquip(equip);
                              setView('detail');
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <DesktopTableView items={items} />
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="py-32 text-center flex flex-col items-center border-t border-slate-100">
                  <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-8 border border-slate-100">
                    <QrCode size={48} />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">No Assets Found</h3>
                  <p className="text-slate-500 mt-4 max-w-xs mx-auto font-medium">We couldn't find any equipment matching your current search criteria or category.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      navigate('/register-equipment');
                    }}
                    className="mt-12 btn-primary px-10 py-4 rounded-2xl shadow-xl shadow-slate-200"
                  >
                    <Plus size={18} /> Register New Asset
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'detail' && selectedEquip && (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <EquipmentDetail 
                equipment={selectedEquip} 
                onBack={() => setView('list')}
                onUpdate={updateEquipment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};
