/**
 * 字段映射配置文件
 * 定义 PDF 原始字段到 Excel 目标字段的映射关系
 */

/**
 * PDF 原始字段 → Excel 目标字段映射
 */
export const FIELD_MAPPING: Record<string, string> = {
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
} as const;

/**
 * 需要从 PDF 提取的字段列表
 */
export const REQUIRED_FIELDS = [
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
  'Product Name',
] as const;

/**
 * 字段显示名称（用于前端展示）
 */
export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  'Article': '产品编号',
  'Order Reference': '订单参考号',
  'Colour Name': '颜色名称',
  'GBP Retail Price': '英镑零售价',
  'Collection': '系列/集合',
  'Design Number': '设计编号',
  'Ex Port Date': '出口日期',
  'Total': '总额/数量',
  'Unit Price': '单价',
  'Line Value': '行金额',
  'Product Name': '产品名称',
};

/**
 * 需要添加前缀的字段
 */
export const FIELDS_WITH_PREFIX = {
  PO: 'PO',
  STYLE_CODE: 'style code',
  COLOR_CODE: 'color code',
  SELL: 'sell',
  TOTAL: 'total',
} as const;

/**
 * 金额格式化字段
 */
export const AMOUNT_FIELDS = ['total'] as const;

/**
 * 获取字段的 Excel 目标名称
 * @param fieldName PDF 原始字段名
 * @returns Excel 目标字段名
 */
export function getExcelFieldName(fieldName: string): string {
  return FIELD_MAPPING[fieldName] || fieldName;
}

/**
 * 检查字段是否需要添加前缀
 * @param excelFieldName Excel 目标字段名
 * @returns 是否需要前缀
 */
export function needsPrefix(excelFieldName: string): boolean {
  const prefixFields = Object.values(FIELDS_WITH_PREFIX) as string[];
  return prefixFields.includes(excelFieldName);
}

/**
 * 获取字段的前缀
 * @param excelFieldName Excel 目标字段名
 * @returns 前缀字符串
 */
export function getFieldPrefix(excelFieldName: string): string {
  const prefixMap: Record<string, string> = {
    'PO': 'PO#',
    'style code': 'style code#',
    'color code': 'color code#',
    'sell': 'GBP',
    'total': '$',
  };
  return prefixMap[excelFieldName] || '';
}
