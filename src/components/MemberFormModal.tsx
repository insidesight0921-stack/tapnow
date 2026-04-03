import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore, type Member } from '../store/useStore';

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
    remainingQty: 0 // 수정 시 사용
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
        startDate: memberToEdit.startDate,
        planQs: memberToEdit.plans.reduce((acc, p) => {
          const matched = customPlans.find(cp => cp.name === p.name);
          if (matched) {
            acc[matched.id] = (acc[matched.id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        paymentAmount: memberToEdit.paymentAmount,
        paymentMethod: memberToEdit.paymentMethod,
        memo: memberToEdit.memo,
        remainingQty: memberToEdit.plans.find(p => p.type === '횟수권')?.remainingQty ?? 0
      });
    } else {
      setFormData({
        name: '', phone: '', belt: '화이트', gral: 0,
        registerDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        planQs: {}, paymentAmount: 0, paymentMethod: '카드 결제', memo: '', remainingQty: 0
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
    
    let expireDate = '';
    let totalMonths = 0;
    let plansArr: any[] = [];
    
    Object.entries(formData.planQs).forEach(([id, qty]) => {
      const p = customPlans.find(cp => cp.id === id);
      if (p && qty > 0) {
        totalMonths += (p.months || 0) * qty;
        for (let i = 0; i < qty; i++) {
          plansArr.push({
            name: p.name,
            qty: p.type === '횟수권' ? (p.defaultQty || 1) : 1,
            remainingQty: p.type === '횟수권' ? (p.defaultQty || 1) : undefined,
            type: p.type
          });
        }
      }
    });

    const start = new Date(formData.startDate);
    if (totalMonths > 0) {
      start.setMonth(start.getMonth() + totalMonths);
      expireDate = start.toISOString().split('T')[0];
    } else if (memberToEdit) {
      expireDate = memberToEdit.expireDate;
      plansArr = memberToEdit.plans.map(p => {
        if (p.type === '횟수권') {
          return { ...p, remainingQty: formData.remainingQty };
        }
        return p;
      });
    }

    const payload = {
      gymId: currentGymId,
      name: formData.name,
      phone: formData.phone,
      belt: formData.belt,
      gral: Number(formData.gral),
      registerDate: formData.registerDate,
      startDate: formData.startDate,
      plans: plansArr,
      paymentAmount: Number(formData.paymentAmount),
      paymentMethod: formData.paymentMethod,
      expireDate,
      memo: formData.memo
    };

    if (memberToEdit) {
      await updateMember(memberToEdit.id, payload);
      onClose();
    } else {
      const result = await addMember(payload);
      if (result.success) {
        onClose();
      } else {
        setError(result.message);
      }
    }
    setIsSubmitting(false);
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: 'var(--surface-container-high)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-xl)',
              width: '100%', maxWidth: '500px',
              maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface-container-high)', zIndex: 10 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{memberToEdit ? '회원 정보 수정' : '신규 회원 등록'}</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.5rem' }}><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: isMobile ? '1.25rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>요금제 선택 및 수량 <span style={{color: 'var(--error)'}}>*</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface-container-low)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)', maxHeight: '250px', overflowY: 'auto' }}>
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

              {memberToEdit && memberToEdit.plans.some(p => p.type === '횟수권') && Object.keys(formData.planQs).length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,183,0,0.05)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,183,0,0.2)' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffb700' }}>⚠️ 잔여 횟수 직접 수정</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="number" 
                      value={formData.remainingQty} 
                      onChange={e => setFormData({...formData, remainingQty: Number(e.target.value)})} 
                      style={{ width: '80px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.5rem', borderRadius: '0.4rem', color: 'var(--on-surface)', fontSize: '0.9375rem', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>기존 횟수권의 남은 횟수를 직접 수정합니다.</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>결제 금액 (원)</label>
                  <input type="number" step="1000" value={formData.paymentAmount} onChange={e => setFormData({...formData, paymentAmount: Number(e.target.value)})} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.875rem' }}/>
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
