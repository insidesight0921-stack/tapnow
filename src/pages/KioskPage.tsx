import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';

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
      position: 'relative'
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
          padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          fontSize: isMobile ? '0.75rem' : '0.875rem',
          fontWeight: 600,
          transition: 'all 0.2s',
          zIndex: 100
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--surface-container-highest)';
          e.currentTarget.style.color = 'var(--on-surface)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--surface-container-high)';
          e.currentTarget.style.color = 'var(--on-surface-variant)';
        }}
      >
        <ArrowLeft size={isMobile ? 14 : 16} />
        {isMobile ? '관리자' : '관리자 화면으로 돌아가기'}
      </button>

      <KioskCard gymName={gymName} isMobile={isMobile} />
    </div>
  );
}

function KioskCard({ gymName, isMobile }: { gymName: string, isMobile: boolean }) {
  const members = useStore(state => state.members);
  const attendances = useStore(state => state.attendances);
  const markAttendance = useStore(state => state.markAttendance);
  const gymId = useStore(state => state.gymId);

  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'NOT_FOUND' | 'ALREADY' | 'NO_REMAIN'>('IDLE');
  const [checkedName, setCheckedName] = useState('');
  const [checkedMemberInfo, setCheckedMemberInfo] = useState<{ isTicket: boolean, remaining?: number, expireDate?: string } | null>(null);

  const handleNumberClick = (num: string) => {
    if (status !== 'IDLE') { setStatus('IDLE'); setPin(''); return; }
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleDelete = () => {
    if (status !== 'IDLE') { setStatus('IDLE'); setPin(''); return; }
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setStatus('IDLE');
  };

  const handleCheckIn = () => {
    if (pin.length !== 4) return;
    setStatus('LOADING');

    const phoneLastFour = pin;
    const todayStr = new Date().toISOString().split('T')[0];

    setTimeout(() => {
      // 해당 도장에서 뒷번호 4자리로 회원 찾기
      const member = members.find(m =>
        (m.gymId === gymId || gymId === 'ALL') &&
        m.phone.replace(/-/g, '').endsWith(phoneLastFour)
      );

      if (!member) {
        setStatus('NOT_FOUND');
        return;
      }

      // 오늘 이미 출석했는지 확인
      if (attendances.some(a => a.memberId === member.id && a.date === todayStr)) {
        setCheckedName(member.name);
        setStatus('ALREADY');
        return;
      }

      // 횟수권 잔여 횟수 확인
      const hasTicket = member.plans.some(p => p.type === '횟수권');
      if (hasTicket) {
        const totalRemaining = member.plans
          .filter(p => p.type === '횟수권')
          .reduce((sum, p) => sum + (p.remainingQty ?? 0), 0);
        if (totalRemaining <= 0) {
          setCheckedName(member.name);
          setStatus('NO_REMAIN');
          return;
        }
      }

      markAttendance(member.id);
      setCheckedName(member.name);
      
      const ticketPlans = member.plans.filter(p => p.type === '횟수권');
      if (ticketPlans.length > 0) {
        const totalRemaining = ticketPlans.reduce((sum, p) => sum + (p.remainingQty ?? 0), 0);
        setCheckedMemberInfo({ isTicket: true, remaining: totalRemaining - 1 });
      } else {
        setCheckedMemberInfo({ isTicket: false, expireDate: member.expireDate });
      }
      
      setStatus('SUCCESS');

      // 3초 후 리셋
      setTimeout(() => { setStatus('IDLE'); setPin(''); setCheckedMemberInfo(null); }, 3000);
    }, 600);
  };

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        width: '100%', maxWidth: '440px', padding: isMobile ? '1.5rem' : 'var(--space-12)',
        borderRadius: 'var(--radius-xl)', textAlign: 'center'
      }}
    >
      <h1 style={{ 
        fontFamily: 'var(--font-logo)', 
        fontSize: isMobile ? '2.5rem' : '3.5rem', 
        color: 'var(--tertiary)', 
        letterSpacing: '2px', 
        marginBottom: '0.25rem' 
      }}>TAPNOW</h1>
      {gymName && <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>{gymName}</div>}
      <p style={{ color: 'var(--on-surface-variant)', fontSize: isMobile ? '1rem' : '1.125rem', marginBottom: isMobile ? '1.5rem' : 'var(--space-10)' }}>
        전화번호 뒷자리 4자리를 입력해 주세요
      </p>

      {/* PIN 화면 */}
      <div style={{
        background: 'var(--surface-container-highest)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: 'var(--radius-md)',
        marginBottom: isMobile ? '1.5rem' : '2rem', fontSize: isMobile ? '2rem' : '2.5rem', letterSpacing: '12px', color: 'var(--on-surface)',
        fontWeight: '700', minHeight: isMobile ? '60px' : '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)'
      }}>
        {pin.padEnd(4, '•')}
      </div>

      {/* 상태 메시지 */}
      {status !== 'IDLE' && status !== 'LOADING' && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          fontSize: '1.25rem',
          background: status === 'SUCCESS' ? 'rgba(82,183,136,0.15)' : 'rgba(255,180,171,0.15)',
          color: status === 'SUCCESS' ? '#52b788' : 'var(--error)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          border: status === 'SUCCESS' ? '1px solid rgba(82,183,136,0.3)' : '1px solid rgba(255,180,171,0.3)'
        }}>
          <div>
            {status === 'SUCCESS' && `✅ ${checkedName} 님 출석 완료!`}
            {status === 'ALREADY' && `⚠️ ${checkedName} 님은 오늘 이미 출석했습니다.`}
            {status === 'NOT_FOUND' && '❌ 등록된 회원을 찾을 수 없습니다.'}
            {status === 'NO_REMAIN' && `⚠️ ${checkedName} 님의 잔여 횟수가 없습니다.`}
          </div>
          {status === 'SUCCESS' && checkedMemberInfo && (
            <div style={{ fontSize: '1rem', opacity: 0.9, background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              {checkedMemberInfo.isTicket ? (
                <>잔여 횟수: <span style={{ color: 'var(--tertiary)', fontWeight: 700 }}>{checkedMemberInfo.remaining}회</span> (1회 차감)</>
              ) : (
                <>만료 예정일: <span style={{ color: 'var(--tertiary)', fontWeight: 700 }}>{checkedMemberInfo.expireDate}</span></>
              )}
            </div>
          )}
        </div>
      )}

      {/* 키패드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '0.75rem' : '1rem', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handleNumberClick(num.toString())} style={{
            background: 'var(--surface-container-low)', border: 'none', color: 'var(--on-surface)',
            fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '600', padding: isMobile ? '1rem' : '1.5rem', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', transition: 'background 0.2s', height: isMobile ? '64px' : 'auto'
          }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-bright)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--surface-container-low)')}
          >{num}</button>
        ))}
        <button onClick={handleClear} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', fontSize: isMobile ? '1rem' : '1.125rem', cursor: 'pointer', height: isMobile ? '64px' : 'auto' }}>CLEAR</button>
        <button onClick={() => handleNumberClick('0')} style={{ background: 'var(--surface-container-low)', border: 'none', color: 'var(--on-surface)', fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '600', padding: isMobile ? '1rem' : '1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', height: isMobile ? '64px' : 'auto' }}>0</button>
        <button onClick={handleDelete} style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontSize: isMobile ? '1rem' : '1.125rem', cursor: 'pointer', height: isMobile ? '64px' : 'auto' }}>DEL</button>
      </div>

      <button
        onClick={handleCheckIn}
        disabled={pin.length < 4 || status === 'LOADING'}
        className="btn btn-primary"
        style={{
          width: '100%', opacity: pin.length === 4 ? 1 : 0.5,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
          color: 'var(--bg-color)', fontSize: '1.125rem'
        }}
      >
        {status === 'LOADING' ? '처리 중...' : '출석 체크'}
      </button>
    </motion.div>
  );
}
