import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
const pdf = require('pdf-parse');
import ExcelJS from 'exceljs';

// 全局 Excel 文件路径
const GLOBAL_EXCEL_PATH = '/tmp/extracted/all_data.xlsx';

// PDF 临时文件目录
const PDF_TEMP_DIR = '/tmp/pdfs';

// Excel 临时目录
const EXCEL_TEMP_DIR = '/tmp/extracted';

// 需要提取的字段列表
const REQUIRED_FIELDS = [
  'Article',
  'Order Reference',
  'Colour Name',
  'GBP Retail Price',
  'Collection',
  'Design Number',
  'Ex Port Date',
  'Total',
  'Unit Price',
  'Line Value',
  'Product Name'
];

// 字段映射关系：原字段名 → 新字段名
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

// 解析 PDF 并提取文本（Node.js 版本）
async function parsePDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF 解析错误:', error);
    throw new Error(`PDF 解析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 使用 LLM 提取字段
async function extractFieldsWithLLM(pdfText: string): Promise<any> {
  try {
    const config = new Config();
    const client = new LLMClient(config);

    // 构建系统提示，明确告诉 LLM 需要提取的字段和格式
    const systemPrompt = `你是一个专业的 PDF 字段提取助手。你的任务是从 PDF 文本内容中提取特定的业务字段。

请从提供的文本中提取以下字段，并以严格的 JSON 格式返回：

必需字段列表：
1. Article - 产品编号/货号
2. Order Reference - 订单参考号/订单号
3. Colour Name - 颜色名称
4. GBP Retail Price - 英镑零售价
5. Collection - 系列/集合/款式编号
6. Design Number - 设计编号
7. Ex Port Date - 出口日期
8. Total - 总额/总数量（重要：这对应 Excel 的 quantity 列，表示数量）
9. Unit Price - 单价（重要：这对应 Excel 的 unit price 列）
10. Line Value - 行金额/总金额（重要：这对应 Excel 的 amount 列，表示金额值）
11. Product Name - 产品名称

重要注意事项：
1. 必须识别 Total（总额/数量）和 Line Value（行金额/金额值）这两个不同的字段
2. Total 通常表示数量，Line Value 通常表示金额
3. 如果字段名称有变体，请根据上下文判断：
   - Total 可能显示为：Total、Quantity、数量、总数
   - Line Value 可能显示为：Line Value、Amount、金额、总价、总金额
4. 只返回纯 JSON 格式，不要包含任何其他解释或说明
5. 如果某个字段在文本中找不到，将其值设为空字符串 ""
6. 字段名称必须完全匹配上面的列表
7. 仔细分析文本内容，特别是表格数据
8. 返回的 JSON 必须是有效的 JSON 格式

返回格式示例（不要包含其他文字）：
{
  "Article": "值",
  "Order Reference": "值",
  "Colour Name": "值",
  "GBP Retail Price": "值",
  "Collection": "值",
  "Design Number": "值",
  "Ex Port Date": "值",
  "Total": "值",
  "Unit Price": "值",
  "Line Value": "值",
  "Product Name": "值"
}`;

    const userMessage = `请从以下 PDF 文本内容中提取指定的业务字段。仔细分析表格数据和字段名称的变体。

PDF 文本内容：
${pdfText}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userMessage },
    ];

    // 使用 LLM 提取字段
    const response = await client.invoke(messages, {
      model: "doubao-seed-1-8-251228",
      temperature: 0.3, // 使用较低的温度以确保准确性
    });

    console.log('LLM 原始返回:', response.content);

    // 解析 LLM 返回的 JSON
    const extractedFields = JSON.parse(response.content);

    console.log('解析后的字段:', JSON.stringify(extractedFields, null, 2));

    // 确保所有必需字段都存在
    const fields: any = {};
    for (const field of REQUIRED_FIELDS) {
      fields[field] = extractedFields[field] || '';
      if (!fields[field]) {
        console.warn(`警告: 字段 ${field} 提取为空`);
      }
    }

    return fields;
  } catch (error) {
    console.error('LLM 字段提取错误:', error);
    console.error('错误详情:', error instanceof Error ? error.stack : String(error));

    // 如果 LLM 失败，返回空对象
    const fields: any = {};
    for (const field of REQUIRED_FIELDS) {
      fields[field] = '';
    }
    return fields;
  }
}

