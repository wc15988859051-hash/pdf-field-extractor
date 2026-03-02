// Vercel Excel 导出 API
// 使用纯 JavaScript 实现（xlsx）

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// 全局数据存储（与 parse-pdf-js 共享）
let globalExtractedData: any[] = [];

// 设置数据（被 parse-pdf-js 调用）
export function setExtractedData(data: any[]) {
  globalExtractedData = data;
}

// GET 路由：导出 Excel
export async function GET(request: NextRequest) {
  try {
    // 检查是否有数据
    if (globalExtractedData.length === 0) {
      return NextResponse.json(
        { error: '暂无数据可导出' },
        { status: 400 }
      );
    }

    console.log('开始导出 Excel，数据行数:', globalExtractedData.length);

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(globalExtractedData);

    // 设置列宽
    const headers = Object.keys(globalExtractedData[0] || {});
    const colWidths = headers.map(header => {
      // 根据内容长度设置列宽
      const maxLength = Math.max(
        header.length,
        ...globalExtractedData.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // 最大 50
    });
    worksheet['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');

    // 生成 Buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    console.log('Excel 生成成功，文件大小:', buffer.length, 'bytes');

    // 返回文件
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="extracted_data_${Date.now()}.xlsx"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Excel 导出失败:', error);
    return NextResponse.json(
      { error: 'Excel 导出失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE 路由：清空数据
export async function DELETE(request: NextRequest) {
  try {
    globalExtractedData = [];
    return NextResponse.json({
      success: true,
      message: '数据已清空'
    });
  } catch (error) {
    console.error('清空数据失败:', error);
    return NextResponse.json(
      { error: '清空数据失败' },
      { status: 500 }
    );
  }
}

// 导出配置
export const config = {
  api: {
    responseLimit: '10mb',
  },
};
