import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const pdf = require('pdf-parse');
import ExcelJS from 'exceljs';

const GLOBAL_EXCEL_PATH = '/tmp/extracted/all_data.xlsx';
const PDF_TEMP_DIR = '/tmp/pdfs';
const EXCEL_TEMP_DIR = '/tmp/extracted';

const REQUIRED_FIELDS = [
  'Article', 'Order Reference', 'Colour Name', 'GBP Retail Price',
  'Collection', 'Design Number', 'Ex Port Date', 'Total',
  'Unit Price', 'Line Value', 'Product Name'
];

const FIELD_MAPPING: Record<string, string> = {
  "Article": "color code",
  "Order Reference": "PO",
  "Colour Name": "color",
  "GBP Retail Price": "sell",
  "Collection": "style no",
  "Design Number": "style code",
  "Ex Port Date": "Ex-date",
  "Total": "quantity",
  "Unit Price": "unit price",
  "Line Value": "total",
  "Product Name": "style name"
};

async function parsePDF(filePath: string): Promise<string> {
  const dataBuffer = readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function extractFieldsWithLLM(pdfText: string): Promise<Record<string, string>> {
  const apiKey = process.env.ARK_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  const model = process.env.LLM_MODEL || 'doubao-seed-1-8-251228';

  const emptyFields = Object.fromEntries(REQUIRED_FIELDS.map(f => [f, '']));

  if (!apiKey) {
    console.warn('未配置 LLM API Key，跳过字段提取');
    return emptyFields;
  }

  const systemPrompt = `你是PDF字段提取助手。从文本中提取以下字段，只返回纯JSON，不含其他文字：
Article, Order Reference, Colour Name, GBP Retail Price, Collection, Design Number, Ex Port Date, Total, Unit Price, Line Value, Product Name
找不到的字段值设为空字符串。`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `从以下PDF文本提取字段：\n${pdfText}` },
      ],
    }),
  });

  if (!response.ok) {
    console.error('LLM API 错误:', response.status, await response.text());
    return emptyFields;
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '{}';

  try {
    // 提取 JSON 块（防止 LLM 返回 markdown 代码块）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const extracted = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    return Object.fromEntries(REQUIRED_FIELDS.map(f => [f, String(extracted[f] || '')]));
  } catch {
    console.error('JSON 解析失败:', content);
    return emptyFields;
  }
}

function mapFields(data: Record<string, string>[], pdfFilename: string): Record<string, string>[] {
  return data.map(item => {
    const mapped: Record<string, string> = { "原PDF名称": pdfFilename };
    for (const [k, v] of Object.entries(item)) {
      mapped[FIELD_MAPPING[k] || k] = v;
    }
    return mapped;
  });
}

