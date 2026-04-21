import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useStore, type Member } from '../store/useStore';
import AttendanceResultPopup from '../components/AttendanceResultPopup';

export default function KioskPage() {
  const navigate = useNavigate();
  const gymName = useStore(state => state.gymName);
  const logout = useStore(state => state.logout);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [enteredAdminPin, setEnteredAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);
  const gymPin = useStore(state => state.gymPin);

  const handleAdminClick = () => {
    setIsAdminPinModalOpen(true);
    setEnteredAdminPin('');
    setAdminPinError(false);
  };

  const handleAdminPinSubmit = (val: string) => {
    const newPin = enteredAdminPin + val;
    if (newPin.length < 4) {
      setEnteredAdminPin(newPin);
      return;
    }

    if (newPin === gymPin) {
      navigate('/admin/members');
    } else {
      setEnteredAdminPin('');
      setAdminPinError(true);
      setTimeout(() => setAdminPinError(false), 2000);
    }
  };

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
        onClick={handleAdminClick}
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

      {/* 관리자 PIN 입력 모달 */}
      <AnimatePresence>
        {isAdminPinModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)',
                padding: '2.5rem', borderRadius: '2rem', width: '100%', maxWidth: '360px', textAlign: 'center'
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>관리자 인증</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9375rem', marginBottom: '2rem' }}>접근을 위해 PIN 4자리를 입력하세요</p>
              
              <div style={{
                fontSize: '2rem', letterSpacing: '1.5rem', fontWeight: 900, marginBottom: '2rem',
                color: adminPinError ? 'var(--error)' : 'var(--primary)',
                transition: 'color 0.2s'
              }}>
                {enteredAdminPin.padEnd(4, '•')}
              </div>

              {adminPinError && (
                <div style={{ color: 'var(--error)', fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>
                  PIN 번호가 일치하지 않습니다.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'X'].map(val => (
                  <button
                    key={val}
                    onClick={() => {
                      if (val === 'C') { setEnteredAdminPin(''); setAdminPinError(false); }
                      else if (val === 'X') setIsAdminPinModalOpen(false);
                      else handleAdminPinSubmit(val.toString());
                    }}
                    style={{
                      padding: '1.25rem 0', borderRadius: '1rem', background: 'var(--surface-container-low)',
                      border: '1px solid var(--outline-variant)', color: 'var(--on-surface)',
                      fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >{val}</button>
                ))}
              </div>

              <button 
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                    if (confirm('관리자 계정으로 다시 로그인하여 관리자 페이지로 진입하시겠습니까?')) {
                      await logout();
                      navigate('/login');
                    }
                }}
                style={{ 
                  marginTop: '1.5rem', background: 'transparent', border: 'none', 
                  color: 'var(--on-surface-variant)', textDecoration: 'underline', 
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  padding: '10px' 
                }}
              >
                PIN을 잊으셨나요? 관리자 계정으로 재인증
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
  const [checkedInfo, setCheckedInfo] = useState<{ remaining?: number, dday?: number, isWarning: boolean, type?: '기간권' | '횟수권' } | null>(null);
  const [attendanceResult, setAttendanceResult] = useState<any>(null);
  const [isResultPopupOpen, setIsResultPopupOpen] = useState(false);

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
      
      // 스토어에서 반환된 풍부한 데이터 사용
      if (res.data) {
        setAttendanceResult(res.data);
        setIsResultPopupOpen(true);
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
              {status !== 'IDLE' && status !== 'LOADING' && !isResultPopupOpen && (
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
                       `${checkedName}님 ${checkedInfo?.isWarning && checkedInfo.type === '횟수권' ? '횟수 부족(보충)' : '출석 완료'}! ${
                         checkedInfo?.type === '횟수권' && checkedInfo.remaining !== undefined 
                           ? `(남은 횟수: ${checkedInfo.remaining}회)` 
                           : checkedInfo?.type === '기간권' && checkedInfo.dday !== undefined
                             ? `(D-${checkedInfo.dday === 0 ? 'Day' : checkedInfo.dday})`
                             : ''
                       }`
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
      <AttendanceResultPopup 
        isOpen={isResultPopupOpen} 
        onClose={() => setIsResultPopupOpen(false)} 
        data={attendanceResult} 
      />
    </motion.div>
  );
}
