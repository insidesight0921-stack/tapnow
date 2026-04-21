import * as XLSX from 'xlsx';

const data = [['이름', '전화번호', '벨트', '등록일', '만료일', '요금제', '납부금액']];
for (let i = 1; i <= 40; i++) {
  data.push([
    `대기회원${i}`,
    `0101111${String(i).padStart(4, '0')}`,
    '화이트',
    '2026-04-01',
    '2026-06-30',
    '3개월권',
    300000
  ]);
}

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'docs/test_limit.xlsx');
console.log('docs/test_limit.xlsx 생성 완료');
