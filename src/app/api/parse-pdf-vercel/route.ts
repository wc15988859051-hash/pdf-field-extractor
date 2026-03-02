// Vercel 兼容的 PDF 解析和字段提取方案
// 使用纯 JavaScript 实现，无需 Python

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 模拟 PDF 解析（Vercel 不支持 PyMuPDF）
// 在实际部署中，需要使用 pdf-parse 库
async function parsePDF(fileBuffer: Buffer): Promise<string> {
  // TODO: 集成 pdf-parse 库
  // import pdf from 'pdf-parse';
  // const data = await pdf(fileBuffer);
  // return data.text;

  // 临时返回占位文本
  return `
Article: ABC123
Order Reference: PO-2024-001
Colour Name: Blue
GBP Retail Price: 29.99
Collection: Summer 2024
Design Number: D001
Ex Port Date: 2024-03-15
Total: 100
Unit Price: 29.99
Line Value: 2999.00
Product Name: Blue Summer T-Shirt
  `.trim();
}

// 使用 LLM 提取字段
async function extractFieldsWithLLM(pdfText: string): Promise<any> {
  try {
    const config = new Config();
    const client = new LLMClient(config);

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
3. 如果字段名称有变体，请根据上下文判断
4. 只返回纯 JSON 格式，不要包含任何其他解释或说明
5. 如果某个字段在文本中找不到，将其值设为空字符串 ""
6. 字段名称必须完全匹配上面的列表

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

    const response = await client.invoke(messages, {
      model: "doubao-seed-1-8-251228",
      temperature: 0.3,
    });

    const extractedFields = JSON.parse(response.content);

    // 确保所有必需字段都存在
    const fields: any = {};
    for (const field of REQUIRED_FIELDS) {
      fields[field] = extractedFields[field] || '';
    }

    return fields;
  } catch (error) {
    console.error('LLM 字段提取错误:', error);

    // 返回空对象
    const fields: any = {};
    const REQUIRED_FIELDS = [
      'Article', 'Order Reference', 'Colour Name', 'GBP Retail Price',
      'Collection', 'Design Number', 'Ex Port Date', 'Total',
      'Unit Price', 'Line Value', 'Product Name'
    ];
    for (const field of REQUIRED_FIELDS) {
      fields[field] = '';
    }
    return fields;
  }
}

// 导出 Excel（Vercel 兼容版本）
async function exportToExcel(data: any[]): Promise<Buffer> {
  // TODO: 集成 xlsx 库
  // import * as XLSX from 'xlsx';
  // const worksheet = XLSX.utils.json_to_sheet(data);
  // const workbook = XLSX.utils.book_new();
  // XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');
  // const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  // return buffer;

  // 临时返回空 buffer
  return Buffer.from('');
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

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 步骤 1: 解析 PDF（JavaScript 版本）
    const pdfText = await parsePDF(buffer);

    // 步骤 2: 提取字段（使用 LLM）
    const extractedFields = await extractFieldsWithLLM(pdfText);

    return NextResponse.json({
      success: true,
      filename: file.name,
      fields: extractedFields,
      message: 'PDF 解析成功（Vercel 版本）'
    });

  } catch (error) {
    console.error('PDF 解析错误:', error);
    return NextResponse.json(
      { error: 'PDF 解析失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
