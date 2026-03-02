# projects

这是一个基于 [Next.js 16](https://nextjs.org) + [shadcn/ui](https://ui.shadcn.com) 的全栈应用项目，由扣子编程 CLI 创建。

## 快速开始

### 启动开发服务器

```bash
coze dev
```

启动后，在浏览器中打开 [http://localhost:5000](http://localhost:5000) 查看应用。

开发服务器支持热更新，修改代码后页面会自动刷新。

### 构建生产版本

```bash
coze build
```

### 启动生产服务器

```bash
coze start
```

## 项目结构

```
src/
├── app/                      # Next.js App Router 目录
│   ├── layout.tsx           # 根布局组件
│   ├── page.tsx             # 首页
│   ├── globals.css          # 全局样式（包含 shadcn 主题变量）
│   └── [route]/             # 其他路由页面
├── components/              # React 组件目录
│   └── ui/                  # shadcn/ui 基础组件（优先使用）
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/                     # 工具函数库
│   └── utils.ts            # cn() 等工具函数
└── hooks/                   # 自定义 React Hooks（可选）
```

## 核心开发规范

### 1. 组件开发

**优先使用 shadcn/ui 基础组件**

本项目已预装完整的 shadcn/ui 组件库，位于 `src/components/ui/` 目录。开发时应优先使用这些组件作为基础：

```tsx
// ✅ 推荐：使用 shadcn 基础组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>标题</CardHeader>
      <CardContent>
        <Input placeholder="输入内容" />
        <Button>提交</Button>
      </CardContent>
    </Card>
  );
}
```

**可用的 shadcn 组件清单**

- 表单：`button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`
- 布局：`card`, `separator`, `tabs`, `accordion`, `collapsible`, `scroll-area`
- 反馈：`alert`, `alert-dialog`, `dialog`, `toast`, `sonner`, `progress`
- 导航：`dropdown-menu`, `menubar`, `navigation-menu`, `context-menu`
- 数据展示：`table`, `avatar`, `badge`, `hover-card`, `tooltip`, `popover`
- 其他：`calendar`, `command`, `carousel`, `resizable`, `sidebar`

详见 `src/components/ui/` 目录下的具体组件实现。

### 2. 路由开发

Next.js 使用文件系统路由，在 `src/app/` 目录下创建文件夹即可添加路由：

```bash
# 创建新路由 /about
src/app/about/page.tsx

# 创建动态路由 /posts/[id]
src/app/posts/[id]/page.tsx

# 创建路由组（不影响 URL）
src/app/(marketing)/about/page.tsx

# 创建 API 路由
src/app/api/users/route.ts
```

**页面组件示例**

```tsx
// src/app/about/page.tsx
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '关于我们',
  description: '关于页面描述',
};

export default function AboutPage() {
  return (
    <div>
      <h1>关于我们</h1>
      <Button>了解更多</Button>
    </div>
  );
}
```

**动态路由示例**

```tsx
// src/app/posts/[id]/page.tsx
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <div>文章 ID: {id}</div>;
}
```

**API 路由示例**

```tsx
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ users: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

### 3. 依赖管理

**必须使用 pnpm 管理依赖**

```bash
# ✅ 安装依赖
pnpm install

# ✅ 添加新依赖
pnpm add package-name

# ✅ 添加开发依赖
pnpm add -D package-name

# ❌ 禁止使用 npm 或 yarn
# npm install  # 错误！
# yarn add     # 错误！
```

项目已配置 `preinstall` 脚本，使用其他包管理器会报错。

### 4. 样式开发

**使用 Tailwind CSS v4**

本项目使用 Tailwind CSS v4 进行样式开发，并已配置 shadcn 主题变量。

```tsx
// 使用 Tailwind 类名
<div className="flex items-center gap-4 p-4 rounded-lg bg-background">
  <Button className="bg-primary text-primary-foreground">
    主要按钮
  </Button>
</div>

// 使用 cn() 工具函数合并类名
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className
)}>
  内容
