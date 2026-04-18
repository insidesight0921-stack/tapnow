import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import KioskPage from './pages/KioskPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import MembersPage from './pages/MembersPage';
import AttendancePage from './pages/AttendancePage';
import PaymentPage from './pages/PaymentPage';
import PlanPage from './pages/PlanPage';
import SuperAdminPage from './pages/SuperAdminPage';
import SettingsPage from './pages/SettingsPage';

// 일반 도장 관리자 전용 가드
const GymAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useStore((state) => state.isAuthenticated);
  const role = useStore((state) => state.userRole);
  
  if (!isAuth) return <Navigate to="/login" replace />;
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
  const isLoading = useStore(state => state.isLoading);
  const init = useStore(state => state.init);
  
  useEffect(() => {
    const unsub = init();
    return () => unsub();
  }, [init]);

  // 임시 테스트용: Ctrl + Shift + 9 클릭 시 90명 회원 자동 등록
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Shift 키와 숫자 9를 함께 누르면 e.key가 '9'가 아닌 '(' 등으로 찍히므로 e.code를 사용
      if (e.ctrlKey && e.shiftKey && e.code === 'Digit9') {
        const { addMember } = useStore.getState();
        const storeState = useStore.getState();
        if (!storeState.isAuthenticated || !storeState.gymId) {
          alert('로그인 후에만 테스트 회원을 등록할 수 있습니다.');
          return;
        }
        if (confirm('테스트 회원 90명을 임의로 추가하시겠습니까? (삭제 시 일괄 삭제 가능)')) {
          for (let i = 0; i < 90; i++) {
            await addMember({
              name: `테스트 회원 ${i + 1}`,
              phone: `010-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
              belt: '화이트',
              gral: 0,
              registerDate: new Date().toISOString().split('T')[0],
              startDate: new Date().toISOString().split('T')[0],
              plans: [{ name: '1개월', type: '기간권', qty: 1 }],
              paymentAmount: 0,
              paymentMethod: '카드',
              memo: '임시 테스트 회원 (Ctrl+Shift+9)'
            });
          }
          alert('90명의 테스트 회원이 등록되었습니다!');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        background: 'var(--bg-color)', color: 'var(--on-surface)' 
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
        <Route path="plan" element={<PlanPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 슈퍼 관리자(본사) 대시보드 */}
      <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>} />
    </Routes>
  );
}

export default App;
