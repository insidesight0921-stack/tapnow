import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, FileText, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useStore } from '../store/useStore';

// 자동 매핑용 유의어 사전
const EXPECTED_FIELDS: Record<string, string[]> = {
  'name': ['이름', '성함', '회원명', 'Name', 'Customer'],
  'phone': ['전화번호', '휴대폰', '연락처', 'Phone', 'Mobile', 'Tel'],
  'belt': ['벨트', '급수', 'Belt', 'Grade'],
  'gral': ['그랄', '단', 'Gral', 'Stripe'],
  'registerDate': ['등록일', '가입일', 'Registered At', 'Join Date'],
  'startDate': ['시작일', '이용 시작', 'Start Date'],
  'expireDate': ['만료', '만료일', '종료', '종료일', 'End Date', 'Expiration'],
  'planName': ['요금제', '상품', '이용권', '상품명', '요금제명', 'Plan'],
  'remainingQty': ['잔여횟수', '남은횟수', '남은 회수', '잔여', 'Remaining'],
  'paymentAmount': ['납부금액', '결제금액', '금액', 'Paid', 'Amount'],
  'paymentMethod': ['납부방법', '결제수단', '결제방법', 'Method', 'Payment Type'],
  'memo': ['메모', '특이사항', 'Note', 'Memo']
};

