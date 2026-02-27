# 诊断工具使用指南

## 测试 API

应用提供了完整的诊断工具，帮助您快速了解系统状态。

### 访问测试 API

```bash
curl http://localhost:5000/api/test
```

### 返回示例

```json
{
  "status": "healthy",
  "timestamp": "2026-02-28T00:10:40.805Z",
  "checks": {
    "node": {
      "status": "ok",
      "version": "v24.13.1",
      "platform": "linux"
    },
    "python": {
      "status": "ok",
      "version": "Python 3.12.3"
    },
    "PyMuPDF": {
      "status": "ok"
    },
    "openpyxl": {
      "status": "ok"
    },
    "Template Excel": {
      "status": "ok",
      "path": "/workspace/projects/public/assets/template.xlsx"
    },
    "Export Script": {
      "status": "ok",
      "path": "/workspace/projects/public/scripts/export_to_excel.py"
    },
    "Parse Script": {
      "status": "ok",
      "path": "/workspace/projects/public/scripts/parse_pdf.py"
    },
    "Directory: /tmp/extracted": {
      "status": "ok"
    }
  }
}
```

### 检查项说明

| 检查项 | 说明 | 状态值 |
|--------|------|--------|
| node | Node.js 运行时 | ok/error |
| python | Python 运行时 | ok/error |
| PyMuPDF | PDF 解析库 | ok/missing |
| openpyxl | Excel 导出库 | ok/missing |
| Template Excel | Excel 模板文件 | ok/missing |
| Export Script | Excel 导出脚本 | ok/missing |
| Parse Script | PDF 解析脚本 | ok/missing |
| Directory: /tmp/extracted | 临时导出目录 | ok/created |

### 状态值说明

- **ok**: 组件正常
- **error**: 组件出错
- **missing**: 组件缺失
- **created**: 目录已创建

## 健康检查 API

应用还提供简化的健康检查接口。

### 访问健康检查 API

```bash
curl http://localhost:5000/api/health
```

### 返回示例

```json
{
  "status": "ok",
  "timestamp": "2026-02-28T00:10:40.805Z",
  "components": {
    "node": "ok",
    "python": "ok",
    "dependencies": "ok",
    "files": "ok",
    "directories": "ok"
  }
}
```

## 故障排查流程

当应用出现问题时，请按以下步骤排查：

### 1. 检查测试 API

```bash
curl http://localhost:5000/api/test
```

查看哪个组件状态不是 "ok"。

### 2. 根据 Check 结果处理

#### Python 缺失
```bash
# 安装 Python（根据系统）
sudo apt-get install python3 python3-pip  # Ubuntu/Debian
# 或
sudo yum install python3 python3-pip  # CentOS/RHEL
```

#### PyMuPDF 缺失
```bash
pip3 install PyMuPDF==1.23.26
```

#### openpyxl 缺失
```bash
pip3 install openpyxl==3.1.5
```

#### 模板文件缺失
检查 `public/assets/template.xlsx` 是否存在。

#### 脚本文件缺失
检查以下文件是否存在：
- `public/scripts/parse_pdf.py`
- `public/scripts/export_to_excel.py`

### 3. 查看日志

```bash
# 查看应用日志
tail -n 50 /app/work/logs/bypass/app.log

# 查看错误日志
tail -n 50 /app/work/logs/bypass/app.log | grep -iE "error|exception|warn"
```

### 4. 重启服务

如果问题无法解决，尝试重启服务：

```bash
# 开发环境
coze dev

# 生产环境
coze build && coze start
```

## 常见问题

### Q1: 上传 PDF 后一直显示"解析中"

**可能原因**:
- PDF 文件过大
- Python 脚本执行慢
- LLM 服务响应慢

**解决方案**:
- 等待更长时间
- 检查 Python 脚本日志
- 使用较小的 PDF 测试

### Q2: 显示"字段提取失败"

**可能原因**:
- PDF 格式不支持
- 字段识别失败
- LLM 服务不可用

**解决方案**:
- 检查 PDF 是否有可识别的表格
- 查看详细错误信息
- 系统会自动降级到正则表达式提取

### Q3: 显示"Excel 导出失败"

**可能原因**:
- Python 依赖缺失
- 模板文件损坏
- 权限问题

**解决方案**:
```bash
# 检查 Python 依赖
pip3 install PyMuPDF==1.23.26 openpyxl==3.1.5

# 检查模板文件
ls -l public/assets/template.xlsx

# 检查目录权限
ls -ld /tmp/extracted
```

### Q4: 下载 Excel 失败

**可能原因**:
- Excel 文件未生成
- 文件路径错误
- 权限问题

**解决方案**:
- 检查 `/tmp/extracted/all_data.xlsx` 是否存在
- 查看服务器日志
- 确保文件有读取权限

## 监控建议

### 定期健康检查

使用 cron 定期检查系统状态：

```bash
# 每分钟检查一次
* * * * * curl -s http://localhost:5000/api/test | grep -q '"status":"healthy"' || echo "System unhealthy!" | mail -s "Health Check Alert" admin@example.com
```

### 监控日志

监控错误日志：

```bash
# 实时监控
tail -f /app/work/logs/bypass/app.log | grep -iE "error|exception"

# 统计错误
grep -iE "error|exception" /app/work/logs/bypass/app.log | wc -l
```

### 性能监控

监控 API 响应时间：

```bash
# 测试 API 响应时间
time curl http://localhost:5000/api/health
```

## 联系支持

如果以上方法都无法解决问题，请提供以下信息：

1. 测试 API 的完整输出
2. 相关的错误日志
3. 操作步骤和重现方法
4. PDF 文件示例（如果可以分享）
