import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useStore, type Member } from '../store/useStore';

export default function KioskPage() {
  const navigate = useNavigate();
  const gymName = useStore(state => state.gymName);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
      padding: isMobile ? '1rem' : 'var(--space-10)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 돌아가기 버튼 - 상단 우측 */}
      <button
        onClick={() => navigate('/admin/members')}
        style={{
          position: isMobile ? 'absolute' : 'fixed',
          top: isMobile ? '1rem' : '1.5rem',
          right: isMobile ? '1rem' : '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--surface-container-high)',
          border: '1px solid var(--outline-variant)',
          color: 'var(--on-surface-variant)',
          padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          fontSize: isMobile ? '0.75rem' : '0.875rem',
          fontWeight: 700,
          transition: 'all 0.2s',
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--surface-container-highest)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--surface-container-high)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <ArrowLeft size={isMobile ? 14 : 18} />
        {isMobile ? '관리자' : '관리자 화면으로 돌아가기'}
      </button>

      <KioskCard gymName={gymName} isMobile={isMobile} />
    </div>
  );
}

function KioskCard({ gymName, isMobile }: { gymName: string, isMobile: boolean }) {
  const members = useStore(state => state.members);
  const markAttendance = useStore(state => state.markAttendance);
  const gymId = useStore(state => state.gymId);

  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'NOT_FOUND' | 'ALREADY' | 'MULTIPLE'>('IDLE');
  const [checkedName, setCheckedName] = useState('');
  const [matchingMembers, setMatchingMembers] = useState<Member[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [checkedInfo, setCheckedInfo] = useState<{ remaining?: number, isWarning: boolean } | null>(null);

  const handleNumberClick = (num: string) => {
    if (status !== 'IDLE' && status !== 'MULTIPLE') { 
      handleClear();
      return; 
    }
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleDelete = () => {
    if (status !== 'IDLE' && status !== 'MULTIPLE') { handleClear(); return; }
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setStatus('IDLE');
    setMatchingMembers([]);
    setStatusMsg('');
    setCheckedInfo(null);
  };

  const processAttendance = async (member: Member) => {
    setStatus('LOADING');
    const res = await markAttendance(member.id);
    
    if (res.success) {
      setCheckedName(member.name);
      setStatusMsg(res.message);
      
      const ticketPlans = member.plans.filter(p => p.type === '횟수권');
      if (ticketPlans.length > 0) {
        const totalRem = ticketPlans.reduce((s, p) => s + (p.remainingQty ?? 0), 0);
        // markAttendance에서 이미 차감되었으므로 -1된 값이 실제 UI에 표시됨
        setCheckedInfo({ 
          remaining: totalRem - 1, 
          isWarning: res.message.includes('부족') 
        });
      }
      setStatus('SUCCESS');
      
      setTimeout(() => {
        handleClear();
      }, 4000);
    } else {
      setCheckedName(member.name);
      setStatusMsg(res.message);
      setStatus(res.message.includes('이미') ? 'ALREADY' : 'NOT_FOUND');
      
      setTimeout(() => {
        if (status !== 'MULTIPLE') handleClear();
      }, 3000);
    }
  };

  const handleCheckIn = async () => {
    if (pin.length !== 4) return;
    
    const matches = members.filter(m => 
      (m.gymId === gymId || gymId === 'ALL') && 
      m.phone.replace(/-/g, '').endsWith(pin)
    );

    if (matches.length === 0) {
      setStatus('NOT_FOUND');
      setStatusMsg('등록된 회원을 찾을 수 없습니다.');
      setTimeout(handleClear, 2000);
    } else if (matches.length === 1) {
      await processAttendance(matches[0]);
    } else {
      setMatchingMembers(matches);
      setStatus('MULTIPLE');
    }
  };

  useEffect(() => {
    if (pin.length === 4 && status === 'IDLE') {
      handleCheckIn();
    }
  }, [pin]);

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        width: '100%', maxWidth: '480px', padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
        borderRadius: '2rem', textAlign: 'center', position: 'relative'
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-logo)', 
          fontSize: isMobile ? '2.5rem' : '3.5rem', 
          color: 'var(--tertiary)', 
          letterSpacing: '4px', 
          marginBottom: '0.5rem',
          textShadow: '0 0 20px rgba(255,183,0,0.2)'
        }}>TAPNOW</h1>
        <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{gymName || '관리 대시보드'}</div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'MULTIPLE' ? (
          <motion.div
            key="multiple"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <p style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '1.125rem' }}>동일한 번호의 회원이 여러 명 있습니다.<br/>본인의 이름을 선택해 주세요.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '1rem' }}>
              {matchingMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => processAttendance(m)}
                  style={{
                    background: 'var(--surface-container-highest)', 
                    border: '1px solid var(--outline-variant)',
                    color: 'var(--on-surface)',
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--tertiary)';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--surface-container-highest)';
                    e.currentTarget.style.color = 'var(--on-surface)';
                  }}
                >
                  <User size={20} />
                  {m.name}
                </button>
              ))}
            </div>
            <button onClick={handleClear} style={{ marginTop: 'auto', background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', textDecoration: 'underline', cursor: 'pointer' }}>다시 입력하기</button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p style={{ color: 'var(--on-surface-variant)', fontSize: isMobile ? '0.9375rem' : '1.125rem', marginBottom: '1.5rem', fontWeight: 500 }}>
              전화번호 뒷자리 4자리를 입력해 주세요
            </p>

            {/* PIN 화면 */}
            <div style={{
              background: 'var(--surface-container-highest)', 
              padding: isMobile ? '1.25rem' : '1.75rem', 
              borderRadius: '1.25rem',
              marginBottom: '2rem', 
              fontSize: isMobile ? '2.25rem' : '3rem', 
              letterSpacing: isMobile ? '12px' : '20px', 
              color: 'var(--on-surface)',
              fontWeight: 800, 
              minHeight: isMobile ? '70px' : '90px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)',
              border: '1px solid var(--outline-variant)'
            }}>
              {pin.padEnd(4, '•')}
            </div>

            {/* 상태 메시지 (간결하게 한 줄로) */}
            <AnimatePresence>
              {status !== 'IDLE' && status !== 'LOADING' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginBottom: '1.5rem',
                    padding: '0.875rem 1.25rem',
                    borderRadius: '1rem',
                    fontWeight: 700,
                    fontSize: '1.0625rem',
                    background: status === 'SUCCESS' ? (checkedInfo?.isWarning ? 'rgba(255,183,0,0.15)' : 'rgba(82,183,136,0.15)') : 'rgba(255,180,171,0.15)',
                    color: status === 'SUCCESS' ? (checkedInfo?.isWarning ? '#ffb700' : '#52b788') : 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.625rem',
                    border: '1px solid currentColor',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {status === 'SUCCESS' ? <CheckCircle2 size={20} /> : status === 'ALREADY' ? <AlertCircle size={20} /> : <XCircle size={20} />}
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {status === 'SUCCESS' ? (
                       `${checkedName}님 ${checkedInfo?.isWarning ? '횟수 부족(보충)' : '출석 완료'}! ${checkedInfo?.remaining !== undefined ? `(남은 횟수: ${checkedInfo.remaining}회)` : ''}`
                    ) : statusMsg}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 키패드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '0.75rem' : '1.25rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleNumberClick(num.toString())} style={{
                  background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)',
                  fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '700', padding: isMobile ? '1rem' : '1.25rem', borderRadius: '1.25rem',
                  cursor: 'pointer', transition: 'all 0.1s', height: isMobile ? '70px' : '84px',
                  boxShadow: 'var(--shadow-sm)'
                }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >{num}</button>
              ))}
              <button onClick={handleClear} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>CLEAR</button>
              <button onClick={() => handleNumberClick('0')} style={{
                  background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)',
                  fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '700', padding: isMobile ? '1rem' : '1.25rem', borderRadius: '1.25rem',
                  cursor: 'pointer', transition: 'all 0.1s', height: isMobile ? '70px' : '84px'
              }}>0</button>
              <button onClick={handleDelete} style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>DEL</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
