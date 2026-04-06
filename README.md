# SHUNYIN

SHUNYIN 是一个基于 `Vite + React + TypeScript` 的摄影水印工作台。它支持本地导入图片、编辑 EXIF 展示信息、切换水印模板、导出成片，并可通过 Supabase 实现登录、云端工作区同步和邮件模板接入。

## 功能概览

- 本地优先工作流：导入一张或多张图片，直接在浏览器内完成编辑与导出
- EXIF 展示编辑：可覆盖机身、镜头、光圈、快门、ISO 等字段
- 水印模板预览：在编辑页、样式页、导出页统一预览模板效果
- 导出能力：支持单张导出和批量导出，可选择 `JPG / PNG` 与不同质量档位
- 云端同步：登录后可将当前工作区保存到 Supabase，并跨设备继续打开
- 云端图片删除：支持删除云端工作区或工作区内单张图片
- EXIF 云端持久化：手动改过的 EXIF 覆盖值可随云端工作区一起保存
- 本地原图恢复：导入后的原图会缓存到浏览器 `IndexedDB`，刷新页面后导出仍尽量使用原图而不是缩略预览图

## 当前页面流转

1. 导入页：拖拽或选择本地图片，查看最近本地会话与云端工作区
2. 编辑页：选择当前图片、修改 EXIF 字段、切换预览模式、切换模板
3. 样式页：横向比较不同模板在当前图片上的表现
4. 导出页：设置文件名、格式和质量，导出当前图或整组图片

## 技术栈

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Motion
- Supabase Auth / Database / Storage
- `exifr` 用于读取图片 EXIF

## 本地运行

前置要求：

- Node.js 20+
- 一个可用的 Supabase 项目

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example`，创建你自己的 `.env.local`：

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
VITE_SUPABASE_STORAGE_BUCKET="workspace-images"
```

说明：

- `VITE_SUPABASE_URL`：Supabase 项目地址
- `VITE_SUPABASE_PUBLISHABLE_KEY`：前端公开可用的 publishable / anon key
- `VITE_SUPABASE_STORAGE_BUCKET`：工作区图片上传使用的 bucket，默认是 `workspace-images`

### 3. 启动开发环境

```bash
npm run dev
```

默认访问地址：

`http://localhost:3000`

## 常用脚本

```bash
npm run dev        # 启动开发服务器
npm run build      # 生产构建
npm run preview    # 预览构建结果
npm run typecheck  # TypeScript 类型检查
npm run clean      # 删除 dist 目录
```

## Supabase 接入说明

当前前端已经接入真实 Supabase 客户端，不再只是纯静态演示。要让云同步完整工作，建议至少准备以下内容：

- Auth：邮箱密码登录、注册、找回密码
- Storage bucket：用于保存原图和预览图
- 数据表：`profiles`、`workspaces`、`photos`

### 必跑 migration

如果你是第一次给 SHUNYIN 配 Supabase，建议在 SQL Editor 里按下面顺序执行：

```sql
docs/supabase/create-shunyin-core-schema.sql
docs/supabase/add-photo-exif-overrides.sql
docs/supabase/add-shunyin-workspace-rpcs.sql
```

其中：

- `create-shunyin-core-schema.sql` 会创建 `profiles`、`workspaces`、`photos` 表、触发器、RLS、`workspace-images` bucket 和对应 Storage policy
- `add-photo-exif-overrides.sql` 会给 `public.photos` 增加 `exif_overrides jsonb` 字段
- `add-shunyin-workspace-rpcs.sql` 会创建 SHUNYIN 使用的工作区保存 / 删除 RPC，前端会优先调用它们；如果你还没执行这份 SQL，前端会自动回退到当前直连实现

这三份 SQL 都可以在 Supabase 免费版使用，不依赖 Edge Functions。

### 邮件模板

仓库内已提供 Supabase Auth 邮件模板：

- `docs/email-templates/reset-password.html`
- `docs/email-templates/confirm-signup-otp.html`

详细替换方式见：

- `docs/email-templates/README.md`

## 目录结构

```text
src/
  assets/                   静态资源
  components/               页面组件、头部、底部导航、预览与认证弹窗
    auth/
    preview/
    views/
    watermark/
  data/                     Demo 数据与默认模板
  hooks/                    核心状态、认证、云同步逻辑
  i18n/                     中英文文案
  lib/                      Supabase 客户端初始化
  types/                    应用类型定义
  utils/                    导入、导出、叠图、存储等工具
docs/
  email-templates/          Supabase 邮件模板
  supabase/                 Supabase 相关 SQL / 文档
```

## 核心模块

- `src/hooks/useWorkspaceState.ts`
  - 本地工作区状态中心
  - 管理图片队列、当前视图、EXIF、导出设置、最近会话、导出历史
  - 负责 `localStorage` 持久化与本地原图恢复

- `src/hooks/useAuth.ts`
  - Supabase 登录、注册、OTP 验证、找回密码、退出登录

- `src/hooks/useCloudWorkspace.ts`
  - 云端工作区列表读取
  - 工作区保存、打开、删除
  - 云端 EXIF 覆盖值持久化

- `src/components/preview/PreviewStage.tsx`
  - 统一处理原图 / 水印预览渲染

- `src/utils/export.ts`
  - 导出单张成片
  - 优先尝试使用缓存的本地原图进行导出

## 当前已知限制

- 浏览器如果清除了站点数据，`IndexedDB` 中缓存的本地原图也会一起丢失；这种情况下只能退回预览图
- 云端删除与存储清理目前还不是严格事务式，极端失败场景下可能出现数据库和 Storage 清理不同步
- 仓库里目前没有完整的 Supabase schema / migration 集合，只有这次补上的 EXIF 相关 SQL

## 建议的下一步

- 补齐 Supabase 表结构与 RLS migration
- 为云端保存 / 删除链路增加更强的一致性保护
- 增加集成测试，覆盖导入、保存云端、删除图片、导出这几条关键路径
