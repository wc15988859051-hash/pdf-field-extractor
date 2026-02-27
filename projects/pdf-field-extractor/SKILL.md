---
name: pdf-field-extractor
description: 从 PDF 文件中提取指定业务字段并导出 Excel；当用户需要解析 PDF 文档并提取 Article、Order Reference、Colour Name、GBP Retail Price、Collection、Design Number、Ex Port Date、Total、Unit Price、Line Value、Product Name 等字段并映射导出时使用
dependency:
  python:
    - PyMuPDF==1.23.26
    - openpyxl==3.1.5
---

# PDF 字段提取器

> **注意**: 本项目已重构，Python 脚本已移至 `src/lib/python/` 目录。请参考项目根目录的 [README.md](../../README.md) 和 [README_REFACTOR.md](../../README_REFACTOR.md) 了解最新的项目结构。

## 任务目标
- 本 Skill 用于：从 PDF 文件中提取结构化的业务字段信息，按映射关系转换字段名并导出到 Excel 文件；支持多文件处理，所有数据合并到同一个 Excel 表格
- 能力包含：PDF 文本解析、字段识别、字段映射、Excel 导出、多文件数据合并
- 触发条件：用户上传 PDF 文件（单个或多个）并要求提取特定字段并导出为 Excel 时

## 前置准备
- 依赖说明：脚本所需的依赖包及版本
  ```
  PyMuPDF==1.23.26
  openpyxl==3.1.2
  ```

## 操作步骤

### 标准流程

#### 单文件处理

1. **接收 PDF 文件**
   - 用户上传 PDF 文件到当前工作目录
   - 记录 PDF 文件路径（如 `./document.pdf`）

2. **解析 PDF 文件**
   - 调用 `src/lib/python/pdf-parser.py` 脚本解析 PDF 文件
   - 传入参数：PDF 文件路径
   - 脚本返回：提取的文本内容（保留表格结构）

   > **注意**: 旧脚本路径 `scripts/parse_pdf.py` 已废弃，新路径为 `src/lib/python/pdf-parser.py`

3. **识别和提取字段**
   - 分析解析后的文本内容
   - 识别以下字段：
     - Article（产品编号）
     - Order Reference（订单参考号）
     - Colour Name（颜色名称）
     - GBP Retail Price（英镑零售价）
     - Collection（系列/集合）
     - Design Number（设计编号）
     - Ex Port Date（出口日期）
     - Total（总额）
     - Unit Price（单价）
     - Line Value（行金额）
     - Product Name（产品名称）
   - 注意字段可能出现的各种格式和变体
   - 处理多值字段（如同一字段在多处出现）

4. **输出结构化结果**
   - 以 JSON 格式输出提取的字段，便于后续处理
   - 对于表格数据，使用 JSON 数组格式
   - 确保字段名称与要求一致
   - 注明数据来源（页码或位置）

