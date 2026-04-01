import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymName, setGymName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  
  const loginAs = useStore(state => state.loginAs);
  const signupGym = useStore(state => state.signupGym);
  const gymAccounts = useStore(state => state.gymAccounts);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // 1. 마스터 관리자 (admin@tapnow.com)
      if (email === 'admin@tapnow.com') {
        if (password === 'admin' || password === 'admin1234') {
          loginAs('SUPER_ADMIN', 'ALL', email, 'TAPNOW 본사');
          navigate('/superadmin');
        } else {
          setError('관리자 비밀번호가 틀렸습니다.');
        }
        return;
      }

      // 2. 일반 도장 관리자 검색
      const foundGym = gymAccounts.find(g => g.ownerEmail === email);
      if (foundGym) {
        if (foundGym.ownerPassword === password) {
          loginAs('GYM_ADMIN', foundGym.id, email, foundGym.gymName);
          navigate('/admin/members');
        } else {
          setError('비밀번호가 틀렸습니다.');
        }
        return;
      }

      setError('등록되지 않은 계정입니다. 회원가입 후 이용해주세요.');
    } else {
      // 3. 회원가입 로직
      if (!email.includes('@') || password.length < 4 || !gymName) {
        setError('모든 정보를 올바르게 입력해주세요.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      
      // 회원가입 처리
      signupGym(gymName, email, password);
      
      // 방금 가입한 계정 정보를 다시 찾아서 로그인 처리
      const newGym = useStore.getState().gymAccounts.find(g => g.ownerEmail === email);
      if (newGym) {
        loginAs('GYM_ADMIN', newGym.id, email, newGym.gymName);
        navigate('/admin/members');
      }
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
            <div style={{ background: 'rgba(255,180,171,0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
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
            style={{ marginTop: '1rem' }}
          >
            {isLogin ? '로그인' : '회원가입'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
