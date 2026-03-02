// Vercel 兼容的 PDF 解析 API
// 使用纯 JavaScript 实现（pdf-parse + xlsx）

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
// @ts-ignore - pdf-parse 可能没有类型定义
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';

// 全局数据存储（Vercel 无服务器环境）
// 注意：每次请求会清空，如需持久化需要使用 Vercel KV 或外部数据库
let globalExtractedData: any[] = [];

// 解析 PDF
async function parsePDF(fileBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(fileBuffer);
    console.log('PDF 解析成功，文本长度:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('PDF 解析失败:', error);
    throw new Error('PDF 解析失败');
  }
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

    const response = await client.invoke(messages, {
      model: "doubao-seed-1-8-251228",
      temperature: 0.3,
    });

    console.log('LLM 原始返回:', response.content);

    const extractedFields = JSON.parse(response.content);

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

// 格式化金额为美元格式
function formatCurrency(value: string): string {
  if (!value) return '';
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(num);
}

// 添加字段前缀
function addPrefixes(fields: any): any {
  return {
    ...fields,
    'Order Reference': fields['Order Reference'] ? `PO#${fields['Order Reference']}` : '',
    'Collection': fields['Collection'] ? `style code#${fields['Collection']}` : '',
    'Colour Name': fields['Colour Name'] ? `color code#${fields['Colour Name']}` : '',
    'GBP Retail Price': fields['GBP Retail Price'] ? `GBP${fields['GBP Retail Price']}` : '',
    'Total': formatCurrency(fields['Total']),
    'Line Value': formatCurrency(fields['Line Value']),
  };
}

// 生成 Excel 文件
function generateExcel(data: any[]): Buffer {
  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 设置列宽
    const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');

    // 生成 Buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    console.log('Excel 生成成功，数据行数:', data.length);
    return buffer;
  } catch (error) {
    console.error('Excel 生成失败:', error);
    throw new Error('Excel 生成失败');
  }
}

// POST 路由：解析 PDF
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

    // 检查文件大小（限制 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 });
    }

    console.log(`开始处理文件: ${file.name}, 大小: ${file.size} bytes`);

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 步骤 1: 解析 PDF
    console.log('步骤 1/3: 解析 PDF...');
    const pdfText = await parsePDF(buffer);

    if (!pdfText || pdfText.length < 10) {
      throw new Error('PDF 内容为空或无法解析');
    }

    // 步骤 2: 提取字段（使用 LLM）
    console.log('步骤 2/3: 使用 LLM 提取字段...');
    const extractedFields = await extractFieldsWithLLM(pdfText);

    // 步骤 3: 添加前缀并格式化
    console.log('步骤 3/3: 格式化字段...');
    const formattedFields = addPrefixes(extractedFields);

    // 添加 PDF 文件名
    formattedFields['原PDF名称'] = file.name;

    // 添加到全局数据
    globalExtractedData.push(formattedFields);

    console.log('处理完成，总数据行数:', globalExtractedData.length);

    return NextResponse.json({
      success: true,
      filename: file.name,
      fields: formattedFields,
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

// GET 路由：获取所有数据
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: globalExtractedData,
      count: globalExtractedData.length
    });
  } catch (error) {
    console.error('获取数据失败:', error);
    return NextResponse.json(
      { error: '获取数据失败' },
      { status: 500 }
    );
  }
}

// DELETE 路由：清空数据
export async function DELETE(request: NextRequest) {
  try {
    globalExtractedData = [];
    return NextResponse.json({
      success: true,
      message: '数据已清空'
    });
  } catch (error) {
    console.error('清空数据失败:', error);
    return NextResponse.json(
      { error: '清空数据失败' },
      { status: 500 }
    );
  }
}

// 导出配置
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
    responseLimit: '8mb',
  },
};
