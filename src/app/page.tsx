/**
 * PDF 字段提取应用主页面
 * 支持多文件上传、字段提取、Excel 导出、历史记录
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, RefreshCw, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// 类型定义
import type { ExtractedField, PDFFile, HistoryRecord } from '@/lib/types';

// 配置
import { HISTORY_CONFIG, FILE_SIZE_LIMIT } from '@/lib/config/constants';
import { FIELD_DISPLAY_NAMES } from '@/lib/config/field-mapping';

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 获取状态徽章
 */
function getStatusBadge(status: PDFFile['status']) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">待处理</Badge>;
    case 'processing':
      return <Badge variant="outline">处理中</Badge>;
    case 'completed':
      return <Badge variant="default">已完成</Badge>;
    case 'error':
      return <Badge variant="destructive">失败</Badge>;
  }
}

/**
 * 下载全局 Excel 文件
 */
async function downloadGlobalExcel(): Promise<void> {
  try {
    const response = await fetch('/api/export-excel');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_data.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('下载 Excel 失败:', error);
    alert('下载 Excel 文件失败，请稍后重试');
  }
}

export default function PDFExtractorPage() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_CONFIG.STORAGE_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('加载历史记录失败:', error);
      }
    }
  }, []);

  // 保存历史记录到 localStorage
  const saveHistory = useCallback((newRecord: HistoryRecord) => {
    const updatedHistory = [newRecord, ...history].slice(0, HISTORY_CONFIG.MAX_RECORDS);
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_CONFIG.STORAGE_KEY, JSON.stringify(updatedHistory));
  }, [history]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const uploadedFiles = Array.from(files).filter(file => file.type === 'application/pdf');

    // 验证文件大小
    const validFiles = uploadedFiles.filter(file => file.size <= FILE_SIZE_LIMIT);
    
    if (validFiles.length < uploadedFiles.length) {
      alert(`部分文件超过大小限制（最大 ${FILE_SIZE_LIMIT / 1024 / 1024}MB），已自动跳过`);
    }

    // 创建新的文件对象，状态为 processing
    const newFiles: PDFFile[] = validFiles.map(file => {
      const existingFile = pdfFiles.find(f => f.name === file.name);

      if (existingFile) {
        return {
          ...existingFile,
          size: file.size,
          uploadedAt: new Date(),
          status: 'processing' as const,
          extractedFields: [],
          errorMessage: undefined,
        };
      }

      return {
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        extractedFields: [],
        status: 'processing' as const,
        errorMessage: undefined,
      };
    });

    // 合并文件列表，去重
    setPdfFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));

      const updatedPrev = prev.map(f => {
        const updatedFile = newFiles.find(nf => nf.name === f.name);
        return updatedFile || f;
      });

      return [...updatedPrev, ...uniqueNewFiles];
    });

    // 对每个文件调用 API 进行解析
    for (const file of validFiles) {
      await processPDF(file);
    }
  }, [pdfFiles, saveHistory]);

  // 处理单个 PDF 文件
  const processPDF = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '解析失败');
      }

      // 转换字段数据为提取字段格式
      const extractedFields: ExtractedField[] = Object.entries(result.fields || {}).map(
        ([key, value]) => ({
          fieldName: key,
          fieldValue: String(value || ''),
        })
      );

      // 更新文件状态
      setPdfFiles(prev =>
        prev.map(f => {
          if (f.name === file.name) {
            return {
              ...f,
              status: 'completed' as const,
              extractedFields,
            };
          }
          return f;
        })
      );

      // 添加到历史记录
      saveHistory({
        filename: file.name,
        uploadTime: new Date().toISOString(),
        status: 'completed',
      });
    } catch (error) {
      console.error(`处理文件 ${file.name} 失败:`, error);
      setPdfFiles(prev =>
        prev.map(f => {
          if (f.name === file.name) {
            return {
              ...f,
              status: 'error' as const,
              errorMessage: error instanceof Error ? error.message : String(error),
            };
          }
          return f;
        })
      );

      // 添加失败记录到历史记录
      saveHistory({
        filename: file.name,
        uploadTime: new Date().toISOString(),
        status: 'error',
      });
    }
  }, [saveHistory]);

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // 删除文件
  const handleDelete = useCallback((id: string) => {
    setPdfFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // 清空所有文件
  const handleClearAll = useCallback(() => {
    if (confirm('确定要清空所有文件吗？')) {
      setPdfFiles([]);
    }
  }, []);

  // 检查是否所有文件都已完成
  const allCompleted = pdfFiles.length > 0 && pdfFiles.every(f => f.status === 'completed');
  const hasProcessing = pdfFiles.some(f => f.status === 'processing');
  const hasErrors = pdfFiles.some(f => f.status === 'error');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            PDF 字段提取器
          </h1>
          <p className="text-muted-foreground">
            上传 PDF 文件，自动提取业务字段并导出到 Excel
          </p>
        </div>

        {/* 上传区域 */}
        <Card>
          <CardContent className="pt-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
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
                支持 PDF 格式，可同时选择多个文件（最大 {FILE_SIZE_LIMIT / 1024 / 1024}MB）
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
                    共 {pdfFiles.length} 个文件 · 所有数据已合并到全局 Excel 文件
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadGlobalExcel}
                    disabled={!allCompleted || hasProcessing}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载全局 Excel
                  </Button>
                  <Dialog open={showHistory} onOpenChange={setShowHistory}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <History className="h-4 w-4 mr-2" />
                        历史记录
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          上传历史记录
                        </DialogTitle>
                        <DialogDescription>
                          查看所有已上传的 PDF 文件记录
                        </DialogDescription>
                      </DialogHeader>
                      <div className="max-h-[500px] overflow-y-auto">
                        {history.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">暂无历史记录</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>文件名</TableHead>
                                <TableHead>上传时间</TableHead>
                                <TableHead>状态</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {history.map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{record.filename}</TableCell>
                                  <TableCell>{new Date(record.uploadTime).toLocaleString('zh-CN')}</TableCell>
                                  <TableCell>
                                    {record.status === 'completed' ? (
                                      <Badge variant="outline">已完成</Badge>
                                    ) : (
                                      <Badge variant="destructive">失败</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  {pdfFiles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                    >
                      <X className="h-4 w-4 mr-2" />
                      清空
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pdfFiles.map((file) => (
                  <div
                    key={file.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
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
                          {file.errorMessage && (
                            <p className="text-xs text-destructive mt-1">
                              错误: {file.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 字段提取结果表格 */}
                    {file.extractedFields.length > 0 && (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">字段名称</TableHead>
                              <TableHead>字段内容</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {file.extractedFields.map((field, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {FIELD_DISPLAY_NAMES[field.fieldName] || field.fieldName}
                                </TableCell>
                                <TableCell className="max-w-md truncate">
                                  {field.fieldValue || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {file.status === 'processing' && (
                      <Alert>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <AlertDescription className="text-xs">
                          正在解析 PDF 并提取字段...
                        </AlertDescription>
                      </Alert>
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
                  上传 PDF 文件后，系统将自动提取字段并合并到全局 Excel 文件
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
