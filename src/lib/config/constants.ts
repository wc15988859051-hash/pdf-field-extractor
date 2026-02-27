/**
 * 常量配置文件
 * 包含项目中使用的所有常量
 */

// 文件路径常量
export const PATHS = {
  // 临时文件目录
  TEMP_DIR: '/tmp',
  PDF_DIR: '/tmp/pdfs',
  EXTRACTED_DIR: '/tmp/extracted',

  // 全局 Excel 文件路径
  GLOBAL_EXCEL: '/tmp/extracted/all_data.xlsx',

  // Python 脚本路径
  PYTHON_SCRIPTS: {
    PARSE_PDF: '/workspace/projects/src/lib/python/pdf-parser.py',
    EXPORT_EXCEL: '/workspace/projects/src/lib/python/excel-exporter.py',
  },

  // 模板文件路径
  TEMPLATE: '/workspace/projects/projects/pdf-field-extractor/assets/template.xlsx',
} as const;

// LLM 配置
export const LLM_CONFIG = {
  MODEL: 'doubao-seed-1-8-251228',
  TEMPERATURE: 0.3,
} as const;

// 文件大小限制（10MB）
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

// Excel 格式常量
export const EXCEL_FORMAT = {
  DATA_ROW_START: 2, // 数据起始行（第1行是表头）
  ROWS_PER_ITEM: 6,  // 每组数据占 6 行

  // 列索引（从 1 开始）
  COLUMNS: {
    SEQUENCE: 1,      // 序号
    PO: 2,            // PO（Order Reference）
    STYLE_NO: 3,      // 款式编号
    STYLE_NAME: 4,    // 款式名称
    COLOR: 5,         // 颜色
    UNIT_PRICE: 6,    // 单价
    QUANTITY: 7,      // 数量
    TOTAL: 8,         // 总金额
    DISCOUNT: 9,      // 折扣后金额
    DELIVERY: 10,     // 交货期
    PDF_NAME: 11,     // 原PDF名称
  } as const,
} as const;

// 字段值前缀规则
export const FIELD_PREFIXES = {
  PO: 'PO#',
  STYLE_CODE: 'style code#',
  COLOR_CODE: 'color code#',
  SELL: 'GBP',
  TOTAL: '$',
} as const;

// 前缀清理规则（用于避免重复添加）
export const PREFIX_CLEANUP = [
  'PO#',
  'style code#',
  'color code#',
  'GBP',
  '¥',
  '$',
];

// 历史记录配置
export const HISTORY_CONFIG = {
  STORAGE_KEY: 'pdfUploadHistory',
  MAX_RECORDS: 50, // 最多保留 50 条记录
} as const;
