import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile, mkdir, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

const execAsync = promisify(exec);

// 获取项目根目录
const PROJECT_ROOT = process.cwd();

// 检查 Python 是否可用
async function checkPythonAvailable(): Promise<string> {
  try {
    const { stdout } = await execAsync('which python3');
    const pythonPath = stdout.trim();
    if (!pythonPath) {
      throw new Error('python3 命令未找到');
    }
    console.log('Python 路径:', pythonPath);

    // 检查 Python 版本
    const { stdout: versionOutput } = await execAsync(`${pythonPath} --version`);
    console.log('Python 版本:', versionOutput.trim());

    return pythonPath;
  } catch (error) {
    console.error('检查 Python 可用性失败:', error);
    throw new Error('Python3 不可用，请确保已安装 Python 3');
  }
}

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
  // 先检查 Python 是否可用
  const pythonPath = await checkPythonAvailable();

  const scriptPath = join(PROJECT_ROOT, 'public', 'scripts', 'parse_pdf.py');
  console.log('=== PDF 解析开始 ===');
  console.log('PDF 解析脚本路径:', scriptPath);
  console.log('PDF 文件路径:', filePath);
  console.log('工作目录:', PROJECT_ROOT);
  console.log('Python 路径:', pythonPath);
  console.log('脚本文件是否存在:', existsSync(scriptPath));
  console.log('PDF 文件是否存在:', existsSync(filePath));

  if (!existsSync(scriptPath)) {
    throw new Error(`PDF 解析脚本不存在: ${scriptPath}`);
  }

  if (!existsSync(filePath)) {
    throw new Error(`PDF 文件不存在: ${filePath}`);
  }

  // 列出 public 目录内容
  try {
    const publicDir = join(PROJECT_ROOT, 'public');
    const { stdout: lsOutput } = await execAsync(`ls -la "${publicDir}/scripts/" 2>&1`);
    console.log('public/scripts 目录内容:', lsOutput);
  } catch (error) {
    console.error('列出目录内容失败:', error);
  }

  // 检查脚本文件权限
  try {
    const { stdout: statOutput } = await execAsync(`stat "${scriptPath}" 2>&1`);
    console.log('脚本文件信息:', statOutput);
  } catch (error) {
    console.error('获取脚本文件信息失败:', error);
  }

  try {
    const command = `"${pythonPath}" "${scriptPath}" "${filePath}"`;
    console.log('执行命令:', command);

    const { stdout, stderr } = await execAsync(command);

    console.log('Python 脚本返回成功');
    console.log('stdout 长度:', stdout?.length || 0);
    console.log('stderr:', stderr);

    // 如果有错误输出，记录并抛出异常
    if (stderr) {
      console.error('PDF 解析脚本 stderr:', stderr);
      throw new Error(`PDF 解析失败: ${stderr}`);
    }

    // 如果没有标准输出，也可能是错误
    if (!stdout || stdout.trim().length === 0) {
      throw new Error('PDF 解析失败: 脚本没有输出任何内容');
    }

    console.log('PDF 解析完成，文本长度:', stdout.length);
    return stdout;
  } catch (error: any) {
    console.error('=== PDF 解析命令执行失败 ===');
    console.error('错误对象:', error);
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误信号:', error.signal);
    console.error('stderr:', error.stderr);
    console.error('stdout:', error.stdout);
    console.error('堆栈:', error.stack);
    console.error('=== 错误信息结束 ===');

    // 提取详细的错误信息
    const errorMessage = error.stderr || error.stdout || error.message || String(error);
    throw new Error(`PDF 解析失败: ${errorMessage}`);
  }
}

