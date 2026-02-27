import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const healthStatus: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // 1. 检查 Node.js 版本
    healthStatus.checks.node = {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      status: 'ok'
    };

    // 2. 检查工作目录
    healthStatus.checks.workingDirectory = {
      path: process.cwd(),
      status: 'ok'
    };

    // 3. 检查 Python
    try {
      const { stdout: pythonPath } = await execAsync('which python3');
      const { stdout: pythonVersion } = await execAsync('python3 --version');

      healthStatus.checks.python = {
        path: pythonPath.trim(),
        version: pythonVersion.trim(),
        status: 'ok'
      };

      // 4. 检查 Python 依赖
      try {
        const { stdout: pymupdf } = await execAsync('python3 -c "import fitz; print(fitz.__version__)"');
        const { stdout: openpyxl } = await execAsync('python3 -c "import openpyxl; print(openpyxl.__version__)"');

        healthStatus.checks.pythonDependencies = {
          PyMuPDF: pymupdf.trim(),
          openpyxl: openpyxl.trim(),
          status: 'ok'
        };
      } catch (depError) {
        healthStatus.checks.pythonDependencies = {
          status: 'error',
          error: 'Python dependencies not installed'
        };
        healthStatus.status = 'error';
      }
    } catch (pythonError) {
      healthStatus.checks.python = {
        status: 'error',
        error: 'Python 3 not found'
      };
      healthStatus.status = 'error';
    }

    // 5. 检查必需文件
    const requiredFiles = [
      'public/scripts/parse_pdf.py',
      'public/scripts/export_to_excel.py',
      'public/assets/template.xlsx'
    ];

    const fileChecks: any = {};
    let allFilesExist = true;

    for (const file of requiredFiles) {
      const exists = existsSync(file);
      fileChecks[file] = exists;
      if (!exists) {
        allFilesExist = false;
      }
    }

    healthStatus.checks.requiredFiles = fileChecks;

    if (!allFilesExist) {
      healthStatus.checks.requiredFiles.status = 'error';
      healthStatus.status = 'error';
    } else {
      healthStatus.checks.requiredFiles.status = 'ok';
    }

    // 6. 检查临时目录
    const tempDirs = ['/tmp/pdfs', '/tmp/extracted'];
    const dirChecks: any = {};

    for (const dir of tempDirs) {
      const exists = existsSync(dir);
      dirChecks[dir] = exists ? 'exists' : 'not found (will be created)';
    }

    healthStatus.checks.temporaryDirectories = dirChecks;

  } catch (error) {
    healthStatus.status = 'error';
    healthStatus.error = error instanceof Error ? error.message : String(error);
  }

  const statusCode = healthStatus.status === 'ok' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
}
