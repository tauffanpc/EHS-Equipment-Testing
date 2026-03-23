import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { Equipment, mapDbToEquipment, getRiksaUjiStatus, getRiksaUjiColor, riksaUjiStatusLabel, formatDateShort } from '../types';
import { Search, Filter, Plus, Download, ChevronRight, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

type FilterStatus = 'all' | 'active' | 'warning' | 'expired' | 'unknown';

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>((searchParams.get('filter') as FilterStatus) || 'all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('equipments').select('*').order('created_at', { ascending: false });
      if (data) setEquipments(data.map(mapDbToEquipment));
      setLoading(false);
    };
    fetchData();
  }, []);

  const categories = useMemo(() => ['all', ...Array.from(new Set(equipments.map(e => e.category)))], [equipments]);
  const departments = useMemo(() => ['all', ...Array.from(new Set(equipments.map(e => e.department).filter(Boolean)))], [equipments]);

  const filtered = useMemo(() => {
    return equipments.filter(e => {
      const status = getRiksaUjiStatus(e.nextInspectionDate);
      const matchSearch = !search ||
        e.equipmentNo.toLowerCase().includes(search.toLowerCase()) ||
        e.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || status === filterStatus;
      const matchCategory = filterCategory === 'all' || e.category === filterCategory;
      const matchDept = filterDept === 'all' || e.department === filterDept;
      return matchSearch && matchStatus && matchCategory && matchDept;
    });
  }, [equipments, search, filterStatus, filterCategory, filterDept]);

  const exportExcel = () => {
    const rows = filtered.map(e => ({
      'No. Peralatan': e.equipmentNo,
      'Nama Peralatan': e.equipmentName,
      'Kategori': e.category,
      'Tipe': e.equipmentType,
      'Merk': e.brand,
      'Tahun Buat': e.manufactureYear,
      'Departemen': e.department,
      'Status Kondisi': e.status,
      'Tgl Riksa Uji Terakhir': e.lastInspectionDate || '-',
      'Masa Berlaku': e.validityPeriod || '-',
      'Tgl Riksa Uji Berikutnya': e.nextInspectionDate || '-',
      'Status Riksa Uji': riksaUjiStatusLabel[getRiksaUjiStatus(e.nextInspectionDate)],
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `EHS_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const statusTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'active', label: 'Aktif' },
    { key: 'warning', label: 'Segera Habis' },
    { key: 'expired', label: 'Expired' },
    { key: 'unknown', label: 'Belum Diisi' },
  ];

  return (
    <Layout>
      <div className="space-y-5 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-500 text-sm mt-0.5">{filtered.length} dari {equipments.length} peralatan</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="btn btn-secondary hidden lg:flex">
              <Download size={15} /> Export Excel
            </button>
            <button onClick={() => navigate('/register-equipment')} className="btn btn-primary">
              <Plus size={15} />
              <span className="hidden sm:inline">Registrasi</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="card p-4 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor, nama, departemen..."
                className="input-field pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-icon ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
            >
              <Filter size={16} />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Kategori</label>
                <select className="input-field" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'Semua Kategori' : c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-xs text-gray-400 block mb-1.5">Departemen</label>
                <select className="input-field" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                  {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'Semua Departemen' : d}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Status tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.key
                    ? 'bg-[#1E3A5F] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="ml-1.5 opacity-70">
                    {equipments.filter(e => getRiksaUjiStatus(e.nextInspectionDate) === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table - PC */}
        <div className="card hidden lg:block overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 font-medium">Tidak ada peralatan ditemukan</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Peralatan</th>
                  <th>Nama & Kategori</th>
                  <th>Departemen</th>
                  <th>Riksa Uji Berikutnya</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const riksaStatus = getRiksaUjiStatus(e.nextInspectionDate);
                  const color = getRiksaUjiColor(riksaStatus);
                  return (
                    <tr key={e.id} onClick={() => navigate(`/inventory/${e.id}`)}>
                      <td>
                        <span className="font-bold text-gray-900 font-mono">{e.equipmentNo}</span>
                      </td>
                      <td>
                        <p className="font-semibold text-gray-800 text-sm">{e.equipmentName || '-'}</p>
                        <p className="text-xs text-gray-400">{e.category}</p>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">{e.department || '-'}</span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-700">
                          {formatDateShort(e.nextInspectionDate)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${riksaStatus}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                          {riksaUjiStatusLabel[riksaStatus]}
                        </span>
                      </td>
                      <td>
                        <ChevronRight size={16} className="text-gray-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Card list - Mobile */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 font-medium">Tidak ada peralatan ditemukan</p>
            </div>
          ) : (
            filtered.map(e => {
              const riksaStatus = getRiksaUjiStatus(e.nextInspectionDate);
              const color = getRiksaUjiColor(riksaStatus);
              return (
                <div
                  key={e.id}
                  onClick={() => navigate(`/inventory/${e.id}`)}
                  className="card p-4 flex items-center gap-3 cursor-pointer"
                >
                  <div className={`w-2 h-12 rounded-full flex-shrink-0 ${color.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 font-mono text-sm">{e.equipmentNo}</p>
                      <span className={`badge badge-${riksaStatus} text-[10px]`}>
                        {riksaUjiStatusLabel[riksaStatus]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{e.equipmentName || '-'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{e.category}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{e.department || '-'}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </div>
              );
            })
          )}
          <button onClick={exportExcel} className="btn btn-secondary w-full">
            <Download size={15} /> Export Excel
          </button>
        </div>

      </div>
    </Layout>
  );
};