// 字段映射
function mapFields(data: any[], pdfFilename?: string): any[] {
  const mappedData = [];
  for (const item of data) {
    const mappedItem: any = {};
    for (const [oldKey, value] of Object.entries(item)) {
      const newKey = FIELD_MAPPING[oldKey] || oldKey;
      mappedItem[newKey] = value;
    }
    if (pdfFilename) {
      mappedItem["原PDF名称"] = pdfFilename;
    }
    mappedData.push(mappedItem);
  }
  return mappedData;
}

// 格式化金额为美元格式
function formatCurrency(value: string): string {
  if (!value) return '';
  
  // 移除非数字字符，保留小数点
  const numericPart = value.replace(/[^\d.]/g, '');
  if (!numericPart) return `$${value}`;
  
  try {
    const amountFloat = parseFloat(numericPart);
    // 格式化为：$55,345.00
    return `$${amountFloat.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  } catch {
    return `$${value}`;
  }
}

// 合并单元格
function mergeCellsForGroup(worksheet: ExcelJS.Worksheet, startRow: number) {
  // 序号（列 1）：合并 5 行
  worksheet.mergeCells(`A${startRow}:A${startRow + 4}`);

  // style no（列 3）：合并 5 行
  worksheet.mergeCells(`C${startRow}:C${startRow + 4}`);

  // style name（列 4）：合并 5 行
  worksheet.mergeCells(`D${startRow}:D${startRow + 4}`);

  // color（列 5）：合并 5 行
  worksheet.mergeCells(`E${startRow}:E${startRow + 4}`);

  // unit price（列 6）：前 3 行合并（行 1-3）
  worksheet.mergeCells(`F${startRow}:F${startRow + 2}`);
  // unit price（列 6）：后 2 行合并（行 4-5）
  worksheet.mergeCells(`F${startRow + 3}:F${startRow + 4}`);

  // quantity（列 7）：合并 5 行
  worksheet.mergeCells(`G${startRow}:G${startRow + 4}`);

  // amount（列 8）：合并 5 行
  worksheet.mergeCells(`H${startRow}:H${startRow + 4}`);

  // amount after discount（列 9）：合并 5 行
  worksheet.mergeCells(`I${startRow}:I${startRow + 4}`);

  // delivery（列 10）：合并前 2 行（行 1-2）
  worksheet.mergeCells(`J${startRow}:J${startRow + 1}`);
}

// 填充数据到工作表
async function fillDataToSheet(worksheet: ExcelJS.Worksheet, data: any[], startIdx: number = 0) {
  for (let idx = 0; idx < data.length; idx++) {
    const item = data[idx];
    const startRow = 2 + ((startIdx + idx) * 6);
    const seqNum = startIdx + idx + 1;

    // 获取数据值
    let po = String(item["PO"] || "");
    const style_no = String(item["style no"] || "");
    const style_name = String(item["style name"] || "");
    const color = String(item["color"] || "");
    const unit_price = String(item["unit price"] || "");
    const quantity = String(item["quantity"] || "");
    let total = String(item["total"] || "");
    const ex_date = String(item["Ex-date"] || "");
    let style_code = String(item["style code"] || "");
    let color_code = String(item["color code"] || "");
    let sell = String(item["sell"] || "");
    const pdf_name = String(item["原PDF名称"] || "");

    // 清理已存在的前缀（避免重复添加）
    if (po.startsWith("PO#")) po = po.slice(3);
    if (style_code.startsWith("style code#")) style_code = style_code.slice(11);
    if (color_code.startsWith("color code#")) color_code = color_code.slice(11);
    if (sell.startsWith("GBP")) sell = sell.slice(3);
    if (total.startsWith("¥") || total.startsWith("$")) total = total.slice(1);

    // 添加前缀（仅当值非空时）
    if (po) po = `PO#${po}`;
    if (style_code) style_code = `style code#${style_code}`;
    if (color_code) color_code = `color code#${color_code}`;
    if (sell) sell = `GBP${sell}`;
    if (total) total = formatCurrency(total);

    // 填充第 1 行
    worksheet.getCell(`A${startRow}`).value = seqNum;
    worksheet.getCell(`B${startRow}`).value = po;
    worksheet.getCell(`C${startRow}`).value = style_no;
    worksheet.getCell(`D${startRow}`).value = style_name;
    worksheet.getCell(`E${startRow}`).value = color;
    worksheet.getCell(`F${startRow}`).value = unit_price;
    worksheet.getCell(`G${startRow}`).value = quantity;
    worksheet.getCell(`H${startRow}`).value = total;
    worksheet.getCell(`I${startRow}`).value = "";
    worksheet.getCell(`J${startRow}`).value = ex_date;
    worksheet.getCell(`K${startRow}`).value = pdf_name;

    // 填充第 2 行（style code）
    worksheet.getCell(`B${startRow + 1}`).value = style_code;

    // 填充第 3 行（color code）
    worksheet.getCell(`B${startRow + 2}`).value = color_code;

    // 填充第 4 行（空行）
    worksheet.getCell(`B${startRow + 3}`).value = "";

    // 填充第 5 行（sell）
    worksheet.getCell(`B${startRow + 4}`).value = sell;

    // 合并单元格
    mergeCellsForGroup(worksheet, startRow);
  }
}

