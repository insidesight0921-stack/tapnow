import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CreditCard, History, Phone, Award, Edit2, Check, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { useStore, type Member, type PlanHistoryItem, type Plan } from '../store/useStore';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export default function MemberDetailModal({ isOpen, onClose, member }: MemberDetailModalProps) {
  const updateMemberHistoryItem = useStore(state => state.updateMemberHistoryItem);
  const deleteMemberHistoryItem = useStore(state => state.deleteMemberHistoryItem);
  const deleteAttendance = useStore(state => state.deleteAttendance);
  const customPlans = useStore(state => state.plans);
  const allAttendances = useStore(state => state.attendances);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PlanHistoryItem>>({});

  const memberAttendances = allAttendances
    .filter(a => a.memberId === member?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                            <td style={{ padding: '0.75rem' }}>
                              {editingId === h.id ? (
                                <input 
                                  type="date"
                                  value={editValues.date || h.date}
                                  onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                                  style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px', width: '100%' }}
                                />
                              ) : h.date}
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                              {editingId === h.id ? (
                                <input 
                                  type="text"
                                  value={editValues.planName || h.planName}
                                  onChange={(e) => setEditValues({ ...editValues, planName: e.target.value })}
                                  style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px', width: '100%' }}
                                />
                              ) : h.planName}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              {editingId === h.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <select 
                                    value={editValues.planType || h.planType}
                                    onChange={(e) => setEditValues({ ...editValues, planType: e.target.value as any })}
                                    style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '0.7rem', padding: '0.2rem', borderRadius: '4px' }}
                                  >
                                    <option value="기간권">기간권</option>
                                    <option value="횟수권">횟수권</option>
                                  </select>
                                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                    <input 
                                      type="number"
                                      placeholder={editValues.planType === '횟수권' || (h.planType === '횟수권' && !editValues.planType) ? "횟수" : "개월"}
                                      value={editValues.planType === '횟수권' || (h.planType === '횟수권' && !editValues.planType) ? (editValues.qty ?? h.qty ?? 0) : (editValues.months ?? h.months ?? 0)}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (editValues.planType === '횟수권' || (h.planType === '횟수권' && !editValues.planType)) {
                                          setEditValues({ ...editValues, qty: val, months: 0 });
                                        } else {
                                          setEditValues({ ...editValues, months: val, qty: 0 });
                                        }
                                      }}
                                      style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '0.7rem', padding: '0.2rem', borderRadius: '4px', width: '40px' }}
                                    />
                                    <span style={{ fontSize: '0.65rem' }}>{editValues.planType === '횟수권' || (h.planType === '횟수권' && !editValues.planType) ? "회" : "개월"}</span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '4px',
                                  background: h.type === '신규' ? 'rgba(52,152,219,0.1)' : 'rgba(82,183,136,0.1)',
                                  color: h.type === '신규' ? '#3498db' : '#52b788',
                                  fontSize: '0.6875rem',
                                  fontWeight: 600
                                }}>
                                  {h.type} ({h.planType})
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              {editingId === h.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginRight: '0.5rem' }}>
                                    <select
                                      value={customPlans.find(p => p.name === (editValues.planName || h.planName))?.id || ''}
                                      onChange={(e) => {
                                        const p = customPlans.find(cp => cp.id === e.target.value);
                                        if (p) {
                                          const qty = p.defaultQty || 1;
                                          setEditValues({
                                            ...editValues,
                                            planName: p.name,
                                            planType: p.type,
                                            months: p.months || 0,
                                            qty: p.type === '횟수권' ? qty : 0,
                                            amount: p.price * qty
                                          });
                                        }
                                      }}
                                      style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '0.7rem', padding: '0.2rem', borderRadius: '4px', width: '100px' }}
                                    >
                                      <option value="">요금제 선택</option>
                                      {customPlans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                      <input 
                                        type="number"
                                        placeholder="개수"
                                        value={editValues.qty ?? h.qty ?? 1}
                                        onChange={(e) => {
                                          const q = parseInt(e.target.value) || 1;
                                          const p = customPlans.find(cp => cp.name === (editValues.planName || h.planName));
                                          setEditValues({ 
                                            ...editValues, 
                                            qty: q,
                                            amount: p ? p.price * q : (editValues.amount ?? h.amount)
                                          });
                                        }}
                                        style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '0.7rem', padding: '0.2rem', borderRadius: '4px', width: '40px' }}
                                      />
                                      <span style={{ fontSize: '0.65rem' }}>개(회)</span>
                                    </div>
                                  </div>
                                  <input 
                                    type="number"
                                    value={editValues.amount ?? h.amount}
                                    onChange={(e) => setEditValues({ ...editValues, amount: parseInt(e.target.value) })}
                                    style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px', width: '60px', textAlign: 'right' }}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <button 
                                      onClick={async () => {
                                        await updateMemberHistoryItem(member.id, h.id, editValues);
                                        setEditingId(null);
                                        setEditValues({});
                                      }}
                                      style={{ background: 'var(--tertiary)', border: 'none', color: '#000', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button 
                                      onClick={() => { setEditingId(null); setEditValues({}); }}
                                      style={{ background: 'var(--surface-container-highest)', border: 'none', color: 'var(--on-surface-variant)', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      <RotateCcw size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <span>{h.amount.toLocaleString()}원</span>
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingId(h.id);
                                        setEditValues(h);
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', opacity: 0.6 }}
                                      onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                                      onMouseOut={(e) => (e.currentTarget.style.opacity = '0.6')}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button 
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm('이 요금제 기록을 삭제하시겠습니까? 삭제 시 회원 상태가 재계산됩니다.')) {
                                          await deleteMemberHistoryItem(member.id, h.id);
                                        }
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.6 }}
                                      onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                                      onMouseOut={(e) => (e.currentTarget.style.opacity = '0.6')}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
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

              {/* 출석 기록 */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>최근 출석 기록</h3>
                </div>
                
                <div style={{ 
                  background: 'var(--surface-container-low)', 
                  borderRadius: 'var(--radius-lg)', 
                  border: '1px solid var(--outline-variant)',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {memberAttendances.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-container-highest)', color: 'var(--on-surface-variant)', textAlign: 'left', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '0.75rem' }}>출석 날짜</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberAttendances.map((a) => (
                          <tr key={a.id} style={{ borderTop: '1px solid var(--outline-variant)' }}>
                            <td style={{ padding: '0.75rem', color: 'var(--on-surface)' }}>{a.date}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              <button 
                                onClick={async () => {
                                  if (confirm(`${a.date} 출석 기록을 삭제(취소)하시겠습니까? 횟수권인 경우 잔여 횟수가 1회 복구됩니다.`)) {
                                    await deleteAttendance(a.id);
                                  }
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }}
                                title="출석 취소"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                      출석 기록이 없습니다.
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