// 使用正则表达式作为 LLM 的降级方案
function extractFieldsWithRegex(pdfText: string): any {
  console.log('使用正则表达式降级方案提取字段');

  const fields: any = {};
  const fieldPatterns = [
    { name: 'Article', patterns: [/Article\s*[:：]\s*([^\n\r]+)/i, /Article\s*:?\s*([^\s\n]+)/i] },
    { name: 'Order Reference', patterns: [/Order\s*Reference\s*[:：]\s*([^\n\r]+)/i, /Order\s*Ref\s*[:：]\s*([^\n\r]+)/i, /PO\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'Colour Name', patterns: [/Colour\s*Name\s*[:：]\s*([^\n\r]+)/i, /Color\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'GBP Retail Price', patterns: [/GBP\s*Retail\s*Price\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'Collection', patterns: [/Collection\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'Design Number', patterns: [/Design\s*Number\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'Ex Port Date', patterns: [/Ex\s*Port\s*Date\s*[:：]\s*([^\n\r]+)/i, /Ex-date\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'Total', patterns: [/Total\s*[:：]\s*([^\n\r]+)/i, /Quantity\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'Unit Price', patterns: [/Unit\s*Price\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'Line Value', patterns: [/Line\s*Value\s*[:：]\s*([^\n\r]+)/i, /Amount\s*[:：]\s*([^\n\r]+)/i] },
    { name: 'Product Name', patterns: [/Product\s*Name\s*[:：]\s*([^\n\r]+)/i] },
  ];

  for (const field of fieldPatterns) {
    for (const pattern of field.patterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        fields[field.name] = match[1].trim();
        break;
      }
    }
    if (!fields[field.name]) {
      fields[field.name] = '';
    }
  }

  console.log('正则表达式提取结果:', fields);
  return fields;
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
    console.log('开始调用 LLM...');
    const response = await client.invoke(messages, {
      model: "doubao-seed-1-8-251228",
      temperature: 0.3, // 使用较低的温度以确保准确性
    });

    console.log('LLM 原始返回:', response.content);
    console.log('LLM 返回长度:', response.content?.length || 0);
    console.log('LLM 返回类型:', typeof response.content);

    // 检查 LLM 返回是否有效
    if (!response.content || typeof response.content !== 'string') {
      console.error('LLM 返回内容无效');
      throw new Error('LLM 返回内容无效');
    }

    // 尝试提取 JSON 内容（可能 LLM 返回的内容包含了额外的文本）
    let jsonContent = response.content.trim();

    // 尝试找到 JSON 对象的开始和结束
    const jsonStart = jsonContent.indexOf('{');
    const jsonEnd = jsonContent.lastIndexOf('}');

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      console.log('提取的 JSON 内容:', jsonContent);
    }

    // 解析 LLM 返回的 JSON
    let extractedFields;
    try {
      extractedFields = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError);
      console.error('原始内容:', response.content);
      console.error('尝试解析的内容:', jsonContent);
      throw new Error(`LLM 返回的不是有效的 JSON 格式: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

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
    console.error('=== LLM 字段提取失败，使用降级方案 ===');
    console.error('错误类型:', error?.constructor?.name);
    console.error('错误消息:', error instanceof Error ? error.message : String(error));
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'N/A');

    // 检查是否是网络错误或 API 错误
    if (error && typeof error === 'object') {
      if ('code' in error) {
        console.error('错误代码:', (error as any).code);
      }
      if ('status' in error) {
        console.error('HTTP 状态:', (error as any).status);
      }
    }
    console.error('=== LLM 错误结束 ===');

    // 使用降级方案（正则表达式）
    console.warn('LLM 提取失败，使用正则表达式降级方案');
    try {
      return extractFieldsWithRegex(pdfText);
    } catch (fallbackError) {
      console.error('降级方案也失败:', fallbackError);
      // 如果降级方案也失败，返回空对象
      console.warn('降级方案也失败，返回空字段对象');
      const fields: any = {};
      for (const field of REQUIRED_FIELDS) {
        fields[field] = '';
      }
      return fields;
    }
  }
}

// 导出 Excel（追加到全局 Excel 文件）
async function exportToExcel(data: any[], pdfFilename: string): Promise<string> {
  // 先检查 Python 是否可用
  const pythonPath = await checkPythonAvailable();

  const extractedDir = '/tmp/extracted';
  const jsonDataPath = join(extractedDir, `temp_${pdfFilename}_${Date.now()}.json`);
  const templatePath = join(PROJECT_ROOT, 'public', 'assets', 'template.xlsx');

  // 确保导出目录存在
  if (!existsSync(extractedDir)) {
    await mkdir(extractedDir, { recursive: true });
  }

  // 确保 PDF 文件名在数据中
  const dataWithFilename = data.map(item => ({
    ...item,
    "原PDF名称": pdfFilename
  }));

  // 写入临时 JSON 文件
  await writeFile(jsonDataPath, JSON.stringify(dataWithFilename, null, 2), 'utf-8');

  // 调用导出脚本（使用增量更新，所有数据合并到全局 Excel）
  const scriptPath = join(PROJECT_ROOT, 'public', 'scripts', 'export_to_excel.py');
  console.log('Excel 导出脚本路径:', scriptPath);
  console.log('临时 JSON 文件路径:', jsonDataPath);
  console.log('模板文件路径:', templatePath);
  console.log('输出 Excel 文件路径:', GLOBAL_EXCEL_PATH);
  console.log('脚本文件是否存在:', existsSync(scriptPath));

  if (!existsSync(scriptPath)) {
    throw new Error(`Excel 导出脚本不存在: ${scriptPath}`);
  }

  if (!existsSync(templatePath)) {
    throw new Error(`Excel 模板文件不存在: ${templatePath}`);
  }

  try {
    const { stdout, stderr } = await execAsync(
      `"${pythonPath}" "${scriptPath}" "${jsonDataPath}" "${templatePath}" "${GLOBAL_EXCEL_PATH}"`
    );

    // 如果有错误输出，记录并抛出异常
    if (stderr) {
      console.error('Excel 导出脚本 stderr:', stderr);
      throw new Error(`Excel 导出失败: ${stderr}`);
    }

    if (!stdout) {
      console.warn('Excel 导出脚本没有输出');
    }
  } catch (error: any) {
    console.error('Excel 导出命令执行失败:', error);
    // 提取详细的错误信息
    const errorMessage = error.stderr || error.stdout || error.message || String(error);
    throw new Error(`Excel 导出失败: ${errorMessage}`);
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
  console.log('=== PDF 解析 API 开始 ===');
  console.log('时间:', new Date().toISOString());
  console.log('工作目录:', process.cwd());
  console.log('Node 版本:', process.version);
  console.log('环境变量 NODE_ENV:', process.env.NODE_ENV);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: '只支持 PDF 文件' }, { status: 400 });
    }

    console.log('接收到文件:', file.name, '大小:', file.size, '类型:', file.type);

    // 保存上传的文件到临时目录
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = file.name;
    const pdfDir = '/tmp/pdfs';
    const pdfPath = join(pdfDir, filename);

    // 确保临时目录存在
    if (!existsSync(pdfDir)) {
      await mkdir(pdfDir, { recursive: true });
    }

    console.log('保存 PDF 文件:', pdfPath);
    await writeFile(pdfPath, buffer);

    // 确保文件可读
    try {
      await chmod(pdfPath, 0o644);
      console.log('PDF 文件权限设置成功');
    } catch (error) {
      console.error('设置 PDF 文件权限失败:', error);
    }

    console.log('PDF 文件保存成功');

    // 步骤 1: 解析 PDF
    console.log('开始解析 PDF...');
    const pdfText = await parsePDF(pdfPath);
    console.log('PDF 解析成功，文本长度:', pdfText.length);

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
    console.error('=== PDF 解析 API 错误 ===');
    console.error('错误类型:', error?.constructor?.name);
    console.error('错误消息:', error instanceof Error ? error.message : String(error));
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'N/A');

    // 尝试获取更多错误详情
    if (error && typeof error === 'object') {
      if ('code' in error) {
        console.error('错误代码:', (error as any).code);
      }
      if ('status' in error) {
        console.error('HTTP 状态:', (error as any).status);
      }
      if ('stderr' in error) {
        console.error('stderr:', (error as any).stderr);
      }
      if ('stdout' in error) {
        console.error('stdout:', (error as any).stdout);
      }
    }

    console.error('=== 错误详情结束 ===');

    // 返回详细的错误信息
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    return NextResponse.json(
      {
        error: 'PDF 解析失败: ' + errorMessage,
        details: {
          type: error?.constructor?.name || 'Unknown',
          message: errorMessage,
          stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        }
      },
      { status: 500 }
    );
  }
}
