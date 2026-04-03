import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'c:/Users/insid/OneDrive/바탕 화면/antigravity/tapnow/bjj_members_20260403.xlsx';

try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Read raw data to see if there are empty rows or weird structures
    const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('--- RAW SAMPLE (First 5 rows) ---');
    console.log(raw.slice(0, 5));

    // Read as objects (default)
    const objects = XLSX.utils.sheet_to_json(worksheet);
    console.log('--- OBJECT SAMPLE (First row) ---');
    console.log(objects[0]);
    console.log('--- KEYS ---');
    if (objects[0]) {
        console.log(Object.keys(objects[0]));
    } else {
        console.log('No objects found');
    }

} catch (error) {
    console.error('Error reading XLSX:', error);
}
