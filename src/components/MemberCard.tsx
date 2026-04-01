import { useStore, type Member } from '../store/useStore';
import { MoreHorizontal } from 'lucide-react';

export default function MemberCard({ member }: { member: Member }) {
  const markAttendance = useStore(state => state.markAttendance);
  const openMemberModal = useStore(state => state.openMemberModal);
  const attendances = useStore(state => state.attendances);

  const isExpired = member.expireDate && new Date(member.expireDate) < new Date();
  const status = isExpired ? '만료' : '유효';

  // 오늘 출석 여부
  const todayStr = new Date().toISOString().split('T')[0];
  const attendedToday = attendances.some(a => a.memberId === member.id && a.date === todayStr);

  // 만료 임박 D-day 계산
  const dday = member.expireDate
    ? Math.floor((new Date(member.expireDate).getTime() - new Date().getTime()) / 86400000)
    : null;
  const isUrgent = dday !== null && dday >= 0 && dday <= 3;
  const isWarning = dday !== null && dday >= 0 && dday <= 7 && !isUrgent;

  // 횟수권 잔여 횟수
  const ticketPlans = member.plans.filter(p => p.type === '횟수권' && p.remainingQty !== undefined);
  const totalRemaining = ticketPlans.reduce((s, p) => s + (p.remainingQty ?? 0), 0);
  const hasTicket = ticketPlans.length > 0;
  const lowRemaining = hasTicket && totalRemaining <= 3;

  // 장기 미출석 (30일 이상)
  const memberAttendances = attendances.filter(a => a.memberId === member.id);
  const lastAttendanceDate = memberAttendances.length > 0
    ? new Date(Math.max(...memberAttendances.map(a => new Date(a.date).getTime())))
    : null;
  const daysSinceAttendance = lastAttendanceDate
    ? Math.floor((new Date().getTime() - lastAttendanceDate.getTime()) / 86400000)
    : null;
  const isLongAbsent = daysSinceAttendance !== null && daysSinceAttendance >= 30;

  return (
    <div style={{
      background: 'var(--surface-container-low)',
      border: `1px solid ${isUrgent ? 'rgba(255,71,87,0.4)' : isWarning ? 'rgba(255,180,0,0.3)' : 'var(--outline-variant)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-ambient)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)' }}>{member.name}</h3>
            {isLongAbsent && <span style={{ fontSize: '0.6875rem', background: 'rgba(100,100,100,0.2)', color: 'var(--on-surface-variant)', padding: '0.125rem 0.4rem', borderRadius: '8px' }}>💤 장기미출석</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{
              background: `var(--belt-${member.belt === '화이트' ? 'white' : member.belt === '블루' ? 'blue' : 'black'})`,
              color: member.belt === '화이트' ? '#000' : '#fff',
              padding: '0.125rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.6875rem', fontWeight: 600
            }}>{member.belt}</span>
            <span style={{ color: 'var(--tertiary)', letterSpacing: '2px', fontSize: '0.75rem' }}>{'●'.repeat(member.gral)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <span style={{
            background: status === '유효' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255, 180, 171, 0.15)',
            color: status === '유효' ? '#52b788' : 'var(--error)',
            padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600
          }}>{status}</span>
          {isUrgent && dday !== null && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--error)', fontWeight: 700 }}>🔴 D-{dday}</span>
          )}
          {isWarning && dday !== null && (
            <span style={{ fontSize: '0.6875rem', color: '#ffb700', fontWeight: 700 }}>⚠️ D-{dday}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.6875rem' }}>전화번호</span>
          <span style={{ color: 'var(--on-surface)' }}>{member.phone || '—'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.6875rem' }}>요금제</span>
          <span style={{ color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.plans.length > 0 ? member.plans.map(p => p.qty > 1 ? `${p.name}×${p.qty}` : p.name).join(', ') : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.6875rem' }}>만료일</span>
          <span style={{ color: isExpired ? 'var(--error)' : 'var(--tertiary)', fontWeight: 600 }}>
            {member.expireDate || '—'}
          </span>
        </div>
        {hasTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem' }}>잔여 횟수</span>
            <span style={{ color: lowRemaining ? '#ffb700' : 'var(--on-surface)', fontWeight: 600 }}>
              {lowRemaining ? '⚠️ ' : ''}{totalRemaining}회
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--outline-variant)' }}>
        <button
          disabled={attendedToday}
          style={{
            flex: 1, background: attendedToday ? 'rgba(82,183,136,0.15)' : 'transparent',
            border: '1px solid #52b788', color: '#52b788',
            borderRadius: '0.75rem', height: '44px',
            fontSize: '0.9375rem', fontWeight: 700, cursor: attendedToday ? 'default' : 'pointer', transition: 'all 0.2s',
            opacity: attendedToday ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseOver={(e) => { if (!attendedToday) { e.currentTarget.style.background = '#52b788'; e.currentTarget.style.color = '#000'; }}}
          onMouseOut={(e) => { if (!attendedToday) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#52b788'; }}}
          onClick={async () => {
            if (attendedToday) return;
            try {
              await markAttendance(member.id);
              alert(`${member.name} 님의 오늘(${todayStr}) 출석이 처리되었습니다.`);
            } catch (err) {
              alert('출석 처리 중 오류가 발생했습니다.');
            }
          }}
        >
          {attendedToday ? '✅ 출석 완료' : '출석 처리'}
        </button>
        <button style={{
          background: 'var(--surface-container-highest)', border: 'none', color: 'var(--on-surface)',
          width: '44px', height: '44px', borderRadius: '0.75rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
        }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-bright)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface-container-highest)'; }}
          onClick={() => openMemberModal(member)}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}