export default function CsvImportModal() {
  const isOpen = useStore(state => state.isCsvModalOpen);
  const onClose = useStore(state => state.closeCsvModal);
  const addMember = useStore(state => state.addMember);
  const gymPlans = useStore(state => state.plans);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'processing'>('upload');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모든 상태 초기화
  const handleReset = useCallback(() => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setFieldMapping({});
    setPreviewData([]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // 모달이 닫힐 때 자동 초기화
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen, handleReset]);

  // 날짜 형식 표준화 (YYYY-MM-DD)
  const formatDate = (val: any) => {
    if (!val) return '';
    try {
      // 엑셀 날짜 형식(숫자) 처리
      if (typeof val === 'number') {
        const d = XLSX.SSF.parse_date_code(val);
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
      const clean = val.toString().replace(/[^0-9/-]/g, '-').replace(/\./g, '-');
      const d = new Date(clean);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch { return ''; }
  };

  // 전화번호 형식 표준화
  const formatPhone = (val: string) => {
    if (!val) return '';
    const digits = val.toString().replace(/[^0-9]/g, '');
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    return digits;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCsv = file.name.endsWith('.csv');
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processParsedData(results.data),
        error: (err) => setError(`CSV 파싱 오류: ${err.message}`)
      });
    } else if (isXlsx) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        processParsedData(json);
      } catch (err: any) {
        setError(`엑셀 파싱 오류: ${err.message}`);
      }
    } else {
      setError('지원하지 않는 파일 형식입니다. (.csv, .xlsx, .xls 파일만 가능)');
    }
  };

  const processParsedData = (data: any[]) => {
    if (data.length === 0) {
      setError('파일에 데이터가 없습니다.');
      return;
    }
    
    const csvHeaders = Object.keys(data[0] as any);
    setCsvData(data);
    setHeaders(csvHeaders);
    
    // 지능형 자동 매핑
    const initialMapping: Record<string, string> = {};
    Object.entries(EXPECTED_FIELDS).forEach(([sysField, synonyms]) => {
      const matched = csvHeaders.find(h => 
        synonyms.some(s => h.toLowerCase().includes(s.toLowerCase()))
      );
      if (matched) initialMapping[sysField] = matched;
    });
    
    setFieldMapping(initialMapping);
    setStep('mapping');
    setError('');
  };

  const handleApplyMapping = () => {
    if (!fieldMapping['name'] || !fieldMapping['phone']) {
      setError('이름과 전화번호 필드는 반드시 매핑해야 합니다.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 데이터 처리 및 매핑
    const processed = csvData.map(row => {
      const member: any = {
        name: row[fieldMapping['name']] || '',
        phone: formatPhone(row[fieldMapping['phone']] || ''),
        belt: row[fieldMapping['belt']] || '화이트',
        gral: parseInt(row[fieldMapping['gral']]) || 0,
        registerDate: formatDate(row[fieldMapping['registerDate']]) || today,
        startDate: formatDate(row[fieldMapping['startDate']]) || today,
        expireDate: formatDate(row[fieldMapping['expireDate']]) || '',
        memo: row[fieldMapping['memo']] || 'CSV 복구',
        plans: [],
        paymentAmount: 0,
        paymentMethod: 'CSV 복구'
      };

      // 요금제 자동 매핑
      const csvPlanName = row[fieldMapping['planName']];
      if (csvPlanName) {
        const normalize = (s: string) => s ? s.toString().toLowerCase().trim().replace(/\s+/g, '') : '';
        let targetName = normalize(csvPlanName);
        let multiplier = 1;

        // x2, *2, 2개 등의 수량 접미사 인식
        const qtyMatch = csvPlanName.toString().match(/(.*)[x*](\d+)$/) || csvPlanName.toString().match(/(.*)(\d+)개$/);
        if (qtyMatch) {
          targetName = normalize(qtyMatch[1]);
          multiplier = parseInt(qtyMatch[2]) || 1;
        }

        const matched = gymPlans.find(p => normalize(p.name) === targetName);
        if (matched) {
          member.plans = [];
          for (let i = 0; i < multiplier; i++) {
            member.plans.push({
              name: matched.name,
              qty: matched.type === '횟수권' ? (matched.defaultQty || 1) : 1,
              remainingQty: matched.type === '횟수권' ? (matched.defaultQty || 1) : undefined,
              type: matched.type
            });
          }
          
          const csvAmount = row[fieldMapping['paymentAmount']];
          member.paymentAmount = csvAmount ? parseInt(csvAmount.toString().replace(/[^0-9]/g, '')) : (matched.price * multiplier);
          
          const csvMethod = row[fieldMapping['paymentMethod']];
          if (csvMethod) member.paymentMethod = csvMethod;

          if (!member.expireDate) {
            const start = new Date(member.startDate);
            start.setMonth(start.getMonth() + ((matched.months || 0) * multiplier));
            member.expireDate = start.toISOString().split('T')[0];
          }
        }
      }

      // 횟수권인 경우 잔여 횟수 정보가 CSV에 따로 있다면 덮어쓰기
      const csvRemQty = row[fieldMapping['remainingQty']];
      if (csvRemQty && member.plans.length > 0) {
        const totalRem = parseInt(csvRemQty.toString().replace(/[^0-9]/g, ''));
        if (!isNaN(totalRem)) {
          member.plans.forEach((p: any, idx: number) => {
            if (p.type === '횟수권') {
              p.remainingQty = idx === 0 ? totalRem : 0;
            }
          });
        }
      }

      return member;
    }).filter(m => m.name && m.phone);

    setPreviewData(processed);
    setStep('preview');
    setError('');
  };

  const handleStartImport = async () => {
    setStep('processing');
    let success = 0;
    let fail = 0;

    for (const member of previewData) {
      const res = await addMember(member);
      if (res.success) success++;
      else fail++;
    }

    alert(`임포트 완료: 성공 ${success}건, 실패 ${fail}건`);
    onClose();
    setStep('upload');
    setCsvData([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText color="var(--tertiary)" size={28} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>회원 데이터 복구 (CSV)</h2>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.5rem' }}><X size={32} /></button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {error && <div style={{ background: 'rgba(255,180,171,0.1)', color: 'var(--error)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid var(--error)', fontSize: '0.875rem' }}>{error}</div>}

              {step === 'upload' && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed var(--outline-variant)', borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--tertiary)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--outline-variant)'}
                >
                  <Upload size={48} color="var(--on-surface-variant)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>여기를 눌러 CSV 파일을 선택하세요</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>다른 도장 관리 프로그램의 엑셀 데이터도 자동으로 매핑됩니다.</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, .xlsx, .xls" style={{ display: 'none' }} />
                </div>
              )}

              {step === 'mapping' && (
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>CSV의 각 열이 시스템의 어떤 정보인지 확인해 주세요.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                    {Object.keys(EXPECTED_FIELDS).map(sysField => (
                      <div key={sysField} style={{ background: 'var(--surface-container-low)', padding: '0.75rem 1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{EXPECTED_FIELDS[sysField][0]}</span>
                        <select 
                          value={fieldMapping[sysField] || ''} 
                          onChange={e => setFieldMapping({...fieldMapping, [sysField]: e.target.value})}
                          style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: '0.5rem', color: 'var(--on-surface)', padding: '0.375rem', fontSize: '0.8125rem', width: '160px' }}
                        >
                          <option value="">-- 선택 안함 --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 'preview' && (
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>총 <strong>{previewData.length}명</strong>의 데이터를 발견했습니다. 상위 5명을 미리 보여드립니다.</p>
                  <div style={{ overflowX: 'auto', border: '1px solid var(--outline-variant)', borderRadius: '0.75rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead style={{ background: 'var(--surface-container-highest)' }}>
                        <tr><th style={{ padding: '0.75rem' }}>이름</th><th style={{ padding: '0.75rem' }}>번호</th><th style={{ padding: '0.75rem' }}>요금제</th><th style={{ padding: '0.75rem' }}>만료일</th></tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 5).map((m, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--outline-variant)' }}>
                            <td style={{ padding: '0.75rem' }}>{m.name}</td>
                            <td style={{ padding: '0.75rem' }}>{m.phone}</td>
                            <td style={{ padding: '0.75rem' }}>{m.plans[0]?.name || '-'}</td>
                            <td style={{ padding: '0.75rem' }}>{m.expireDate || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {step === 'processing' && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '1rem' }}>
                    <Upload size={40} color="var(--tertiary)" />
                  </motion.div>
                  <p style={{ fontWeight: 600 }}>서버에 업로드 중입니다...</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>잠시만 기다려 주세요.</p>
                </div>
              )}
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              {(step === 'mapping' || step === 'preview') && (
                <button 
                  onClick={handleReset} 
                  style={{ background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  다른 파일 선택
                </button>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
                {step === 'mapping' && <button onClick={handleApplyMapping} className="btn-primary" style={{ background: 'var(--tertiary)', color: '#000', padding: '1rem 2rem', borderRadius: '0.75rem', fontSize: '1.125rem', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>다음 단계 <ArrowRight size={20} /></button>}
                {step === 'preview' && (
                  <>
                    <button onClick={() => setStep('mapping')} style={{ background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '1rem 2rem', borderRadius: '0.75rem', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>이전</button>
                    <button onClick={handleStartImport} className="btn-primary" style={{ background: 'var(--tertiary)', color: '#000', padding: '1rem 2rem', borderRadius: '0.75rem', fontSize: '1.125rem', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>가져오기 시작 <Check size={20} /></button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
