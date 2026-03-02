# 极空间部署 - 快速开始 🚀

这是极空间部署的快速版本，适合想快速上手的用户。

---

## ⚡ 5 分钟快速部署

### 第一步：准备文件

1. 在电脑上创建文件夹 `pdf-field-extractor`
2. 将以下文件放入该文件夹：

**必需文件（从项目导出）：**
- ✅ `docker-compose.zima.yml` （极空间专用配置）
- ✅ `Dockerfile` 或 `Dockerfile.nas` （根据架构选择）
- ✅ `package.json`
- ✅ `pnpm-lock.yaml`
- ✅ `next.config.ts`
- ✅ `src/` 文件夹（完整）
- ✅ `projects/` 文件夹（完整）
- ✅ `public/` 文件夹（完整）

### 第二步：上传到极空间

1. 打开极空间网页版或客户端
2. 进入 **文件管理**
3. 创建文件夹：`/docker/pdf-field-extractor`
4. 将所有文件上传到该文件夹

### 第三步：在 Docker Manager 中部署

1. 打开极空间的 **Docker Manager** 应用
2. 点击左侧 **容器** → **+** 创建
3. 选择 **从 Docker Compose 创建**
4. 项目名称：`pdf-field-extractor`
5. 项目路径：选择 `/docker/pdf-field-extractor`
6. 修改配置文件名为：`docker-compose.zima.yml`
7. 点击 **完成**

### 第四步：等待构建

- 首次构建需要 **10-20 分钟**
- 可以在 Docker Manager 查看进度
- 构建完成后自动启动

### 第五步：访问应用

打开浏览器访问：`http://极空间IP:5000`

**极空间 IP 查找：**
- 极空间桌面 → 设置 → 系统信息 → 查看网络 IP

---

## 🎯 选择正确的 Dockerfile

### 检查极空间架构

**方法 1：查看型号**
- **ZimaBoard** → 使用 `Dockerfile`
- **ZimaNAS** → 可能使用 `Dockerfile.nas`（ARM64）

**方法 2：SSH 确认**
```bash
ssh admin@极空间IP
uname -m
```

**结果：**
- `x86_64` → 使用 `Dockerfile`
- `aarch64` 或 `arm64` → 使用 `Dockerfile.nas`

### 修改 docker-compose.zima.yml

如果你使用的是 `Dockerfile`（x86_64），修改配置文件：

```yaml
build:
  context: .
  dockerfile: Dockerfile  # 去掉 .nas
```

如果你使用的是 `Dockerfile.nas`（ARM64），保持不变。

---

## ✅ 验证部署

部署完成后，执行以下检查：

1. **检查容器状态**
   - 打开 Docker Manager
   - 查看 `pdf-field-extractor` 状态是否为"运行中"

2. **查看日志**
   - 点击容器名称
   - 点击 **日志** 标签
   - 确认无错误信息

3. **访问应用**
   - 打开浏览器
   - 输入：`http://极空间IP:5000`
   - 应该能看到应用界面

4. **测试功能**
   - 上传一个 PDF 文件
   - 检查字段提取结果
   - 下载 Excel 文件

---

## 🐛 常见问题快速解决

### 问题：构建失败

**可能原因：**
- 网络超时
- 架构不匹配

**解决方案：**
1. 使用 `Dockerfile.nas`（包含国内镜像源）
2. 确认 Dockerfile 与架构匹配
3. 检查网络连接

### 问题：无法访问应用

**检查：**
- [ ] 容器是否运行
- [ ] IP 地址是否正确
- [ ] 防火墙是否阻止端口

**解决方案：**
```bash
# SSH 连接后执行
docker ps  # 查看容器状态
docker logs pdf-field-extractor  # 查看日志
```

### 问题：端口 5000 被占用

**解决方案：**
修改 `docker-compose.zima.yml`:
```yaml
ports:
  - "8080:5000"  # 改为 8080
```
访问地址：`http://极空间IP:8080`

---

## 📋 上传文件清单

在部署前，确保已上传所有文件：

```
/docker/pdf-field-extractor/
├── docker-compose.zima.yml  ✅ 必需
├── Dockerfile 或 Dockerfile.nas  ✅ 必需
├── package.json  ✅ 必需
├── pnpm-lock.yaml  ✅ 必需
├── next.config.ts  ✅ 必需
├── src/  ✅ 必需（完整目录）
│   ├── app/
│   ├── components/
│   └── lib/
├── projects/  ✅ 必需（完整目录）
│   └── pdf-field-extractor/
│       ├── scripts/
│       └── assets/
└── public/  ✅ 必需（完整目录）
```

---

## 🎉 部署成功！

完成后：
1. 访问应用：`http://极空间IP:5000`
2. 开始使用 PDF 字段提取功能
3. 可选：在极空间桌面添加快捷方式

### 添加快捷方式（可选）

1. 打开极空间桌面
2. 点击 **+** 添加应用
3. 选择 **网站**
4. 名称：`PDF 提取器`
5. URL：`http://极空间IP:5000`
6. 保存，即可在桌面快速访问

---

## 📚 详细文档

如果需要更详细的说明，请查看：

- **完整部署指南**: [ZIMA_DEPLOYMENT.md](./ZIMA_DEPLOYMENT.md)
- **常见问题**: [NAS_DOCKER_DEPLOYMENT.md](./NAS_DOCKER_DEPLOYMENT.md)
- **快速参考**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

## 💡 提示

1. **首次构建时间长**：请耐心等待 10-20 分钟
2. **使用国内镜像**：`Dockerfile.nas` 包含国内镜像源，速度更快
3. **数据持久化**：docker-compose.zima.yml 已配置数据卷，数据不会丢失
4. **定时更新**：定期更新应用以获得新功能

---

**快速部署版本 | 适用于极空间用户**

如有问题，请查看完整文档或告诉我！
