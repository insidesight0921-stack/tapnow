import { useStore, type Member } from '../store/useStore';
import { Trash2, Edit2, History } from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  onDetail?: (member: Member) => void;
  onAttendanceSuccess?: (data: any) => void;
}

export default function MemberTable({ 
  members, selectedIds, onToggleSelection, onToggleAll, onDetail, onAttendanceSuccess 
}: MemberTableProps) {
  const markAttendance = useStore(state => state.markAttendance);
  const deleteMember = useStore(state => state.deleteMember);
  const openMemberModal = useStore(state => state.openMemberModal);
  const attendances = useStore(state => state.attendances);

  const todayStr = new Date().toISOString().split('T')[0];

  if (members.length === 0) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>등록된 회원이 없습니다.</div>;
  }

  const allIds = members.map(m => m.id);
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)', width: '40px' }}>
              <input 
                type="checkbox" 
                checked={isAllSelected} 
                onChange={() => onToggleAll(allIds)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--tertiary)' }}
              />
            </th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>이름</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>연락처</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>벨트 / 그랄</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>요금제 / 잔여</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>만료일 / D-day</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>상태</th>
            <th style={{ padding: '1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'center' }}>출석 / 관리</th>
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

            // 횟수권 잔여 횟수 (기간권만 있는 경우 노출하지 않음)
            const ticketPlans = member.plans.filter(p => p.type === '횟수권');
            const hasTicket = ticketPlans.length > 0;
            const totalRemaining = hasTicket ? ticketPlans.reduce((s, p) => s + (p.remainingQty ?? 0), 0) : 0;

            return (
              <tr key={member.id}
                style={{ borderBottom: '1px solid var(--outline-variant)', transition: 'background 0.1s', background: selectedIds.includes(member.id) ? 'rgba(255,183,0,0.05)' : 'transparent' }}
                onMouseOver={(e) => e.currentTarget.style.background = selectedIds.includes(member.id) ? 'rgba(255,183,0,0.1)' : 'var(--surface-container-highest)'}
                onMouseOut={(e) => e.currentTarget.style.background = selectedIds.includes(member.id) ? 'rgba(255,183,0,0.05)' : 'transparent'}
              >
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(member.id)} 
                    onChange={() => onToggleSelection(member.id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--tertiary)' }}
                  />
                </td>
                <td 
                  style={{ padding: '1rem', fontWeight: 600, color: 'var(--on-surface)', cursor: 'pointer' }}
                  onClick={() => onDetail && onDetail(member)}
                >
                  {member.name}
                </td>
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
                  <div style={{ fontWeight: 600 }}>{member.plans.length > 0 ? member.plans.map(p => p.qty > 1 ? `${p.name}×${p.qty}` : p.name).join(', ') : '—'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', marginTop: '0.25rem' }}>
                    {hasTicket && (
                      <span style={{ color: totalRemaining <= 3 ? '#ffb700' : 'var(--on-surface-variant)', fontSize: '0.8125rem', fontWeight: 700 }}>
                        {totalRemaining}회 남음
                      </span>
                    )}
                    {dday !== null && !isExpired && (
                      <span style={{ color: dday <= 3 ? 'var(--error)' : dday <= 7 ? '#ffb700' : 'var(--on-surface-variant)', fontSize: '0.8125rem', fontWeight: 700 }}>
                        D-{String(dday).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ color: isExpired ? 'var(--error)' : 'var(--tertiary)', fontWeight: 500 }}>{member.expireDate || '—'}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    background: status === '유효' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255, 180, 171, 0.15)',
                    color: status === '유효' ? '#52b788' : 'var(--error)',
                    padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                  }}>{status}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
                      onClick={async () => {
                        if (attendedToday) return;
                        const res = await markAttendance(member.id);
                        if (onAttendanceSuccess && res.success) {
                          onAttendanceSuccess(res.data);
                        } else if (!res.success) {
                          alert(res.message);
                        }
                      }}
                    >{attendedToday ? '✅ 완료' : '출석'}</button>
                      <button
                        style={{
                          background: 'rgba(52,152,219,0.1)', border: 'none', color: '#3498db',
                          borderRadius: 'var(--radius-md)', padding: '0.25rem 0.5rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => onDetail && onDetail(member)}
                        title="상세 보기"
                      >
                        <History size={16} />
                      </button>
                      <button
                        style={{
                          background: 'rgba(155,89,182,0.1)', border: 'none', color: '#9b59b6',
                          borderRadius: 'var(--radius-md)', padding: '0.25rem 0.5rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => openMemberModal(member)}
                        title="회원 수정"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        style={{
                          background: 'rgba(255,71,87,0.1)', border: 'none', color: 'var(--error)',
                          borderRadius: 'var(--radius-md)', padding: '0.25rem 0.5rem',
                          cursor: 'pointer'
                        }}
                        onClick={async () => {
                          if (confirm(`${member.name} 회원을 삭제하시겠습니까?`)) {
                            await deleteMember(member.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