// 提取现有数据
function extractExistingData(worksheet: ExcelJS.Worksheet): [number, any][] {
  const existingData: [number, any][] = [];
  let rowIdx = 2;

  while (rowIdx <= worksheet.rowCount) {
    const seqCell = worksheet.getCell(`A${rowIdx}`);
    if (!seqCell.value || String(seqCell.value).trim() === "") break;

    const item: any = {
      "序号": seqCell.value,
      "PO": worksheet.getCell(`B${rowIdx}`).value || "",
      "style no": worksheet.getCell(`C${rowIdx}`).value || "",
      "style name": worksheet.getCell(`D${rowIdx}`).value || "",
      "color": worksheet.getCell(`E${rowIdx}`).value || "",
      "unit price": worksheet.getCell(`F${rowIdx}`).value || "",
      "quantity": worksheet.getCell(`G${rowIdx}`).value || "",
      "total": worksheet.getCell(`H${rowIdx}`).value || "",
      "Ex-date": worksheet.getCell(`J${rowIdx}`).value || "",
      "原PDF名称": worksheet.getCell(`K${rowIdx}`).value || "",
    };

    item["style code"] = worksheet.getCell(`B${rowIdx + 1}`).value || "";
    item["color code"] = worksheet.getCell(`B${rowIdx + 2}`).value || "";
    item["sell"] = worksheet.getCell(`B${rowIdx + 4}`).value || "";

    existingData.push([Number(item["序号"]), item]);
    rowIdx += 6;
  }

  return existingData;
}

