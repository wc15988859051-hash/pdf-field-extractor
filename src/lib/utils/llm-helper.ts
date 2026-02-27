/**
 * LLM 调用工具
 * 封装 LLM 相关的逻辑
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { LLM_CONFIG } from '@/lib/config/constants';
import { REQUIRED_FIELDS } from '@/lib/config/field-mapping';
import type { ExtractedRawFields } from '@/lib/types';

/**
 * 构建 LLM 系统提示
 */
function buildSystemPrompt(): string {
  return `你是一个专业的 PDF 字段提取助手。你的任务是从 PDF 文本内容中提取特定的业务字段。

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
}

/**
 * 使用 LLM 从 PDF 文本中提取字段
 * @param pdfText PDF 文本内容
 * @returns 提取的字段对象
 */
export async function extractFieldsWithLLM(pdfText: string): Promise<ExtractedRawFields> {
  try {
    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = buildSystemPrompt();
    const userMessage = `请从以下 PDF 文本内容中提取指定的业务字段。仔细分析表格数据和字段名称的变体。

PDF 文本内容：
${pdfText}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userMessage },
    ];

    // 使用 LLM 提取字段
    const response = await client.invoke(messages, {
      model: LLM_CONFIG.MODEL,
      temperature: LLM_CONFIG.TEMPERATURE,
    });

    console.log('LLM 原始返回:', response.content);

    // 解析 LLM 返回的 JSON
    const extractedFields = JSON.parse(response.content);

    console.log('解析后的字段:', JSON.stringify(extractedFields, null, 2));

    // 确保所有必需字段都存在
    const fields: Partial<ExtractedRawFields> = {};
    for (const field of REQUIRED_FIELDS) {
      fields[field] = extractedFields[field] || '';
      if (!fields[field]) {
        console.warn(`警告: 字段 ${field} 提取为空`);
      }
    }

    return fields as ExtractedRawFields;
  } catch (error) {
    console.error('LLM 字段提取错误:', error);
    console.error('错误详情:', error instanceof Error ? error.stack : String(error));

    // 如果 LLM 失败，返回空对象
    const fields: Partial<ExtractedRawFields> = {};
    for (const field of REQUIRED_FIELDS) {
      fields[field] = '';
    }
    return fields as ExtractedRawFields;
  }
}
