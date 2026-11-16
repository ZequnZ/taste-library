---
name: taste-library
description: Use when designing UI or collecting design references.
version: 0.1.0
---

# Taste Library

## 使用场景

设计页面、组件、typography、motion、interaction、插画或者演示文档时读取收藏。用户也可以明确调用此 skill。

## 工作流程

1. 确认收藏 repository 的位置，读取根目录 `llm.txt` 和 `collection.json`。查阅与任务相关的 category、family 和 entry。`demonstrations` 是演示素材；用户确认的收藏位于 `entries`。收藏为空时明确说明当前状态。
2. 阅读相关 entry 的来源、使用场景、用户反馈和确认的设计原则。需要复用代码时阅读完整 source、dependencies 和使用说明。
3. 新设计和主要改版提供基于收藏的 sketches，并注明参考 entry 和具体应用方式。小范围修改读取相关指导后执行请求。用户明确要求 implementation 时按照请求执行。
4. 根据用户反馈调整设计。用户要求新的方向时开展 exploration，并明确素材来源。
5. 出现值得保存的设计或者设计原则时提供保存建议，说明 example、category、family、原始场景、用户反馈、source 和候选原则。请求用户确认保存内容。
6. 用户确认后编辑批准的文件，维护 `collection.json`、entry 文档和 `llm.txt`。执行 `npm run validate`、`npm test` 和 `npm run build`。可执行 example 需要在浏览器中验证 interaction。
7. 告知用户保存的 entry、验证结果和待确认事项。用户自行执行 commit 和 push。

## 页面实现与验证

- 修改独立页面时维护 `src/navigation.js` 的共享渲染与 `scripts/generate-pages.mjs`，不要直接编辑生成的 `entries/*/index.html`。
- Vite 多页面入口放在 `build.rollupOptions.input`；构建后通过静态 HTTP server 验证每个 detail URL、资源加载和实际交互，避免仅 dev server 正常而发布页面失效。
- Preview/Code 切换保留同一个 iframe，以保持交互状态；验证 tab 的键盘导航、clipboard 内容，以及 320–1920px 的页面 overflow。
- Idea motion 和 underline 的每个 variant 独立显示 gallery card、detail page 和可复制 example；不要重新合成两个大块。`study` / `variant` 元数据与 `scripts/generate-examples.mjs` 复用原始 source，生成单一 treatment，保留 attribution 和字体 license。拆分收藏素材不代表用户偏爱某个 variant。每个 entry 只展示一种效果：letter motion 移除共享 underline，underline entry 去掉 `data-motion`。Gallery 和 detail Preview 使用 `?variant=` embedded 模式，只显示元素本身。

## 使用边界

用户选择建立设计喜好的证据。推断的原则保持候选状态，直到用户确认。保留第三方来源和 reuse permissions。只有批准的素材进入用户收藏。

## 安装说明

此 skill 的 source 与收藏文件保存在同一个 repository。通过 agent harness 支持的 skill discovery 配置读取 `skills/`，或者明确指定此文件。跨项目使用时配置收藏 checkout 的绝对路径。Hermes profile 配置需要用户明确指定目标 profile；当前 repository 初始化没有修改 profile 配置。
