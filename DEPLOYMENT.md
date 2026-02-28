# 部署指南：私人 NAS 部署

## 项目概述
- 项目名称：PDF 字段提取应用
- 技术栈：Next.js 16 + Python 3.12
- 端口：5000

## 系统要求

### 必需软件
1. **Node.js 24+** (建议使用 nvm 或 n 安装)
2. **Python 3.12** (必须)
3. **pnpm** (包管理器)
4. **Git** (可选，用于版本控制)

## 部署步骤

### 第一步：准备项目文件

在 NAS 上创建工作目录：
```bash
mkdir -p /path/to/your/nas/project
cd /path/to/your/nas/project
```

### 第二步：复制项目文件

将以下文件/目录从当前环境复制到 NAS：

#### 必需文件列表
```
project/
├── src/                    # 源代码目录
│   ├── app/
│   │   ├── api/
│   │   │   ├── parse-pdf/route.ts
│   │   │   └── export-excel/route.ts
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/            # shadcn/ui 组件
│   └── lib/
├── public/                # 静态资源
├── projects/              # Python 脚本目录
│   └── pdf-field-extractor/
│       ├── scripts/
│       │   └── export_to_excel.py
│       └── SKILL.md
├── .coze                  # 项目配置文件（重要！）
├── package.json           # Node.js 依赖配置
├── tsconfig.json          # TypeScript 配置
├── next.config.mjs        # Next.js 配置
├── tailwind.config.ts     # Tailwind 配置
└── postcss.config.mjs     # PostCSS 配置
```

#### 复制方法
```bash
# 方法1：使用 scp 从本地复制
scp -r /workspace/projects/* user@nas-ip:/path/to/project/

# 方法2：在 NAS 上使用 git clone（如果项目已推送到 git 仓库）
git clone your-repo-url project
```

### 第三步：安装依赖

#### 安装 Node.js 依赖
```bash
cd /path/to/your/nas/project
pnpm install
```

#### 安装 Python 依赖
```bash
# 确保使用 Python 3.12
python3.12 -m venv venv
source venv/bin/activate

pip install PyMuPDF==1.23.26 openpyxl==3.1.5
```

### 第四步：配置环境变量（可选）

如果需要自定义配置，可以创建 `.env.local` 文件：
```bash
# 在项目根目录创建
touch .env.local

# 添加配置（根据需要）
# NEXT_PUBLIC_API_URL=your-api-url
```

### 第五步：启动服务

#### 开发模式（用于测试）
```bash
cd /path/to/your/nas/project
pnpm run dev
```

#### 生产模式（推荐）
```bash
cd /path/to/your/nas/project
pnpm run build
pnpm run start
```

### 第六步：配置反向代理（可选但推荐）

如果 NAS 已运行 Nginx 或 Apache，配置反向代理：

#### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-nas-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

保存后重启 Nginx：
```bash
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

### 第七步：设置开机自启（可选）

#### 使用 systemd 服务（推荐 Linux NAS）
创建服务文件 `/etc/systemd/system/pdf-extractor.service`：
```ini
[Unit]
Description=PDF Field Extractor Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/nas/project
ExecStart=/path/to/pnpm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable pdf-extractor
sudo systemctl start pdf-extractor
sudo systemctl status pdf-extractor
```

#### 使用 Docker（备选方案）
创建 `Dockerfile`：
```dockerfile
FROM node:24

# 安装 Python 3.12
RUN apt-get update && apt-get install -y python3.12 python3.12-venv

WORKDIR /app

# 复制 package.json
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# 复制项目文件
COPY . .

# 安装 Python 依赖
RUN python3.12 -m venv venv && \
    source venv/bin/activate && \
    pip install PyMuPDF==1.23.26 openpyxl==3.1.5

# 构建项目
RUN pnpm run build

EXPOSE 5000

CMD ["pnpm", "run", "start"]
```

构建和运行：
```bash
docker build -t pdf-extractor .
docker run -d -p 5000:5000 --name pdf-extractor pdf-extractor
```

## 常见问题排查

### 1. 端口被占用
```bash
# 检查端口占用
lsof -i:5000
# 或
netstat -tulpn | grep 5000

# 修改端口（编辑 next.config.mjs 或 .coze 文件）
```

### 2. Python 依赖安装失败
```bash
# 确保使用正确的 Python 版本
python3.12 --version

# 如果没有 pip
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3.12 get-pip.py
```

### 3. 权限问题
```bash
# 确保有写入 /tmp 目录的权限
chmod 755 /tmp/extracted 2>/dev/null || sudo mkdir -p /tmp/extracted
sudo chown your-username /tmp/extracted
```

### 4. 查看日志
```bash
# 开发模式日志直接在终端
# 生产模式日志
tail -f /path/to/project/.next/server/logs/*.log

# systemd 服务日志
sudo journalctl -u pdf-extractor -f
```

## 性能优化建议

1. **增加内存限制**：在 `.coze` 文件或启动脚本中设置 Node.js 内存限制
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm run start
   ```

2. **配置缓存**：为上传的 PDF 文件添加缓存机制

3. **使用 CDN**：如果需要外部访问，可以将静态文件部署到 CDN

## 安全建议

1. **配置防火墙**：仅允许特定 IP 访问 5000 端口
2. **启用 HTTPS**：使用 Let's Encrypt 免费证书
3. **添加认证**：在应用层添加用户登录功能
4. **定期备份**：备份上传的 PDF 文件和提取的数据

## 访问方式

部署成功后，可以通过以下方式访问：
- **本地访问**：http://nas-ip:5000
- **域名访问**：http://your-domain.com（配置了反向代理）
- **内网穿透**：使用 frp、ngrok 等工具（如需外网访问）

## 持续更新

如果需要更新项目：
```bash
cd /path/to/your/nas/project
git pull  # 如果使用 git
# 或手动复制新文件

# 重新安装依赖（如有变化）
pnpm install
source venv/bin/activate
pip install -r requirements.txt  # 如有变化

# 重新构建
pnpm run build

# 重启服务
sudo systemctl restart pdf-extractor
```

---

**部署完成后，请访问 http://your-nas-ip:5000 测试应用！**
