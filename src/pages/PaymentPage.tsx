import { useState, useEffect } from 'react';
import { useStore, type Payment } from '../store/useStore';
import { Search, TrendingUp } from 'lucide-react';

// 간단한 SVG 도넛 차트
function DonutChart({ data, isMobile }: { data: { label: string; value: number; color: string }[], isMobile?: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>데이터 없음</div>;

  let cumulative = 0;
  const radius = isMobile ? 45 : 60;
  const cx = isMobile ? 60 : 80;
  const cy = isMobile ? 60 : 80;
  const strokeWidth = isMobile ? 14 : 20;

  const segments = data.filter(d => d.value > 0).map(d => {
    const pct = d.value / total;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });

  const polarToCartesian = (angle: number) => {
    const rad = (angle - 0.25) * 2 * Math.PI;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1.5rem', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
      <svg width={isMobile ? "120" : "160"} height={isMobile ? "120" : "160"} viewBox={isMobile ? "0 0 120 120" : "0 0 160 160"}>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={describeArc(seg.start, seg.start + seg.pct)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--on-surface)" fontSize={isMobile ? "10" : "12"} fontWeight="600">합계</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--tertiary)" fontSize={isMobile ? "11" : "14"} fontWeight="700">{total.toLocaleString()}원</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>{d.label}:</span>
            <span style={{ fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap' }}>{d.value.toLocaleString()}원</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 월별 매출 막대 그래프
function MonthlyBarChart({ payments }: { payments: Payment[] }) {
  const months: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = 0;
  }
  payments.filter(p => p.status === '완료').forEach(p => {
    const key = p.date.slice(0, 7);
    if (key in months) months[key] += p.amount;
  });

  const entries = Object.entries(months);
  const maxVal = Math.max(...entries.map(e => e[1]), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px' }}>
      {entries.map(([key, val]) => {
        const pct = val / maxVal;
        const [, mo] = key.split('-');
        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.25rem' }}>
            <div style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
              {val > 0 ? `${(val / 10000).toFixed(0)}만` : ''}
            </div>
            <div style={{ width: '100%', height: `${Math.max(pct * 90, 4)}px`, background: key.endsWith(String(now.getMonth() + 1).padStart(2, '0')) ? 'var(--tertiary)' : 'var(--surface-container-highest)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
            <div style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>{mo}월</div>
          </div>
        );
      })}
    </div>
  );
}

export default function PaymentPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const payments = useStore(state => state.payments); 
  const currentGymId = useStore(state => state.gymId); 
  
  const gymPayments = payments.filter(p => p.gymId === currentGymId);

  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [methodFilter, setMethodFilter] = useState<'전체' | '카드' | '현금' | '계좌이체' | '기타'>('전체');
  const [statusFilter, setStatusFilter] = useState<'전체' | '완료' | '미납' | '취소'>('전체');
  const [search, setSearch] = useState('');

  const filtered = gymPayments.filter(p => {
    if (!p.date.startsWith(monthFilter)) return false;
    if (methodFilter !== '전체' && p.method !== methodFilter) return false;
    if (statusFilter !== '전체' && p.status !== statusFilter) return false;
    if (search && !(p.memberName?.includes(search) || p.item?.includes(search))) return false;
    return true;
  });

  const totalRevenue = filtered.filter(p => p.status === '완료').reduce((s, p) => s + p.amount, 0);
  const totalCount = filtered.filter(p => p.status === '완료').length;
  const cancelledCount = filtered.filter(p => p.status === '취소').length;

  // 결제 수단별 합계
  const methods = ['카드', '현금', '계좌이체', '기타'] as const;
  const methodColors = { '카드': '#6e86ff', '현금': '#52b788', '계좌이체': '#ffd166', '기타': '#aaa' };
  const methodData = methods.map(m => ({
    label: m,
    value: gymPayments.filter(p => p.method === m && p.status === '완료' && p.date.startsWith(monthFilter)).reduce((s, p) => s + p.amount, 0),
    color: methodColors[m]
  }));

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 600, color: 'var(--on-bg)', marginBottom: '1.5rem' }}>결제 관리</h2>

      {/* 상단 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr', gap: isMobile ? '0.5rem' : '1rem', gridColumn: isMobile ? '1' : 'auto' }}>
            <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.375rem' }}>이달 매출 (완료)</div>
              <div style={{ fontSize: isMobile ? '1.125rem' : '1.75rem', fontWeight: 700, color: 'var(--tertiary)' }}>{totalRevenue.toLocaleString()}원</div>
            </div>
            <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.375rem', fontWeight: 600 }}>결제 완료 건수</div>
              <div style={{ fontSize: isMobile ? '1.125rem' : '1.75rem', fontWeight: 700, color: '#52b788' }}>{totalCount.toLocaleString()}건 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--on-surface-variant)' }}>(취소 {cancelledCount}건)</span></div>
            </div>
        </div>
        <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}><TrendingUp size={14} /> 결제 수단별 분포</div>
          <DonutChart data={methodData} isMobile={isMobile} />
        </div>
        <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.75rem', fontWeight: 600 }}>최근 6개월 매출 추이</div>
          <MonthlyBarChart payments={payments} />
        </div>
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginBottom: '1.5rem', alignItems: isMobile ? 'stretch' : 'center', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '0.5rem', 
          width: isMobile ? '100%' : 'auto',
          margin: isMobile ? '0 -1rem' : '0',
          padding: isMobile ? '0 1rem 0.5rem' : '0 0 0.5rem',
          flexWrap: isMobile ? 'nowrap' : 'wrap'
        }} className="no-wrap-group">
          <input
            type="month"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            style={{ padding: '0.75rem', background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: '0.75rem', color: 'var(--on-surface)', fontSize: '0.875rem', outline: 'none', height: '44px', flexShrink: 0 }}
          />
          <select 
            value={methodFilter} 
            onChange={e => setMethodFilter(e.target.value as any)}
            style={{ 
              padding: '0 1rem', background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', 
              borderRadius: '0.75rem', color: 'var(--on-surface)', fontSize: '0.875rem', outline: 'none', height: '44px', cursor: 'pointer' 
            }}
          >
            <option value="전체">모든 결제 수단</option>
            <option value="카드">카드</option>
            <option value="현금">현금</option>
            <option value="계좌이체">계좌이체</option>
            <option value="기타">기타</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? '100%' : 'auto', flex: isMobile ? 'unset' : 1, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.25rem', flex: isMobile ? 1 : 'unset', overflowX: isMobile ? 'auto' : 'visible' }} className="no-wrap-group">
                {(['전체', '완료', '미납', '취소'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ flex: isMobile ? 1 : 'unset', background: statusFilter === s ? 'var(--primary)' : 'var(--surface-container-high)', color: statusFilter === s ? '#000' : 'var(--on-surface-variant)', border: 'none', padding: '0 1rem', borderRadius: '0.75rem', fontSize: '0.8125rem', fontWeight: statusFilter === s ? 700 : 500, cursor: 'pointer', height: '44px', whiteSpace: 'nowrap' }}>{s}</button>
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: '0.75rem', padding: '0 1rem', height: '44px', flex: isMobile ? 2 : 1, minWidth: '150px' }}>
                <Search size={18} color="var(--on-surface-variant)" style={{ marginRight: '0.75rem' }} />
                <input type="text" placeholder="회원 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', outline: 'none', fontSize: '0.9375rem', width: '100%' }} />
            </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-xl)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: isMobile ? '600px' : 'auto', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>
              <th style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'left' }}>회원명</th>
              <th style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'left' }}>결제일</th>
              <th style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'left' }}>요금제</th>
              <th style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'right' }}>금액</th>
              <th style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'center' }}>수단</th>
              <th style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'center' }}>상태</th>
              <th style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--outline-variant)', textAlign: 'right' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>결제 내역이 없습니다.</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-container-highest)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.memberName || p.item || '구독 결제'}</td>
                <td style={{ padding: '1rem', color: 'var(--on-surface-variant)' }}>{p.date}</td>
                <td style={{ padding: '1rem', color: 'var(--on-surface-variant)' }}>{p.planName || p.item || '-'}</td>
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--on-surface)', textAlign: 'right' }}>{p.amount.toLocaleString()}원</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span style={{ background: 'var(--surface-container-highest)', padding: '0.125rem 0.625rem', borderRadius: '12px', fontSize: '0.75rem' }}>{p.method}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span style={{
                    background: p.status === '완료' ? 'rgba(82,183,136,0.15)' : p.status === '취소' ? 'rgba(150,150,150,0.15)' : 'rgba(255,71,87,0.15)',
                    color: p.status === '완료' ? '#52b788' : p.status === '취소' ? '#888' : 'var(--error)',
                    padding: '0.25rem 0.625rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                    textDecoration: p.status === '취소' ? 'line-through' : 'none'
                  }}>{p.status}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {p.status !== '취소' && (
                    <button 
                      onClick={() => {
                        if (confirm('정말 이 결제 기록을 취소하시겠습니까? (매출 통계에서 제외됩니다)')) {
                          useStore.getState().updatePaymentStatus(p.id, '취소');
                        }
                      }}
                      style={{ 
                        background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)',
                        padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500
                      }}
                    >
                      결제 취소
                    </button>
                  )}
                  {p.status === '취소' && (
                    <button 
                      onClick={() => useStore.getState().deletePayment(p.id)}
                      style={{ 
                        background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)',
                        padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500, marginLeft: '0.5rem'
                      }}
                    >
                      기록 삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