</div>
```

## 部署

### 本地开发

使用 Coze CLI 启动开发服务器：

```bash
coze dev
```

### Docker 部署（推荐 - 极空间）

本项目支持通过 Docker 部署到极空间 NAS。

#### 快速开始

1. **克隆或下载项目**

```bash
git clone https://github.com/YOUR_USERNAME/pdf-field-extractor.git
cd pdf-field-extractor
```

2. **配置环境变量**

复制并编辑环境变量文件：

```bash
cp .env.docker .env
nano .env
```

填写你的 Coze API 凭据：
```bash
COZE_API_KEY=pat_your_api_key_here
COZE_BASE_URL=https://api.coze.cn
COZE_BOT_ID=your_bot_id_here
```

3. **构建并启动容器**

```bash
docker-compose up -d
```

4. **访问应用**

浏览器访问：`http://你的IP:5000`

详细部署步骤请查看 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

#### 极空间 Docker 部署

支持在极空间 Docker 中部署，详细步骤：
- [DOCKER_DEPLOYMENT.md - 方法一：极空间 Docker 部署](./DOCKER_DEPLOYMENT.md#方法一极空间-docker-部署推荐)

### Vercel 部署

⚠️ **注意**：当前项目使用了 Python 脚本，部署到 Vercel 需要先迁移到 Node.js。

详见 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
```

## 部署到 Vercel

本项目支持通过 Git 仓库自动部署到 Vercel。

### 方案选择

⚠️ **重要提示**：当前项目使用了 Python 脚本，需要先迁移到 Node.js 才能在 Vercel 上部署。

**推荐方案：迁移到 Node.js**
- 使用 `pdf-parse` 和 `exceljs` 替代 Python 脚本
- 统一技术栈，部署更简单
- 详细步骤：[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

### 快速部署步骤

#### 1. 创建 Git 远程仓库

在 GitHub 创建一个新仓库，获取仓库 URL：
```
https://github.com/YOUR_USERNAME/pdf-field-extractor.git
```

#### 2. 连接并推送代码

```bash
cd /workspace/projects
git remote add origin https://github.com/YOUR_USERNAME/pdf-field-extractor.git
git branch -M main
git push -u origin main
```

#### 3. 在 Vercel 导入仓库

1. 访问 https://vercel.com 并登录（推荐 GitHub 账号）
2. 点击 **"Add New"** → **"Project"**
3. 找到 `pdf-field-extractor` 仓库，点击 **"Import"**
4. 点击 **"Deploy"** 开始部署

#### 4. 配置环境变量

在 Vercel 项目设置中添加：

| 环境变量 | 值 |
|---------|-----|
| `COZE_API_KEY` | 从 Coze 平台获取 |
| `COZE_BASE_URL` | `https://api.coze.com` |
| `COZE_BOT_ID` | 从 Coze 平台获取 |

#### 5. 重新部署

配置环境变量后，在 **"Deployments"** 页面点击 **"Redeploy"**。

#### 6. 访问应用

部署成功后，访问：
- **Production URL**: `https://pdf-field-extractor.vercel.app`

### 自动部署

配置完成后，每次推送代码到 `main` 分支，Vercel 会自动重新部署：

```bash
git add .
git commit -m "update: 更新功能"
git push
```

### 详细文档

- 📖 [快速开始指南](./QUICKSTART.md) - 简化的部署步骤
- 📘 [完整部署指南](./GIT_AND_VERCEL_DEPLOYMENT.md) - 详细的 Git 和 Vercel 配置
- 📗 [Vercel 部署方案](./VERCEL_DEPLOYMENT.md) - Node.js vs Python 方案对比
- 📙 [环境变量配置](./.env.example) - 环境变量示例

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI**: React 19 + shadcn/ui
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **包管理器**: pnpm
- **PDF 解析**: Python (PyMuPDF) *需要迁移到 Node.js*
- **Excel 导出**: Python (openpyxl) *需要迁移到 Node.js*
- **LLM**: doubao-seed-1-8-251228 (coze-coding-dev-sdk)

## 相关链接

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 组件库](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [Vercel 部署文档](https://vercel.com/docs)

## 许可证

本项目由扣子编程 CLI 创建。
```

## 部署到 Vercel

### 快速部署

1. **安装 Vercel CLI**

```bash
npm install -g vercel
```

2. **登录并部署**

```bash
vercel login
vercel
```

3. **配置环境变量**

在 Vercel 项目设置中添加以下环境变量：

```bash
COZE_API_KEY=your_api_key_here
COZE_BASE_URL=https://api.coze.com
COZE_BOT_ID=your_bot_id_here
```

4. **部署到生产环境**

```bash
vercel --prod
```

详细部署指南请查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
```

**主题变量**

主题变量定义在 `src/app/globals.css` 中，支持亮色/暗色模式：

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### 5. 表单开发

推荐使用 `react-hook-form` + `zod` 进行表单开发：

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  username: z.string().min(2, '用户名至少 2 个字符'),
  email: z.string().email('请输入有效的邮箱'),
});

