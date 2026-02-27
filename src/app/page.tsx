'use client';

import { useState, useCallback } from 'react';
import { Upload, Trash2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 字段数据接口
interface FieldData {
  [key: string]: string; // 存储提取的字段值
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

  // 解析PDF文件并提取字段
  const parsePDFFile = async (file: File, fileId: string) => {
    try {
      // 更新状态为处理中
      setPdfFiles(prev => 
        prev.map(f => 
          f.id === fileId ? { ...f, status: 'processing' } : f
        )
      );

      // 准备表单数据
      const formData = new FormData();
      formData.append('file', file);

      // 调用API
      const response = await fetch('/api/pdf/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'PDF解析失败');
      }

      // 更新字段数据
      setPdfFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? {
                ...f,
                status: 'completed',
                fieldData: result.mappedFields,
              }
            : f
        )
      );
    } catch (error) {
      console.error('PDF解析错误:', error);
      setPdfFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? {
                ...f,
                status: 'error',
              }
            : f
        )
      );
    }
  };

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
          const fileId = existingFile.id;
          // 触发重新解析
          setTimeout(() => parsePDFFile(file, fileId), 100);
          return {
            ...existingFile,
            size: file.size,
            uploadedAt: new Date(),
            status: 'pending' as const,
            fieldData: {},
          };
        }

        const fileId = `${file.name}-${Date.now()}`;
        // 触发解析
        setTimeout(() => parsePDFFile(file, fileId), 100);

        return {
          id: fileId,
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

  // 渲染单元格内容
  const renderCell = (fieldName: string | undefined, fieldData: FieldData) => {
    if (!fieldName) {
      return <TableCell className="text-muted-foreground/50">-</TableCell>;
    }

    const value = fieldData[fieldName];
    return (
      <TableCell className="text-sm">
        {value ? (
          <span className="font-medium text-foreground">{value}</span>
        ) : (
          <span className="text-muted-foreground/70">$fieldName</span>
        )}
      </TableCell>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            PDF 文件解析与字段提取
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            上传PDF文件，自动提取并映射字段内容到统一列表
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

        {/* 统一数据表格 */}
        {pdfFiles.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>提取结果</CardTitle>
                  <CardDescription>
                    共 {pdfFiles.length} 个文件
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800">
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                        序号
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap min-w-[200px]">
                        文件名
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        状态
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        PO
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        style no
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        style name
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        color
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        unit price
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        quantity
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        amount
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        amount after discount
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        delivery
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        style code
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        color code
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        sell
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pdfFiles.map((file, index) => (
                      <TableRow key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell className="font-medium sticky left-0 bg-white dark:bg-slate-950 z-10">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium min-w-[200px] max-w-[300px]">
                          <div className="space-y-1">
                            <div className="truncate" title={file.name}>
                              {file.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} · {file.uploadedAt.toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(file.status)}
                        </TableCell>
                        <TableCell>{renderCell('PO', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('style no', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('style name', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('color', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('unit price', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('quantity', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('total', file.fieldData).props.children}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{renderCell('Ex-date', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('style code', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('color code', file.fieldData).props.children}</TableCell>
                        <TableCell>{renderCell('sell', file.fieldData).props.children}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {pdfFiles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">还没有上传任何文件</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 空状态提示 */}
        {pdfFiles.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  还没有上传任何文件
                </p>
                <p className="text-xs mt-2">
                  上传PDF文件后，所有提取的数据将显示在统一列表中
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 功能说明 */}
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>功能说明：</strong>上传PDF文件后，系统会自动解析并提取以下字段：
            Article、Order Reference、Colour Name、GBP Retail Price、Collection、Design Number、Ex Port Date、Total、Unit Price、Line Value、Product Name。
            提取的字段会自动映射到统一表格的对应列中。相同名称的文件会覆盖原有数据。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
