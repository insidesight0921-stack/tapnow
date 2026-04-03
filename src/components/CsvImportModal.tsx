import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [debugLog, setDebugLog] = useState<string>('');
  
  const { gymId, plans, addMember } = useStore();

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
      const data = event.target?.result;
      if (!data) {
        setError('파일 데이터를 읽을 수 없습니다.');
        return;
      }

      if (isCsv) {
        const decoder = new TextDecoder('utf-8');
        const csvString = decoder.decode(data as ArrayBuffer);
        Papa.parse(csvString, {
          header: false,
          skipEmptyLines: true,
          complete: (results: any) => findHeadersAndProcess(results.data),
          error: (err: any) => setError(`CSV 파싱 오류: ${err.message}`)
        });
      } else if (isXlsx) {
        try {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
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

    // 지능형 헤더 탐지: 상위 10행 중 가장 많은 값을 가진 행을 헤더로 간주
    let headerIdx = -1;
    let maxCols = 0;
    
    for (let i = 0; i < Math.min(allRows.length, 10); i++) {
      const row = allRows[i];
      if (!row) continue;
      const nonNullCols = row.filter(cell => cell !== null && cell !== undefined && cell !== "").length;
      if (nonNullCols > maxCols) {
        maxCols = nonNullCols;
        headerIdx = i;
      }
    }

    if (headerIdx === -1 || maxCols === 0) {
      setError('유효한 데이터 헤더를 찾을 수 없습니다.');
      return;
    }

    const rawHeaders = allRows[headerIdx].map(h => h?.toString().trim() || "");
    const dataRows = allRows.slice(headerIdx + 1);

    setDebugLog(prev => `${prev}\n탐지된 헤더: ${rawHeaders.join(', ')}\n데이터 행 수: ${dataRows.length}`);

    // 데이터 변환 (헤더를 키로 하는 객체 배열로)
    const formattedData = dataRows.map(row => {
      const obj: any = {};
      rawHeaders.forEach((header, idx) => {
        if (header) {
          obj[header] = row[idx];
        }
      });
      return obj;
    }).filter(obj => {
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
          return cleanH.includes(cleanS) || cleanS.includes(cleanH);
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
    setStep('preview');
  };

  const handleImport = async () => {
    let success = 0;
    let failed = 0;

    for (const row of csvData) {
      try {
        const planName = fieldMapping.planName ? row[fieldMapping.planName]?.toString().trim() : '';
        const foundPlan = plans.find(p => p.name === planName);

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
            remainingQty: fieldMapping.remainingQty ? parseInt(row[fieldMapping.remainingQty]) || 0 : (foundPlan.type === '횟수권' ? foundPlan.defaultQty || 0 : undefined),
            type: foundPlan.type
          }] : [],
          paymentAmount: parseInt(row[fieldMapping.paymentAmount]) || 0,
          paymentMethod: row[fieldMapping.paymentMethod]?.toString() || '현금',
          gymId: gymId || '',
          memo: row[fieldMapping.memo]?.toString() || ''
        };

        await addMember(newMember);
        success++;
      } catch (err) {
        console.error('Import individual error:', err);
        failed++;
      }
    }

    setImportResults({ success, failed });
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
                <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 82, 82, 0.1)', border: '1px solid #FF5252', borderRadius: '0.75rem', color: '#FF5252', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {step === 'upload' && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '2px dashed var(--outline-variant)', borderRadius: '1.25rem', backgroundColor: 'var(--surface-container)' }}>
                  <Upload size={64} color="var(--outline)" style={{ marginBottom: '1.5rem' }} />
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>엑셀 또는 CSV 파일 업로드</h3>
                  <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>엑셀(.xlsx, .xls) 또는 CSV 파일을 선택하세요.</p>
                  
                  <label style={{ display: 'inline-flex', padding: '0.875rem 2rem', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', borderRadius: '100px', fontWeight: 600, cursor: 'pointer', gap: '0.5rem', alignItems: 'center' }}>
                    파일 선택
                    <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              {step === 'mapping' && (
                <div>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--on-surface-variant)' }}>파일의 각 열이 시스템의 어떤 정보인지 확인해 주세요.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                    {Object.keys(EXPECTED_FIELDS).map(sysField => (
                      <div key={sysField} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginLeft: '0.25rem' }}>{EXPECTED_FIELDS[sysField][0]}</span>
                        <select 
                          value={fieldMapping[sysField] || ''} 
                          onChange={(e) => setFieldMapping(prev => ({ ...prev, [sysField]: e.target.value }))}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container-highest)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)' }}
                        >
                          <option value="">-- 선택 안함 --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setStep('upload')} style={{ color: 'var(--on-surface-variant)', background: 'transparent', border: 'none', cursor: 'pointer' }}>다른 파일 선택</button>
                    <button onClick={handleApplyMapping} style={{ padding: '0.875rem 2rem', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)', borderRadius: '100px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      다음 단계 <CheckCircle size={18} />
                    </button>
                  </div>

                  <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--outline)', whiteSpace: 'pre-wrap', border: '1px solid var(--outline-variant)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                      <HelpCircle size={14} /> 시스템 분석 정보
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
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>데이터 가져오기 준비 완료</h3>
                  <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>총 <strong>{csvData.length}명</strong>의 회원 데이터를 시스템에 등록합니다.<br />계속하시겠습니까?</p>
                  
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => setStep('mapping')} style={{ padding: '0.875rem 2rem', backgroundColor: 'transparent', border: '1px solid var(--outline-variant)', borderRadius: '100px', fontWeight: 600 }}>이전으로</button>
                    <button onClick={handleImport} style={{ padding: '0.875rem 2rem', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '100px', fontWeight: 600 }}>지금 가져오기</button>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={50} color="#4CAF50" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>복구 완료</h3>
                  <p style={{ color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>회원 데이터 복구를 성공적으로 마쳤습니다.</p>
                  <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>성공: <span style={{ color: '#4CAF50', fontWeight: 700 }}>{importResults.success}건</span> / 실패: <span style={{ color: '#FF5252', fontWeight: 700 }}>{importResults.failed}건</span></p>
                  
                  <button onClick={onClose} style={{ padding: '0.875rem 3rem', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '100px', fontWeight: 600 }}>닫기</button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