export default function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', email: '' },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('username')} />
      <Input {...form.register('email')} />
      <Button type="submit">提交</Button>
    </form>
  );
}
```

### 6. 数据获取

**服务端组件（推荐）**

```tsx
// src/app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store', // 或 'force-cache'
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

**客户端组件**

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
```

## 常见开发场景

### 添加新页面

1. 在 `src/app/` 下创建文件夹和 `page.tsx`
2. 使用 shadcn 组件构建 UI
3. 根据需要添加 `layout.tsx` 和 `loading.tsx`

### 创建业务组件

1. 在 `src/components/` 下创建组件文件（非 UI 组件）
2. 优先组合使用 `src/components/ui/` 中的基础组件
3. 使用 TypeScript 定义 Props 类型

### 添加全局状态

推荐使用 React Context 或 Zustand：

```tsx
// src/lib/store.ts
import { create } from 'zustand';

interface Store {
  count: number;
  increment: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 集成数据库

推荐使用 Prisma 或 Drizzle ORM，在 `src/lib/db.ts` 中配置。

## 技术栈

- **框架**: Next.js 16.1.1 (App Router)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS v4
- **图标**: Lucide React
- **包管理器**: pnpm 9+
- **TypeScript**: 5.x
- **PDF 解析**: Python 3.12 + PyMuPDF
- **Excel 导出**: Python 3.12 + openpyxl
- **LLM**: doubao-seed-1-8-251228 (coze-coding-dev-sdk)
- **容器化**: Docker + Docker Compose

## 部署方式

| 方式 | 适用场景 | 推荐度 |
|------|----------|--------|
| **Docker** | 极空间 NAS、本地服务器 | ⭐⭐⭐⭐⭐ |
| **本地开发** | 开发测试 | ⭐⭐⭐⭐⭐ |
| **Vercel** | 云端部署（需迁移到 Node.js） | ⭐⭐⭐ |

## 参考文档

- [Docker 部署指南](./DOCKER_DEPLOYMENT.md) - 极空间 Docker 部署
- [Vercel 部署指南](./VERCEL_DEPLOYMENT.md) - Vercel 部署方案
- [Git 部署指南](./GIT_AND_VERCEL_DEPLOYMENT.md) - Git 仓库配置
- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 组件文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 重要提示

1. **必须使用 pnpm** 作为包管理器
2. **优先使用 shadcn/ui 组件** 而不是从零开发基础组件
3. **遵循 Next.js App Router 规范**，正确区分服务端/客户端组件
4. **使用 TypeScript** 进行类型安全开发
5. **使用 `@/` 路径别名** 导入模块（已配置）
6. **Docker 部署前** 需要配置 `.env` 文件中的 Coze API 凭据
