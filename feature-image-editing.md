# 图像编辑功能 - 水印样式优化与 AI 工作台

## 问题背景

原项目包含 5 个水印样式模板，但实际使用中发现：
- 样式过多导致用户选择困难
- 部分样式使用频率低
- 需要保持核心功能简洁

## 解决方案

### 1. 精简水印样式

**保留的 3 个核心样式：**

1. **Minimal White Footer (极简白底参数栏)**
   - 文件：`MinimalWhiteFooterTemplate.tsx`
   - 特点：干净白底信息条，展示相机、镜头与曝光参数
   - 适用场景：专业摄影作品展示

2. **Magazine Cover (杂志封面款)**
   - 文件：`MagazineCoverTemplate.tsx`
   - 特点：满版照片叠加大标题与轻量参数，偏编辑封面感
   - 适用场景：社交媒体、作品集封面

3. **Film Border (胶片边框款)**
   - 文件：`FilmBorderTemplate.tsx`
   - 特点：暖色胶片边框、齿孔与底部铭牌式参数
   - 适用场景：复古风格、胶片摄影

**删除的样式：**
- Portrait Gallery Card (氛围画廊卡)
- White Footer Brand (白底品牌栏)

### 2. 技术实现

**修改的文件：**

1. `src/types/app.ts`
   - 更新 `StyleTemplate` 接口的 `styleType` 类型定义
   - 只保留 3 个样式类型

2. `src/data/mockData.ts`
   - 更新 `styleTemplates` 数组
   - 只导出 3 个样式配置

3. `src/utils/overlay.ts`
   - 移除不需要的模板导入
   - 更新 `WATERMARK_RENDERERS` 映射表
   - 只保留 3 个渲染器

4. `src/i18n/translations.ts`
   - 保留对应的翻译键值
   - 中英文双语支持

**删除的文件：**
- `src/components/watermark/PortraitGalleryCardTemplate.tsx`
- `src/components/watermark/WhiteFooterBrandTemplate.tsx`

### 3. 设计原则

- **响应式布局**：所有样式都根据图片横竖比自动调整
- **文字截断**：使用 `truncateText` 函数防止文字溢出
- **动态缩放**：使用 `getWatermarkLayoutScale` 确保不同尺寸图片的一致性
- **字体大小自适应**：根据图片尺寸动态计算字体大小

## AI 工作台功能

### 功能概述

AI 工作台提供了基于 OpenAI 兼容 API 的图像生成和编辑功能，支持两种模式：
- **文生图 (Text-to-Image)**：通过文本描述生成图像
- **图生图 (Image-to-Image)**：基于上传的图像进行 AI 编辑

### 核心组件

**1. AiImageView 组件** (`src/components/views/AiImageView.tsx`)

主要功能模块：
- **API 密钥管理**：本地存储用户的 API 密钥
- **模型选择**：自动获取可用模型列表，支持手动输入
- **双模式切换**：文生图和图生图模式无缝切换
- **异步任务轮询**：支持长时间运行的图像生成任务
- **结果预览与下载**：全屏预览和本地下载功能

**2. OpenAI 图像服务** (`src/services/openAiImageService.ts`)

核心功能：
- `fetchOpenAiModels()` - 获取可用模型列表
- `createOpenAiImageJob()` - 创建文生图任务
- `createOpenAiImageEditJob()` - 创建图生图任务
- `fetchOpenAiImageJob()` - 查询任务状态
- `openAiImageJobToGeneratedImage()` - 转换任务结果为可用图像

### 技术实现细节

**1. 状态管理**

```typescript
type AiJobStatus = 'idle' | 'loading' | 'done' | 'error';
type AiMode = 'generate' | 'edit';

interface ActiveImageJob {
  id: string;
  prompt: string;
  model: string;
  status: OpenAiImageJob['status'];
  createdAt: number;
  updatedAt: number;
}
```

**2. 任务轮询机制**

