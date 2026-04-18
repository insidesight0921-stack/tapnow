import { useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Upload, User, KeyRound, Smartphone, Trash2, Save } from 'lucide-react';
import { useStore } from '../store/useStore';

type TabType = 'general' | 'account';

export default function SettingsPage() {
  const theme = useStore(state => state.theme);
  const profileImage = useStore(state => state.profileImage);
  const updateSettings = useStore(state => state.updateSettings);
  const adminEmail = useStore(state => state.adminEmail);
  const updateEmail = useStore(state => state.updateEmail);
  const updatePassword = useStore(state => state.updatePassword);
  const gymPin = useStore(state => state.gymPin);
  const updatePin = useStore(state => state.updatePin);
  const deleteAccount = useStore(state => state.deleteAccount);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // 일반 설정
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(theme);
  const [logoPreview, setLogoPreview] = useState<string | null>(profileImage);

  // 계정 관리
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState(gymPin);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSubmitting(true);
    await updateSettings(currentTheme, logoPreview);
    setIsSubmitting(false);
    setAccountMsg({ type: 'success', text: '일반 설정이 저장되었습니다.' });
    setTimeout(() => setAccountMsg(null), 3000);
  };

  const handleEmailChange = () => {
    if (!newEmail.includes('@')) {
      setAccountMsg({ type: 'error', text: '유효한 이메일을 입력해주세요.' });
      return;
    }
    updateEmail(newEmail);
    setNewEmail('');
    setAccountMsg({ type: 'success', text: '이메일이 변경되었습니다.' });
    setTimeout(() => setAccountMsg(null), 3000);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 4) {
      setAccountMsg({ type: 'error', text: '비밀번호는 4자 이상이어야 합니다.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountMsg({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setAccountMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' });
    } catch (err) {
      setAccountMsg({ type: 'error', text: '비밀번호 변경 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAccountMsg(null), 3000);
    }
  };

  const handlePinChange = async () => {
    if (!/^\d{4}$/.test(newPin)) {
      setAccountMsg({ type: 'error', text: 'PIN은 숫자 4자리여야 합니다.' });
      return;
    }
    setIsSubmitting(true);
    await updatePin(newPin);
    setIsSubmitting(false);
    setAccountMsg({ type: 'success', text: '키오스크 PIN이 변경되었습니다.' });
    setTimeout(() => setAccountMsg(null), 3000);
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    await deleteAccount();
    setIsSubmitting(false);
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
    color: 'var(--on-surface)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
    '&:focus': { borderColor: 'var(--primary)' }
  };

  const sectionStyle = {
    display: 'flex', flexDirection: 'column' as const, gap: '1rem',
    padding: '1.5rem', background: 'var(--surface-container-low)',
    borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)',
    boxShadow: 'var(--shadow-sm)'
  };

  const tabStyle = (active: boolean) => ({
    padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.75rem',
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? '#000' : 'var(--on-surface-variant)',
    fontWeight: active ? 700 : 500, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s'
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}
    >
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--on-surface)' }}>도장 설정</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>도장의 운영 정보와 계정 보안을 관리합니다.</p>
        </div>
      </div>

      {/* 알림 메시지 (상단 고정 형태) */}
      <div style={{ height: '60px', marginBottom: '1rem' }}>
        {accountMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              padding: '1rem', borderRadius: '1rem', fontSize: '1rem', fontWeight: 600, 
              background: accountMsg.type === 'success' ? 'rgba(82,183,136,0.15)' : 'rgba(255,180,171,0.15)', 
              color: accountMsg.type === 'success' ? '#52b788' : 'var(--error)',
              border: `1px solid ${accountMsg.type === 'success' ? '#52b788' : 'var(--error)'}`,
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {accountMsg.type === 'success' ? '✅' : '❌'} {accountMsg.text}
          </motion.div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-container-high)', padding: '0.4rem', borderRadius: '1rem', marginBottom: '2rem', width: 'fit-content' }}>
        <button style={tabStyle(activeTab === 'general')} onClick={() => setActiveTab('general')}>일반 설정</button>
        <button style={tabStyle(activeTab === 'account')} onClick={() => setActiveTab('account')}>계정 및 보안</button>
      </div>

      {/* 컨텐츠 영역 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {activeTab === 'general' ? (
          <>
            {/* 테마 설정 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Moon size={20} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>디스플레이 테마</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setCurrentTheme('dark')} style={{
                  flex: 1, padding: '1.5rem', borderRadius: '1rem',
                  border: currentTheme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                  background: currentTheme === 'dark' ? 'var(--surface-container-highest)' : 'var(--surface-container-low)', 
                  color: 'var(--on-surface)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                  transition: 'all 0.2s'
                }}>
                  <Moon size={32} /> <span style={{ fontWeight: 600 }}>다크 모드</span>
                </button>
                <button onClick={() => setCurrentTheme('light')} style={{
                  flex: 1, padding: '1.5rem', borderRadius: '1rem',
                  border: currentTheme === 'light' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                  background: currentTheme === 'light' ? 'var(--surface-container-highest)' : 'var(--surface-container-low)', 
                  color: 'var(--on-surface)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                  transition: 'all 0.2s'
                }}>
                  <Sun size={32} /> <span style={{ fontWeight: 600 }}>라이트 모드</span>
                </button>
              </div>
            </div>

            {/* 로고 설정 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={20} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>도장 로고 / 프로필</span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ 
                  width: '100px', height: '100px', borderRadius: '1.5rem', 
                  background: 'var(--surface-container-highest)', overflow: 'hidden', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-sm)'
                }}>
                  {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>No Logo</span>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '200px' }}>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                    background: 'var(--surface-container-high)', padding: '0.75rem 1.5rem', 
                    borderRadius: '0.75rem', cursor: 'pointer', border: '1px solid var(--outline-variant)', 
                    fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s'
                  }}>
                    <Upload size={18} /> 이미지 업로드
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                  {logoPreview && (
                    <button onClick={() => setLogoPreview(null)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600 }}>로고 삭제</button>
                  )}
                </div>
              </div>
            </div>

            <button onClick={handleSaveGeneral} disabled={isSubmitting} style={{ 
              width: '100%', padding: '1.25rem', background: 'var(--primary)', border: 'none', 
              color: '#000', borderRadius: '1rem', cursor: 'pointer', fontWeight: 800, fontSize: '1.125rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              boxShadow: 'var(--shadow-md)', transition: 'all 0.2s'
            }}>
              <Save size={20} /> {isSubmitting ? '저장 중...' : '설정 저장하기'}
            </button>
          </>
        ) : (
          <>
            {/* 이메일 변경 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} color="var(--tertiary)" />
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>이메일 계정</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', background: 'var(--surface-container-highest)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 600 }}>현재 이메일: {adminEmail || '없음'}</div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input type="email" placeholder="변경할 새 이메일" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} />
                <button onClick={handleEmailChange} style={{ padding: '0 1.5rem', background: 'var(--surface-container-highest)', border: '1px solid var(--outline-variant)', borderRadius: '0.75rem', color: 'var(--on-surface)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>변경</button>
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} color="var(--tertiary)" />
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>비밀번호 변경</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input type="password" placeholder="새 비밀번호" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
                <button onClick={handlePasswordChange} style={{ padding: '1rem', background: 'var(--surface-container-highest)', border: '1px solid var(--outline-variant)', borderRadius: '0.75rem', color: 'var(--on-surface)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>비밀번호 업데이트</button>
              </div>
            </div>

            {/* 키오스크 PIN 변경 */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={20} color="var(--tertiary)" />
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>관리자 접근 PIN 설정</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                키오스크 화면에서 관리자 모드로 돌아갈 때 사용하는 보안 번호입니다. <br/>
                기본값은 <strong>0000</strong>입니다.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  maxLength={4} 
                  placeholder="숫자 4자리" 
                  value={newPin} 
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                  style={{ ...inputStyle, letterSpacing: '0.5rem', fontWeight: 800, textAlign: 'center', fontSize: '1.25rem' }} 
                />
                <button onClick={handlePinChange} style={{ padding: '0 2rem', background: 'var(--primary)', border: 'none', borderRadius: '0.75rem', color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>PIN 저장</button>
              </div>
            </div>

            {/* 회원 탈퇴 */}
            <div style={{ ...sectionStyle, border: '1px solid rgba(255,180,171,0.3)', background: 'rgba(255,180,171,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={20} color="var(--error)" />
                <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--error)' }}>계정 삭제</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>계정 삭제 시 모든 회원 정보, 출석 기록, 결제 내역이 영구적으로 삭제되며 복구할 수 없습니다.</p>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '1rem', background: 'transparent', border: '1px solid var(--error)', borderRadius: '1rem', color: 'var(--error)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>탈퇴 절차 시작</button>
              ) : (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '1rem', background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: '1rem', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 700 }}>취소</button>
                  <button onClick={handleDeleteAccount} style={{ flex: 1, padding: '1rem', background: 'var(--error)', border: 'none', borderRadius: '1rem', color: '#000', fontWeight: 800, cursor: 'pointer' }}>정말 탈퇴하기</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
