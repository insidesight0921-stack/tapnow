import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Trash2, Plus } from 'lucide-react';
import { useStore, type Member } from '../store/useStore';

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export default function AttendanceDetailModal({ isOpen, onClose, member }: AttendanceDetailModalProps) {
  const attendances = useStore(state => state.attendances);
  const deleteAttendance = useStore(state => state.deleteAttendance);
  const addPastAttendance = useStore(state => state.addPastAttendance);
  
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('12:00');

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    const dateStr = new Date(`${manualDate}T${manualTime}:00`).toISOString();
    addPastAttendance(member.id, dateStr);
  };

  if (!member) return null;

  // 해당 회원의 출석 기록 필터링 및 최신순 정렬
  const memberAttendances = attendances
    .filter(a => a.memberId === member.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 현재 월 출석 횟수
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthCount = memberAttendances.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

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
              width: '100%', maxWidth: '450px',
              display: 'flex', flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>출석 기록 상세</h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>{member.name} 님의 기록</div>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--outline-variant)' }}>
              <div style={{ flex: 1, background: 'var(--surface-container-low)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>이번 달 출석</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#52b788' }}>{thisMonthCount}<span style={{ fontSize: '1rem', fontWeight: 500 }}>회</span></div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface-container-low)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>총 누적 출석</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--tertiary)' }}>{memberAttendances.length}<span style={{ fontSize: '1rem', fontWeight: 500 }}>회</span></div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--tertiary)" /> 전체 출석 기록 ({memberAttendances.length})
              </h3>
              
              <form onSubmit={handleManualAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--surface-container-low)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--outline-variant)' }}>
                <input required type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }} />
                <input required type="time" value={manualTime} onChange={e => setManualTime(e.target.value)} style={{ width: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }} />
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'var(--tertiary)', color: '#502400', borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={16} /> 추가
                </button>
              </form>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {memberAttendances.map(a => {
                  const dateObj = new Date(a.date);
                  const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
                  const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={a.id} style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem', background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)'
                    }}>
                      <span style={{ fontWeight: 500 }}>{dateStr}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{timeStr}</span>
                        <button onClick={() => deleteAttendance(a.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {memberAttendances.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)' }}>
                    아직 출석 기록이 없습니다.
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
