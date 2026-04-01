import { useState, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Upload, User, KeyRound, Smartphone, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'account';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const theme = useStore(state => state.theme);
  const profileImage = useStore(state => state.profileImage);
  const updateSettings = useStore(state => state.updateSettings);
  const adminEmail = useStore(state => state.adminEmail);
  const updateEmail = useStore(state => state.updateEmail);
  const updatePassword = useStore(state => state.updatePassword);
  const gymPin = useStore(state => state.gymPin);
  const updatePin = useStore(state => state.updatePin);
  const deleteAccount = useStore(state => state.deleteAccount);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    onClose();
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
    onClose();
  };

  const inputStyle = {
    width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
    border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
    color: 'var(--on-surface)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const
  };

  const sectionStyle = {
    display: 'flex', flexDirection: 'column' as const, gap: '0.5rem',
    padding: '1rem', background: 'var(--surface-container-low)',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)'
  };

  const tabStyle = (active: boolean) => ({
    flex: 1, padding: '0.625rem', border: 'none', borderRadius: '0.5rem',
    background: active ? 'var(--surface-variant)' : 'transparent',
    color: active ? 'var(--on-surface)' : 'var(--on-surface-variant)',
    fontWeight: active ? 600 : 500, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s'
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '460px',
              display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}
          >
            {/* 헤더 */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>도장 설정</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            {/* 탭 */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--outline-variant)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-container-low)', padding: '0.25rem', borderRadius: '0.625rem' }}>
                <button style={tabStyle(activeTab === 'general')} onClick={() => setActiveTab('general')}>⚙️ 일반</button>
                <button style={tabStyle(activeTab === 'account')} onClick={() => setActiveTab('account')}>👤 계정 관리</button>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1.25rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {activeTab === 'general' ? (
                <>
                  {/* 테마 설정 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>테마 설정</span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={() => setCurrentTheme('dark')} style={{
                        flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)',
                        border: currentTheme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                        background: 'var(--surface-container-low)', color: 'var(--on-surface)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                      }}>
                        <Moon size={24} /> 다크 모드
                      </button>
                      <button onClick={() => setCurrentTheme('light')} style={{
                        flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)',
                        border: currentTheme === 'light' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                        background: 'var(--surface-container-low)', color: 'var(--on-surface)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                      }}>
                        <Sun size={24} /> 라이트 모드
                      </button>
                    </div>
                  </div>

                  {/* 로고 설정 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>도장 로고 / 프로필</span>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-container-highest)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>No Logo</span>}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-low)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid var(--outline-variant)', fontSize: '0.875rem' }}>
                        <Upload size={16} /> 이미지 업로드
                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                      </label>
                      {logoPreview && <button onClick={() => setLogoPreview(null)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.875rem' }}>삭제</button>}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 상태 메시지 */}
                  {accountMsg && (
                    <div style={{ padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, background: accountMsg.type === 'success' ? 'rgba(82,183,136,0.15)' : 'rgba(255,180,171,0.15)', color: accountMsg.type === 'success' ? '#52b788' : 'var(--error)' }}>
                      {accountMsg.type === 'success' ? '✅ ' : '❌ '}{accountMsg.text}
                    </div>
                  )}

                  {/* 이메일 변경 */}
                  <div style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <User size={16} color="var(--tertiary)" />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>이메일 변경</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>현재: {adminEmail || '없음'}</div>
                    <input type="email" placeholder="새 이메일" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} />
                    <button onClick={handleEmailChange} style={{ padding: '0.5rem', background: 'var(--primary)', border: 'none', borderRadius: '0.5rem', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>변경</button>
                  </div>

                  {/* 비밀번호 변경 */}
                  <div style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <KeyRound size={16} color="var(--tertiary)" />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>비밀번호 변경</span>
                    </div>
                    <input type="password" placeholder="새 비밀번호" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                    <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
                    <button onClick={handlePasswordChange} style={{ padding: '0.5rem', background: 'var(--primary)', border: 'none', borderRadius: '0.5rem', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>변경</button>
                  </div>

                  {/* 키오스크 PIN 변경 */}
                  <div style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Smartphone size={16} color="var(--tertiary)" />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>키오스크 PIN 변경</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>현재 PIN: {gymPin} (키오스크 자가 출석에 사용되지 않음. 별도 관리 PIN)</div>
                    <input type="text" maxLength={4} placeholder="새 PIN (숫자 4자리)" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ ...inputStyle, letterSpacing: '0.5rem', fontWeight: 700 }} />
                    <button onClick={handlePinChange} style={{ padding: '0.5rem', background: 'var(--primary)', border: 'none', borderRadius: '0.5rem', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>변경</button>
                  </div>

                  {/* 회원 탈퇴 */}
                  <div style={{ ...sectionStyle, border: '1px solid rgba(255,180,171,0.3)', background: 'rgba(255,180,171,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Trash2 size={16} color="var(--error)" />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--error)' }}>도장 계정 탈퇴</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>탈퇴 시 모든 데이터가 삭제되며 복구가 불가능합니다.</div>
                    {!showDeleteConfirm ? (
                      <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--error)', borderRadius: '0.5rem', color: 'var(--error)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>탈퇴하기</button>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--outline-variant)', borderRadius: '0.5rem', color: 'var(--on-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>취소</button>
                        <button onClick={handleDeleteAccount} style={{ flex: 1, padding: '0.5rem', background: 'var(--error)', border: 'none', borderRadius: '0.5rem', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>정말 탈퇴</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 푸터 */}
            <div style={{ padding: isMobile ? '1rem 1.25rem' : '1rem 1.5rem', borderTop: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
              <button onClick={onClose} style={{ flex: isMobile ? 1 : 'unset', height: '44px', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>닫기</button>
              {activeTab === 'general' && (
                <button onClick={handleSaveGeneral} disabled={isSubmitting} style={{ flex: isMobile ? 1 : 'unset', height: '44px', background: 'var(--primary)', border: 'none', color: '#000', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
