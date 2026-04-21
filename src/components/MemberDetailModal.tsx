import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CreditCard, History, Phone, Award } from 'lucide-react';
import type { Member } from '../store/useStore';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export default function MemberDetailModal({ isOpen, onClose, member }: MemberDetailModalProps) {
  if (!member) return null;

  const isExpired = member.expireDate && new Date(member.expireDate) < new Date();

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: 'var(--surface-container-high)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--outline-variant)'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid var(--outline-variant)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--surface-container-highest)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#502400',
                  fontSize: '1.25rem',
                  fontWeight: 800
                }}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>{member.name} 회원 상세</h2>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: isExpired ? 'var(--error)' : '#52b788',
                    fontWeight: 700,
                    background: isExpired ? 'rgba(255,71,87,0.1)' : 'rgba(82,183,136,0.1)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    {isExpired ? '기간 만료' : '정상 이용 중'}
                  </span>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={18} color="var(--on-surface-variant)" />
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>연락처</div>
                    <div style={{ fontSize: '0.9375rem' }}>{member.phone || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={18} color="var(--on-surface-variant)" />
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>벨트 / 그랄</div>
                    <div style={{ fontSize: '0.9375rem' }}>{member.belt} / {member.gral}그랄</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={18} color="var(--on-surface-variant)" />
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>등록일</div>
                    <div style={{ fontSize: '0.9375rem' }}>{member.registerDate}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CreditCard size={18} color="var(--on-surface-variant)" />
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>만료일</div>
                    <div style={{ fontSize: '0.9375rem', color: isExpired ? 'var(--error)' : 'var(--on-surface)', fontWeight: 600 }}>
                      {member.expireDate || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 요금제 히스토리 */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <History size={18} color="var(--tertiary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>요금제 최신화 기록</h3>
                </div>
                
                <div style={{ 
                  background: 'var(--surface-container-low)', 
                  borderRadius: 'var(--radius-lg)', 
                  overflow: 'hidden',
                  border: '1px solid var(--outline-variant)'
                }}>
                  {member.planHistory && member.planHistory.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-container-highest)', color: 'var(--on-surface-variant)', textAlign: 'left' }}>
                          <th style={{ padding: '0.75rem' }}>날짜</th>
                          <th style={{ padding: '0.75rem' }}>요금제</th>
                          <th style={{ padding: '0.75rem' }}>유형</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {member.planHistory.map((h, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--outline-variant)' }}>
                            <td style={{ padding: '0.75rem' }}>{h.date}</td>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{h.planName}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                background: h.type === '신규' ? 'rgba(52,152,219,0.1)' : 'rgba(82,183,136,0.1)',
                                color: h.type === '신규' ? '#3498db' : '#52b788',
                                fontSize: '0.6875rem',
                                fontWeight: 600
                              }}>
                                {h.type}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{h.amount.toLocaleString()}원</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                      기록된 요금제 변경 이력이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* 메모 섹션 */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>메모</div>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--surface-container-low)', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.875rem',
                  color: 'var(--on-surface)',
                  minHeight: '60px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {member.memo || '기록된 메모가 없습니다.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  background: 'var(--surface-container-highest)',
                  color: 'var(--on-surface)',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
