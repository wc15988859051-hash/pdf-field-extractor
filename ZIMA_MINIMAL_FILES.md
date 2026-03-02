# 🚀 极空间部署 - 极简文件清单

## ✅ 只需导出 8 个文件/文件夹

```
1. Dockerfile.nas                    (1个文件)
2. docker-compose.zima.yml           (1个文件)
3. .dockerignore                     (1个文件)
4. package.json                      (1个文件)
5. pnpm-lock.yaml                    (1个文件)
6. next.config.ts                    (1个文件)
7. src/                              (1个目录)
8. projects/pdf-field-extractor/     (1个目录)
```

**总计：8 项，约 1-2 MB**

---

## 📁 详细结构

```
你需要上传的文件：
├── Dockerfile.nas
├── docker-compose.zima.yml
├── .dockerignore
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
└── projects/
    └── pdf-field-extractor/
        ├── scripts/
        │   ├── parse_pdf.py
        │   └── export_to_excel.py
        └── assets/
            └── template.xlsx
```

---

## ❌ 不需要上传

- ❌ projects/assets/ （根目录的）
- ❌ projects/requirements.txt
- ❌ node_modules/
- ❌ .next/
- ❌ 所有 .md 文档
- ❌ scripts/ （根目录的）
- ❌ nas-deploy.sh
- ❌ 其他文档和配置

---

## 🎯 一句话总结

**只需要导出：Dockerfile.nas、docker-compose.zima.yml、.dockerignore、package.json、pnpm-lock.yaml、next.config.ts、src/、projects/pdf-field-extractor/ 这 8 项！**

就这么简单！🎉
