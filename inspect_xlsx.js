import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'c:/Users/insid/OneDrive/바탕 화면/antigravity/tapnow/bjj_members_20260403.xlsx';

try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('--- HEADERS ---');
    console.log(json[0]);
    console.log('--- FIRST ROW ---');
    console.log(json[1]);
    console.log('--- TOTAL ROWS ---');
    console.log(json.length - 1);
} catch (error) {
    console.error('Error reading XLSX:', error);
}
