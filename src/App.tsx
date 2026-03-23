import React, { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InventoryPage } from './pages/InventoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { RegisterEquipmentPage } from './pages/RegisterEquipmentPage';
import { PublicScannerPage } from './pages/PublicScannerPage';
import { EquipmentPublicPage } from './pages/EquipmentPublicPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { EquipmentDetailPage } from './pages/EquipmentDetailPage';

// ─── Auth Context ────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  employeeId: string;
  fullName: string;
  role: 'user' | 'superadmin';
  status: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Auth Provider ───────────────────────────────────────────────────────────

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async (supabaseUserId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    if (profile) {
      setUser({
        id: profile.id,
        employeeId: profile.employee_id,
        fullName: profile.full_name,
        role: profile.role,
        status: profile.status,
      });
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id).finally(() => setLoading(false));
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Protected Route ─────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'pending') return <Navigate to="/login?status=pending" replace />;
  if (user.status === 'rejected') return <Navigate to="/login?status=rejected" replace />;
  if (requireAdmin && user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

// ─── Root Redirect ────────────────────────────────────────────────────────────

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.status !== 'approved') return <Navigate to="/login" replace />;
  if (user.role === 'superadmin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/public-scan" element={<PublicScannerPage />} />
        <Route path="/scan/:equipmentNo" element={<EquipmentPublicPage />} />

        {/* Protected routes — all approved users */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute><InventoryPage /></ProtectedRoute>
        } />
        <Route path="/inventory/:id" element={
          <ProtectedRoute><EquipmentDetailPage /></ProtectedRoute>
        } />
        <Route path="/register-equipment" element={
          <ProtectedRoute><RegisterEquipmentPage /></ProtectedRoute>
        } />

        {/* Protected routes — superadmin only */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
        } />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