- 使用 `useEffect` 实现自动轮询
- 根据任务状态调整轮询间隔：
  - `queued` 状态：1 秒轮询一次
  - `running` 状态：2 秒轮询一次
- 任务完成或失败时自动停止轮询

**3. 错误处理**

```typescript
const normalizeProviderError = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : fallback;
  if (/invalid token/i.test(message)) {
    return dict.aiInvalidToken;
  }
  if (/524|provider timed out|timed out|timeout/i.test(message)) {
    return dict.aiProviderTimeout;
  }
  return message;
};
```

**4. 图像上传与预览**

- 支持拖拽上传和点击上传
- 使用 `URL.createObjectURL()` 创建本地预览
- 自动清理 Object URL 防止内存泄漏
- 支持将生成的图像作为编辑模式的输入

**5. 本地存储**

```typescript
const SHUNYIN_API_KEY_STORAGE_KEY = 'shunyin_openai_api_key';
const SHUNYIN_IMAGE_MODEL_STORAGE_KEY = 'shunyin_openai_image_model';
```

- API 密钥和模型选择持久化到 localStorage
- 自动加载上次使用的配置
- 支持清除存储的凭证

### API 中继服务

**后端实现** (`api/_openaiRelay.ts`)

核心功能：
- 代理 OpenAI 兼容 API 请求
- 隐藏用户 API 密钥，提高安全性
- 统一错误处理和响应格式化
- 支持流式和非流式响应

**图像编辑端点** (`api/openai/images/edit.ts`)

- 处理图生图请求
- 支持 multipart/form-data 文件上传
- 参数验证和错误处理
- 转发请求到上游 OpenAI 兼容服务

### 用户体验优化

**1. 自动模型加载**
- 输入 API 密钥后自动获取模型列表（800ms 防抖）
- 智能选择默认模型

**2. 状态提示**
```typescript
const generateStatusText = generateStatus === 'done'
  ? dict.aiGenerated
  : generateStatus === 'error'
    ? generateError ?? dict.aiGenerateFailed
    : generateStatus === 'loading'
      ? activeJob?.status === 'running'
        ? dict.aiJobRunning
        : activeJob?.status === 'queued'
          ? dict.aiJobQueued
          : dict.aiJobCreating
      : dict.aiGenerateHint;
```

**3. 响应式布局**
- 左侧：控制面板（API 配置、模型选择、提示词输入）
- 右侧：结果预览面板
- 移动端自适应布局

**4. 图像比例选择**
- 支持多种比例：auto, 1:1, 16:9, 9:16, 4:3, 3:4
- 根据场景自动推荐比例

### 安全考虑

1. **API 密钥保护**
   - 密码输入框隐藏密钥
   - 本地存储加密（依赖浏览器安全机制）
   - 支持一键清除

2. **错误信息脱敏**
   - 统一错误处理，避免泄露敏感信息
   - 用户友好的错误提示

3. **资源清理**
   - 自动释放 Object URL
   - 组件卸载时清理所有资源

### 国际化支持

完整的中英文翻译覆盖：
- 界面标签和按钮
- 错误提示信息
- 状态描述文本
- 帮助提示

## 效果

### 水印样式优化
- ✅ 减少用户选择负担
- ✅ 保留最常用的 3 种风格
- ✅ 代码更简洁，维护成本降低
- ✅ 加载性能提升（减少组件数量）

### AI 工作台
- ✅ 提供强大的 AI 图像生成能力
- ✅ 支持文生图和图生图两种模式
- ✅ 异步任务处理，用户体验流畅
- ✅ 完整的错误处理和状态反馈
- ✅ 本地化存储，提升使用便利性

## 后续优化方向

### 水印样式
1. 可以根据用户反馈数据进一步优化样式
2. 考虑添加自定义样式编辑器
3. 支持用户保存常用样式配置

### AI 工作台
1. 支持批量图像生成
2. 添加历史记录功能
3. 支持更多 AI 模型提供商
4. 优化大图预览性能
5. 添加图像编辑高级参数（如 strength, guidance_scale）
