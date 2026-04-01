import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Search, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import BulkAttendanceModal from '../components/BulkAttendanceModal';
import AttendanceDetailModal from '../components/AttendanceDetailModal';
import { type Member } from '../store/useStore';

export default function AttendancePage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const members = useStore(state => state.members);
  const currentGymId = useStore(state => state.gymId); // Add Multi-tenant guard
  const attendances = useStore(state => state.attendances);
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailMember, setSelectedDetailMember] = useState<Member | null>(null);
  
  const [filter, setFilter] = useState<'전체' | '횟수권' | '기간권'>('전체');
  const [search, setSearch] = useState('');
  
  const currentDate = new Date();
  const [targetYear, setTargetYear] = useState(currentDate.getFullYear());
  const [targetMonth, setTargetMonth] = useState(currentDate.getMonth() + 1);

  const gymMembers = members.filter(m => m.gymId === currentGymId);

  const prevMonth = () => {
    if (targetMonth === 1) { setTargetMonth(12); setTargetYear(targetYear - 1); }
    else setTargetMonth(targetMonth - 1);
  };
  const nextMonth = () => {
    if (targetMonth === 12) { setTargetMonth(1); setTargetYear(targetYear + 1); }
    else setTargetMonth(targetMonth + 1);
  };

  const filteredMembers = gymMembers.filter(m => {
    if (search && !m.name.includes(search)) return false;
    
    // 단순 횟수권, 기간권 구분 로직 (요금제명에 '회권' 포함 여부)
    const isTicket = m.plans.some(p => p.name.includes('회권'));
    if (filter === '횟수권' && !isTicket) return false;
    if (filter === '기간권' && isTicket) return false;
    
    return true;
  });

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 600, color: 'var(--on-bg)', marginBottom: '1.5rem' }}>출석 현황</h2>
      
      {/* 툴바 */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '1.5rem', gap: '1.25rem' }}>
        
        {/* 달 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.25rem', 
            alignItems: 'center', 
            background: 'var(--surface-container-high)', 
            padding: '0.25rem', 
            borderRadius: '0.75rem',
            height: '44px',
            flex: isMobile ? 1 : 'unset',
            justifyContent: 'space-between'
          }}>
            <button onClick={prevMonth} className="btn-secondary" style={{ padding: '0', height: '36px', width: '36px', borderRadius: '0.5rem', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></button>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--tertiary)', minWidth: '90px', textAlign: 'center' }}>
              {targetYear}년 {targetMonth}월
            </div>
            <button onClick={nextMonth} className="btn-secondary" style={{ padding: '0', height: '36px', width: '36px', borderRadius: '0.5rem', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></button>
          </div>
          <button className="btn btn-secondary compact-toggle" style={{ height: '44px', borderRadius: '0.75rem', fontSize: '0.8125rem', padding: '0 1rem', width: isMobile ? 'auto' : 'unset' }}
            onClick={() => { setTargetYear(currentDate.getFullYear()); setTargetMonth(currentDate.getMonth() + 1); }}
          >이번 달</button>
        </div>

        {/* 필터 및 검색 */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.375rem', 
            overflowX: 'auto', 
            paddingBottom: '0.5rem',
            margin: isMobile ? '0 -1rem' : '0',
            padding: isMobile ? '0 1rem 0.5rem' : '0 0 0.5rem'
          }} className="no-wrap-group">
            {['전체', '횟수권', '기간권'].map(f => (
              <button key={f} onClick={() => setFilter(f as '전체' | '횟수권' | '기간권')} style={{
                background: filter === f ? 'var(--tertiary)' : 'var(--surface-container-high)',
                color: filter === f ? '#502400' : 'var(--on-surface-variant)',
                border: filter === f ? 'none' : '1px solid var(--outline-variant)',
                padding: '0 1.25rem', 
                height: '44px',
                borderRadius: '0.75rem', 
                fontSize: '0.8125rem', 
                fontWeight: filter === f ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}>{f}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <div style={{
              display: 'flex', alignItems: 'center', background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: '0.75rem', padding: '0 1rem', height: '44px', flex: 1
            }}>
              <Search size={18} color="var(--on-surface-variant)" style={{ marginRight: '0.75rem' }} />
              <input type="text" placeholder="회원 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', outline: 'none', width: '100%', fontSize: '0.9375rem' }} />
            </div>

            <button 
              className="btn btn-primary" 
              style={{ height: '44px', borderRadius: '0.75rem', padding: '0 1.25rem', fontSize: '0.8125rem', background: 'var(--tertiary)', color: '#502400', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              onClick={() => setIsBulkModalOpen(true)}
            >
              <CheckCircle size={18} /><span className={isMobile ? '' : ''}>일괄 출석</span>
            </button>
          </div>
        </div>
      </div>

      {/* 출석표 영역 (카드 뷰 예시) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filteredMembers.map(m => {
          const memberAttendances = attendances.filter(a => a.memberId === m.id);
          const thisMonthCount = memberAttendances.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === targetMonth - 1 && d.getFullYear() === targetYear;
          }).length;
          const todayStr = currentDate.toISOString().split('T')[0];
          const hasAttendedToday = memberAttendances.some(a => a.date.startsWith(todayStr));

          return (
          <div key={m.id} className="glass-panel" style={{ padding: isMobile ? '1.25rem' : '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{m.name}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', background: 'var(--surface-container-highest)', padding: '0.25rem 0.625rem', borderRadius: '12px', fontWeight: 600 }}>
                {m.plans.some(p => p.name.includes('회권')) ? '횟수권' : '기간권'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
               <div>
                 <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>오늘 출석</div>
                 <div style={{ fontSize: '1rem', fontWeight: 700, color: hasAttendedToday ? '#52b788' : 'var(--on-surface-variant)' }}>
                   {hasAttendedToday ? '✅ 완료' : '미출석'}
                 </div>
               </div>
               <div>
                 <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>이달 누적</div>
                 <div style={{ fontSize: '1rem', fontWeight: 700, color: '#52b788' }}>{thisMonthCount}회</div>
               </div>
            </div>
            <button style={{ width: '100%', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', height: '44px', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseOver={(e) => { e.currentTarget.style.border = '1px solid var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseOut={(e) => { e.currentTarget.style.border = '1px solid var(--outline-variant)'; e.currentTarget.style.color = 'var(--on-surface)'; }}
            onClick={() => { setSelectedDetailMember(m); setIsDetailModalOpen(true); }}
            >
              상세 기록 보기
            </button>
          </div>
        )})}
        {filteredMembers.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>
            조회된 회원이 없습니다.
          </div>
        )}
      </div>

      <BulkAttendanceModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />
      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        member={selectedDetailMember}
      />

      {/* 이번 달 출석 통계 */}
      {filteredMembers.length > 0 && (() => {
        const ranked = filteredMembers
          .map(m => ({
            name: m.name,
            count: attendances.filter(a => a.memberId === m.id && a.date.startsWith(`${targetYear}-${String(targetMonth).padStart(2, '0')}`)).length
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        const maxCount = Math.max(...ranked.map(r => r.count), 1);

        return (
          <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--on-surface)' }}>
              📊 {targetYear}년 {targetMonth}월 출석 랭킹 Top 10
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ranked.map((r, i) => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: isMobile ? '1.25rem' : '1.5rem', textAlign: 'right', fontSize: '0.75rem', color: i < 3 ? 'var(--tertiary)' : 'var(--on-surface-variant)', fontWeight: i < 3 ? 700 : 400 }}>
                    {i + 1}
                  </div>
                  <div style={{ width: isMobile ? '4rem' : '5rem', fontSize: '0.75rem', color: 'var(--on-surface)', fontWeight: 500, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ flex: 1, background: 'var(--surface-container-highest)', borderRadius: '4px', height: '14px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(r.count / maxCount) * 100}%`,
                      background: i === 0 ? 'var(--tertiary)' : i < 3 ? 'var(--primary)' : 'var(--surface-bright)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <div style={{ width: '2.25rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: r.count > 0 ? 'var(--tertiary)' : 'var(--on-surface-variant)' }}>
                    {r.count}회
                  </div>
                </div>
              ))}
              {ranked.every(r => r.count === 0) && (
                <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '1rem' }}>해당 월에 출석 기록이 없습니다.</div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