5. **字段映射和 Excel 导出**
   - 将提取的字段按以下映射关系转换：
     - Article → color code（导出时添加前缀 "color code#"）
     - Order Reference → PO（导出时添加前缀 "PO#"）
     - Colour Name → color
     - GBP Retail Price → sell（导出时添加前缀 "GBP"）
     - Collection → style no
     - Design Number → style code（导出时添加前缀 "style code#"）
     - Ex Port Date → Ex-date
     - Total → quantity
     - Unit Price → unit price
     - Line Value → total（导出时格式化为美元，添加前缀 "$"，保留 2 位小数，添加千位分隔符）
     - Product Name → style name
   - 字段值前缀说明：
     - PO 字段：添加前缀 "PO#"
     - style code 字段：添加前缀 "style code#"
     - color code 字段：添加前缀 "color code#"
     - sell 字段：添加前缀 "GBP"
     - total 字段：格式化为美元格式，例如 "$55,345.00"
   - 金额格式说明：
     - total 字段自动格式化为美元格式
     - 添加 "$" 前缀
     - 保留 2 位小数
     - 添加千位分隔符（逗号）
     - 示例：100 → "$100.00"，50000 → "$50,000.00"，52345.6 → "$52,345.60"
   - 调用 `src/lib/python/excel-exporter.py` 脚本导出 Excel 文件
   - 传入参数：JSON 数据文件路径、模板文件路径、Excel 输出文件路径
   - 脚本自动判断是新建还是更新：

   > **注意**: 旧脚本路径 `scripts/export_to_excel.py` 已废弃，新路径为 `src/lib/python/excel-exporter.py`
     - 如果 Excel 文件不存在：基于模板创建新文件
     - 如果 Excel 文件已存在：执行增量更新
       - 检查新数据的 PDF 文件名是否已存在
       - 如果已存在，删除旧数据（整个 6 行块）
       - 追加新数据到末尾
       - 重新计算所有数据的序号
   - 脚本基于模板格式填充数据，每组数据占 6 行，序号自增
   - 脚本自动合并单元格，保持格式一致：
     - 序号、style no、style name、color、quantity、amount、amount after discount：合并 5 行
     - unit price：前 3 行合并，后 2 行单独合并
     - delivery：合并前 2 行
   - 模板格式说明：
     - 第 1 行：表头（序号、PO、style no、style name、color、unit price、quantity、amount、amount after discount、delivery、原PDF名称）
     - 每组数据占 6 行：
       - 第 1 行：序号 + PO、style no、style name、color、unit price、quantity、total、空、Ex-date、原PDF名称
       - 第 2 行：style code（在第 2 列）
       - 第 3 行：color code（在第 2 列）
       - 第 4 行：空行（部分列为空）
       - 第 5 行：sell（在第 2 列）
       - 第 6 行：空行（分隔下一组数据）

#### 多文件处理

1. **接收多个 PDF 文件**
   - 用户上传多个 PDF 文件到当前工作目录
   - 记录所有 PDF 文件路径

2. **批量解析 PDF**
   - 对每个 PDF 文件调用 `scripts/parse_pdf.py` 解析
   - 智能体分别识别和提取每个文件的字段

3. **合并数据**
   - 智能体将所有文件的提取数据合并为一个 JSON 数组
   - 每个文件的数据单独一行

4. **字段映射和 Excel 导出**
   - 智能体为每组提取的数据添加 PDF 文件名到"原PDF名称"字段
   - 调用 `src/lib/python/excel-exporter.py` 脚本，基于模板更新 Excel 文件
   - 脚本自动判断是新建还是更新：
     - 如果 Excel 文件不存在：基于模板创建新文件
     - 如果 Excel 文件已存在：执行增量更新
       - 检查新数据的 PDF 文件名是否已存在
       - 如果已存在，删除旧数据（整个 6 行块）
       - 追加新数据到末尾
       - 重新计算所有数据的序号
   - 模板位于 `assets/template.xlsx`

### 可选分支

- 当 PDF 包含多页：遍历所有页面提取字段
- 当字段缺失：标注空值并继续处理
- 当字段重复：收集所有实例并标注
- 当格式不标准：根据上下文推断字段含义
- 当需要导出 Excel：调用 `src/lib/python/excel-exporter.py` 进行字段映射和导出
- 当处理多个文件：智能体合并所有数据，脚本自动添加"原 PDF 文件名"列

## 资源索引

- 必要脚本：见 [src/lib/python/pdf-parser.py](../../src/lib/python/pdf-parser.py)（用途：将 PDF 文件转换为结构化文本，参数：PDF 文件路径）
- 必要脚本：见 [src/lib/python/excel-exporter.py](../../src/lib/python/excel-exporter.py)（用途：基于模板填充数据导出 Excel，参数：JSON 数据文件路径、模板文件路径、Excel 输出文件路径）
- 模板文件：见 [assets/template.xlsx](assets/template.xlsx)（Excel 输出格式模板）

## 注意事项

- PDF 解析脚本处理文本提取，字段识别由智能体完成
- 字段映射和 Excel 导出由脚本自动完成
- 支持单文件和多文件处理，多文件时所有数据合并到同一个 Excel 表格
- Excel 输出格式严格按照模板要求，每组数据占 6 行，序号自增
- 模板文件位于 `assets/template.xlsx`，包含预定义的表头和格式
- 模板表头：序号、PO、style no、style name、color、unit price、quantity、amount、amount after discount、delivery、原PDF名称
- **单元格合并规则**：
  - 序号（列 1）：合并 5 行
  - style no（列 3）：合并 5 行
  - style name（列 4）：合并 5 行
  - color（列 5）：合并 5 行
  - unit price（列 6）：前 3 行合并，后 2 行单独合并
  - quantity（列 7）：合并 5 行
  - amount（列 8）：合并 5 行
  - amount after discount（列 9）：合并 5 行
  - delivery（列 10）：合并前 2 行
