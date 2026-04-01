import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import KioskPage from './pages/KioskPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import MembersPage from './pages/MembersPage';
import AttendancePage from './pages/AttendancePage';
import PaymentPage from './pages/PaymentPage';
import SuperAdminPage from './pages/SuperAdminPage';



// 일반 도장 관리자 전용 가드
const GymAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useStore((state) => state.isAuthenticated);
  const role = useStore((state) => state.userRole);
  
  if (!isAuth) return <Navigate to="/login" replace />;
  // 만약 통합 관리자 계정이라면 도장 화면 진입 시 통제 (혹은 허용 가능 설계에 따라)
  if (role === 'SUPER_ADMIN') return <Navigate to="/superadmin" replace />;
  
  return <>{children}</>;
};

// 통합 관리자 전용 가드
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useStore((state) => state.isAuthenticated);
  const role = useStore((state) => state.userRole);
  if (!isAuth || role !== 'SUPER_ADMIN') return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const theme = useStore(state => state.theme);
  
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/kiosk" element={<GymAdminRoute><KioskPage /></GymAdminRoute>} />
      
      {/* 도장 전용 대시보드 - Multi Tenant */}
      <Route 
        path="/admin" 
        element={
          <GymAdminRoute>
            <AdminLayout />
          </GymAdminRoute>
        } 
      >
        <Route index element={<Navigate to="/admin/members" replace />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="payments" element={<PaymentPage />} />
      </Route>

      {/* 슈퍼 관리자(본사) 대시보드 */}
      <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>} />
    </Routes>
  );
}

export default App;
