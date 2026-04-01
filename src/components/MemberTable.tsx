import { useStore, type Member } from '../store/useStore';

export default function MemberTable({ members }: { members: Member[] }) {
  const markAttendance = useStore(state => state.markAttendance);
  const attendances = useStore(state => state.attendances);

  const todayStr = new Date().toISOString().split('T')[0];

  if (members.length === 0) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>등록된 회원이 없습니다.</div>;
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>이름</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>연락처</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>벨트 / 그랄</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>요금제 / 잔여</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>만료일 / D-day</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>상태</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'center' }}>출석</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => {
            const isExpired = member.expireDate && new Date(member.expireDate) < new Date();
            const status = isExpired ? '만료' : '유효';
            const attendedToday = attendances.some(a => a.memberId === member.id && a.date === todayStr);

            // D-day 계산
            const dday = member.expireDate
              ? Math.floor((new Date(member.expireDate).getTime() - new Date().getTime()) / 86400000)
              : null;
            const isUrgent = dday !== null && dday >= 0 && dday <= 3;
            const isWarning = dday !== null && dday >= 0 && dday <= 7 && !isUrgent;

            // 잔여 횟수
            const ticketPlans = member.plans.filter(p => p.type === '횟수권' && p.remainingQty !== undefined);
            const totalRemaining = ticketPlans.reduce((s, p) => s + (p.remainingQty ?? 0), 0);
            const hasTicket = ticketPlans.length > 0;

            return (
              <tr key={member.id}
                style={{ borderBottom: '1px solid var(--outline-variant)', transition: 'background 0.1s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-container-highest)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--on-surface)' }}>{member.name}</td>
                <td style={{ padding: '1rem', color: 'var(--on-surface-variant)' }}>{member.phone || '—'}</td>
                <td style={{ padding: '1rem' }}>
                  {member.belt !== '' && (
                    <span style={{
                      background: `var(--belt-${member.belt === '화이트' ? 'white' : member.belt === '블루' ? 'blue' : 'black'})`,
                      color: member.belt === '화이트' ? '#000' : '#fff',
                      padding: '0.125rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', marginRight: '0.5rem'
                    }}>{member.belt}</span>
                  )}
                  <span style={{ color: 'var(--tertiary)', letterSpacing: '2px' }}>{'●'.repeat(member.gral)}</span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--on-surface)' }}>
                  <div>{member.plans.length > 0 ? member.plans.map(p => p.qty > 1 ? `${p.name}×${p.qty}` : p.name).join(', ') : '—'}</div>
                  {hasTicket && (
                    <div style={{ fontSize: '0.75rem', color: totalRemaining <= 3 ? '#ffb700' : 'var(--on-surface-variant)', marginTop: '0.125rem' }}>
                      {totalRemaining <= 3 && '⚠️ '}잔여 {totalRemaining}회
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ color: isExpired ? 'var(--error)' : 'var(--tertiary)' }}>{member.expireDate || '—'}</div>
                  {dday !== null && !isExpired && (
                    <div style={{ fontSize: '0.75rem', color: isUrgent ? 'var(--error)' : isWarning ? '#ffb700' : 'var(--on-surface-variant)', fontWeight: isUrgent || isWarning ? 700 : 400 }}>
                      {isUrgent ? '🔴' : isWarning ? '⚠️' : ''} D-{dday}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    background: status === '유효' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255, 180, 171, 0.15)',
                    color: status === '유효' ? '#52b788' : 'var(--error)',
                    padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                  }}>{status}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button
                    disabled={attendedToday}
                    style={{
                      background: attendedToday ? 'rgba(82,183,136,0.15)' : 'transparent',
                      border: '1px solid #52b788', color: '#52b788',
                      borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem', fontWeight: 600,
                      cursor: attendedToday ? 'default' : 'pointer',
                      whiteSpace: 'nowrap', opacity: attendedToday ? 0.7 : 1
                    }}
                    onClick={() => {
                      if (attendedToday) return;
                      markAttendance(member.id);
                      alert(`${member.name} 님의 오늘(${todayStr}) 출석이 처리되었습니다.`);
                    }}
                  >{attendedToday ? '✅ 완료' : '출석'}</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
