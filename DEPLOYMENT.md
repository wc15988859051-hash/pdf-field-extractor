# 部署指南

## 部署环境要求

### Python 依赖
- Python 3.12+
- PyMuPDF==1.23.26
- openpyxl==3.1.5

### Node.js 依赖
- Node.js 18+
- pnpm

## 部署前检查清单

### 1. 确保文件结构正确
以下文件必须存在于项目中：
```
src/app/api/parse-pdf/
├── route.ts
├── scripts/
│   ├── parse_pdf.py
│   └── export_to_excel.py
└── assets/
    └── template.xlsx
```

### 2. 安装 Python 依赖
```bash
pip3 install PyMuPDF==1.23.26 openpyxl==3.1.5
```

### 3. 验证 Python 脚本可执行
```bash
python3 src/app/api/parse-pdf/scripts/parse_pdf.py --help
python3 src/app/api/parse-pdf/scripts/export_to_excel.py --help
```

## 部署到 Vercel

### 步骤 1: 准备代码
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 步骤 2: 部署到 Vercel
1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 选择你的 GitHub 仓库
5. 点击 "Deploy"

### 步骤 3: 配置环境变量（如需要）
在 Vercel 项目设置中添加环境变量。

### 步骤 4: 绑定自定义域名
1. 在项目设置中添加域名
2. 配置 DNS：`CNAME` 指向 `cname.vercel-dns.com`

## 部署到云服务器

### 步骤 1: 购买云服务器
- 推荐配置：2核2G，20GB SSD
- 系统：Ubuntu 22.04 LTS

### 步骤 2: 连接服务器
```bash
ssh root@your-server-ip
```

### 步骤 3: 安装依赖
```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 18+ (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装 pnpm
npm install -g pnpm

# 安装 Python 3.12
apt install python3.12 python3.12-venv -y

# 安装 Python 依赖
pip3 install PyMuPDF==1.23.26 openpyxl==3.1.5
```

### 步骤 4: 上传代码
```bash
# 在本地执行
scp -r ./src root@your-server-ip:/var/www/pdf-extractor/
scp -r ./public root@your-server-ip:/var/www/pdf-extractor/
scp package.json pnpm-lock.yaml root@your-server-ip:/var/www/pdf-extractor/
```

### 步骤 5: 安装项目依赖
```bash
cd /var/www/pdf-extractor
pnpm install
```

### 步骤 6: 构建项目
```bash
pnpm run build
```

### 步骤 7: 使用 PM2 启动服务
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start pnpm --name "pdf-extractor" -- run start

# 查看日志
pm2 logs pdf-extractor

# 设置开机自启
pm2 startup
pm2 save
```

### 步骤 8: 配置 Nginx 反向代理
```bash
# 安装 Nginx
apt install nginx -y

# 创建配置文件
nano /etc/nginx/sites-available/pdf-extractor
```

**Nginx 配置内容：**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
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

**启用配置：**
```bash
ln -s /etc/nginx/sites-available/pdf-extractor /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 步骤 9: 配置 SSL 证书（HTTPS）
```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 自动配置 HTTPS
certbot --nginx -d your-domain.com
```

## 常见问题排查

### 问题 1: Python 脚本找不到
**错误**: `No such file or directory: '/workspace/projects/projects/pdf-field-extractor/scripts/parse_pdf.py'`

**解决方案**:
1. 确保脚本文件已复制到 `src/app/api/parse-pdf/scripts/` 目录
2. 检查文件路径是否正确
3. 验证文件权限是否可执行

### 问题 2: Python 依赖缺失
**错误**: `ModuleNotFoundError: No module named 'fitz'`

**解决方案**:
```bash
pip3 install PyMuPDF==1.23.26 openpyxl==3.1.5
```

### 问题 3: 文件上传失败
**错误**: `ENOENT: no such file or directory, open '/tmp/pdfs/xxx.pdf'`

**解决方案**:
1. 确保 `/tmp/pdfs` 目录存在
2. 检查目录权限
3. 确保应用有写入权限

### 问题 4: 内存不足
**错误**: `JavaScript heap out of memory`

**解决方案**:
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 性能优化建议

### 1. 使用 CDN 加速静态资源
- 将 `public/` 目录中的文件上传到 CDN
- 配置域名指向 CDN

### 2. 启用 Gzip 压缩
```javascript
// next.config.js
module.exports = {
  compress: true,
}
```

### 3. 缓存优化
- 配置浏览器缓存
- 使用 Redis 缓存 PDF 解析结果

### 4. 负载均衡
- 使用 Nginx 负载均衡
- 部署多个应用实例

## 安全建议

1. **使用 HTTPS** - 所有生产环境必须启用 SSL
2. **配置防火墙** - 只开放必要端口（80, 443）
3. **文件上传限制** - 限制文件大小和类型
4. **输入验证** - 验证所有用户输入
5. **定期更新** - 保持系统和依赖包更新
6. **备份策略** - 定期备份数据和配置
7. **监控日志** - 设置异常告警

## 监控和日志

### 应用日志
```bash
# 查看 PM2 日志
pm2 logs pdf-extractor

# 查看系统日志
tail -f /var/log/nginx/error.log
```

### 性能监控
- 使用 New Relic 或 Datadog 监控应用性能
- 配置告警规则

## 成本估算

### 使用 Vercel（推荐）
- **免费套餐**:
  - 100GB 带宽/月
  - 无限部署
  - 6,000 分钟构建时间/月
- **Pro 套餐**: $20/月

### 使用云服务器
- **阿里云/腾讯云**: ~¥30-50/月
- **AWS/DigitalOcean**: $5-10/月

### 域名费用
- .com 域名: $10-15/年
- .cn 域名: ¥20-50/年

## 技术支持

如遇到部署问题，请检查：
1. 日志文件
2. 服务器资源使用情况
3. 网络连接
4. 配置文件

---

**最后更新**: 2026-03-02
