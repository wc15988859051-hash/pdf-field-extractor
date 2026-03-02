# 🚀 针对你的情况：图形界面部署指南

既然你的 NAS 只支持图形界面 Docker 管理工具，我为你准备了专门的操作指南。

---

## 📦 第一步：下载部署包

**文件位置**：`/workspace/projects/pdf-extractor-complete-deploy-package-v2.tar.gz`（538KB）

下载这个文件到你的电脑。

---

## 📂 第二步：解压文件

在你的电脑上解压这个压缩包，你会看到：

```
pdf-extractor-nas.tar.gz       ← 主程序包
README.md                      ← 总览
QUICK-GUI-GUIDE.md            ← ⭐ 图形界面快速指南（重点看这个！）
GUI-DETAILED-GUIDE.md         ← 详细图形界面指南
QUICK-START.md                ← SSH 部署指南（你不需要）
NAS-DEPLOYMENT-GUIDE.md       ← 详细 SSH 指南（你不需要）
```

---

## 📖 第三步：阅读指南

**强烈建议你先阅读**：`QUICK-GUI-GUIDE.md`

这个文件包含：
- ✅ 6 步完成部署
- ✅ 每步都有流程图
- ✅ 清晰的操作指引
- ✅ 快速故障排查

---

## 🎯 6 步快速部署（超简化）

### 步骤 1️⃣：准备文件
```
1. 解压 pdf-extractor-complete-deploy-package-v2.tar.gz
2. 再解压里面的 pdf-extractor-nas.tar.gz
3. 你会看到很多文件和文件夹
```

### 步骤 2️⃣：上传到 NAS
```
1. 打开 NAS 文件管理器
2. 创建目录：/volume1/docker/pdf-extractor/
3. 创建子目录：
   - /volume1/docker/pdf-extractor/data/
   - /volume1/docker/pdf-extractor/temp/
4. 上传所有文件到 /volume1/docker/pdf-extractor/
```

### 步骤 3️⃣：创建 Compose 项目
```
1. 打开 Docker 管理界面（你的截图界面）
2. 点击左侧菜单的 "Compose"
3. 点击 "创建" 按钮
4. 填写：
   - 项目名称: pdf-extractor
   - 路径: /volume1/docker/pdf-extractor
   - Docker Compose 文件: docker-compose.yml
5. 点击 "保存"
```

### 步骤 4️⃣：构建镜像（⏱️ 5-10 分钟）
```
1. 在 Compose 项目列表中找到 pdf-extractor
2. 点击项目右侧的 "..." 或 "操作" 按钮
3. 选择 "构建" 或 "Build"
4. 等待构建完成（首次较慢）
5. 看到 "成功" 提示
```

### 步骤 5️⃣：启动容器
```
1. 点击 "..." 或 "操作" 按钮
2. 选择 "启动" 或 "Start"
3. 等待几秒钟
4. 进入 "容器" 菜单查看状态
5. 确认状态为 "运行中"
```

### 步骤 6️⃣：测试访问
```
1. 打开浏览器
2. 输入: http://your-nas-ip:5000
3. 将 your-nas-ip 替换成你的 NAS IP
   例如: http://192.168.1.100:5000
4. 应该能看到应用界面
5. 上传一个 PDF 测试功能
```

---

## ⚠️ 关键提示

1. **首次构建慢**：第一次需要 5-10 分钟下载镜像，正常现象
2. **不要中断**：构建过程中不要关闭浏览器
3. **查看日志**：如果出错，查看容器日志
4. **耐心等待**：整个过程可能需要 10-15 分钟

---

## 🔧 需要帮助？

### 如果找不到 "Compose" 菜单

你的 Docker 管理界面可能名称不同，尝试查找：
- "项目"
- "项目组"
- "堆栈"
- "Stack"

如果都没有，请告诉我你的界面有哪些菜单，我会帮你调整指南。

### 如果构建失败

1. 检查网络连接（需要下载镜像）
2. 确认所有文件都已上传
3. 检查 NAS 存储空间（至少 2GB）
4. 查看构建日志中的错误信息

### 如果无法访问应用

1. 确认容器在运行
2. 检查防火墙是否开放端口 5000
3. 确认端口映射正确（5000:5000）
4. 在 NAS 内部测试：http://localhost:5000

---

## 📚 详细文档

- **QUICK-GUI-GUIDE.md** - 快速开始（6 步）
- **GUI-DETAILED-GUIDE.md** - 详细说明
- **README.md** - 总览

---

## 🎉 成功标志

部署成功后，你应该能：
- ✅ 在 Docker 管理界面看到容器状态为"运行中"
- ✅ 在浏览器访问 http://your-nas-ip:5000
- ✅ 看到 PDF 字段提取应用界面
- ✅ 上传 PDF 并提取字段
- ✅ 下载 Excel 文件

---

## 💬 现在开始吧！

1. 下载 `/workspace/projects/pdf-extractor-complete-deploy-package-v2.tar.gz`
2. 解压并阅读 `QUICK-GUI-GUIDE.md`
3. 按照 6 步操作
4. 完成部署！

如果遇到任何问题，随时告诉我：
- 你在哪一步卡住了
- 看到了什么错误信息
- 你的 Docker 界面有哪些菜单选项

我会帮你解决！🚀
