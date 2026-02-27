/**
 * PDF 解析 API 路由
 * 接收 PDF 文件，解析并提取字段，导出到全局 Excel 文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { HeaderUtils } from 'coze-coding-dev-sdk';

// 工具函数
import { initTempDirs, saveFile, deleteFile } from '@/lib/utils/file-helper';
import { parsePDF, exportExcel } from '@/lib/utils/python-helper';
import { extractFieldsWithLLM } from '@/lib/utils/llm-helper';
import { writeFile, unlink } from 'fs/promises';

// 配置
import { PATHS, FILE_SIZE_LIMIT } from '@/lib/config/constants';
import type { ExtractedRawFields, ExcelDataItem } from '@/lib/types';

/**
 * 将提取的字段转换为 Excel 格式
 */
function convertToExcelFormat(fields: ExtractedRawFields, pdfFilename: string): ExcelDataItem {
  return {
    ...fields,
    "原PDF名称": pdfFilename,
  };
}

/**
 * 导出数据到 Excel 文件
 */
async function exportToExcel(data: ExcelDataItem[]): Promise<string> {
  const jsonDataPath = join(PATHS.EXTRACTED_DIR, `temp_${Date.now()}.json`);

  // 写入临时 JSON 文件
  await writeFile(jsonDataPath, JSON.stringify(data, null, 2), 'utf-8');

  try {
    // 调用导出脚本（使用增量更新，所有数据合并到全局 Excel）
    await exportExcel(
      jsonDataPath,
      PATHS.TEMPLATE,
      PATHS.GLOBAL_EXCEL
    );

    return PATHS.GLOBAL_EXCEL;
  } finally {
    // 清理临时 JSON 文件
    try {
      await unlink(jsonDataPath);
    } catch (error) {
      console.error('清理临时 JSON 文件失败:', error);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 初始化临时目录
    await initTempDirs();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 验证文件类型
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: '只支持 PDF 文件' }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > FILE_SIZE_LIMIT) {
      return NextResponse.json(
        { error: `文件大小超过限制（最大 ${FILE_SIZE_LIMIT / 1024 / 1024}MB）` },
        { status: 400 }
      );
    }

    // 提取并转发请求头（用于 LLM 调用）
    HeaderUtils.extractForwardHeaders(request.headers);

    // 保存上传的文件到临时目录
    const filename = file.name;
    const pdfPath = join(PATHS.PDF_DIR, filename);
    await saveFile(file, pdfPath);

    try {
      // 步骤 1: 解析 PDF
      const pdfText = await parsePDF(pdfPath);

      // 步骤 2: 提取字段（使用 LLM）
      const extractedFields = await extractFieldsWithLLM(pdfText);

      // 步骤 3: 转换为 Excel 格式
      const excelData = convertToExcelFormat(extractedFields, filename);

      // 步骤 4: 导出 Excel（追加到全局 Excel 文件）
      await exportToExcel([excelData]);

      return NextResponse.json({
        success: true,
        filename: filename,
        fields: extractedFields,
        message: 'PDF 解析成功，字段已提取并追加到全局 Excel 文件'
      });

    } finally {
      // 清理临时 PDF 文件
      await deleteFile(pdfPath);
    }

  } catch (error) {
    console.error('PDF 解析错误:', error);
    return NextResponse.json(
      { error: 'PDF 解析失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
