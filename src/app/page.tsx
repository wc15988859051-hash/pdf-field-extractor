'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Trash2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 表格模板数据结构（严格按照Excel模板）
const TEMPLATE_COLUMNS = [
  '序号', 'PO', 'style no', 'style name', 'color', 
  'unit price', 'quantity', 'amount', 'amount after dicount', 'delivery'
];

const TEMPLATE_ROWS = [
  ['1', '$PO', '$style no', '$style name', '$color', '$unit price', '$quantity', '$total', '-', '$Ex-date'],
  ['', '$style code', '', '', '', '', '', '', '', ''],
  ['', '$color code', '', '', '', '', '', '', '-', ''],
  ['', '-', '', '', '', '-', '', '', '', '-'],
  ['', '$sell', '', '', '', '', '', '', '', '-'],
];

// 字段数据接口
interface FieldData {
  [key: string]: string; // 存储提取的字段值，如 { PO: "PO123", style_no: "ABC-001" }
}

interface PDFFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  fieldData: FieldData;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export default function PDFExtractorPage() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 处理文件上传
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: PDFFile[] = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map(file => {
        // 检查是否已存在同名文件
        const existingFile = pdfFiles.find(f => f.name === file.name);

        if (existingFile) {
          // 覆盖现有文件
          return {
            ...existingFile,
            size: file.size,
            uploadedAt: new Date(),
            status: 'pending' as const,
            fieldData: {},
          };
        }

        return {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          size: file.size,
          uploadedAt: new Date(),
          fieldData: {},
          status: 'pending' as const,
        };
      });

    // 合并文件列表，去重
    setPdfFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      
      // 对于已存在的同名文件，更新它们
      const updatedPrev = prev.map(f => {
        const updatedFile = newFiles.find(nf => nf.name === f.name);
        return updatedFile || f;
      });

      return [...updatedPrev, ...uniqueNewFiles];
    });
  }, [pdfFiles]);

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // 删除文件
  const handleDelete = (id: string) => {
    setPdfFiles(prev => prev.filter(f => f.id !== id));
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 获取状态徽章
  const getStatusBadge = (status: PDFFile['status']) => {
    const statusConfig = {
      pending: { label: '待处理', variant: 'secondary' as const },
      processing: { label: '处理中', variant: 'default' as const },
      completed: { label: '已完成', variant: 'outline' as const },
      error: { label: '失败', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // 解析单元格内容
  const parseCellContent = (cellValue: string, fieldData: FieldData): string => {
    // 检查是否为标识符（以$开头）
    if (cellValue.startsWith('$')) {
      const fieldName = cellValue.substring(1);
      // 检查是否已提取到该字段的值
      if (fieldData[fieldName]) {
        return fieldData[fieldName];
      }
      // 返回原始标识符
      return cellValue;
    }
    // 返回原始值（包括"-"或空字符串）
    return cellValue;
  };

  // 渲染单元格
  const renderCell = (cellValue: string, fieldData: FieldData) => {
    const isEmpty = !cellValue || cellValue === '-';
    const isIdentifier = cellValue.startsWith('$');
    const fieldName = isIdentifier ? cellValue.substring(1) : null;
    const hasValue = fieldName && fieldData[fieldName];

    return (
      <TableCell className={`text-sm ${isEmpty ? 'text-muted-foreground/50' : ''}`}>
        {isEmpty ? (
          <span className="text-muted-foreground">-</span>
        ) : isIdentifier && !hasValue ? (
          <code className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono">
            {cellValue}
          </code>
        ) : (
          <span className={hasValue ? 'font-medium text-foreground' : ''}>
            {hasValue ? fieldData[fieldName!] : cellValue}
          </span>
        )}
      </TableCell>
    );
  };

  // 导出结果为JSON
  const handleExport = () => {
    const exportData = pdfFiles.map(file => ({
      fileName: file.name,
      uploadedAt: file.uploadedAt.toISOString(),
      fieldData: file.fieldData,
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-extraction-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            PDF 文件解析与字段提取
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            上传PDF文件，按照模板提取并映射字段内容
          </p>
        </div>

        {/* 上传区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              上传PDF文件
            </CardTitle>
            <CardDescription>
              支持单个或多个PDF文件上传，相同名称的文件将覆盖原有内容
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                点击或拖拽文件到此处上传
              </p>
              <p className="text-xs text-muted-foreground">
                支持PDF格式，可同时选择多个文件
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 文件列表 */}
        {pdfFiles.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    已上传文件
                  </CardTitle>
                  <CardDescription>
                    共 {pdfFiles.length} 个文件
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!pdfFiles.some(f => f.status === 'completed')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出结果
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pdfFiles.map((file) => (
                  <div
                    key={file.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* 文件信息头部 */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border-b">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 mt-0.5 text-slate-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            {getStatusBadge(file.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} · 上传于 {file.uploadedAt.toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 模板表格 */}
                    <div className="p-4 overflow-x-auto">
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold mb-1">提取结果</h4>
                        <p className="text-xs text-muted-foreground">
                          表格中的 <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">$标识符</code> 表示待提取字段，
                          <span className="text-muted-foreground/70">-</span> 表示无数据
                        </p>
                      </div>
                      
                      <Table className="border">
                        <TableHeader>
                          <TableRow className="bg-slate-100 dark:bg-slate-800">
                            {TEMPLATE_COLUMNS.map((col, index) => (
                              <TableHead key={index} className="text-xs font-semibold text-foreground whitespace-nowrap">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {TEMPLATE_ROWS.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell, cellIndex) => renderCell(cell, file.fieldData))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {file.status === 'pending' && (
                      <div className="px-4 pb-4">
                        <Alert>
                          <AlertDescription className="text-xs">
                            等待PDF解析和字段提取...
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 空状态提示 */}
        {pdfFiles.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  还没有上传任何文件
                </p>
                <p className="text-xs mt-2">
                  上传PDF文件后，将按照模板显示提取结果
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 业务逻辑提示 */}
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="text-sm">
            表格已按照模板结构生成。详细的PDF解析和字段提取业务逻辑（如何从PDF中提取对应字段）将在后续提供。
            当前页面已完成文件上传、列表展示和模板表格渲染功能。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