- **字段值前缀规则**：
  - PO（列 2）：添加前缀 "PO#"，例如 "PO#12345"
  - style code（第 2 行，列 2）：添加前缀 "style code#"，例如 "style code#SC001"
  - color code（第 3 行，列 2）：添加前缀 "color code#"，例如 "color code#CC001"
  - sell（第 5 行，列 2）：添加前缀 "GBP"，例如 "GBP10.00"
  - amount（列 8）：格式化为美元格式，添加 "$" 前缀，保留 2 位小数，添加千位分隔符，例如 "$55,345.00"
  - 只有字段值非空时才添加前缀，空值不添加前缀
- **增量更新机制**：
  - 如果目标 Excel 文件已存在，自动执行增量更新
  - 根据PDF文件名判断是否重复：
    - 文件名相同：删除旧数据（整个 6 行块），追加新数据
    - 文件名不同：直接追加新数据
  - 更新后自动重新计算所有数据的序号
- 每组数据的 6 行结构：
  - 第 1 行：序号 + 主数据（PO、style no、style name、color、unit price、quantity、total、Ex-date、原PDF名称）
  - 第 2 行：style code
  - 第 3 行：color code
  - 第 4 行：部分列填 "-"
  - 第 5 行：sell
  - 第 6 行：空行（分隔）
- 保持字段名称与要求完全一致
- 对于表格数据，注意保持行对应关系
- 处理日期、金额等格式化字段时，保留原始格式
- 如果字段无法识别，标注空值而非"未找到"
- 字段映射关系固定，不可自定义

## 使用示例

### 示例 1：提取单个订单 PDF 中的字段并导出 Excel
- 功能说明：从单个订单 PDF 中提取业务字段，按映射关系转换并基于模板导出为 Excel
- 执行方式：脚本 + 智能体
- 操作：
  ```bash
  # 步骤 1: 解析 PDF
  python /workspace/projects/src/lib/python/pdf-parser.py ./order.pdf

  # 步骤 2: 智能体分析输出文本，提取所有指定字段并生成 JSON 数据，添加 PDF 文件名

  # 步骤 3: 导出或更新 Excel（假设 JSON 数据已保存到 extracted_data.json）
  python /workspace/projects/src/lib/python/excel-exporter.py \
    ./extracted_data.json \
    /workspace/projects/projects/pdf-field-extractor/assets/template.xlsx \
    ./output.xlsx
  ```
- 字段映射：Article→color code、Order Reference→PO、Colour Name→color 等
- Excel 格式：每组数据占 6 行，序号自增，严格按照模板格式填充
- **增量更新**：如果 output.xlsx 已存在，自动判断 PDF 文件名，重复则覆盖，不同则追加

### 示例 2：处理多个 PDF 文件并合并导出
- 功能说明：从多个 PDF 文件中提取字段，合并到同一个 Excel 表格
- 执行方式：脚本 + 智能体
- 操作流程：
  1. 智能体逐个解析每个 PDF 文件
  2. 智能体提取所有字段并合并数据，为每组添加 PDF 文件名
  3. 智能体调用 `src/lib/python/excel-exporter.py` 更新 Excel 文件
- 注意事项：每个文件的数据作为一组，序号连续自增，每组占 6 行
- **增量更新**：自动去重，相同文件名覆盖，不同文件名追加

### 示例 3：更新已存在的 Excel 文件
- 功能说明：重新解析某个 PDF 文件，更新 Excel 中的对应数据
- 执行方式：脚本 + 智能体
- 操作流程：
  1. 解析 PDF 文件
  2. 提取字段并添加相同的 PDF 文件名
  3. 调用 `src/lib/python/excel-exporter.py` 更新 Excel 文件
- 结果：脚本自动找到旧数据并删除，追加新数据，重新计算序号
