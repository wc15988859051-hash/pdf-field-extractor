# ==============================================
# PDF 字段提取应用 - 快速开始指南
# ==============================================

## 🚀 3 步快速部署到极空间 NAS

### 第 1 步：准备文件
将以下文件上传到极空间 NAS 的 `/Docker/pdf-extractor/` 目录：

```
✅ Dockerfile
✅ docker-compose.yml
✅ .dockerignore
✅ requirements.txt
✅ package.json
✅ pnpm-lock.yaml
✅ src/ （整个目录）
✅ projects/ （整个目录）
✅ 其他配置文件（next.config.ts, tsconfig.json 等）
```

### 第 2 步：在极空间 Docker 中创建项目
1. 打开极空间 Docker 应用
2. 点击「项目」→「添加」
3. 选择刚才上传的目录 `/Docker/pdf-extractor/`
4. 确认 `docker-compose.yml` 被识别
5. 点击「创建」并等待构建完成（5-15 分钟）

### 第 3 步：访问应用
1. 确认容器 `pdf-extractor-app` 状态为「运行中」
2. 浏览器访问：`http://你的NAS_IP:5000`
3. 完成！🎉

---

## 🌐 配置域名 def-sheild.tech

### 快速配置步骤：

1. **DNS 解析**：在域名服务商处将 `def-sheild.tech` 解析到你的 NAS 公网 IP

2. **端口转发**：在路由器配置转发：外部 80/443 → NAS 5000

3. **反向代理**：在极空间配置反向代理：
   - 来源：`def-sheild.tech:443`
   - 目标：`localhost:5000`
   - 开启 HTTPS 和 Let's Encrypt 证书

4. **完成**：通过 `https://def-sheild.tech` 访问！

---

## 📦 Docker 依赖自动安装

**不需要手动安装任何依赖！** ✅

Docker 构建时会自动安装：

### Python 依赖（自动安装）
- PyMuPDF 1.23.26 - PDF 解析
- openpyxl 3.1.5 - Excel 生成

### Node.js 依赖（自动安装）
- 通过 pnpm install 自动安装所有 package.json 中的依赖

---

## 📖 详细文档

需要更详细的说明？请查看：
- 📄 [DEPLOY.md](./DEPLOY.md) - 完整部署指南
- 📄 [README.md](./README.md) - 项目说明

---

## 💡 提示

- 首次 Docker 构建需要 5-15 分钟，请耐心等待
- 确保 NAS 有至少 2GB 可用内存和 2GB 可用存储空间
- 如果 5000 端口被占用，修改 docker-compose.yml 中的端口映射
- 数据会持久化保存在 Docker 卷中，不用担心数据丢失

祝你使用愉快！🚀
