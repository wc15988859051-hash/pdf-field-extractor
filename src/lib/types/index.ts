/**
 * 类型定义文件
 * 定义项目中使用的所有 TypeScript 类型
 */

/**
 * 提取的字段
 */
export interface ExtractedField {
  fieldName: string;
  fieldValue: string;
}

/**
 * PDF 文件状态
 */
export type PDFFileStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * PDF 文件信息
 */
export interface PDFFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  extractedFields: ExtractedField[];
  status: PDFFileStatus;
  errorMessage?: string;
}

/**
 * 历史记录
 */
export interface HistoryRecord {
  filename: string;
  uploadTime: string; // ISO 格式的时间字符串
  status: 'completed' | 'error';
}

/**
 * LLM 提取的原始字段
 */
export interface ExtractedRawFields {
  Article: string;
  'Order Reference': string;
  'Colour Name': string;
  'GBP Retail Price': string;
  Collection: string;
  'Design Number': string;
  'Ex Port Date': string;
  Total: string;
  'Unit Price': string;
  'Line Value': string;
  'Product Name': string;
}

/**
 * Excel 导出的数据项
 */
export interface ExcelDataItem {
  'Article': string;
  'Order Reference': string;
  'Colour Name': string;
  'GBP Retail Price': string;
  Collection: string;
  'Design Number': string;
  'Ex Port Date': string;
  Total: string;
  'Unit Price': string;
  'Line Value': string;
  'Product Name': string;
  '原PDF名称': string;
}

/**
 * PDF 解析结果
 */
export interface PDFParseResult {
  total_pages: number;
  pages: Array<{
    page_num: number;
    text: string;
    tables: Array<{
      table_num: number;
      headers: string[];
      rows: string[][];
    }>;
  }>;
}

/**
 * Excel 导出结果
 */
export interface ExcelExportResult {
  success: boolean;
  filePath: string;
  itemCount: number;
  totalRows: number;
}
