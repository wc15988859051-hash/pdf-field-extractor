'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, RefreshCw, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ExtractedField {
  fieldName: string;
  fieldValue: string;
}

interface PDFFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  extractedFields: ExtractedField[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

interface HistoryRecord {
  filename: string;
  uploadTime: string;
  status: 'completed' | 'error';
}

interface HealthCheck {
  status: string;
  timestamp: string;
  checks: Record<string, any>;
}

// 默认字段映射（后续可由用户配置）
const DEFAULT_FIELDS = ['文档标题', '文档作者', '创建日期', '页数'];

export default function PDFExtractorPage() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'ok' | 'error' | 'checking'>('checking');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<HealthCheck | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);

  // 检查服务健康状态
  const checkHealth = async () => {
    setHealthStatus('checking');
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data.status === 'ok' ? 'ok' : 'error');
      console.log('健康检查结果:', data);
    } catch (error) {
      setHealthStatus('error');
      console.error('健康检查失败:', error);
    }
  };

  // 获取诊断信息
  const getDiagnostics = async () => {
    setIsLoadingDiagnostics(true);
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      setDiagnosticsData(data);
      setShowDiagnostics(true);
    } catch (error) {
      console.error('获取诊断信息失败:', error);
      alert('获取诊断信息失败');
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  // 页面加载时检查健康状态
  useEffect(() => {
    checkHealth();
    // 每 60 秒检查一次
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('pdfUploadHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('加载历史记录失败:', error);
      }
    }
  }, []);

  // 保存历史记录到 localStorage
  const saveHistory = (newRecord: HistoryRecord) => {
    const updatedHistory = [newRecord, ...history].slice(0, 50); // 只保留最近 50 条
    setHistory(updatedHistory);
    localStorage.setItem('pdfUploadHistory', JSON.stringify(updatedHistory));
  };

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const uploadedFiles = Array.from(files).filter(file => file.type === 'application/pdf');

    // 创建新的文件对象，状态为 processing
    const newFiles: PDFFile[] = uploadedFiles.map(file => {
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
    for (const file of uploadedFiles) {
      await processPDF(file);
    }
  }, [pdfFiles]);

  // 处理单个 PDF 文件
  const processPDF = async (file: File) => {
    console.log(`开始处理文件: ${file.name}`);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      console.log(`文件 ${file.name} 的响应状态:`, response.status, response.statusText);
      console.log(`响应类型:`, response.headers.get('content-type'));

      // 先读取响应文本（只能读取一次）
      let responseText;
      try {
        responseText = await response.text();
        console.log(`文件 ${file.name} 的响应内容:`, responseText);
      } catch (textError) {
        console.error('读取响应内容失败:', textError);
        throw new Error('无法读取服务器响应');
      }

      // 检查响应是否成功
      if (!response.ok) {
        // 尝试从文本中解析错误信息
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails: any = null;

        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details;
        } catch (jsonError) {
          // 如果无法解析 JSON，使用原始文本（截断以避免太长）
          errorMessage = `HTTP ${response.status}: ${responseText.substring(0, 200)}`;
        }

        console.error(`文件 ${file.name} 解析失败:`, errorMessage);
        console.error('错误详情:', errorDetails);

        // 如果有错误详情，显示更多信息
        if (errorDetails && errorDetails.type) {
          errorMessage += ` (类型: ${errorDetails.type})`;
        }

        throw new Error(errorMessage);
      }

      // 解析成功的响应
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON 解析失败:', jsonError);
        console.error('响应内容:', responseText);
        throw new Error('服务器返回了无效的响应格式');
      }

      if (!result.success) {
        throw new Error(result.message || '解析失败');
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
  };

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

  // 下载全局 Excel 文件
  const downloadGlobalExcel = async () => {
    try {
      const response = await fetch('/api/export-excel');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '下载失败');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_data_${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载 Excel 失败:', error);
      alert('下载 Excel 失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            PDF 字段提取与 Excel 合并
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            上传PDF文件，自动提取业务字段并合并到同一个 Excel 表格
          </p>

          {/* 健康状态栏 */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {healthStatus === 'checking' ? (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                正在检查服务状态...
              </Badge>
            ) : healthStatus === 'ok' ? (
              <>
                <Badge variant="default" className="gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  服务正常
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={getDiagnostics}
                  disabled={isLoadingDiagnostics}
                >
                  {isLoadingDiagnostics ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    '系统诊断'
                  )}
                </Button>
              </>
            ) : (
              <>
                <Badge variant="destructive" className="gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  服务异常 - <Button variant="ghost" size="sm" className="h-4 px-2 -mx-2 -my-1 text-white hover:text-white" onClick={checkHealth}>刷新</Button>
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-red-400 hover:text-red-300"
                  onClick={getDiagnostics}
                  disabled={isLoadingDiagnostics}
                >
                  {isLoadingDiagnostics ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    '系统诊断'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 上传区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              上传PDF文件
            </CardTitle>
            <CardDescription>
              支持单个或多个PDF文件上传，所有数据将自动合并到同一个 Excel 表格中
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
                    共 {pdfFiles.length} 个文件 · 所有数据已合并到全局 Excel 文件
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadGlobalExcel}
                    disabled={!pdfFiles.every(f => f.status === 'completed')}
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
                                <TableCell className="font-medium">{field.fieldName}</TableCell>
                                <TableCell className="max-w-md truncate">{field.fieldValue || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {file.status === 'processing' && (
                      <Alert>
                        <RefreshCw className="h-4 w-4" />
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
                  上传PDF文件后，系统将自动提取字段并合并到全局 Excel 文件
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 系统诊断对话框 */}
      <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              系统诊断
            </DialogTitle>
            <DialogDescription>
              查看系统各组件的运行状态
            </DialogDescription>
          </DialogHeader>
          {diagnosticsData ? (
            <div className="space-y-4">
              {/* 整体状态 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">整体状态:</span>
                <Badge variant={diagnosticsData.status === 'healthy' ? 'default' : 'destructive'}>
                  {diagnosticsData.status === 'healthy' ? '正常' : '异常'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(diagnosticsData.timestamp).toLocaleString('zh-CN')}
                </span>
              </div>

              {/* 详细检查项 */}
              <div className="space-y-2">
                {Object.entries(diagnosticsData.checks).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {value.status === 'ok' ? (
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                      )}
                      <span className="text-sm font-medium">{key}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant={value.status === 'ok' ? 'outline' : 'destructive'}>
                        {value.status}
                      </Badge>
                      {value.version && (
                        <div className="text-xs text-muted-foreground mt-1">{value.version}</div>
                      )}
                      {value.path && (
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                          {value.path}
                        </div>
                      )}
                      {value.error && (
                        <div className="text-xs text-destructive mt-1">{value.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
