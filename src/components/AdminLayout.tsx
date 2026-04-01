
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import MemberFormModal from './MemberFormModal';
import PlanManageModal from './PlanManageModal';
import CsvImportModal from './CsvImportModal';
import SettingsModal from './SettingsModal';
import { Menu, X, Save, Upload, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const logout = useStore(state => state.logout);
  const gymName = useStore(state => state.gymName);
  const isMemberModalOpen = useStore(state => state.isMemberModalOpen);
  const closeMemberModal = useStore(state => state.closeMemberModal);
  const editingMember = useStore(state => state.editingMember);
  const currentGymId = useStore(state => state.gymId);
  const allMembers = useStore(state => state.members);
  
  const members = allMembers.filter(m => m.gymId === currentGymId);

  const isPlanModalOpen = useStore(state => state.isPlanModalOpen);
  const openPlanModal = useStore(state => state.openPlanModal);
  const closePlanModal = useStore(state => state.closePlanModal);

  const isCsvModalOpen = useStore(state => state.isCsvModalOpen);
  const openCsvModal = useStore(state => state.openCsvModal);
  const closeCsvModal = useStore(state => state.closeCsvModal);

  const navigate = useNavigate();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const profileImage = useStore(state => state.profileImage);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const isEndOfMonth = lastDay.getDate() - today.getDate() <= 2; // 마지막 3일 간

  const handleExportCsv = () => {
    const headers = "이름,전화번호,벨트,그랄,요금제,등록일,만료일\n";
    const rows = members.map(m => {
      const plansStr = m.plans.map(p => p.qty > 1 ? `${p.name}x${p.qty}` : p.name).join(' / ');
      return `${m.name},${m.phone},${m.belt},${m.gral},${plansStr},${m.registerDate},${m.expireDate}`;
    }).join('\n');
    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tapnow_members_${today.toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 알림 카운터 계산
  const expiringCount = members.filter(m => {
    if (!m.expireDate || new Date(m.expireDate) < new Date()) return false;
    const dday = Math.floor((new Date(m.expireDate).getTime() - new Date().getTime()) / 86400000);
    return dday <= 7;
  }).length;

  const totalAlerts = expiringCount;

  const navStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '0.875rem 1rem',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    color: isActive ? 'var(--primary-container)' : 'var(--on-surface-variant)',
    background: isActive ? 'var(--surface-container-highest)' : 'transparent',
    fontWeight: isActive ? 600 : 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.2s',
    fontSize: '0.9375rem'
  });

  const handleNavLinkClick = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  const currentGym = useStore(state => state.gymAccounts).find(g => g.id === currentGymId);
  const gymMembersCount = members.length;
  const isFreeOverLimit = currentGym?.plan === 'free' && gymMembersCount >= 30;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', position: 'relative' }}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--surface-container-low)',
        borderRight: '1px solid var(--outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile && !isSidebarOpen ? '-260px' : '0',
        top: 0,
        bottom: 0,
        zIndex: 999,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isMobile && isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none'
      }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--outline-variant)' }}>
          <h1 style={{ fontFamily: 'var(--font-logo)', fontSize: '2rem', color: 'var(--tertiary)', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            TAPNOW <span style={{ fontFamily: 'var(--font-main)', fontSize: '0.875rem', color: 'var(--on-surface-variant)', letterSpacing: '0' }}>ADMIN</span>
          </h1>
          {gymName && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {profileImage && <img src={profileImage} alt="logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />}
              <div style={{ fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 600 }}>{gymName}</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <NavLink to="/admin/members" style={navStyle} onClick={handleNavLinkClick}>
            👥 회원 관리
          </NavLink>
          <NavLink to="/admin/attendance" style={navStyle} onClick={handleNavLinkClick}>
            📋 출석 현황
          </NavLink>
          <NavLink to="/admin/payments" style={navStyle} onClick={handleNavLinkClick}>
            💳 결제 관리
          </NavLink>

          {/* 알림 요약 */}
          {totalAlerts > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(255, 183, 134, 0.08)',
              border: '1px solid rgba(255, 183, 134, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--tertiary)', marginBottom: '0.375rem' }}>🔔 알림</div>
              {expiringCount > 0 && (
                <div style={{ color: '#ffb700', marginBottom: '0.125rem' }}>⚠️ 만료 임박 {expiringCount}명</div>
              )}
            </div>
          )}
        </nav>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => navigate('/kiosk')}
            style={{ width: '100%', padding: '1rem', background: 'var(--tertiary)', border: 'none', color: '#502400', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          >💻 키오스크 켜기</button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', marginBottom: '0.5rem' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-container-highest)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >⚙️ 도장 설정</button>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 180, 171, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >🔓 로그아웃</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          minHeight: isMobile ? '64px' : '88px',
          background: 'var(--surface-variant)',
          backdropFilter: 'var(--glass-blur)',
          padding: isMobile ? '0.75rem 1rem' : '1.25rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid var(--outline-variant)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '0.75rem',
            flexWrap: 'nowrap'
          }}>
            {/* Left Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden' }}>
              {isMobile && (
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  style={{ 
                    background: 'var(--surface-container-high)', 
                    border: '1px solid var(--outline-variant)',
                    borderRadius: '0.75rem',
                    width: '44px',
                    height: '44px',
                    color: 'var(--on-surface)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                {isEndOfMonth && (
                  <div style={{ background: 'rgba(255, 180, 171, 0.15)', color: 'var(--error)', padding: '0.4rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    🚨 {!isMobile && <span style={{ fontWeight: 600 }}>마감 임박!</span>}
                  </div>
                )}
                {isFreeOverLimit && (
                  <div style={{ 
                    background: gymMembersCount >= 35 ? 'var(--error)' : 'rgba(255, 183, 134, 0.15)', 
                    color: gymMembersCount >= 35 ? 'var(--on-error)' : 'var(--tertiary)', 
                    padding: '0.4rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', 
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    border: gymMembersCount >= 35 ? 'none' : '1px solid var(--tertiary)',
                    flexShrink: 0
                  }}>
                    {gymMembersCount >= 35 ? '🛑' : '⚠️'} {!isMobile && <span style={{ fontWeight: 600 }}>인원 초과!</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
              <button className="btn btn-secondary compact-toggle" onClick={handleExportCsv} title="백업하기" style={{ height: '44px', minWidth: isMobile ? '44px' : 'auto', padding: isMobile ? '0' : '0 1rem', borderRadius: '0.75rem' }}>
                <Save size={18} />
                {!isMobile && <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>백업</span>}
              </button>
              <button className="btn btn-secondary compact-toggle" onClick={() => openCsvModal()} title="불러오기" style={{ height: '44px', minWidth: isMobile ? '44px' : 'auto', padding: isMobile ? '0' : '0 1rem', borderRadius: '0.75rem' }}>
                <Upload size={18} />
                {!isMobile && <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>복구</span>}
              </button>
              <button className="btn btn-secondary compact-toggle" onClick={() => openPlanModal()} title="요금제 설정" style={{ height: '44px', minWidth: isMobile ? '44px' : 'auto', padding: isMobile ? '0' : '0 1rem', borderRadius: '0.75rem' }}>
                <Settings size={18} />
                {!isMobile && <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>요금제</span>}
              </button>
            </div>
          </div>
        </header>

        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>

      {/* 모달 렌더링 영역 */}
      <MemberFormModal
        isOpen={isMemberModalOpen}
        onClose={closeMemberModal}
        memberToEdit={editingMember}
      />
      <PlanManageModal isOpen={isPlanModalOpen} onClose={closePlanModal} />
      <CsvImportModal isOpen={isCsvModalOpen} onClose={closeCsvModal} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
}
