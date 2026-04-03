import * as XLSX from 'xlsx';
import * as fs from 'fs';

const EXPECTED_FIELDS = {
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

const filePath = 'c:/Users/insid/OneDrive/바탕 화면/antigravity/tapnow/bjj_members_20260403.xlsx';

try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    console.log('Detected Headers:', headerRow);

    const initialMapping = {};
    Object.entries(EXPECTED_FIELDS).forEach(([sysField, synonyms]) => {
      const matched = headerRow.find(h => 
        h && synonyms.some(s => h.toString().toLowerCase().includes(s.toLowerCase()))
      );
      if (matched) initialMapping[sysField] = matched;
    });

    console.log('Resulting Mapping:', initialMapping);

} catch (error) {
    console.error('Error:', error);
}
