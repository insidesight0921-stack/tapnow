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
    planId: '',
    paymentAmount: 0,
    paymentMethod: '카드 결제',
    memo: ''
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
        planId: '', // Todo: 기존 plan 매핑 보완
        paymentAmount: memberToEdit.paymentAmount,
        paymentMethod: memberToEdit.paymentMethod,
        memo: memberToEdit.memo
      });
    } else {
      setFormData({
        name: '', phone: '', belt: '화이트', gral: 0,
        registerDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        planId: '', paymentAmount: 0, paymentMethod: '카드 결제', memo: ''
      });
    }
    setError('');
  }, [memberToEdit, isOpen]);

  // 요금제 변경 시 금액 자동 설정
  const handlePlanChange = (planId: string) => {
    const selectedPlan = customPlans.find(p => p.id === planId);
    setFormData(prev => ({
      ...prev,
      planId,
      paymentAmount: selectedPlan ? selectedPlan.price : prev.paymentAmount
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 선택된 요금제 기준으로 만료일 계산
    let expireDate = '';
    const selectedPlan = customPlans.find(p => p.id === formData.planId);
    let plansArr: { name: string, qty: number }[] = [];
    
    if (selectedPlan) {
      plansArr = [{ name: selectedPlan.name, qty: selectedPlan.type === '횟수권' ? (selectedPlan.defaultQty || 1) : 1 }];
      const start = new Date(formData.startDate);
      start.setMonth(start.getMonth() + selectedPlan.months);
      expireDate = start.toISOString().split('T')[0];
    } else if (memberToEdit) {
      expireDate = memberToEdit.expireDate;
      plansArr = memberToEdit.plans;
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
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface-container-high)', zIndex: 10 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{memberToEdit ? '회원 정보 수정' : '신규 회원 등록'}</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={24} /></button>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>요금제 선택 <span style={{color: 'var(--error)'}}>*</span></label>
                <select required value={formData.planId} onChange={e => handlePlanChange(e.target.value)} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', outline: 'none', fontSize: '0.875rem' }}>
                  <option value="">-- 요금제 선택 --</option>
                  {customPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()}원)</option>
                  ))}
                </select>
              </div>

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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={onClose} disabled={isSubmitting} style={{ flex: isMobile ? 1 : 'unset', padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>취소</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: isMobile ? 1 : 'unset', padding: '0.75rem 1.5rem', background: 'var(--primary)', border: 'none', color: '#000', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
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
