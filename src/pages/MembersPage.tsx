import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import MemberCard from '../components/MemberCard';
import MemberTable from '../components/MemberTable';
import { Search, LayoutGrid, List } from 'lucide-react';

export default function MembersPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const members = useStore(state => state.members);
  const attendances = useStore(state => state.attendances);
  const payments = useStore(state => state.payments);
  const currentGymId = useStore(state => state.gymId);
  const [view, setView] = useState<'card' | 'table'>('card');
  const [filter, setFilter] = useState<'전체' | '유효' | '만료' | '임박' | '미출석'>('전체');
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

  // 통계 계산
  const gymMembers = members.filter(m => m.gymId === currentGymId || currentGymId === 'ALL');
  const activeCount = gymMembers.filter(m => !(m.expireDate && new Date(m.expireDate) < new Date())).length;
  const expiredCount = gymMembers.length - activeCount;

  // 이번 달 매출 (해당 도장 회원만)
  const thisMonthRevenue = payments
    .filter(p => gymMembers.some(m => m.id === p.memberId) && p.date.startsWith(thisMonthPrefix) && p.status === '완료')
    .reduce((sum, p) => sum + p.amount, 0);

  // 이번 달 신규 회원
  const newThisMonth = gymMembers.filter(m => m.registerDate?.startsWith(thisMonthPrefix)).length;

  // 장기 미출석 (14일 이상)
  const longAbsentCount = gymMembers.filter(m => {
    const memberAtt = attendances.filter(a => a.memberId === m.id);
    if (memberAtt.length === 0) return true;
    const lastDate = new Date(Math.max(...memberAtt.map(a => new Date(a.date).getTime())));
    return Math.floor((new Date().getTime() - lastDate.getTime()) / 86400000) >= 14;
  }).length;

  // 만료 임박 (7일 이내)
  const expiringCount = gymMembers.filter(m => {
    if (!m.expireDate || new Date(m.expireDate) < new Date()) return false;
    const dday = Math.floor((new Date(m.expireDate).getTime() - new Date().getTime()) / 86400000);
    return dday <= 7;
  }).length;

  const filteredMembers = gymMembers.filter(m => {
    const isExpired = m.expireDate && new Date(m.expireDate) < new Date();
    const status = isExpired ? '만료' : '유효';

    if (filter === '유효' && status !== '유효') return false;
    if (filter === '만료' && status !== '만료') return false;
    if (filter === '임박') {
      if (status !== '유효') return false;
      const dday = m.expireDate ? Math.floor((new Date(m.expireDate).getTime() - new Date().getTime()) / 86400000) : 999;
      if (dday > 7) return false;
    }
    if (filter === '미출석') {
      const memberAtt = attendances.filter(a => a.memberId === m.id);
      if (memberAtt.length === 0) return true;
      const lastDate = new Date(Math.max(...memberAtt.map(a => new Date(a.date).getTime())));
      const days = Math.floor((new Date().getTime() - lastDate.getTime()) / 86400000);
      if (days < 14) return false;
    }

    if (search && !m.name.includes(search)) return false;
    return true;
  });

  const statCards = [
    { label: '전체 회원', value: gymMembers.length, color: 'var(--tertiary)' },
    { label: '유효 회원', value: activeCount, color: '#52b788' },
    { label: '만료 회원', value: expiredCount, color: 'var(--error)' },
    { label: '이번 달 매출', value: `${thisMonthRevenue.toLocaleString()}원`, color: 'var(--primary)', small: true },
    { label: '이번 달 신규', value: `${newThisMonth}명`, color: '#52b788', small: true },
    { label: '만료 임박', value: `${expiringCount}명`, color: '#ffb700', small: true, highlight: expiringCount > 0 },
    { label: '장기 미출석 (2주)', value: `${longAbsentCount}명`, color: 'var(--on-surface-variant)', small: true },
  ];

  const filterOptions: Array<{ key: typeof filter; label: string }> = [
    { key: '전체', label: '전체' },
    { key: '유효', label: '유효' },
    { key: '만료', label: '만료' },
    { key: '임박', label: `임박 ${expiringCount > 0 ? `(${expiringCount})` : ''}` },
    { key: '미출석', label: `미출석(2주) ${longAbsentCount > 0 ? `(${longAbsentCount})` : ''}` },
  ];

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 600, color: 'var(--on-bg)', marginBottom: '1.5rem' }}>회원 관리</h2>

      {/* 통계 카드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', 
        gap: isMobile ? '0.5rem' : '0.75rem', 
        marginBottom: '2rem' 
      }}>
        {statCards.map((card, i) => (
          <div key={i} className="glass-panel" style={{
            padding: isMobile ? '0.875rem' : '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: card.highlight ? `1px solid ${card.color}` : undefined,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
            <div style={{ fontSize: card.small ? (isMobile ? '1.125rem' : '1.5rem') : (isMobile ? '1.5rem' : '2.25rem'), fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 툴바 */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '0.375rem', 
          overflowX: 'auto', 
          paddingBottom: '0.5rem',
          margin: isMobile ? '0 -1rem' : '0',
          padding: isMobile ? '0 1rem 0.5rem' : '0 0 0.5rem',
          flexShrink: 0
        }} className="no-wrap-group">
          {filterOptions.map(({ key, label }) => (
            <button key={key}
              onClick={() => setFilter(key)}
              style={{
                background: filter === key ? 'var(--tertiary)' : 'var(--surface-container-high)',
                color: filter === key ? '#502400' : 'var(--on-surface-variant)',
                border: filter === key ? 'none' : '1px solid var(--outline-variant)',
                padding: '0 0.875rem', 
                height: '40px',
                borderRadius: '0.625rem', 
                fontSize: '0.8125rem',
                fontWeight: filter === key ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center'
              }}
            >{label}</button>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center', 
          flex: 1,
          maxWidth: isMobile ? 'none' : '480px'
        }}>
          <button className="btn btn-primary" onClick={() => useStore.getState().openMemberModal()} style={{
            padding: '0 1.25rem', height: '44px', borderRadius: '0.75rem', background: 'var(--tertiary)', color: '#502400', fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap'
          }}>회원 등록</button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--surface-container-high)', 
            border: '1px solid var(--outline-variant)', 
            borderRadius: '0.75rem', 
            padding: '0 1rem', 
            height: '44px', 
            flex: 1 
          }}>
            <Search size={18} color="var(--on-surface-variant)" style={{ marginRight: '0.75rem' }} />
            <input type="text" placeholder="검색..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', outline: 'none', width: '100%', fontSize: '0.9375rem' }} />
          </div>
          
          <div style={{ display: isMobile ? 'none' : 'flex', background: 'var(--surface-container-high)', borderRadius: '0.5rem', padding: '0.25rem' }}>
            <button onClick={() => setView('card')} style={{ background: view === 'card' ? 'var(--surface-variant)' : 'transparent', color: view === 'card' ? 'var(--on-surface)' : 'var(--on-surface-variant)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><LayoutGrid size={18} /></button>
            <button onClick={() => setView('table')} style={{ background: view === 'table' ? 'var(--surface-variant)' : 'transparent', color: view === 'table' ? 'var(--on-surface)' : 'var(--on-surface-variant)', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><List size={18} /></button>
          </div>
        </div>
      </div>

      {/* 리스트 */}
      {view === 'card' ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredMembers.map(m => <MemberCard key={m.id} member={m} />)}
          {filteredMembers.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>조회된 회원이 없습니다.</div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <MemberTable members={filteredMembers} />
        </div>
      )}
    </div>
  );
}
