import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

const execAsync = promisify(exec);

// 全局 Excel 文件路径
const GLOBAL_EXCEL_PATH = '/tmp/extracted/all_data.xlsx';

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

// 解析 PDF 并提取文本
async function parsePDF(filePath: string): Promise<string> {
  const scriptPath = '/workspace/projects/projects/pdf-field-extractor/scripts/parse_pdf.py';
  const { stdout, stderr } = await execAsync(`python3 ${scriptPath} "${filePath}"`);

  if (stderr && !stdout) {
    throw new Error(`PDF 解析失败: ${stderr}`);
  }

  return stdout;
}

// 使用 LLM 提取字段
async function extractFieldsWithLLM(pdfText: string): Promise<any> {
  try {
    const config = new Config();
    const client = new LLMClient(config);

    // 构建系统提示，明确告诉 LLM 需要提取的字段和格式
    const systemPrompt = `你是一个专业的 PDF 字段提取助手。你的任务是从 PDF 文本内容中提取特定的业务字段。

请从提供的文本中提取以下字段，并以 JSON 格式返回：
- Article（产品编号）
- Order Reference（订单参考号）
- Colour Name（颜色名称）
- GBP Retail Price（英镑零售价）
- Collection（系列/集合）
- Design Number（设计编号）
- Ex Port Date（出口日期）
- Total（总额）
- Unit Price（单价）
- Line Value（行金额）
- Product Name（产品名称）

注意事项：
1. 只返回纯 JSON 格式，不要包含任何其他解释或说明
2. 如果某个字段在文本中找不到，将其值设为空字符串 ""
3. 字段名称必须完全匹配上面的列表
4. 仔细分析文本内容，特别是表格数据
5. 可能的变体和同义词也要考虑

返回格式示例：
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

    const userMessage = `请从以下 PDF 文本内容中提取指定的业务字段：

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

    // 解析 LLM 返回的 JSON
    const extractedFields = JSON.parse(response.content);

    // 确保所有必需字段都存在
    const fields: any = {};
    for (const field of REQUIRED_FIELDS) {
      fields[field] = extractedFields[field] || '';
    }

    return fields;
  } catch (error) {
    console.error('LLM 字段提取错误:', error);

    // 如果 LLM 失败，返回空对象
    const fields: any = {};
    for (const field of REQUIRED_FIELDS) {
      fields[field] = '';
    }
    return fields;
  }
}

// 导出 Excel（追加到全局 Excel 文件）
async function exportToExcel(data: any[], pdfFilename: string): Promise<string> {
  const jsonDataPath = join('/tmp/extracted', `temp_${pdfFilename}_${Date.now()}.json`);
  const templatePath = '/workspace/projects/projects/pdf-field-extractor/assets/template.xlsx';

  // 确保 PDF 文件名在数据中
  const dataWithFilename = data.map(item => ({
    ...item,
    "原PDF名称": pdfFilename
  }));

  // 写入临时 JSON 文件
  await writeFile(jsonDataPath, JSON.stringify(dataWithFilename, null, 2), 'utf-8');

  // 调用导出脚本（使用增量更新，所有数据合并到全局 Excel）
  const scriptPath = '/workspace/projects/projects/pdf-field-extractor/scripts/export_to_excel.py';
  const { stdout, stderr } = await execAsync(
    `python3 ${scriptPath} "${jsonDataPath}" "${templatePath}" "${GLOBAL_EXCEL_PATH}"`
  );

  if (stderr && !stdout) {
    throw new Error(`Excel 导出失败: ${stderr}`);
  }

  // 清理临时 JSON 文件
  try {
    await unlink(jsonDataPath);
  } catch (error) {
    console.error('清理临时 JSON 文件失败:', error);
  }

  return GLOBAL_EXCEL_PATH;
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
    const pdfPath = join('/tmp/pdfs', filename);

    await writeFile(pdfPath, buffer);

    // 步骤 1: 解析 PDF
    const pdfText = await parsePDF(pdfPath);

    // 步骤 2: 提取字段（使用 LLM）
    const extractedFields = await extractFieldsWithLLM(pdfText);

    // 步骤 3: 导出 Excel（追加到全局 Excel 文件）
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
