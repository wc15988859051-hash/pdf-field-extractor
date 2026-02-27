# 生产环境访问和运维指南

## 重要说明

**通常情况下，您无法直接 SSH 进入生产环境**。

Coze 平托管的 Next.js 应用采用 Serverless 架构，您无法通过 SSH、FTP 或其他方式直接访问生产环境的文件系统。

## 如何管理生产环境

### 方式 1：通过构建脚本配置（推荐）

在生产环境中，所有依赖和配置都应该在构建阶段完成。

**自动安装 Python 依赖**：

您的项目已配置为在构建时自动安装 Python 依赖：

```bash
# 构建时会自动执行以下步骤：
# 1. 安装 Node.js 依赖
# 2. 检测并安装 Python 依赖
# 3. 构建 Next.js 项目
coze build
```

**查看构建脚本**：
- `scripts/build.sh` - 生产环境构建脚本
- `requirements.txt` - Python 依赖列表

### 方式 2：通过健康检查 API 诊断

访问健康检查接口查看环境状态：

```bash
curl https://srmtbdbbpy.coze.site/api/health
```

**响应示例**：
```json
{
  "status": "ok",
  "checks": {
    "pythonDependencies": {
      "status": "error",
      "error": "Python dependencies not installed"
    }
  }
}
```

### 方式 3：通过应用日志诊断

在您的应用中，所有日志都会记录到：
- `/app/work/logs/bypass/app.log`
- `/app/work/logs/bypass/console.log`

**查看日志的方法**：

#### 方法 1：通过 Coze 控制台
1. 登录 Coze 平台
2. 找到您的应用
3. 查看"日志"或"监控"部分

#### 方法 2：通过健康检查
健康检查会返回当前环境的状态，包括：
- Node.js 版本
- Python 版本
- Python 依赖状态
- 文件存在性

#### 方法 3：通过前端显示
您的应用前端会显示服务健康状态：
- 🟢 服务正常
- 🔴 服务异常

### 方式 4：通过环境变量配置

如果需要配置环境变量，可以通过以下方式：

**在 Coze 平台配置**：
1. 登录 Coze 平台
2. 找到您的应用设置
3. 添加环境变量

**常见环境变量**：
```bash
NODE_ENV=production
COZE_API_KEY=your_api_key
```

## 如果需要执行命令怎么办？

如果您需要在生产环境中执行命令（如安装依赖、运行脚本等），应该：

### 方案 1：在构建脚本中添加

修改 `scripts/build.sh`，添加需要执行的命令：

```bash
#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "=== 开始构建项目 ==="

echo "[1/3] 安装 Node.js 依赖..."
pnpm install

echo "[2/3] 安装 Python 依赖..."
pip3 install -r requirements.txt

echo "[3/3] 执行自定义命令..."
# 在这里添加您需要执行的命令
# 例如：
# python3 scripts/migrate.py
# 或者
# npm run custom-script

echo "[4/4] 构建 Next.js 项目..."
npx next build

echo "=== 构建完成 ==="
```

### 方案 2：在启动脚本中添加

修改 `scripts/start.sh`，在启动前执行命令：

```bash
#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# 检查并安装依赖
if ! python3 -c "import fitz" 2>/dev/null; then
  echo "Python 依赖未安装，正在安装..."
  pip3 install -r requirements.txt
fi

# 执行其他命令
# 例如：python3 scripts/init.py

# 启动服务
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT}..."
    npx next start --port ${DEPLOY_RUN_PORT}
}

start_service
```

### 方案 3：通过 API 接口执行

创建一个 API 接口来执行命令（仅用于紧急情况）：

**文件**: `src/app/api/execute/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ⚠️ 警告：这个接口仅用于紧急情况，不要在生产环境使用
export async function POST(request: NextRequest) {
  // 检查是否为开发环境
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: '此接口在生产环境不可用' },
      { status: 403 }
    );
  }

  try {
    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({ error: '未提供命令' }, { status: 400 });
    }

    // 执行命令
    const { stdout, stderr } = await execAsync(command);

    return NextResponse.json({
      success: true,
      stdout,
      stderr,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
```

## 常见运维任务

### 安装 Python 依赖

**在构建阶段安装**（推荐）：
```bash
# 已在 scripts/build.sh 中配置
# 重新构建时会自动安装
coze build
```

### 查看环境状态

**通过健康检查 API**：
```bash
curl https://srmtbdbbpy.coze.site/api/health
```

### 查看日志

**通过 Coze 平台**：
1. 登录 Coze 平台
2. 找到您的应用
3. 查看日志部分

### 更新代码

```bash
# 1. 提交代码
git add .
git commit -m "your message"
git push

# 2. 重新构建和部署
coze build
coze deploy
```

### 回滚版本

如果新版本有问题，可以通过 Coze 平台回滚：
1. 登录 Coze 平台
2. 找到您的应用
3. 查看部署历史
4. 选择之前的版本进行回滚

## 如果真的需要 SSH 访问

如果您确实需要 SSH 访问生产环境，可能需要：

### 联系 Coze 支持

联系 Coze 平台的技术支持，询问是否可以：
- 提供临时 SSH 访问
- 提供其他方式访问文件系统
- 提供更详细的日志访问方式

### 使用自托管方案

如果需要完全控制服务器环境，考虑：
1. 使用 Docker 部署
2. 使用 VPS（如阿里云、腾讯云等）
3. 使用 Kubernetes

## 最佳实践

1. **自动化一切**
   - 所有配置通过脚本完成
   - 所有依赖在构建阶段安装
   - 所有环境通过环境变量配置

2. **使用健康检查**
   - 定期检查 `/api/health`
   - 监控应用状态
   - 及时发现问题

3. **详细日志**
   - 记录所有重要操作
   - 记录错误详情
   - 便于问题排查

4. **环境隔离**
   - 开发环境、测试环境、生产环境分离
   - 不要在生产环境执行测试代码
   - 使用不同的配置

5. **版本控制**
   - 所有代码通过 Git 管理
   - 记录所有更改
   - 便于回滚

## 总结

**关键点**：
- ✅ 无法直接 SSH 进入生产环境
- ✅ 通过构建脚本配置环境
- ✅ 通过健康检查 API 诊断问题
- ✅ 通过日志查看运行状态
- ✅ 通过 Coze 平台管理应用

**如果遇到问题**：
1. 查看健康检查：`/api/health`
2. 查看前端健康状态指示器
3. 查看错误详情
4. 通过构建脚本修复
5. 联系 Coze 支持（如果需要）

**推荐的运维流程**：
1. 在本地测试通过
2. 提交代码到 Git
3. 通过 `coze build` 构建
4. 通过 `coze deploy` 部署
5. 访问应用验证
6. 通过 `/api/health` 检查状态
7. 如果有问题，查看日志并修复
