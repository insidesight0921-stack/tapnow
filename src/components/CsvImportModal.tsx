import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Info, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import Papa from 'papaparse';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPECTED_HEADERS = ['이름', '전화번호', '벨트', '그랄'];

export default function CsvImportModal({ isOpen, onClose }: CsvImportModalProps) {
  const addMember = useStore(state => state.addMember);
  const currentGymId = useStore(state => state.gymId) || 'gym_default';

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({
    '이름': '', '전화번호': '', '벨트': '', '그랄': ''
  });
  const [isError, setIsError] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setHeaderMapping({'이름': '', '전화번호': '', '벨트': '', '그랄': ''});
    setIsError(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          
          // 자동 매핑 시도
          const newMapping = { '이름': '', '전화번호': '', '벨트': '', '그랄': '' };
          results.meta.fields.forEach(field => {
            if (field.includes('이름') || field.includes('name')) newMapping['이름'] = field;
            if (field.includes('전화') || field.includes('phone') || field.includes('연락처')) newMapping['전화번호'] = field;
            if (field.includes('벨트') || field.includes('belt') || field.includes('띠')) newMapping['벨트'] = field;
            if (field.includes('그랄') || field.includes('grau') || field.includes('그라우')) newMapping['그랄'] = field;
          });
          setHeaderMapping(newMapping);
          setParsedData(results.data);
          setIsError(false);
        } else {
          setIsError(true);
        }
      },
      error: () => {
        setIsError(true);
      }
    });
  };

  const handleImport = () => {
    if (!headerMapping['이름']) {
      alert("이름 필드는 필수적으로 매핑되어야 합니다.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    parsedData.forEach(row => {
      const name = row[headerMapping['이름']];
      if (!name) return; // 이름 없는 행 스킵
      
      const phone = headerMapping['전화번호'] ? row[headerMapping['전화번호']] : '';
      const belt = headerMapping['벨트'] ? row[headerMapping['벨트']] : '화이트';
      const gralStr = headerMapping['그랄'] ? row[headerMapping['그랄']] : '0';
      const gral = isNaN(Number(gralStr)) ? 0 : Number(gralStr);

      addMember({
        gymId: currentGymId,
        name,
        phone,
        belt,
        gral,
        registerDate: today,
        startDate: today,
        plans: [],
        paymentAmount: 0,
        paymentMethod: '현금',
        expireDate: '',
        memo: 'CSV 일괄 가져오기'
      });
    });

    alert(`${parsedData.length}명의 데이터가 등록되었습니다.`);
    handleClose();
  };

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
              width: '100%', maxWidth: '600px',
              display: 'flex', flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>엑셀/CSV 데이터 가져오기</h2>
              <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              {!file ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Info size={24} color="var(--tertiary)" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.875rem', color: 'var(--on-surface)' }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>가져오기 가이드</p>
                      <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                        - 첫 번째 줄은 데이터의 제목(헤더)이어야 합니다.<br />
                        - 파일 형식이 달라도 다음 단계에서 수동으로 항목을 연결할 수 있습니다.<br />
                        - 권장 항목: 이름, 전화번호, 벨트, 그랄
                      </p>
                    </div>
                  </div>

                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload} 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                  />
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--outline-variant)', borderRadius: 'var(--radius-lg)',
                      padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--tertiary)'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <UploadCloud size={48} color="var(--on-surface-variant)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>CSV 파일 선택</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>또는 여기에 마우스를 클릭하세요</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {isError ? (
                    <div style={{ background: 'rgba(255, 180, 171, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', color: 'var(--error)', alignItems: 'center' }}>
                      <AlertTriangle size={20} />
                      <span style={{ fontSize: '0.875rem' }}>파일을 읽는 데失敗했습니다. 올바른 CSV 파일인지 확인해 주세요.</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ background: 'var(--surface-container-low)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{file.name}</span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginLeft: '1rem' }}>총 {parsedData.length} 명</span>
                        </div>
                        <button onClick={resetState} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.875rem' }}>다른 파일 선택</button>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>데이터 항목 연결</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
                          시스템에 필요한 정보와 파일의 열(Column)을 알맞게 매핑해 주세요. (가장 유사한 헤더를 자동 연결했습니다.)
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          {EXPECTED_HEADERS.map(expected => (
                            <div key={expected} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>{expected} 코어 데이터 {expected === '이름' && <span style={{color: 'var(--error)'}}>*</span>}</label>
                              <select 
                                value={headerMapping[expected]} 
                                onChange={(e) => setHeaderMapping({...headerMapping, [expected]: e.target.value})}
                                style={{
                                  background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)',
                                  padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--on-surface)', outline: 'none'
                                }}
                              >
                                <option value="">-- 제외 --</option>
                                {headers.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={handleClose} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>취소</button>
                        <button type="button" onClick={handleImport} style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', border: 'none', color: '#000', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>가져오기 완료</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
