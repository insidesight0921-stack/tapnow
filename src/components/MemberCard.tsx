import { useStore, type Member } from '../store/useStore';
import { Trash2, Edit2 } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onDetail?: (member: Member) => void;
  onAttendanceSuccess?: (data: any) => void;
}

export default function MemberCard({ member, isSelected, onToggleSelection, onDetail, onAttendanceSuccess }: MemberCardProps) {
  const markAttendance = useStore(state => state.markAttendance);
  const deleteMember = useStore(state => state.deleteMember);
  const openMemberModal = useStore(state => state.openMemberModal);
  const attendances = useStore(state => state.attendances);

  const isExpired = member.expireDate && new Date(member.expireDate) < new Date();
  const status = isExpired ? '만료' : '유효';

  // 오늘 출석 여부
  const todayStr = new Date().toISOString().split('T')[0];
  const attendedToday = attendances.some(a => a.memberId === member.id && a.date === todayStr);

  // 만료 임박 D-day 계산
  const dday = member.expireDate && !isNaN(new Date(member.expireDate).getTime())
    ? Math.floor((new Date(member.expireDate).getTime() - new Date().getTime()) / 86400000)
    : null;
  const isUrgent = dday !== null && dday >= 0 && dday <= 3;
  const isWarning = dday !== null && dday >= 0 && dday <= 7 && !isUrgent;

  // 횟수권 잔여 횟수 (기간권만 있는 경우 노출하지 않음)
  const ticketPlans = member.plans.filter(p => p.type === '횟수권');
  const hasTicket = ticketPlans.length > 0;
  const totalRemaining = hasTicket ? ticketPlans.reduce((s, p) => s + (p.remainingQty ?? 0), 0) : 0;

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
    }}
    onClick={() => onDetail && onDetail(member)}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          {onToggleSelection && (
            <input 
              type="checkbox" 
              checked={isSelected} 
              onChange={() => onToggleSelection(member.id)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--tertiary)', marginTop: '0.25rem', flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ 
                fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
              }} title={member.name}>{member.name}</h3>
              {isLongAbsent && <span style={{ flexShrink: 0, fontSize: '0.6875rem', background: 'rgba(100,100,100,0.2)', color: 'var(--on-surface-variant)', padding: '0.125rem 0.4rem', borderRadius: '8px', whiteSpace: 'nowrap' }}>💤 장기미출석</span>}
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
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
          <span style={{
            background: status === '유효' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255, 180, 171, 0.15)',
            color: status === '유효' ? '#52b788' : 'var(--error)',
            padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap'
          }}>{status}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.6875rem' }}>전화번호</span>
          <span style={{ color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{member.phone || '—'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.6875rem' }}>요금제</span>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.plans.length > 0 ? member.plans.map(p => p.qty > 1 ? `${p.name}×${p.qty}` : p.name).join(', ') : '—'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.6875rem' }}>만료일</span>
          <span style={{ color: isExpired ? 'var(--error)' : 'var(--tertiary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
            {member.expireDate || '—'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.6875rem' }}>잔여횟수/잔여일</span>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hasTicket ? `${totalRemaining}회` : ''}
            {hasTicket && dday !== null && !isExpired ? ' / ' : ''}
            {dday !== null && !isExpired ? `D-${dday === 0 ? 'Day' : String(dday).padStart(2, '0')}` : (!hasTicket ? '—' : '')}
          </div>
        </div>
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
          onClick={async (e) => {
            e.stopPropagation();
            if (attendedToday) return;
            const res = await markAttendance(member.id);
            if (onAttendanceSuccess && res.success) {
              onAttendanceSuccess(res.data);
            } else if (!res.success) {
              // 실패 시에만 안내 (이미 출석 등)
              alert(res.message);
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
          onClick={(e) => { e.stopPropagation(); openMemberModal(member); }}
        >
          <Edit2 size={18} />
        </button>

        <button style={{
          background: 'rgba(255,71,87,0.1)', border: 'none', color: 'var(--error)',
          width: '44px', height: '44px', borderRadius: '0.75rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
        }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,71,87,0.1)'; e.currentTarget.style.color = 'var(--error)'; }}
          onClick={async (e) => {
            e.stopPropagation();
            if (confirm(`${member.name} 회원을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.`)) {
              await deleteMember(member.id);
            }
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