// 导出 Excel（Node.js 版本）
async function exportToExcel(data: any[], pdfFilename: string): Promise<string> {
  // 确保目录存在
  if (!existsSync(EXCEL_TEMP_DIR)) {
    await mkdir(EXCEL_TEMP_DIR, { recursive: true });
    console.log(`创建 Excel 导出目录: ${EXCEL_TEMP_DIR}`);
  }

  const templatePath = '/workspace/projects/projects/pdf-field-extractor/assets/template.xlsx';
  const outputPath = GLOBAL_EXCEL_PATH;

  // 字段映射并添加文件名
  const dataWithFilename = data.map(item => ({
    ...item,
    "原PDF名称": pdfFilename
  }));

  const mappedData = mapFields(dataWithFilename, pdfFilename);

  let workbook: ExcelJS.Workbook;
  let worksheet: ExcelJS.Worksheet;

  // 检查 Excel 文件是否存在
  if (existsSync(outputPath)) {
    console.log(`Excel 文件已存在，执行增量更新: ${outputPath}`);
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(outputPath);
    worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('Sheet1');

    // 提取现有数据
    const existingData = extractExistingData(worksheet);
    console.log(`现有数据: ${existingData.length} 组`);

    // 获取新数据的 PDF 文件名集合
    const newPdfNames = new Set(mappedData.map(item => item["原PDF名称"] || ""));

    // 过滤掉与新数据 PDF 文件名相同的旧数据
    const filteredData = existingData
      .filter(([_, item]) => !newPdfNames.has(item["原PDF名称"] || ""))
      .map(([_, item]) => item);

    const removedCount = existingData.length - filteredData.length;
    if (removedCount > 0) {
      console.log(`删除了 ${removedCount} 组重复数据`);
    }

    // 合并数据
    const mergedData = [...filteredData, ...mappedData];

    // 清空工作表数据（保留表头）
    while (worksheet.rowCount > 1) {
      worksheet.spliceRows(2, 1);
    }

    // 重新填充所有数据
    await fillDataToSheet(worksheet, mergedData);
    console.log(`Excel 文件已成功更新: ${outputPath}`);
    console.log(`当前共有 ${mergedData.length} 组数据`);
  } else {
    console.log(`Excel 文件不存在，基于模板创建: ${outputPath}`);
    workbook = new ExcelJS.Workbook();
    
    if (existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
      worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('Sheet1');
      
      // 清空模板中的示例数据
      while (worksheet.rowCount > 1) {
        worksheet.spliceRows(2, 1);
      }
    } else {
      worksheet = workbook.addWorksheet('Sheet1');
      // 创建简单表头
      const headers = ['序号', 'PO', 'style no', 'style name', 'color', 'unit price', 'quantity', 'total', '', 'Ex-date', '原PDF名称'];
      headers.forEach((header, idx) => {
        worksheet.getCell(String.fromCharCode(65 + idx) + '1').value = header;
      });
    }

    // 填充数据
    await fillDataToSheet(worksheet, mappedData);
    console.log(`Excel 文件已成功导出到: ${outputPath}`);
    console.log(`共填充 ${mappedData.length} 组数据`);
  }

  // 保存 Excel 文件
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: '只支持 PDF 文件' }, { status: 400 });
    }

    // 提取并转发请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 保存上传的文件到临时目录
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = file.name;
    const pdfPath = join(PDF_TEMP_DIR, filename);

    // 确保临时目录存在
    if (!existsSync(PDF_TEMP_DIR)) {
      await mkdir(PDF_TEMP_DIR, { recursive: true });
      console.log(`创建临时目录: ${PDF_TEMP_DIR}`);
    }

    await writeFile(pdfPath, buffer);
    console.log(`文件已保存到: ${pdfPath}`);

    // 步骤 1: 解析 PDF（Node.js 版本）
    const pdfText = await parsePDF(pdfPath);

    // 步骤 2: 提取字段（使用 LLM）
    const extractedFields = await extractFieldsWithLLM(pdfText);

    // 步骤 3: 导出 Excel（Node.js 版本）
    await exportToExcel([extractedFields], filename);

    // 清理临时 PDF 文件
    try {
      await unlink(pdfPath);
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }

    return NextResponse.json({
      success: true,
      filename: filename,
      fields: extractedFields,
      message: 'PDF 解析成功，字段已提取并追加到全局 Excel 文件'
    });

  } catch (error) {
    console.error('PDF 解析错误:', error);
    return NextResponse.json(
      { error: 'PDF 解析失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
