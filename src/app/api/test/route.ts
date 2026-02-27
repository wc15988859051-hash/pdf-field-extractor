import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();

export async function GET() {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // 检查 Node.js
    health.checks.node = {
      status: 'ok',
      version: process.version,
      platform: process.platform,
    };

    // 检查 Python
    try {
      const pythonVersion = execSync('python3 --version 2>&1 || python --version 2>&1', { encoding: 'utf-8' });
      health.checks.python = {
        status: 'ok',
        version: pythonVersion.trim(),
      };
    } catch (error) {
      health.checks.python = {
        status: 'error',
        error: 'Python not found',
      };
    }

    // 检查 Python 依赖
    const dependencies = ['PyMuPDF', 'openpyxl'];
    for (const dep of dependencies) {
      try {
        const result = execSync(`python3 -c "import ${dep === 'PyMuPDF' ? 'fitz' : dep}; print('OK')" 2>&1`, { encoding: 'utf-8' });
        health.checks[dep] = {
          status: 'ok',
        };
      } catch (error) {
        health.checks[dep] = {
          status: 'missing',
          error: `Module ${dep} not installed`,
        };
      }
    }

    // 检查关键文件
    const files = [
      { name: 'Template Excel', path: join(PROJECT_ROOT, 'public', 'assets', 'template.xlsx') },
      { name: 'Export Script', path: join(PROJECT_ROOT, 'public', 'scripts', 'export_to_excel.py') },
      { name: 'Parse Script', path: join(PROJECT_ROOT, 'public', 'scripts', 'parse_pdf.py') },
    ];

    for (const file of files) {
      health.checks[file.name] = {
        status: existsSync(file.path) ? 'ok' : 'missing',
        path: file.path,
      };
    }

    // 检查目录
    const dirs = ['/tmp/extracted'];
    for (const dir of dirs) {
      health.checks[`Directory: ${dir}`] = {
        status: existsSync(dir) ? 'ok' : 'created',
      };
    }

    // 确定整体状态
    const allChecks = Object.values(health.checks);
    const hasErrors = allChecks.some((check: any) => check.status === 'error' || check.status === 'missing');

    if (hasErrors) {
      health.status = 'degraded';
    }

    return NextResponse.json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error instanceof Error ? error.message : String(error);
    return NextResponse.json(health, { status: 500 });
  }
}
