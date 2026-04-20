import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useStore } from '../store/useStore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymName, setGymName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const navigate = useNavigate();
  const { isAuthenticated, userRole, loginWithGoogle } = useStore();

  // 이미 로그인된 경우 자동 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'SUPER_ADMIN') {
        navigate('/superadmin');
      } else {
        navigate('/admin/members');
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (isLogin) {
        // Firebase Auth 로그인
        await signInWithEmailAndPassword(auth, normalizedEmail, password);

        // 슈퍼 관리자 특수 처리 (이메일로 구분)
        const isAdmin = normalizedEmail === 'hjbyun0921@naver.com';

        if (isAdmin) {
          navigate('/superadmin');
        } else {
          navigate('/admin/members');
        }
      } else {
        // 회원가입 로직
        if (password !== passwordConfirm) {
          setError('비밀번호가 일치하지 않습니다.');
          setIsSubmitting(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const user = userCredential.user;

        // Firestore에 도장 정보 등록
        await setDoc(doc(db, 'gyms', user.uid), {
          gymName,
          ownerEmail: normalizedEmail,
          registeredAt: new Date().toISOString().split('T')[0],
          memberCount: 0,
          plan: 'free',
          planExpireDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0],
          status: 'active',
          memo: '신규 가입',
          gymPin: '0000',
          theme: 'dark'
        });

        // 💡 중요: 회원가입 후에는 수동 이동(navigate)하지 않고 
        // useStore의 onAuthStateChanged 리스너가 감지할 때까지 대기합니다.
        // (이것이 더 안정적인 상태 전환을 보장합니다.)
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('가입되어 있지 않은 계정입니다.');
      } else if (err.code === 'auth/wrong-password') {
        setError('비밀번호가 올바르지 않습니다. 다시 입력해주세요.');
      } else if (err.code === 'auth/invalid-credential') {
        // Firebase v9+에서는 wrong-password와 user-not-found가 이 코드로 통합됨
        // 이메일 존재 여부를 추가 확인하여 메시지 구분
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email.trim().toLowerCase());
          if (methods.length > 0) {
            setError('비밀번호가 올바르지 않습니다. 다시 입력해주세요.');
          } else {
            setError('가입되어 있지 않은 계정입니다.');
          }
        } catch {
          setError('아이디 또는 비밀번호를 확인해주세요.');
        }
      } else if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 6자리 이상이어야 합니다.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-color)', padding: 'var(--space-10)'
    }}>
      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '420px', padding: 'var(--space-12)',
          borderRadius: 'var(--radius-xl)', textAlign: 'center'
        }}
      >
        <div style={{
          background: 'var(--surface-container-high)', width: '64px', height: '64px',
          borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-10)', border: '1px solid var(--outline-variant)'
        }}>
          <Lock size={28} color="var(--tertiary)" />
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            disabled={isSubmitting}
            style={{ 
              background: 'transparent', border: 'none', fontSize: '1.125rem', fontWeight: 700,
              color: isLogin ? 'var(--tertiary)' : 'var(--on-surface-variant)',
              borderBottom: isLogin ? '2px solid var(--tertiary)' : '2px solid transparent',
              paddingBottom: '0.25rem', cursor: 'pointer', transition: 'all 0.2s'
            }}>
            LOGIN
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            disabled={isSubmitting}
            style={{ 
              background: 'transparent', border: 'none', fontSize: '1.125rem', fontWeight: 700,
              color: !isLogin ? 'var(--tertiary)' : 'var(--on-surface-variant)',
              borderBottom: !isLogin ? '2px solid var(--tertiary)' : '2px solid transparent',
              paddingBottom: '0.25rem', cursor: 'pointer', transition: 'all 0.2s'
            }}>
            SIGN UP
          </button>
        </div>

        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {isLogin ? '계정에 접속하여 도장을 관리하세요.' : '새로운 도장 계정을 생성합니다.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ 
              background: 'rgba(211, 47, 47, 0.15)', 
              color: '#ffb4ab', 
              padding: '0.625rem 0.75rem', 
              borderRadius: '0.5rem', 
              fontSize: '0.75rem', 
              textAlign: 'center',
              border: '1px solid rgba(211, 47, 47, 0.3)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {error}
            </div>
          )}
          
          {!isLogin && (
            <input 
              type="text" 
              required
              placeholder="도장 이름 (ex. 주짓수랩 강남)" 
              value={gymName}
              onChange={e => setGymName(e.target.value)}
              disabled={isSubmitting}
              className="input-field"
              style={{
                background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)',
                height: '48px', padding: '0 1rem', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', outline: 'none', fontSize: '1rem'
              }}
            />
          )}

          <input 
            type="email" 
            required
            placeholder="이메일" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="input-field"
            style={{
              background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)',
              height: '48px', padding: '0 1rem', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', outline: 'none', fontSize: '1rem'
            }}
          />
          <input 
            type="password" 
            required
            placeholder="비밀번호" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isSubmitting}
            className="input-field"
            style={{
              background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)',
              height: '48px', padding: '0 1rem', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', outline: 'none', fontSize: '1rem'
            }}
          />
          
          {!isLogin && (
            <input 
              type="password" 
              required
              placeholder="비밀번호 확인" 
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              disabled={isSubmitting}
              className="input-field"
              style={{
                background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)',
                height: '48px', padding: '0 1rem', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', outline: 'none', fontSize: '1rem'
              }}
            />
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ marginTop: '1rem', position: 'relative' }}
          >
            {isSubmitting ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>

          {/* 비밀번호 찾기 */}
          {isLogin && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setShowResetPassword(!showResetPassword); setResetMsg(null); setResetEmail(email); }}
                style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: '0.8125rem', textDecoration: 'underline' }}
              >
                비밀번호를 잊으셨나요?
              </button>
              {showResetPassword && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="email"
                    placeholder="가입한 이메일 주소"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="input-field"
                    style={{
                      background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)',
                      height: '44px', padding: '0 1rem', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.875rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!resetEmail.includes('@')) {
                        setResetMsg({ type: 'error', text: '유효한 이메일을 입력해주세요.' });
                        return;
                      }
                      try {
                        await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
                        setResetMsg({ type: 'success', text: '비밀번호 재설정 이메일이 발송되었습니다. 메일함을 확인해주세요.' });
                      } catch (err: any) {
                        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                          setResetMsg({ type: 'error', text: '해당 이메일로 가입된 계정이 없습니다.' });
                        } else {
                          // Firebase 보안 정책상 이메일 존재 여부를 숨길 수 있으므로 성공 메시지 표시
                          setResetMsg({ type: 'success', text: '계정이 존재하면 비밀번호 재설정 이메일이 발송됩니다. 메일함을 확인해주세요.' });
                        }
                      }
                    }}
                    style={{
                      padding: '0.625rem', background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem'
                    }}
                  >
                    재설정 이메일 보내기
                  </button>
                  {resetMsg && (
                    <div style={{
                      padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', textAlign: 'center',
                      background: resetMsg.type === 'success' ? 'rgba(82,183,136,0.15)' : 'rgba(211,47,47,0.15)',
                      color: resetMsg.type === 'success' ? '#52b788' : '#ffb4ab',
                      border: `1px solid ${resetMsg.type === 'success' ? 'rgba(82,183,136,0.3)' : 'rgba(211,47,47,0.3)'}`
                    }}>
                      {resetMsg.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* SNS 로그인 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--outline-variant)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>또는 SNS로 시작하기</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--outline-variant)' }} />
        </div>

        {/* 구글 로그인 버튼 */}
        <button 
          type="button"
          onClick={async () => {
            try {
              setError('');
              setIsSubmitting(true);
              await loginWithGoogle();
            } catch (err: any) {
              console.error('Google Login Error:', err);
              if (err.code === 'auth/popup-closed-by-user') {
                setError('로그인 창이 닫혔습니다. 다시 시도해주세요.');
              } else if (err.code === 'auth/cancelled-by-user') {
                setError('로그인이 취소되었습니다.');
              } else {
                setError('구글 로그인 중 오류가 발생했습니다.');
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          style={{ 
            width: '100%', height: '48px', background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', 
            color: 'var(--on-surface)', borderRadius: 'var(--radius-md)', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9375rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? (
            <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
              구글로 시작하기
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
