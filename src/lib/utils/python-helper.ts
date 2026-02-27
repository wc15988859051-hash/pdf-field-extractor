/**
 * Python 脚本调用工具
 * 封装 Python 脚本的调用逻辑
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { PATHS } from '@/lib/config/constants';

const execAsync = promisify(exec);

/**
 * 调用 Python 脚本
 * @param scriptPath 脚本路径
 * @param args 脚本参数
 * @returns 脚本输出
 */
export async function runPythonScript(
  scriptPath: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  const command = `python3 ${scriptPath} ${args.map(arg => `"${arg}"`).join(' ')}`;

  try {
    const { stdout, stderr } = await execAsync(command);

    // 如果有错误输出，但同时也成功输出，可能是警告信息
    if (stderr && !stdout) {
      throw new Error(`Python 脚本执行失败: ${stderr}`);
    }

    return { stdout, stderr };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Python 脚本执行错误: ${error.message}`);
    }
    throw new Error('Python 脚本执行失败: 未知错误');
  }
}

/**
 * 解析 PDF 文件
 * @param pdfPath PDF 文件路径
 * @returns 解析后的文本内容
 */
export async function parsePDF(pdfPath: string): Promise<string> {
  const { stdout } = await runPythonScript(PATHS.PYTHON_SCRIPTS.PARSE_PDF, [pdfPath]);
  return stdout;
}

/**
 * 导出 Excel 文件
 * @param jsonDataPath JSON 数据文件路径
 * @param templatePath 模板文件路径
 * @param outputPath 输出文件路径
 * @returns 导出结果信息
 */
export async function exportExcel(
  jsonDataPath: string,
  templatePath: string,
  outputPath: string
): Promise<{ stdout: string; stderr: string }> {
  return await runPythonScript(PATHS.PYTHON_SCRIPTS.EXPORT_EXCEL, [
    jsonDataPath,
    templatePath,
    outputPath,
  ]);
}
