import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Plus, Pencil, Trash2, X, ShieldAlert,
  Building2, Users, TrendingUp, AlertCircle
} from 'lucide-react';
import { useStore, type GymAccount } from '../store/useStore';

// 요금제 정보 상수
const PLAN_INFO = {
  free: { label: '무료 (30인 미만)', price: 0, color: '#888', bg: 'rgba(136,136,136,0.15)' },
  basic: { label: '베이직', price: 6900, color: '#6e86ff', bg: 'rgba(110,134,255,0.15)' },
  plus: { label: 'PLUS (알림톡)', price: 14900, color: 'var(--tertiary)', bg: 'rgba(255,165,0,0.15)' },
} as const;

const STATUS_INFO = {
  active: { label: '활성', color: '#52b788', bg: 'rgba(82,183,136,0.15)' },
  trial: { label: '체험 중', color: '#ffd166', bg: 'rgba(255,209,102,0.15)' },
  suspended: { label: '정지', color: 'var(--error)', bg: 'rgba(255,71,87,0.15)' },
} as const;

// 도장 폼 모달
function GymFormModal({
  isOpen,
  onClose,
  editTarget,
  isMobile,
}: {
  isOpen: boolean;
  onClose: () => void;
  editTarget: GymAccount | null;
  isMobile: boolean;
}) {
  const addGymAccount = useStore(s => s.addGymAccount);
  const updateGymAccount = useStore(s => s.updateGymAccount);

  const [form, setForm] = useState<Omit<GymAccount, 'id'>>({
    gymName: editTarget?.gymName ?? '',
    ownerEmail: editTarget?.ownerEmail ?? '',
    registeredAt: editTarget?.registeredAt ?? new Date().toISOString().split('T')[0],
    memberCount: editTarget?.memberCount ?? 0,
    plan: editTarget?.plan ?? 'free',
    planExpireDate: editTarget?.planExpireDate ?? '',
    status: editTarget?.status ?? 'trial',
    memo: editTarget?.memo ?? '',
  });

  // 편집 대상이 바뀌면 폼 리셋
  useState(() => {
    setForm({
      gymName: editTarget?.gymName ?? '',
      ownerEmail: editTarget?.ownerEmail ?? '',
      registeredAt: editTarget?.registeredAt ?? new Date().toISOString().split('T')[0],
      memberCount: editTarget?.memberCount ?? 0,
      plan: editTarget?.plan ?? 'free',
      planExpireDate: editTarget?.planExpireDate ?? '',
      status: editTarget?.status ?? 'trial',
      memo: editTarget?.memo ?? '',
    });
  });

  const handleSave = () => {
    if (!form.gymName || !form.ownerEmail) return;
    if (editTarget) {
      updateGymAccount(editTarget.id, form);
    } else {
      addGymAccount(form);
    }
    onClose();
  };

  const inputStyle = {
    width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
    border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
    color: 'var(--on-surface)', fontSize: '0.875rem', outline: 'none',
    boxSizing: 'border-box' as const,
  };
  const labelStyle = { fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBottom: '0.25rem', display: 'block' as const };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: 'var(--surface-container-high)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--outline-variant)', width: '100%', maxWidth: '480px',
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700 }}>{editTarget ? '도장 정보 수정' : '새 도장 등록'}</h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '65vh', overflowY: 'auto' }}>
              <div>
                <label style={labelStyle}>도장명 *</label>
                <input style={inputStyle} value={form.gymName} onChange={e => setForm(f => ({ ...f, gymName: e.target.value }))} placeholder="ex. 오닉스 주짓수" />
              </div>
              <div>
                <label style={labelStyle}>관장 이메일 *</label>
                <input type="email" style={inputStyle} value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))} placeholder="owner@gym.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>등록일</label>
                  <input type="date" style={inputStyle} value={form.registeredAt} onChange={e => setForm(f => ({ ...f, registeredAt: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>수련생 수</label>
                  <input type="number" min={0} style={inputStyle} value={form.memberCount} onChange={e => setForm(f => ({ ...f, memberCount: Number(e.target.value) }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>SaaS 요금제</label>
                  <select style={inputStyle} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value as GymAccount['plan'] }))}>
                    <option value="free">무료 (30인 미만 / ₩0)</option>
                    <option value="basic">베이직 (₩6,900)</option>
                    <option value="plus">PLUS (알림톡 / ₩14,900)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>만료일</label>
                  <input type="date" style={inputStyle} value={form.planExpireDate} onChange={e => setForm(f => ({ ...f, planExpireDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>상태</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as GymAccount['status'] }))}>
                  <option value="trial">체험 중</option>
                  <option value="active">활성</option>
                  <option value="suspended">정지</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>메모</label>
                <textarea style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }} value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="내부 메모..." />
              </div>
            </div>

            <div style={{ padding: isMobile ? '1rem 1.25rem' : '1rem 1.5rem', borderTop: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={onClose} style={{ flex: isMobile ? 1 : 'unset', height: '44px', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>취소</button>
              <button
                onClick={handleSave}
                disabled={!form.gymName || !form.ownerEmail}
                style={{ flex: isMobile ? 1 : 'unset', height: '44px', background: 'var(--tertiary)', border: 'none', color: '#502400', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', opacity: (!form.gymName || !form.ownerEmail) ? 0.5 : 1 }}
              >저장</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// 슈퍼 관리자(통합 마스터) 대시보드
// ─────────────────────────────────────────────
export default function SuperAdminPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gymAccounts = useStore(s => s.gymAccounts);
  const deleteGymAccount = useStore(s => s.deleteGymAccount);
  const updateGymAccount = useStore(s => s.updateGymAccount);
  const logout = useStore(s => s.logout);
  const adminEmail = useStore(s => s.adminEmail);
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GymAccount | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [planFilterTab, setPlanFilterTab] = useState<'all' | GymAccount['plan']>('all');

  const handleLogout = () => { logout(); navigate('/login'); };

  const openEdit = (gym: GymAccount) => { setEditTarget(gym); setIsFormOpen(true); };
  const openAdd = () => { setEditTarget(null); setIsFormOpen(true); };

  const handleQuickPlanChange = (id: string, plan: GymAccount['plan']) => {
    const today = new Date();
    const expireDate = new Date(today.getFullYear(), today.getMonth() + (plan === 'plus' ? 12 : plan === 'basic' ? 6 : 1), today.getDate()).toISOString().split('T')[0];
    updateGymAccount(id, { plan, planExpireDate: expireDate, status: plan === 'free' ? 'trial' : 'active' });
  };

  // 통계
  const totalRevenue = gymAccounts
    .filter(g => g.status === 'active')
    .reduce((sum, g) => sum + PLAN_INFO[g.plan].price, 0);
  const activeCount = gymAccounts.filter(g => g.status === 'active').length;
  const trialCount = gymAccounts.filter(g => g.status === 'trial').length;

  // 만료 임박 (7일 이내)
  const expiringCount = gymAccounts.filter(g => {
    const d = g.planExpireDate ? Math.floor((new Date(g.planExpireDate).getTime() - Date.now()) / 86400000) : 999;
    return d >= 0 && d <= 7;
  }).length;

  const filtered = gymAccounts.filter(g => planFilterTab === 'all' || g.plan === planFilterTab);

  const tabs = [
    { key: 'all', label: `전체 (${gymAccounts.length})` },
    { key: 'free', label: `무료 (${gymAccounts.filter(g => g.plan === 'free').length})` },
    { key: 'basic', label: `베이직 (${gymAccounts.filter(g => g.plan === 'basic').length})` },
    { key: 'plus', label: `PLUS (${gymAccounts.filter(g => g.plan === 'plus').length})` },
  ] as const;

  const statStyle = (color: string, highlight = false) => ({
    padding: '1.25rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-container-high)',
    border: highlight ? `1px solid ${color}` : '1px solid var(--outline-variant)',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <header style={{
        height: isMobile ? '60px' : '68px', background: 'var(--surface-container-highest)',
        borderBottom: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 1rem' : '0 2rem',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <ShieldAlert size={isMobile ? 18 : 22} color="var(--tertiary)" />
          <span style={{ fontFamily: 'var(--font-logo)', fontSize: isMobile ? '1.25rem' : '1.5rem', color: 'var(--on-bg)', letterSpacing: '1px' }}>
            TAPNOW
          </span>
          {!isMobile && (
            <span style={{
                background: 'linear-gradient(135deg, var(--tertiary), #ff9f43)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontWeight: 800, fontSize: '0.8125rem', letterSpacing: '1px', marginLeft: '0.5rem'
            }}>MASTER ADMIN</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isMobile && <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>{adminEmail}</span>}
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: '40px', padding: '0 0.875rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
          >
            <LogOut size={isMobile ? 18 : 16} /> 
            {!isMobile && <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>로그아웃</span>}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: isMobile ? '1.25rem 1rem' : '2.5rem 3rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>도장 통합 관리</h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>모든 지점과 구독 상태를 한눈에 관리합니다.</p>
          </div>
          <button
            onClick={openAdd}
            className="btn btn-primary"
            style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--tertiary)', border: 'none', color: '#502400', padding: '0 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700, fontSize: '0.9375rem' }}
          >
            <Plus size={18} /> 새 도장 등록
          </button>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={statStyle('var(--tertiary)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Building2 size={14} color="var(--on-surface-variant)" />
              <span style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>총 등록 도장</span>
            </div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, color: 'var(--tertiary)' }}>{gymAccounts.length}<span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginLeft: '0.25rem', fontWeight: 400 }}>개</span></div>
          </div>
          <div style={statStyle('#52b788')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={14} color="var(--on-surface-variant)" />
              <span style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>정상 운영 중</span>
            </div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, color: '#52b788' }}>{activeCount}<span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginLeft: '0.25rem', fontWeight: 400 }}>개</span></div>
          </div>
          <div style={statStyle('#ffd166', trialCount > 0)}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>신규 체험</div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, color: '#ffd166' }}>{trialCount}<span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginLeft: '0.25rem', fontWeight: 400 }}>개</span></div>
          </div>
          <div style={statStyle('var(--primary)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={14} color="var(--on-surface-variant)" />
              <span style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>월 구독 매출</span>
            </div>
            <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{totalRevenue.toLocaleString()}<span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginLeft: '0.125rem', fontWeight: 400 }}>원</span></div>
          </div>
          {expiringCount > 0 && (
            <div style={{ ...statStyle('var(--error)', true), gridColumn: isMobile ? 'span 2' : 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertCircle size={14} color="var(--error)" />
                <span style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>구독 만료 임박</span>
              </div>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, color: 'var(--error)' }}>{expiringCount}<span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginLeft: '0.25rem', fontWeight: 400 }}>개</span></div>
            </div>
          )}
        </div>

        {/* 탭 필터 */}
        <div style={{ 
          display: 'flex', 
          gap: '0.375rem', 
          marginBottom: '1.5rem', 
          flexWrap: 'nowrap', 
          overflowX: 'auto', 
          paddingBottom: '0.5rem', 
          margin: isMobile ? '0 -1rem' : '0',
          padding: isMobile ? '0 1rem 0.5rem' : '0 0 0.5rem',
          WebkitOverflowScrolling: 'touch' 
        }}>
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setPlanFilterTab(key)}
              style={{
                padding: '0 1rem', 
                height: '44px',
                borderRadius: '0.75rem',
                background: planFilterTab === key ? 'var(--tertiary)' : 'var(--surface-container-high)',
                color: planFilterTab === key ? '#502400' : 'var(--on-surface-variant)',
                border: 'none', fontWeight: planFilterTab === key ? 700 : 500, cursor: 'pointer', fontSize: '0.8125rem',
                whiteSpace: 'nowrap', flexShrink: 0,
                display: 'flex', alignItems: 'center'
              }}
            >{label}</button>
          ))}
        </div>

        {/* 도장 카드 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(gym => {
            const statusInfo = STATUS_INFO[gym.status];
            const dday = gym.planExpireDate
              ? Math.floor((new Date(gym.planExpireDate).getTime() - Date.now()) / 86400000)
              : null;
            const isExpiring = dday !== null && dday >= 0 && dday <= 7;
            const isExpired = dday !== null && dday < 0;

            return (
              <motion.div
                key={gym.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--surface-container-high)',
                  border: `1px solid ${isExpiring ? 'rgba(255,71,87,0.4)' : 'var(--outline-variant)'}`,
                  borderRadius: 'var(--radius-xl)',
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  display: 'flex', flexDirection: 'column', gap: '1.25rem'
                }}
              >
                {/* 상단 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{gym.gymName}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>{gym.ownerEmail}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ ...statusInfo, padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: statusInfo.color, background: statusInfo.bg }}>{statusInfo.label}</span>
                  </div>
                </div>

                {/* 정보 그리드 */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: '수련생', value: `${gym.memberCount}명` },
                    { label: '등록일', value: gym.registeredAt },
                    { label: '만료일', value: gym.planExpireDate || '—', accent: isExpired ? 'var(--error)' : isExpiring ? '#ffb700' : undefined },
                  ].map(({ label, value, accent }) => (
                    <div key={label} style={{ background: 'var(--surface-container-low)', padding: '0.75rem', borderRadius: '0.5rem', gridColumn: (isMobile && label === '만료일') ? 'span 2' : 'auto' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>{label}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: accent ?? 'var(--on-surface)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* 요금제 빠른 변경 */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>구독 마스터 변경</div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {(['free', 'basic', 'plus'] as const).map(p => (
                      <button key={p} onClick={() => handleQuickPlanChange(gym.id, p)}
                        style={{
                          flex: 1, height: '44px',
                          borderRadius: '0.75rem', border: gym.plan === p ? `2px solid ${PLAN_INFO[p].color}` : '1px solid var(--outline-variant)',
                          background: gym.plan === p ? PLAN_INFO[p].bg : 'transparent',
                          color: gym.plan === p ? PLAN_INFO[p].color : 'var(--on-surface-variant)',
                          cursor: 'pointer', fontSize: '0.75rem', fontWeight: gym.plan === p ? 700 : 500,
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >{PLAN_INFO[p].label.split(' ')[0]}</button>
                    ))}
                  </div>
                </div>

                {/* 메모 */}
                {gym.memo && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontStyle: 'italic' }}>
                    💬 {gym.memo}
                  </div>
                )}

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--outline-variant)' }}>
                  <button onClick={() => openEdit(gym)}
                    style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}
                  ><Pencil size={18} /> 수정</button>
                  {deleteConfirmId === gym.id ? (
                    <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setDeleteConfirmId(null)}
                        style={{ flex: 1, height: '44px', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}
                      >취소</button>
                      <button onClick={() => { deleteGymAccount(gym.id); setDeleteConfirmId(null); }}
                        style={{ flex: 1, height: '44px', background: 'var(--error)', border: 'none', color: '#fff', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}
                      >삭제</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(gym.id)}
                      style={{ width: '44px', height: '44px', background: 'transparent', border: '1px solid rgba(255,71,87,0.4)', color: 'var(--error)', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    ><Trash2 size={18} /></button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
              등록된 도장이 없습니다.
            </div>
          )}
        </div>
      </main>

      <GymFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditTarget(null); }}
        editTarget={editTarget}
        isMobile={isMobile}
      />
    </div>
  );
}
