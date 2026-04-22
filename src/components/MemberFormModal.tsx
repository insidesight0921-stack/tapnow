import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore, type Member, type PlanHistoryItem } from '../store/useStore';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 수정일 경우 전달
  memberToEdit?: Member | null;
}

export default function MemberFormModal({ isOpen, onClose, memberToEdit }: MemberFormModalProps) {
  const customPlans = useStore(state => state.plans);
  const addMember = useStore(state => state.addMember);
  const updateMember = useStore(state => state.updateMember);
  const currentGymId = useStore(state => state.gymId) || 'gym_default';

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    belt: '화이트',
    gral: 0,
    registerDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    planQs: {} as Record<string, number>,
    paymentAmount: 0,
    paymentMethod: '카드 결제',
    memo: '',
    remainingQty: 0, // 수정 시 사용
    saveToPayment: true // 결제 기록 저장 여부
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        name: memberToEdit.name,
        phone: memberToEdit.phone,
        belt: memberToEdit.belt,
        gral: memberToEdit.gral,
        registerDate: memberToEdit.registerDate,
        startDate: new Date().toISOString().split('T')[0],
        planQs: {} as Record<string, number>, // 신규 추가할 요금제만 관리
        paymentAmount: 0,
        paymentMethod: '카드 결제',
        memo: memberToEdit.memo,
        remainingQty: memberToEdit.plans.find(p => p.type === '횟수권')?.remainingQty ?? 0,
        saveToPayment: true
      });
    } else {
      setFormData({
        name: '', phone: '', belt: '화이트', gral: 0,
        registerDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        planQs: {}, paymentAmount: 0, paymentMethod: '카드 결제', memo: '', remainingQty: 0, saveToPayment: true
      });
    }
    setError('');
  }, [memberToEdit, isOpen, customPlans]);

  // 요금제 수량 조절
  const handleQtyChange = (planId: string, delta: number) => {
    setFormData(prev => {
      const currentQty = prev.planQs[planId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newPlanQs = { ...prev.planQs, [planId]: newQty };
      if (newQty === 0) delete newPlanQs[planId];

      const totalAmount = Object.entries(newPlanQs).reduce((sum, [id, qty]) => {
        const p = customPlans.find(cp => cp.id === id);
        return sum + (p ? p.price * qty : 0);
      }, 0);

      return { ...prev, planQs: newPlanQs, paymentAmount: totalAmount };
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // 3. 만료일 및 요금제 히스토리 계산
      let expireDate = memberToEdit ? memberToEdit.expireDate : '';
      let plansArr = memberToEdit ? [...memberToEdit.plans] : [];
      let newHistoryItems: PlanHistoryItem[] = [];

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      let totalMonths = 0;
      Object.entries(formData.planQs).forEach(([id, qty]) => {
        const p = customPlans.find(cp => cp.id === id);
        if (p) totalMonths += (p.months || 0) * qty;
      });

      const hasNewPlans = Object.keys(formData.planQs).length > 0;
      if (hasNewPlans) {
        plansArr = []; // 신규 요금제 결제 시 기존 요금제 정보는 기록으로만 남기고 초기화
      }

      if (totalMonths > 0) {
        // 기준 날짜 결정 (만료되지 않았으면 기존 만료일, 만료되었거나 신규면 오늘/시작일)
        let baseDate: Date;
        if (memberToEdit) {
          const currentExp = new Date(memberToEdit.expireDate);
          baseDate = currentExp > today ? currentExp : today;
        } else {
          baseDate = new Date(formData.startDate);
        }

        // 새 만료일 계산
        const newBase = new Date(baseDate);
        newBase.setMonth(newBase.getMonth() + totalMonths);
        expireDate = newBase.toISOString().split('T')[0];

        // 새로운 요금제 정보 생성 및 히스토리 기록
        Object.entries(formData.planQs).forEach(([id, qty]) => {
          const p = customPlans.find(cp => cp.id === id);
          if (p && qty > 0) {
            newHistoryItems.push({
              id: Math.random().toString(36).substr(2, 9),
              date: todayStr,
              planName: p.name,
              amount: p.price * qty,
              months: p.months * qty,
              qty: p.type === '횟수권' ? (p.defaultQty || 1) * qty : 0,
              planType: p.type,
              type: memberToEdit ? '연장' : '신규'
            });

            for (let i = 0; i < qty; i++) {
              plansArr.push({
                name: p.name,
                qty: p.type === '횟수권' ? (p.defaultQty || 1) : 1,
                type: p.type,
                remainingQty: p.type === '횟수권' ? (p.defaultQty || 1) : undefined
              });
            }
          }
        });
      } else if (memberToEdit) {
        // 요금제 추가 없이 정보만 수정하는 경우 (횟수권 잔여량은 수동 수정 가능)
        plansArr = memberToEdit.plans.map(p => {
          if (p.type === '횟수권') {
            return { ...p, remainingQty: Number(formData.remainingQty) };
          }
          return p;
        });
      }

      const payload = {
        gymId: currentGymId,
        name: formData.name,
        phone: formData.phone,
        belt: formData.belt,
        gral: Number(formData.gral) || 0,
        registerDate: formData.registerDate,
        startDate: formData.startDate,
        plans: plansArr,
        paymentAmount: Number(formData.paymentAmount) || 0,
        paymentMethod: formData.paymentMethod,
        expireDate,
        memo: formData.memo,
        planHistory: memberToEdit 
          ? [...(memberToEdit.planHistory || []), ...newHistoryItems] 
          : newHistoryItems
      };

      console.log(JSON.stringify(payload, null, 2));

      let memberIdToUse = '';
      if (memberToEdit) {
        memberIdToUse = memberToEdit.id;
        await updateMember(memberToEdit.id, payload);
      } else {
        const result = await addMember(payload);
        if (result.success && (result as any).id) {
          memberIdToUse = (result as any).id;
        } else if (result.success) {
          // fallback: members 리스트에서 방금 추가된 멤버 찾기 (약간의 레이턴시 위험 있음)
          // 하지만 대부분의 경우 addMember가 ID를 반환하도록 스토어를 수정하는게 좋음.
        } else {
          setError(result.message);
          setIsSubmitting(false);
          return;
        }
      }

      // 결제 기록 자동 생성
      if (formData.saveToPayment && Number(formData.paymentAmount) > 0) {
        const selectedPlanNames = Object.entries(formData.planQs)
          .filter(([_, qty]) => qty > 0)
          .map(([id, _]) => customPlans.find(p => p.id === id)?.name)
          .filter(Boolean)
          .join(', ');

        await useStore.getState().addPayment({
          gymId: currentGymId,
          memberId: memberIdToUse || undefined,
          memberName: formData.name,
          amount: Number(formData.paymentAmount),
          method: formData.paymentMethod as any,
          planName: selectedPlanNames || '수동 갱신',
          date: todayStr,
          status: '완료'
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Submit Error:', err);
      setError('처리 중 오류가 발생했습니다: ' + (err.message || '서버 응답 없음'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <motion.div
            className="modal-content-base"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: 'var(--surface-container-high)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-xl)',
              width: '100%', maxWidth: '500px'
            }}
          >
            <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface-container-high)', zIndex: 10, flexShrink: 0, borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{memberToEdit ? '회원 정보 수정' : '신규 회원 등록'}</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.5rem' }}><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body-scroll" style={{ padding: isMobile ? '1.25rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ 
                  background: 'rgba(255, 180, 171, 0.1)', color: 'var(--error)', 
                  padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600,
                  border: '1px solid var(--error)'
                }}>
                  {error}
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>이름 <span style={{color: 'var(--error)'}}>*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="홍길동" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.875rem' }}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>전화번호 <span style={{color: 'var(--error)'}}>*</span></label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" placeholder="010-1234-5678" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.875rem' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>등록일 <span style={{color: 'var(--error)'}}>*</span></label>
                  <input required type="date" value={formData.registerDate} onChange={e => setFormData({...formData, registerDate: e.target.value})} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.875rem' }}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>시작일 <span style={{color: 'var(--error)'}}>*</span></label>
                  <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.875rem' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>벨트 색상</label>
                  <select value={formData.belt} onChange={e => setFormData({...formData, belt: e.target.value})} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', outline: 'none', fontSize: '0.875rem' }}>
                    <option value="화이트">화이트</option>
                    <option value="블루">블루</option>
                    <option value="퍼플">퍼플</option>
                    <option value="브라운">브라운</option>
                    <option value="블랙">블랙</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>그랄 (Gral)</label>
                  <select value={formData.gral} onChange={e => setFormData({...formData, gral: Number(e.target.value)})} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', outline: 'none', fontSize: '0.875rem' }}>
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} 그랄</option>)}
                  </select>
                </div>
              </div>

              {/* 횟수권 회원의 경우 잔여 횟수 수정 필드 노출 */}
              {memberToEdit && memberToEdit.plans.some(p => p.type === '횟수권') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary-container)' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)' }}>기존 횟수권 잔여 횟수 수정</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="number" 
                      value={formData.remainingQty || ''} 
                      onChange={e => setFormData({...formData, remainingQty: e.target.value === '' ? 0 : Number(e.target.value)})} 
                      style={{ width: '100px', background: 'var(--surface-container-low)', border: '1px solid var(--primary)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '1rem', fontWeight: 800, textAlign: 'center' }}
                      onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                    />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                      현재 등록된 횟수권의 남은 횟수를 직접 수정할 수 있습니다.<br/>
                      <small>(새로운 요금제를 결제하는 경우 이 값은 무시됩니다.)</small>
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>신규 요금제 연장/결제 <span style={{fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 400}}>(선택 시 금액/기간 자동 연장)</span></label>
                  {(() => {
                    let previewExpire = '';
                    let tempMonths = 0;
                    Object.entries(formData.planQs).forEach(([id, qty]) => {
                      const p = customPlans.find(cp => cp.id === id);
                      if (p) tempMonths += (p.months || 0) * qty;
                    });
                    
                    if (tempMonths > 0) {
                      let base: Date;
                      if (memberToEdit) {
                        const curr = new Date(memberToEdit.expireDate);
                        base = curr > new Date() ? curr : new Date();
                      } else {
                        base = new Date(formData.startDate);
                      }
                      const newBase = new Date(base);
                      newBase.setMonth(newBase.getMonth() + tempMonths);
                      previewExpire = newBase.toISOString().split('T')[0];
                    } else if (memberToEdit) {
                      previewExpire = memberToEdit.expireDate;
                    }
                    
                    return previewExpire ? (
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-container)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                        예상 만료일: {previewExpire}
                      </div>
                    ) : null;
                  })()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface-container-low)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)', maxHeight: '200px', overflowY: 'auto' }}>
                  {customPlans.length === 0 && <span style={{fontSize: '0.75rem', color: 'var(--on-surface-variant)'}}>등록된 요금제가 없습니다.</span>}
                  {customPlans.map(p => {
                    const qty = formData.planQs[p.id] || 0;
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--outline-variant)', borderBottomStyle: 'none' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{p.price.toLocaleString()}원 / {p.months}개월</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button 
                            type="button" 
                            onClick={() => handleQtyChange(p.id, -1)} 
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}
                          >−</button>
                          <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>{qty}</span>
                          <button 
                            type="button" 
                            onClick={() => handleQtyChange(p.id, 1)} 
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--primary)', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>결제 금액 (원)</label>
                  <input 
                    type="number" 
                    step="1000" 
                    value={formData.paymentAmount || ''} 
                    onChange={e => setFormData({...formData, paymentAmount: e.target.value === '' ? 0 : Number(e.target.value)})} 
                    style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.875rem' }}
                    placeholder="0"
                    onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>결제 수단</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', outline: 'none', fontSize: '0.875rem' }}>
                    <option value="카드 결제">카드 결제</option>
                    <option value="결제 대행">결제 대행</option>
                    <option value="계좌 이체">계좌 이체</option>
                    <option value="현금">현금</option>
                  </select>
                </div>
              </div>

              {/* 결제 기록 저장 체크박스 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-lowest)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }}>
                <input 
                  type="checkbox" 
                  id="saveToPayment" 
                  checked={formData.saveToPayment} 
                  onChange={e => setFormData({...formData, saveToPayment: e.target.checked})}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="saveToPayment" style={{ fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600, color: 'var(--on-surface)' }}>
                  결제 관리 탭에 자동으로 기록 저장
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>메모</label>
                <textarea value={formData.memo} onChange={e => setFormData({...formData, memo: e.target.value})} rows={2} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.875rem', resize: 'vertical' }} placeholder="도복 포함, 특이사항 등"/>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingBottom: '0.5rem' }}>
                <button type="button" onClick={onClose} disabled={isSubmitting} style={{ flex: isMobile ? 1 : 'unset', padding: '1rem 2rem', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '1.125rem' }}>취소</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: isMobile ? 1 : 'unset', padding: '1rem 2.5rem', background: 'var(--primary)', border: 'none', color: '#000', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 800, fontSize: '1.125rem' }}>
                  {isSubmitting ? '처리 중...' : (memberToEdit ? '저장' : '등록')}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
