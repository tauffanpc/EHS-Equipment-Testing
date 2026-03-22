import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InventoryPage } from './pages/InventoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { RegisterEquipmentPage } from './pages/RegisterEquipmentPage';
import { PublicScannerPage } from './pages/PublicScannerPage';
import { EquipmentPublicPage } from './pages/EquipmentPublicPage';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/register-equipment" element={<RegisterEquipmentPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/public-scan" element={<PublicScannerPage />} />
      <Route path="/scan/:equipmentNo" element={<EquipmentPublicPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
