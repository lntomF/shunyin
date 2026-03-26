# SHUNYIN

一个基于 Vite + React + Tailwind 的摄影水印与导出流程演示项目。

## 功能

- 导入页：展示最近会话与入口操作
- 编辑页：可编辑 EXIF 信息、切换预览模式、选择样式模板
- 样式页：样式模板选择与最近导出信息联动
- 导出页：可配置文件名、格式、质量并查看导出摘要

## 本地运行

前置要求：Node.js 20+

1. 安装依赖

```bash
npm install
```

2. 启动开发环境

```bash
npm run dev
```

默认访问地址：`http://localhost:3000`

## 常用脚本

```bash
npm run dev        # 开发模式
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm run typecheck  # TypeScript 类型检查
npm run clean      # 删除 dist 目录（跨平台）
```

## 目录结构

```text
src/
   components/
      views/
   data/
   i18n/
   types/
```

## 说明

- 当前为前端演示流程，未接入真实上传、后端存储和实际图像处理。
- 若需要生产可用版本，建议下一步接入文件上传管线与持久化存储。
