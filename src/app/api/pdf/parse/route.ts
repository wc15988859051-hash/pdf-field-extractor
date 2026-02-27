import { NextRequest, NextResponse } from 'next/server';

// 动态导入pdf-parse
const pdfParseLib = require('pdf-parse');
const pdfParse = pdfParseLib.PDFParse;

// 字段映射关系
const FIELD_MAPPING = {
  'Article': 'color code',
  'Order Reference': 'PO',
  'Colour Name': 'color',
  'GBP Retail Price': 'sell',
  'Collection': 'style no',
  'Design Number': 'style code',
  'Ex Port Date': 'Ex-date',
  'Total': 'quantity',
  'Unit Price': 'unit price',
  'Line Value': 'total',
  'Product Name': 'style name',
};

// 需要提取的PDF字段
const PDF_FIELDS = Object.keys(FIELD_MAPPING);

// 提取字段的函数
function extractField(text: string, fieldName: string): string | null {
  // 尝试多种模式来匹配字段
  const patterns = [
    // 模式1: "FieldName: value"
    new RegExp(`${fieldName}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\w+\\s*:|$)`, 'i'),
    // 模式2: "FieldName value"
    new RegExp(`${fieldName}\\s+([\\s\\S]*?)(?=\\n\\s*\\w+\\s*:|\\n\\s*\\w+\\s+|$)`, 'i'),
    // 模式3: 换行后的字段值
    new RegExp(`${fieldName}\\s*\\n\\s*([\\s\\S]*?)(?=\\n\\s*\\w+|$)`, 'i'),
    // 模式4: 带冒号和换行
    new RegExp(`${fieldName}\\s*:\\s*\\n\\s*([\\s\\S]*?)(?=\\n\\s*\\w+\\s*[:\\n]|$)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // 清理提取的值
      const value = match[1].trim();
      // 移除多余的空行
      const cleanedValue = value.split('\n')[0].trim();
      if (cleanedValue && cleanedValue.length > 0) {
        return cleanedValue;
      }
    }
  }

  return null;
}

// 增强的字段提取函数，支持更复杂的PDF结构
function extractFieldsFromPDF(text: string): Record<string, string> {
  const extractedFields: Record<string, string> = {};
  
  // 统一文本格式
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 为每个字段尝试提取
  for (const fieldName of PDF_FIELDS) {
    const value = extractField(normalizedText, fieldName);
    if (value) {
      extractedFields[fieldName] = value;
    }
  }

  // 如果某些字段没有提取到，尝试备用方法
  const backupExtracted = extractFieldsWithBackup(normalizedText);
  
  // 合并结果
  Object.assign(extractedFields, backupExtracted);

  return extractedFields;
}

// 备用提取方法 - 基于行分析
function extractFieldsWithBackup(text: string): Record<string, string> {
  const extractedFields: Record<string, string> = {};
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  // 寻找包含字段名称的行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const fieldName of PDF_FIELDS) {
      if (extractedFields[fieldName]) continue; // 已经提取过就跳过

      // 检查行是否包含字段名称
      const fieldPattern = new RegExp(`${fieldName}\\s*[:\\-]?`, 'i');
      if (fieldPattern.test(line)) {
        // 提取冒号后的值
        const colonMatch = line.match(/[:\\-]\s*(.+)/);
        if (colonMatch) {
          const value = colonMatch[1].trim();
          if (value && value.length > 0) {
            extractedFields[fieldName] = value;
          }
        }
        // 如果没有冒号，尝试下一行
        else if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          // 检查下一行是否是另一个字段的开始
          const isNextField = PDF_FIELDS.some(f => 
            new RegExp(`${f}\\s*[:\\-]?`, 'i').test(nextLine)
          );
          
          if (!isNextField) {
            extractedFields[fieldName] = nextLine;
          }
        }
      }
    }
  }

  return extractedFields;
}

export async function POST(request: NextRequest) {
  try {
    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未找到上传的文件' },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: '只支持PDF文件' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 解析PDF
    const data = await pdfParse(buffer);
    const pdfText = data.text;

    // 提取字段
    const extractedPDFFields = extractFieldsFromPDF(pdfText);

    // 映射到表格字段
    const mappedFields: Record<string, string> = {};
    for (const [pdfField, tableField] of Object.entries(FIELD_MAPPING)) {
      if (extractedPDFFields[pdfField]) {
        mappedFields[tableField] = extractedPDFFields[pdfField];
      }
    }

    return NextResponse.json({
      success: true,
      extractedFields: extractedPDFFields,
      mappedFields: mappedFields,
    });
  } catch (error) {
    console.error('PDF解析错误:', error);
    return NextResponse.json(
      { 
        error: 'PDF解析失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
