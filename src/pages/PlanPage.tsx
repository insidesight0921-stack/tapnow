import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Crown, ArrowLeft, Loader2, Rocket, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['수련생 35명 제한', '기본 출석 관리', '키오스크 모드', '데이터 백업'],
    color: '#888',
    bg: 'rgba(128,128,128,0.1)',
    icon: Zap
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 6900,
    features: ['수련생 무제한', '엑셀 데이터 내보내기', '상세 통계 분석', '우선 고객 지원'],
    color: '#6e86ff',
    bg: 'rgba(110,134,255,0.1)',
    icon: Star
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 14900,
    features: ['Basic 모든 기능', '카카오 알림톡 연동', '미납 자동 안내', '커스텀 알림 설정'],
    color: '#f9a825',
    bg: 'rgba(249,168,37,0.1)',
    icon: Crown
  }
];

export default function PlanPage() {
  const navigate = useNavigate();
  const { gymId, gymAccounts, updateGymPlan } = useStore();
  const currentGym = gymAccounts.find(g => g.id === gymId);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    // 토스 페이먼츠 SDK 로드
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (planId: string, price: number) => {
    if (planId === 'free') {
      alert('무료 플랜은 기본값입니다.');
      return;
    }

    if (planId === currentGym?.plan) {
      alert('이미 이용 중인 플랜입니다.');
      return;
    }

    setLoadingPlan(planId);

    // 실제 토스 페이먼츠 연동 로직 (테스트 키 사용)
    // @ts-ignore
    const tossPayments = window.TossPayments ? window.TossPayments('test_ck_D5yaZDRb31p94oA2ZOneV5jMvEeO') : null;

    if (tossPayments) {
      try {
        // 실제 결제창 호출 (테스트 환경)
        await tossPayments.requestPayment('카드', {
          amount: price,
          orderId: `order_${Math.random().toString(36).slice(2, 11)}`,
          orderName: `탭나우 ${planId.toUpperCase()} 요금제`,
          successUrl: window.location.origin + '/admin/plan/success?plan=' + planId,
          failUrl: window.location.origin + '/admin/plan/fail',
        });
      } catch (err) {
        console.error('Payment error:', err);
        setLoadingPlan(null);
      }
    } else {
      // 스크립트 미로드 시 시뮬레이션 (개발용)
      setTimeout(async () => {
        if (confirm(`[테스트] ${planId.toUpperCase()} 요금제로 업그레이드 하시겠습니까? (테스트용 즉시 승인)`)) {
          await updateGymPlan(planId as any, 1);
          alert('요금제 변경이 완료되었습니다!');
          navigate('/admin/members');
        }
        setLoadingPlan(null);
      }, 500);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--on-bg)', padding: 'var(--space-12)' }}>
      <header style={{ maxWidth: '1000px', margin: '0 auto 4rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button 
          onClick={() => navigate(-1)}
          className="glass-panel"
          style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>멤버십 플랜</h1>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>도장에 가장 적합한 요금제를 선택하세요.</p>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* 현재 상태 배너 */}
        <div className="glass-panel" style={{ 
          marginBottom: '3rem', padding: '2rem', borderRadius: 'var(--radius-xl)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, var(--surface-container-high), var(--surface-container-low))',
          border: '1px solid var(--outline-variant)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Rocket size={20} color="var(--tertiary)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>현재 이용 중</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--tertiary)' }}>{currentGym?.plan.toUpperCase()}</h2>
              <div style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', background: 'rgba(255,165,0,0.15)', color: 'var(--tertiary)', fontSize: '0.75rem', fontWeight: 700 }}>
                {currentGym?.status === 'trial' ? '무료 체험' : '구독 중'}
              </div>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.9375rem', color: 'var(--on-surface-variant)' }}>
              만료 예정일: <strong style={{ color: 'var(--on-surface)' }}>{currentGym?.planExpireDate || '없음'}</strong>
            </p>
          </div>
          <div style={{ display: 'none' }}>{/* Placeholder for illustration */}</div>
        </div>

        {/* 요금제 카드 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {PLANS.map((plan) => {
            const isCurrent = currentGym?.plan === plan.id;
            const Icon = plan.icon;
            const isPlus = plan.id === 'plus';

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -8 }}
                className="glass-panel"
                style={{
                  padding: '2.5rem', borderRadius: 'var(--radius-2xl)',
                  border: isCurrent ? `3px solid ${plan.color}` : '1px solid var(--outline-variant)',
                  display: 'flex', flexDirection: 'column', position: 'relative',
                  background: isPlus ? 'linear-gradient(180deg, var(--surface-container-high) 0%, rgba(249,168,37,0.05) 100%)' : 'var(--surface-container-high)'
                }}
              >
                {isPlus && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--tertiary)', color: '#502400', padding: '4px 16px', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>BEST CHOICE</div>
                )}
                
                <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-lg)', background: plan.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                  <Icon size={28} color={plan.color} />
                </div>

                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900 }}>₩{plan.price.toLocaleString()}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>/월</span>
                </div>

                <div style={{ flex: 1, marginBottom: '2.5rem' }}>
                  {plan.features.map(feature => (
                    <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <CheckCircle2 size={18} color={plan.color} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9375rem', color: 'var(--on-surface-variant)' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePayment(plan.id, plan.price)}
                  disabled={isCurrent || loadingPlan === plan.id}
                  style={{
                    width: '100%', height: '56px', borderRadius: 'var(--radius-xl)',
                    background: isCurrent ? 'transparent' : plan.color,
                    border: isCurrent ? `1px solid ${plan.color}` : 'none',
                    color: isCurrent ? plan.color : (isPlus ? '#502400' : '#fff'),
                    fontSize: '1rem', fontWeight: 800, cursor: isCurrent ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'all 0.3s'
                  }}
                >
                  {loadingPlan === plan.id ? <Loader2 className="animate-spin" size={20} /> : isCurrent ? '이용 중' : '시작하기'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>
          <p>카드 결제 및 계좌이체는 토스 페이먼츠 안전 결제 시스템을 통해 보호됩니다.</p>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <span>이용약관</span>
            <span>개인정보처리방침</span>
            <span>결제문의: help@tapnow.kr</span>
          </div>
        </div>
      </main>
    </div>
  );
}
