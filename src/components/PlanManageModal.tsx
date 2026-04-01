import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import { useStore, type Plan } from '../store/useStore';

interface PlanManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlanManageModal({ isOpen, onClose }: PlanManageModalProps) {
  const plans = useStore(state => state.plans);
  const addPlan = useStore(state => state.addPlan);
  const updatePlan = useStore(state => state.updatePlan);
  const deletePlan = useStore(state => state.deletePlan);

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{name: string, price: number, months: number, type: '기간권'|'횟수권', defaultQty: number}>({ 
    name: '', price: 0, months: 1, type: '기간권', defaultQty: 0 
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEditClick = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setFormData({ 
      name: plan.name, price: plan.price, months: plan.months, 
      type: plan.type, defaultQty: plan.defaultQty || 0 
    });
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (editingPlanId) {
      updatePlan(editingPlanId, formData);
      setEditingPlanId(null);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPlan({ 
      name: formData.name, 
      price: Number(formData.price), 
      months: Number(formData.months),
      type: formData.type,
      defaultQty: formData.type === '횟수권' ? Number(formData.defaultQty) : undefined
    });
    setIsAdding(false);
    setFormData({ name: '', price: 0, months: 1, type: '기간권', defaultQty: 0 });
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
              width: '100%', maxWidth: '600px',
              padding: isMobile ? '0' : '0',
              display: 'flex', flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>요금제 관리</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: isMobile ? '1.25rem' : '1.5rem', overflowY: 'auto', flex: 1, minHeight: '300px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {plans.map(p => (
                  <div key={p.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--surface-container-low)', padding: '1rem',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)'
                  }}>
                    {editingPlanId === p.id ? (
                      <div style={{ display: 'flex', gap: '0.75rem', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as '기간권' | '횟수권'})} style={{ padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.875rem' }}>
                            <option value="기간권">기간권</option>
                            <option value="횟수권">횟수권</option>
                          </select>
                          <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="요금제명" style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.875rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                          <input type="number" value={formData.price} step="1000" onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="가격" style={{ width: '100px', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.875rem' }} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>원</span>
                          <input type="number" value={formData.months} onChange={e => setFormData({...formData, months: Number(e.target.value)})} placeholder="개월" style={{ width: '60px', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.875rem' }} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>개월</span>
                          {formData.type === '횟수권' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255, 183, 134, 0.1)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 183, 134, 0.3)' }}>
                              <input type="number" value={formData.defaultQty} onChange={e => setFormData({...formData, defaultQty: Number(e.target.value)})} placeholder="횟수" style={{ width: '50px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.875rem' }} />
                              <span style={{ fontSize: '0.8125rem', color: 'var(--tertiary)', fontWeight: 600 }}>회</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                          <button onClick={handleSaveEdit} className="btn-primary" style={{ height: '36px', padding: '0 1rem', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>저장</button>
                          <button onClick={() => setEditingPlanId(null)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{p.name}</span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                            {p.price.toLocaleString()}원 • {p.months}개월 유지 • {p.type} {p.type === '횟수권' ? `(${p.defaultQty}회)` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEditClick(p)} style={{ background: 'transparent', border: 'none', color: 'var(--tertiary)', cursor: 'pointer', padding: '0.5rem' }}><Edit2 size={18}/></button>
                          <button onClick={() => deletePlan(p.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={18}/></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {isAdding && (
                  <form onSubmit={handleAddSubmit} style={{
                    display: 'flex', gap: '0.75rem', flex: 1, alignItems: 'center', flexWrap: 'wrap',
                    background: 'var(--surface-container-low)', padding: '1.25rem',
                    borderRadius: 'var(--radius-md)', border: '2px dashed var(--tertiary)'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as '기간권' | '횟수권'})} style={{ padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.875rem' }}>
                        <option value="기간권">기간권</option>
                        <option value="횟수권">횟수권</option>
                      </select>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="새 요금제명" style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.875rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                      <input required type="number" step="1000" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="가격" style={{ width: '100px', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.875rem' }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>원</span>
                      <input required type="number" value={formData.months} onChange={e => setFormData({...formData, months: Number(e.target.value)})} placeholder="개월" style={{ width: '60px', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.875rem' }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>개월</span>
                      {formData.type === '횟수권' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255, 183, 134, 0.1)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 183, 134, 0.3)' }}>
                          <input required type="number" value={formData.defaultQty} onChange={e => setFormData({...formData, defaultQty: Number(e.target.value)})} placeholder="횟수" style={{ width: '50px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.875rem' }} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--tertiary)', fontWeight: 600 }}>회</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                      <button type="submit" style={{ height: '36px', padding: '0 1.25rem', background: 'var(--tertiary)', color: '#502400', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>저장</button>
                      <button type="button" onClick={() => setIsAdding(false)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={18}/></button>
                    </div>
                  </form>
                )}
                
                {!isAdding && (
                  <button onClick={() => { setIsAdding(true); setFormData({ name: '', price: 0, months: 1, type: '기간권', defaultQty: 0 }); setEditingPlanId(null); }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '1rem', border: '1px dashed var(--outline-variant)', borderRadius: 'var(--radius-md)',
                    background: 'transparent', color: 'var(--on-surface-variant)', cursor: 'pointer',
                    fontWeight: 600, transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = 'var(--on-surface)'; e.currentTarget.style.borderColor = 'var(--on-surface)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = 'var(--on-surface-variant)'; e.currentTarget.style.borderColor = 'var(--outline-variant)'; }}>
                    <Plus size={18} /> 새 요금제 추가
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
