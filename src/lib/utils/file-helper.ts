/**
 * 文件处理工具
 * 封装文件操作相关的逻辑
 */

import { writeFile, unlink, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { PATHS } from '@/lib/config/constants';

/**
 * 确保目录存在
 * @param dirPath 目录路径
 */
export async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * 初始化临时目录
 */
export async function initTempDirs(): Promise<void> {
  await ensureDir(PATHS.TEMP_DIR);
  await ensureDir(PATHS.PDF_DIR);
  await ensureDir(PATHS.EXTRACTED_DIR);
}

/**
 * 保存上传的文件
 * @param file File 对象
 * @param targetPath 目标路径
 */
export async function saveFile(file: File, targetPath: string): Promise<void> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(targetPath, buffer);
}

/**
 * 删除文件
 * @param filePath 文件路径
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error(`删除文件失败: ${filePath}`, error);
  }
}

/**
 * 读取文件为 Buffer
 * @param filePath 文件路径
 */
export async function readFileAsBuffer(filePath: string): Promise<Buffer> {
  return await readFile(filePath);
}

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 */
export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 验证文件类型
 * @param file File 对象
 * @param allowedTypes 允许的类型数组
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 * @param file File 对象
 * @param maxSize 最大字节数
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}
