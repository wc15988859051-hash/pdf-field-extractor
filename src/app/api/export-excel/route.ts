/**
 * Excel 导出 API 路由
 * 提供全局 Excel 文件下载
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// 配置
import { PATHS } from '@/lib/config/constants';

export async function GET(request: NextRequest) {
  try {
    // 检查 Excel 文件是否存在
    const exists = existsSync(PATHS.GLOBAL_EXCEL);

    if (!exists) {
      return NextResponse.json(
        { error: 'Excel 文件不存在，请先上传 PDF 文件' },
        { status: 404 }
      );
    }

    // 读取 Excel 文件
    const buffer = await readFile(PATHS.GLOBAL_EXCEL);

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
