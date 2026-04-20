import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [confirmMode, setConfirmMode] = useState<'attendance' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkMarkAttendance = useStore(state => state.bulkMarkAttendance);
  const bulkDeleteMembers = useStore(state => state.bulkDeleteMembers);

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

  // 선택 해제 시 확인 모드도 초기화
  useEffect(() => {
    if (selectedMemberIds.length === 0) setConfirmMode(null);
  }, [selectedMemberIds.length]);

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
          maxWidth: isMobile ? 'none' : '640px'
        }}>
          {/* 전체 선택 제어 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem', background: 'var(--surface-container-high)', padding: '0 1rem', height: '44px', borderRadius: '0.75rem', border: '1px solid var(--outline-variant)' }}>
            <input 
              type="checkbox" 
              id="select-all-members"
              checked={filteredMembers.length > 0 && filteredMembers.every(m => selectedMemberIds.includes(m.id))}
              onChange={(e) => {
                const allFilteredIds = filteredMembers.map(m => m.id);
                if (e.target.checked) {
                  setSelectedMemberIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                } else {
                  setSelectedMemberIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                }
              }}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--tertiary)' }}
            />
            <label htmlFor="select-all-members" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>전체</label>
          </div>

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

      {/* 일괄 작업 액션 바 */}
      {selectedMemberIds.length > 0 && (
        <div
          data-testid="bulk-action-bar"
          style={{
            position: 'fixed', bottom: '3rem', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--surface-container-highest)', border: '2px solid var(--tertiary)',
            padding: '1rem 2rem', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 99999, minWidth: isMobile ? '90%' : 'auto',
            pointerEvents: 'auto'
          }}
        >
          {confirmMode === null ? (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--tertiary)' }}>{selectedMemberIds.length}명</span> 선택됨
              </div>
              <div style={{ height: '24px', width: '2px', background: 'var(--outline-variant)' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmMode('attendance'); }}
                  style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer' }}
                >일괄 출석</button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmMode('delete'); }}
                  style={{ background: 'rgba(255,71,87,0.2)', color: '#ff4757', border: '2px solid #ff4757', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer' }}
                >일괄 삭제</button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedMemberIds([]); }}
                  style={{ background: 'transparent', color: 'var(--on-surface-variant)', border: 'none', padding: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >취소</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: confirmMode === 'delete' ? 'var(--error)' : 'var(--tertiary)' }}>
                {confirmMode === 'attendance' ? '일괄 출석을 진행할까요?' : '정말 일괄 삭제하시겠습니까?'}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button"
                  disabled={isProcessing}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsProcessing(true);
                    try {
                      if (confirmMode === 'attendance') {
                        await bulkMarkAttendance(selectedMemberIds);
                      } else {
                        await bulkDeleteMembers(selectedMemberIds);
                      }
                      setSelectedMemberIds([]);
                      setConfirmMode(null);
                    } catch (err) {
                      console.error('Bulk action error:', err);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  style={{ 
                    background: confirmMode === 'delete' ? 'var(--error)' : 'var(--tertiary)', 
                    color: confirmMode === 'delete' ? '#fff' : '#502400', 
                    border: 'none', padding: '0.625rem 1.5rem', borderRadius: '0.75rem', 
                    fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer',
                    opacity: isProcessing ? 0.5 : 1
                  }}
                >{isProcessing ? '처리 중...' : '확인'}</button>
                <button 
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => { e.stopPropagation(); setConfirmMode(null); }}
                  style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', padding: '0.625rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer' }}
                >취소</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 리스트 */}
      {view === 'card' ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredMembers.map(m => (
            <MemberCard 
              key={m.id} 
              member={m} 
              isSelected={selectedMemberIds.includes(m.id)}
              onToggleSelection={(id) => {
                setSelectedMemberIds(prev => 
                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                );
              }}
            />
          ))}
          {filteredMembers.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>조회된 회원이 없습니다.</div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <MemberTable 
            members={filteredMembers} 
            selectedIds={selectedMemberIds}
            onToggleSelection={(id) => {
              setSelectedMemberIds(prev => 
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
              );
            }}
            onToggleAll={(ids) => {
              setSelectedMemberIds(prev => 
                prev.length === ids.length ? [] : ids
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
