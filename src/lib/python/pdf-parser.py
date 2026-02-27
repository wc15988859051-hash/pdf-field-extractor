#!/usr/bin/env python3
"""
PDF 解析脚本
将 PDF 文件转换为结构化文本，保留表格格式
"""

import sys
import os
from typing import List, Dict, Any

try:
    import fitz  # PyMuPDF
except ImportError:
    print("错误: 需要安装 PyMuPDF 库")
    print("请执行: pip install PyMuPDF==1.23.26")
    sys.exit(1)


def parse_pdf(file_path: str) -> Dict[str, Any]:
    """
    解析 PDF 文件，提取文本和表格

    Args:
        file_path: PDF 文件路径

    Returns:
        包含解析结果的字典：
        {
            "total_pages": 总页数,
            "pages": [
                {
                    "page_num": 页码,
                    "text": 页面文本,
                    "tables": [表格数据列表]
                }
            ]
        }
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF 文件不存在: {file_path}")

    # 打开 PDF 文件
    doc = fitz.open(file_path)

    result = {
        "total_pages": len(doc),
        "pages": []
    }

    # 遍历所有页面
    for page_num, page in enumerate(doc, 1):
        page_data = {
            "page_num": page_num,
            "text": "",
            "tables": []
        }

        # 提取文本
        text = page.get_text()
        page_data["text"] = text

        # 尝试提取表格
        tables = page.find_tables()
        for table_idx, table in enumerate(tables):
            table_data = {
                "table_num": table_idx + 1,
                "headers": [],
                "rows": []
            }

            # 提取表格内容
            table_content = table.extract()
            if table_content:
                # 假设第一行是表头
                if table_content:
                    table_data["headers"] = table_content[0]
                    # 剩余行是数据
                    table_data["rows"] = table_content[1:]

            page_data["tables"].append(table_data)

        result["pages"].append(page_data)

    doc.close()
    return result


def format_result(result: Dict[str, Any]) -> str:
    """
    将解析结果格式化为易读的文本

    Args:
        result: parse_pdf 返回的结果字典

    Returns:
        格式化后的文本字符串
    """
    output = []
    output.append(f"=== PDF 解析结果 ===")
    output.append(f"总页数: {result['total_pages']}")
    output.append("")

    for page in result["pages"]:
        output.append(f"--- 第 {page['page_num']} 页 ---")
        output.append("")

        # 输出文本内容
        if page["text"].strip():
            output.append("文本内容:")
            output.append(page["text"])
            output.append("")

        # 输出表格
        if page["tables"]:
            for table in page["tables"]:
                output.append(f"表格 {table['table_num']}:")

                # 输出表头
                if table["headers"]:
                    headers = " | ".join(str(h) for h in table["headers"])
                    output.append(headers)
                    output.append("-" * len(headers))

                # 输出数据行
                for row in table["rows"]:
                    row_text = " | ".join(str(cell) for cell in row)
                    output.append(row_text)

                output.append("")

    return "\n".join(output)


def main():
    """主函数"""
    if len(sys.argv) != 2:
        print("使用方法: python pdf-parser.py <pdf_file_path>")
        print("示例: python pdf-parser.py ./document.pdf")
        sys.exit(1)

    pdf_path = sys.argv[1]

    try:
        # 解析 PDF
        result = parse_pdf(pdf_path)

        # 格式化并输出结果
        formatted_output = format_result(result)
        print(formatted_output)

        return 0

    except FileNotFoundError as e:
        print(f"错误: {e}")
        return 1
    except Exception as e:
        print(f"解析 PDF 时发生错误: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
