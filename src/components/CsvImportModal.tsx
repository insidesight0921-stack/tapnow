import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore, type Member } from '../store/useStore';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'success';

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
  
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');
  const [importResults, setImportResults] = useState<{ success: number; failed: number; pending: number }>({ success: 0, failed: 0, pending: 0 });
  const [debugLog, setDebugLog] = useState<string>('');
  const [deduplicatedCount, setDeduplicatedCount] = useState(0);
  
  const { gymId, plans, addMember, addPlan } = useStore();

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setCsvData([]);
      setHeaders([]);
      setFieldMapping({});
      setError('');
      setImportResults({ success: 0, failed: 0, pending: 0 });
      setDebugLog('');
      setDeduplicatedCount(0);
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setDebugLog(`파일 선택됨: ${file.name} (${file.size} bytes)`);
    
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isXlsx = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as ArrayBuffer;
      if (!data) {
        setError('파일 데이터를 읽을 수 없습니다.');
        return;
      }

      if (isCsv) {
        // 인코딩 자동 감지 로직 (한글 깨짐 방지)
        const utf8Decoder = new TextDecoder('utf-8');
        let csvString = utf8Decoder.decode(data);
        
        // 깨진 문자(?)가 포함되어 있는지 확인 (Replacement Character \uFFFD)
        const replacementCharCount = (csvString.match(/\uFFFD/g) || []).length;
        if (replacementCharCount > 3) {
          const eucDecoder = new TextDecoder('euc-kr');
          csvString = eucDecoder.decode(data);
          setDebugLog(prev => `${prev}\n인코딩 자동 감지: EUC-KR(한글) 적용`);
        } else {
          setDebugLog(prev => `${prev}\n인코딩 자동 감지: UTF-8 적용`);
        }

        Papa.parse(csvString, {
          header: false,
          skipEmptyLines: 'greedy',
          complete: (results: any) => findHeadersAndProcess(results.data),
          error: (err: any) => setError(`CSV 파싱 오류: ${err.message}`)
        });
      } else if (isXlsx) {
        try {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][];
          findHeadersAndProcess(allRows);
        } catch (err: any) {
          setError(`엑셀 파싱 오류: ${err.message}`);
          console.error(err);
        }
      } else {
        setError('지원하지 않는 파일 형식입니다. (.csv, .xlsx, .xls 파일만 가능)');
      }
    };

    reader.onerror = () => setError('파일을 읽는 중 오류가 발생했습니다.');
    reader.readAsArrayBuffer(file);
  };

  const findHeadersAndProcess = (allRows: any[][]) => {
    if (!allRows || allRows.length === 0) {
      setError('파일에 데이터가 없습니다.');
      return;
    }

    // 헤더 탐지 알고리즘 강화: 키워드 매칭 점수제 도입
    let headerIdx = -1;
    let maxScore = -1;
    
    const allKeywords = Object.values(EXPECTED_FIELDS).flat();

    for (let i = 0; i < Math.min(allRows.length, 12); i++) {
      const row = allRows[i];
      if (!row || row.length === 0) continue;
      
      const nonNullCols = row.filter(cell => cell !== null && cell !== undefined && cell !== "").length;
      let keywordScore = 0;
      
      row.forEach(cell => {
        if (!cell) return;
        const cellStr = cell.toString().toLowerCase().replace(/\s/g, '');
        if (allKeywords.some(kw => {
          const cleanKw = kw.toLowerCase().replace(/\s/g, '');
          return cellStr === cleanKw || cellStr.includes(cleanKw);
        })) {
          keywordScore += 10; // 키워드 일치 시 높은 가점
        }
      });

      // 최종 점수: 데이터 존재 열 개수 + 키워드 매칭 보너스
      const totalRowScore = nonNullCols + keywordScore;
      if (totalRowScore > maxScore && nonNullCols > 0) {
        maxScore = totalRowScore;
        headerIdx = i;
      }
    }

    if (headerIdx === -1) {
      setError('유효한 데이터 형식을 찾을 수 없습니다.');
      return;
    }

    const rawHeaders = allRows[headerIdx].map(h => h?.toString().trim() || "");
    const dataRows = allRows.slice(headerIdx + 1);

    setDebugLog(prev => `${prev}\n최적 헤더 행 찾음 (행 번호: ${headerIdx + 1})\n탐지된 필드: ${rawHeaders.filter(h => h).join(', ')}`);

    const formattedData = dataRows.map(row => {
      const obj: any = {};
      rawHeaders.forEach((header, idx) => {
        if (header) obj[header] = row[idx];
      });
      return obj;
    }).filter(obj => {
      // 행에 최소한 하나 이상의 데이터가 있는 경우만 유지
      return Object.values(obj).some(val => val !== null && val !== undefined && val !== "");
    });

    processParsedData(formattedData, rawHeaders.filter(h => h !== ""));
  };

  const processParsedData = (data: any[], detectedHeaders: string[]) => {
    setCsvData(data);
    setHeaders(detectedHeaders);
    
    const initialMapping: Record<string, string> = {};
    Object.entries(EXPECTED_FIELDS).forEach(([sysField, synonyms]) => {
      const matched = detectedHeaders.find(h => {
        if (!h) return false;
        const cleanH = h.toString().toLowerCase().replace(/\s/g, '');
        return synonyms.some(s => {
          const cleanS = s.toLowerCase().replace(/\s/g, '');
          return cleanH === cleanS || cleanH.includes(cleanS) || cleanS.includes(cleanH);
        });
      });
      if (matched) initialMapping[sysField] = matched;
    });
    
    setFieldMapping(initialMapping);
    setStep('mapping');
    setError('');
  };

  const handleApplyMapping = () => {
    if (!fieldMapping.name || !fieldMapping.phone) {
      setError('이름과 전화번호 매핑은 필수입니다.');
      return;
    }

    // 중복 제거: 이름 + 전화번호 기준 그룹핑 → 만료일이 가장 최신인 행만 유지
    const nameField = fieldMapping.name;
    const phoneField = fieldMapping.phone;
    const expireField = fieldMapping.expireDate;

    const grouped = new Map<string, any>();
    for (const row of csvData) {
      const name = (row[nameField] || '').toString().trim();
      const phone = (row[phoneField] || '').toString().replace(/[^0-9]/g, '');
      if (!name || !phone) continue;

      const key = `${name}__${phone}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, row);
      } else if (expireField) {
        const existingDate = (existing[expireField] || '').toString();
        const newDate = (row[expireField] || '').toString();
        if (newDate > existingDate) {
          grouped.set(key, row);
        }
      }
    }

    const deduped = Array.from(grouped.values());
    const removedCount = csvData.length - deduped.length;
    setDeduplicatedCount(removedCount);
    setCsvData(deduped);

    if (removedCount > 0) {
      setDebugLog(prev => `${prev}\n🔄 중복 제거: 동일인(이름+전화번호) ${removedCount}건 제거됨 (최신 만료일 기준 유지)`);
    }

    setStep('preview');
    setError('');
  };

  const handleImport = async () => {
    let success = 0;
    let failed = 0;
    let pending = 0;

    // 자동 생성된 요금제 캐시 (동일 요금제 중복 생성 방지)
    const planCache = new Map<string, { id: string; name: string; type: '횟수권' | '기간권' }>();
    // 기존 요금제를 캐시에 미리 로드
    for (const p of plans) {
      planCache.set(p.name, { id: p.id, name: p.name, type: p.type });
    }

    const formatExcelDate = (val: any) => {
      if (!val) return '';
      if (typeof val === 'number') {
        try {
          const date = XLSX.SSF.parse_date_code(val);
          return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        } catch { return val.toString(); }
      }
      return val.toString();
    };

    for (const row of csvData) {
      try {
        const planName = fieldMapping.planName ? row[fieldMapping.planName]?.toString().trim() : '';
        let foundPlan = planName ? planCache.get(planName) : undefined;

        // 미등록 요금제인 경우 자동 생성
        if (planName && !foundPlan) {
          try {
            const hasRemaining = !!(fieldMapping.remainingQty && row[fieldMapping.remainingQty]);
            const newPlanType: '횟수권' | '기간권' = hasRemaining ? '횟수권' : '기간권';
            await addPlan({
              name: planName,
              price: 0,
              months: 1,
              type: newPlanType,
              ...(newPlanType === '횟수권' ? { defaultQty: parseInt(row[fieldMapping.remainingQty]) || 10 } : {})
            });
            // 생성 후 store에서 최신 plans 가져오기
            const latestPlans = useStore.getState().plans;
            const newPlan = latestPlans.find(p => p.name === planName);
            if (newPlan) {
              foundPlan = { id: newPlan.id, name: newPlan.name, type: newPlan.type };
              planCache.set(planName, foundPlan);
            }
          } catch (planErr) {
            console.warn(`요금제 '${planName}' 자동 생성 실패:`, planErr);
          }
        }

        const newMember: Omit<Member, 'id'> = {
          name: row[fieldMapping.name]?.toString().trim() || '',
          phone: row[fieldMapping.phone]?.toString().replace(/[^0-9]/g, '') || '',
          belt: row[fieldMapping.belt]?.toString().trim() || '화이트',
          gral: parseInt(row[fieldMapping.gral]) || 0,
          registerDate: formatExcelDate(row[fieldMapping.registerDate]) || new Date().toISOString().split('T')[0],
          startDate: formatExcelDate(row[fieldMapping.startDate]) || new Date().toISOString().split('T')[0],
          expireDate: formatExcelDate(row[fieldMapping.expireDate]) || '',
          plans: foundPlan ? [{
            id: foundPlan.id,
            name: foundPlan.name,
            qty: 1,
            remainingQty: fieldMapping.remainingQty ? parseInt(row[fieldMapping.remainingQty]) || 0 : (foundPlan.type === '횟수권' ? 0 : undefined),
            type: foundPlan.type
          }] : [],
          paymentAmount: parseInt(row[fieldMapping.paymentAmount]) || 0,
          paymentMethod: row[fieldMapping.paymentMethod]?.toString() || '현금',
          gymId: gymId || '',
          memo: row[fieldMapping.memo]?.toString() || ''
        };

        if (newMember.name && newMember.phone) {
          const res = await addMember(newMember);
          if (!res.success && res.message?.includes('한도')) {
            await addDoc(collection(db, 'pendingMembers'), { 
              ...newMember, 
              gymId: gymId || '', 
              createdAt: serverTimestamp() 
            });
            pending++;
          } else if (res.success) {
            success++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      } catch (err) {
        console.error('Import individual error:', err);
        failed++;
      }
    }

    setImportResults({ success, failed, pending });
    setStep('success');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ backgroundColor: 'var(--surface-container-high)', width: '100%', maxWidth: '800px', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', border: '1px solid var(--outline-variant)' }}>
            
            <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText color="var(--tertiary)" size={28} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>회원 데이터 복구</h2>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.5rem' }}><X size={32} /></button>
            </div>

            <div style={{ padding: '2rem' }}>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1rem', backgroundColor: 'rgba(255, 82, 82, 0.1)', border: '1px solid #FF5252', borderRadius: '0.75rem', color: '#FF5252', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertCircle size={20} />
                  <span style={{ fontWeight: 600 }}>{error}</span>
                </motion.div>
              )}

              {step === 'upload' && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '2px dashed var(--outline-variant)', borderRadius: '1.25rem', backgroundColor: 'var(--surface-container)' }}>
                  <Upload size={64} color="var(--outline)" style={{ marginBottom: '1.5rem' }} />
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>엑셀 또는 CSV 파일 업로드</h3>
                  <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>엑셀(.xlsx, .xls) 또는 CSV 파일을 선택하세요.</p>
                  
                  <label style={{ display: 'inline-flex', padding: '1rem 2.5rem', backgroundColor: 'var(--primary)', color: '#FFFFFF', borderRadius: '100px', fontWeight: 700, cursor: 'pointer', gap: '0.75rem', alignItems: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}>
                    <Upload size={20} />
                    파일 선택
                    <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              {step === 'mapping' && (
                <div>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--on-surface-variant)', fontSize: '1rem' }}>파일의 각 열이 시스템의 어떤 정보인지 매핑해 주세요.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--outline-variant)', borderRadius: '1rem', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    {Object.keys(EXPECTED_FIELDS).map(sysField => (
                      <div key={sysField} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--surface-container)', borderRadius: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)' }}>{EXPECTED_FIELDS[sysField][0]}</span>
                          {(sysField === 'name' || sysField === 'phone') && <span style={{ color: '#FF5252', fontSize: '0.75rem' }}>(필수)</span>}
                        </div>
                        <select 
                          value={fieldMapping[sysField] || ''} 
                          onChange={(e) => setFieldMapping(prev => ({ ...prev, [sysField]: e.target.value }))}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container-highest)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', fontSize: '0.95rem' }}
                        >
                          <option value="">-- 선택 안함 --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setStep('upload')} style={{ color: 'var(--on-surface-variant)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>다른 파일 선택</button>
                    <button onClick={handleApplyMapping} style={{ padding: '0.875rem 2rem', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)', borderRadius: '100px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      검토 단계로 <CheckCircle size={18} />
                    </button>
                  </div>

                  <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', fontSize: '0.8rem', color: 'var(--outline)', whiteSpace: 'pre-wrap', border: '1px solid var(--outline-variant)', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--tertiary)' }}>
                      <HelpCircle size={14} /> AI 파일 분석 로그
                    </div>
                    {debugLog}
                  </div>
                </div>
              )}

              {step === 'preview' && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <FileText size={40} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>데이터 가져오기 준비 완료</h3>
                  <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1rem', lineHeight: 1.6 }}>총 <strong style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{csvData.length}명</strong>의 회원 데이터를 시스템에 등록합니다.<br />기존 데이터는 유지되며 새로운 회원이 추가됩니다.</p>
                  {deduplicatedCount > 0 && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,183,0,0.12)', border: '1px solid rgba(255,183,0,0.35)', borderRadius: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#ffb700', textAlign: 'left' }}>
                      🔄 동일인 중복 <strong>{deduplicatedCount}건</strong> 제거됨 (이름+전화번호 기준, 최신 만료일 유지)
                    </div>
                  )}
                  <div style={{ padding: '0.5rem 1rem', background: 'rgba(var(--primary-rgb), 0.08)', border: '1px solid rgba(var(--primary-rgb), 0.2)', borderRadius: '0.75rem', marginBottom: '2rem', fontSize: '0.8125rem', color: 'var(--primary)', textAlign: 'left' }}>
                    💡 파일에 있는 요금제 정보가 기존 목록에 없으면 자동으로 시스템에 등록됩니다.
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <button onClick={() => setStep('mapping')} style={{ padding: '1rem 2.5rem', backgroundColor: 'transparent', border: '1px solid var(--outline-variant)', borderRadius: '100px', fontWeight: 600, color: 'var(--on-surface)' }}>이전 단계</button>
                    <button onClick={handleImport} style={{ padding: '1rem 3rem', backgroundColor: 'var(--primary)', color: '#FFFFFF', border: 'none', borderRadius: '100px', fontWeight: 700, boxShadow: '0 8px 20px rgba(var(--primary-rgb), 0.3)' }}>지금 복구하기</button>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={60} color="#4CAF50" />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', fontWeight: 800 }}>복구 결과</h3>
                  <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem', lineHeight: 1.6 }}>데이터 복구 작업이 성공적으로 완료되었습니다.<br />시스템에 적용된 결과를 확인하세요.</p>
                  
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ padding: '1rem 2rem', backgroundColor: 'rgba(82, 183, 136, 0.1)', borderRadius: '1rem', border: '1px solid rgba(82, 183, 136, 0.3)' }}>
                      <div style={{ fontSize: '0.875rem', color: '#52B788', fontWeight: 600, marginBottom: '0.5rem' }}>성공</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#52B788' }}>{importResults.success}</div>
                    </div>
                    {importResults.pending > 0 && (
                      <div style={{ padding: '1rem 2rem', backgroundColor: 'rgba(255, 183, 0, 0.1)', borderRadius: '1rem', border: '1px solid rgba(255, 183, 0, 0.3)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#FFB700', fontWeight: 600, marginBottom: '0.5rem' }}>초과(대기)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFB700' }}>{importResults.pending}</div>
                      </div>
                    )}
                    <div style={{ padding: '1rem 2rem', backgroundColor: 'rgba(255, 82, 82, 0.1)', borderRadius: '1rem', border: '1px solid rgba(255, 82, 82, 0.3)' }}>
                      <div style={{ fontSize: '0.875rem', color: '#FF5252', fontWeight: 600, marginBottom: '0.5rem' }}>실패</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FF5252' }}>{importResults.failed}</div>
                    </div>
                  </div>

                  {importResults.pending > 0 && (
                    <div style={{ padding: '0.875rem 1rem', background: 'rgba(255,183,0,0.12)', border: '1px solid rgba(255,183,0,0.35)', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#ffb700', textAlign: 'left', lineHeight: 1.5 }}>
                      💡 무료 요금제 30명 제한으로 <strong>{importResults.pending}명</strong>의 데이터가 대기(백업) 중입니다.<br />요금제를 승급하시면 대기 중인 회원이 자동으로 등록됩니다.
                    </div>
                  )}

                  <button onClick={onClose} style={{ padding: '1rem 3rem', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', borderRadius: '100px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                    확인
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
