import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../store/useStore';

interface BulkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkAttendanceModal({ isOpen, onClose }: BulkAttendanceModalProps) {
  const members = useStore(state => state.members);
  const currentGymId = useStore(state => state.gymId) || 'ALL';
  const bulkMarkAttendance = useStore(state => state.bulkMarkAttendance);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const displayMembers = members.filter(m => {
    if (currentGymId !== 'ALL' && m.gymId !== currentGymId) return false;
    if (search && !m.name.includes(search)) return false;
    // 만료된 회원은 제외 처리할 수도 있지만 기획에 따라 전체 표시
    return true;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === displayMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayMembers.map(m => m.id)));
    }
  };

  const handleBulkAttendance = () => {
    if (selectedIds.size === 0) return;
    bulkMarkAttendance(Array.from(selectedIds));
    alert(`${selectedIds.size}명의 출석 처리가 완료되었습니다.`);
    onClose();
    setSelectedIds(new Set()); // 초기화
    setSearch('');
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
              display: 'flex', flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>일괄 출석 처리</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="이름 검색..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1, background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--on-surface-variant)' }}>
                  선택됨: <strong style={{ color: 'var(--tertiary)' }}>{selectedIds.size}</strong> 명
                </span>
                <button 
                  onClick={selectAll} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--tertiary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  {selectedIds.size === displayMembers.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {displayMembers.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => toggleSelect(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
                    cursor: 'pointer', borderRadius: '0.5rem',
                    background: selectedIds.has(m.id) ? 'var(--surface-container-highest)' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedIds.has(m.id) ? 'var(--tertiary)' : 'transparent',
                    transition: 'all 0.2s', marginBottom: '0.5rem'
                  }}
                >
                  <div style={{ color: selectedIds.has(m.id) ? 'var(--tertiary)' : 'var(--on-surface-variant)' }}>
                    {selectedIds.has(m.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{m.phone || '연락처 없음'}</div>
                  </div>
                </div>
              ))}
              {displayMembers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)' }}>검색 결과가 없습니다.</div>
              )}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: '1rem' }}>
              <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)', background: 'transparent', color: 'var(--on-surface)' }}>취소</button>
              <button 
                onClick={handleBulkAttendance} 
                className="btn-primary" 
                style={{ flex: 2, padding: '1rem', borderRadius: '0.5rem', border: 'none', fontWeight: 700 }}
                disabled={selectedIds.size === 0}
              >
                {selectedIds.size}명 출석 완료
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
