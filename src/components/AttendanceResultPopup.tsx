import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

interface AttendanceResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    memberName?: string;
    remainingQty?: number;
    remainingDays?: number;
    isExpired?: boolean;
    type: '횟수권' | '기간권' | 'mixed' | 'bulk';
    count?: number;
    total?: number;
  } | null;
}

export default function AttendanceResultPopup({ isOpen, onClose, data }: AttendanceResultPopupProps) {
  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              background: 'var(--surface-container-high)',
              width: '100%',
              maxWidth: '400px',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              border: '1px solid var(--outline-variant)',
              position: 'relative'
            }}
          >
            <button 
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--on-surface-variant)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <X size={24} />
            </button>

            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}
              >
                <CheckCircle2 size={72} color="#52b788" />
              </motion.div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
                {data.type === 'bulk' ? '일괄 출석 처리' : `${data.memberName}님`}
              </h2>
              <div style={{ fontSize: '1.125rem', color: '#52b788', fontWeight: 600, marginBottom: '2rem' }}>
                {data.type === 'bulk' ? (
                  `${data.count}명의 출석이 완료되었습니다!`
                ) : (
                  '출석이 완료되었습니다!'
                )}
              </div>

              <div style={{ 
                background: 'var(--surface-container-low)', 
                borderRadius: 'var(--radius-lg)', 
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {(data.type === '횟수권' || data.type === 'mixed') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>잔여 횟수</span>
                    <span style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 700, 
                      color: (data.remainingQty ?? 0) <= 3 ? 'var(--error)' : 'var(--tertiary)' 
                    }}>
                      {data.remainingQty ?? 0}회
                    </span>
                  </div>
                )}
                
                {(data.type === '기간권' || data.type === 'mixed') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>잔여 일수</span>
                    <span style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 700, 
                      color: (data.remainingDays ?? 0) <= 7 ? 'var(--error)' : 'var(--on-surface)' 
                    }}>
                      {data.remainingDays === 0 ? '만료' : `D-${data.remainingDays}`}
                    </span>
                  </div>
                )}

                {data.isExpired && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.75rem', 
                    background: 'rgba(255,71,87,0.1)', 
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--error)',
                    fontSize: '0.8125rem',
                    fontWeight: 600
                  }}>
                    ⚠️ 요금제가 만료되었습니다. 연장이 필요합니다.
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                style={{
                  marginTop: '2rem',
                  width: '100%',
                  background: 'var(--tertiary)',
                  color: '#502400',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
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
