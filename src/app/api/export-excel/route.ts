import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// 确保使用 Node.js runtime（Vercel 兼容性）
export const runtime = 'nodejs';

// 全局 Excel 文件路径
const GLOBAL_EXCEL_PATH = '/tmp/extracted/all_data.xlsx';

export async function GET(request: NextRequest) {
  try {
    // 检查 Excel 文件是否存在
    const exists = existsSync(GLOBAL_EXCEL_PATH);

    if (!exists) {
      return NextResponse.json(
        { error: 'Excel 文件不存在，请先上传 PDF 文件' },
        { status: 404 }
      );
    }

    // 读取 Excel 文件
    const buffer = await readFile(GLOBAL_EXCEL_PATH);

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="all_data.xlsx"',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('下载 Excel 文件错误:', error);
    return NextResponse.json(
      { error: '下载 Excel 文件失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