function formatCurrency(value: string): string {
  const num = parseFloat(value.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return value;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mergeCellsForGroup(worksheet: ExcelJS.Worksheet, startRow: number) {
  worksheet.mergeCells(`A${startRow}:A${startRow + 4}`);
  worksheet.mergeCells(`C${startRow}:C${startRow + 4}`);
  worksheet.mergeCells(`D${startRow}:D${startRow + 4}`);
  worksheet.mergeCells(`E${startRow}:E${startRow + 4}`);
  worksheet.mergeCells(`F${startRow}:F${startRow + 2}`);
  worksheet.mergeCells(`F${startRow + 3}:F${startRow + 4}`);
  worksheet.mergeCells(`G${startRow}:G${startRow + 4}`);
  worksheet.mergeCells(`H${startRow}:H${startRow + 4}`);
  worksheet.mergeCells(`I${startRow}:I${startRow + 4}`);
  worksheet.mergeCells(`J${startRow}:J${startRow + 1}`);
}

async function fillDataToSheet(worksheet: ExcelJS.Worksheet, data: Record<string, string>[], startIdx = 0) {
  for (let idx = 0; idx < data.length; idx++) {
    const item = data[idx];
    const startRow = 2 + (startIdx + idx) * 6;
    const seqNum = startIdx + idx + 1;

    let po = String(item["PO"] || "");
    let style_code = String(item["style code"] || "");
    let color_code = String(item["color code"] || "");
    let sell = String(item["sell"] || "");
    let total = String(item["total"] || "");

    if (po.startsWith("PO#")) po = po.slice(3);
    if (style_code.startsWith("style code#")) style_code = style_code.slice(11);
    if (color_code.startsWith("color code#")) color_code = color_code.slice(11);
    if (sell.startsWith("GBP")) sell = sell.slice(3);
    if (total.startsWith("¥") || total.startsWith("$")) total = total.slice(1);

    if (po) po = `PO#${po}`;
    if (style_code) style_code = `style code#${style_code}`;
    if (color_code) color_code = `color code#${color_code}`;
    if (sell) sell = `GBP${sell}`;
    if (total) total = formatCurrency(total);

    worksheet.getCell(`A${startRow}`).value = seqNum;
    worksheet.getCell(`B${startRow}`).value = po;
    worksheet.getCell(`C${startRow}`).value = String(item["style no"] || "");
    worksheet.getCell(`D${startRow}`).value = String(item["style name"] || "");
    worksheet.getCell(`E${startRow}`).value = String(item["color"] || "");
    worksheet.getCell(`F${startRow}`).value = String(item["unit price"] || "");
    worksheet.getCell(`G${startRow}`).value = String(item["quantity"] || "");
    worksheet.getCell(`H${startRow}`).value = total;
    worksheet.getCell(`I${startRow}`).value = "";
    worksheet.getCell(`J${startRow}`).value = String(item["Ex-date"] || "");
    worksheet.getCell(`K${startRow}`).value = String(item["原PDF名称"] || "");
    worksheet.getCell(`B${startRow + 1}`).value = style_code;
    worksheet.getCell(`B${startRow + 2}`).value = color_code;
    worksheet.getCell(`B${startRow + 3}`).value = "";
    worksheet.getCell(`B${startRow + 4}`).value = sell;

    mergeCellsForGroup(worksheet, startRow);
  }
}

function extractExistingData(worksheet: ExcelJS.Worksheet): [number, Record<string, string>][] {
  const result: [number, Record<string, string>][] = [];
  let rowIdx = 2;
  while (rowIdx <= worksheet.rowCount) {
    const seqCell = worksheet.getCell(`A${rowIdx}`);
    if (!seqCell.value || String(seqCell.value).trim() === "") break;
    const item: Record<string, string> = {
      "PO": String(worksheet.getCell(`B${rowIdx}`).value || ""),
      "style no": String(worksheet.getCell(`C${rowIdx}`).value || ""),
      "style name": String(worksheet.getCell(`D${rowIdx}`).value || ""),
      "color": String(worksheet.getCell(`E${rowIdx}`).value || ""),
      "unit price": String(worksheet.getCell(`F${rowIdx}`).value || ""),
      "quantity": String(worksheet.getCell(`G${rowIdx}`).value || ""),
      "total": String(worksheet.getCell(`H${rowIdx}`).value || ""),
      "Ex-date": String(worksheet.getCell(`J${rowIdx}`).value || ""),
      "原PDF名称": String(worksheet.getCell(`K${rowIdx}`).value || ""),
      "style code": String(worksheet.getCell(`B${rowIdx + 1}`).value || ""),
      "color code": String(worksheet.getCell(`B${rowIdx + 2}`).value || ""),
      "sell": String(worksheet.getCell(`B${rowIdx + 4}`).value || ""),
    };
    result.push([Number(seqCell.value), item]);
    rowIdx += 6;
  }
  return result;
}

async function exportToExcel(data: Record<string, string>[], pdfFilename: string): Promise<string> {
  if (!existsSync(EXCEL_TEMP_DIR)) {
    await mkdir(EXCEL_TEMP_DIR, { recursive: true });
  }

  const templatePath = join(process.cwd(), 'projects/pdf-field-extractor/assets/template.xlsx');
  const mappedData = mapFields(data, pdfFilename);
  let workbook: ExcelJS.Workbook;
  let worksheet: ExcelJS.Worksheet;

  if (existsSync(GLOBAL_EXCEL_PATH)) {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(GLOBAL_EXCEL_PATH);
    worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('Sheet1');

    const existingData = extractExistingData(worksheet);
    const newPdfNames = new Set(mappedData.map(i => i["原PDF名称"] || ""));
    const filteredData = existingData
      .filter(([, item]) => !newPdfNames.has(item["原PDF名称"] || ""))
      .map(([, item]) => item);

    const mergedData = [...filteredData, ...mappedData];
    while (worksheet.rowCount > 1) worksheet.spliceRows(2, 1);
    await fillDataToSheet(worksheet, mergedData);
  } else {
    workbook = new ExcelJS.Workbook();
    if (existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
      worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('Sheet1');
      while (worksheet.rowCount > 1) worksheet.spliceRows(2, 1);
    } else {
      worksheet = workbook.addWorksheet('Sheet1');
      ['序号', 'PO', 'style no', 'style name', 'color', 'unit price', 'quantity', 'total', '', 'Ex-date', '原PDF名称']
        .forEach((h, i) => { worksheet.getCell(String.fromCharCode(65 + i) + '1').value = h; });
    }
    await fillDataToSheet(worksheet, mappedData);
  }

  await workbook.xlsx.writeFile(GLOBAL_EXCEL_PATH);
  return GLOBAL_EXCEL_PATH;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    if (file.type !== 'application/pdf') return NextResponse.json({ error: '只支持 PDF 文件' }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: '文件大小不能超过 4MB' }, { status: 400 });

    if (!existsSync(PDF_TEMP_DIR)) await mkdir(PDF_TEMP_DIR, { recursive: true });

    const pdfPath = join(PDF_TEMP_DIR, file.name);
    await writeFile(pdfPath, Buffer.from(await file.arrayBuffer()));

    const pdfText = await parsePDF(pdfPath);
    const extractedFields = await extractFieldsWithLLM(pdfText);
    await exportToExcel([extractedFields], file.name);

    try { await unlink(pdfPath); } catch { /* ignore */ }

    return NextResponse.json({ success: true, filename: file.name, fields: extractedFields });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('PDF 解析错误:', msg);
    return NextResponse.json({ error: 'PDF 解析失败: ' + msg }, { status: 500 });
  }
}
