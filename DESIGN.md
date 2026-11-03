---
version: alpha
name: "Lantern"
description: "Windows 局域网文件与聊天工作台，借鉴 Apple 桌面信息层级"
colors:
  primary: "#0868cf"
  primary-hover: "#0553ab"
  ink: "#202733"
  muted: "#657183"
  background: "#f5f6f8"
  surface: "#ffffff"
  sidebar: "#eaf0f6"
  line: "#dbe1e8"
  selection: "#dceafa"
  success: "#16784c"
  danger: "#b52e38"
  scroll-thumb: "#a8b5c5"
  scroll-track: "#edf1f5"
typography:
  sans:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
  mono:
    fontFamily: "Consolas, monospace"
rounded:
  DEFAULT: "10px"
  control: "7px"
  dialog: "16px"
spacing:
  sidebar: "242px"
  content: "32px"
components:
  button: {}
  table: {}
  dialog: {}
  search: {}
---

# Lantern设计规范

## Overview

### Creative North Star

像桌上的文件收件盒：左侧找到同伴，右侧处理消息与文件。参考 Apple 桌面侧栏和工具栏的信息层级，保留 Windows 窗口与键盘习惯。来源：用户要求 Apple 风格及社区 skill https://github.com/tzzs/apple-design-skill ，不是 Apple 官方组件实现。

### Product context and register

产品工具，中文界面；用户在同一局域网中管理两台 Windows 电脑的文件。不推断地区、无日本业务要求。签名视觉为蓝灰侧栏与纸张叠放的空状态。内容区域保持白色，避免整屏玻璃、营销大标题、假数据和装饰图表。

Token ownership: ui/style.css 的 :root 是运行时规范来源，本文件镜像已接受的值。colors 的每个键直接映射 --同名 CSS 变量；sans/mono 映射 --font/--mono。组件通过语义变量消费；截图叠层为系统辅助界面的独立高对比变体。

## Colors

primary 用于安全主操作、选中和焦点。success 仅完成状态，danger 用于错误与删除文案；所有状态附文字。surface 承载文件内容，sidebar 承载导航。首版提供浅色主题和 forced-colors 系统适配。

## Typography

Segoe UI 搭配微软雅黑；标题 24px、页面副标题 19px、正文 14px、表格 12px、辅助信息 10–12px。正文行高 1.5。技术指纹与配对码用 Consolas。路径可换行，文件名截断后通过 title 和定位操作访问原值。

## Layout

桌面外壳固定视口，242px 侧栏与可伸缩内容区；小于 1000px 时侧栏 205px。最低窗口 780×580。聊天记录、文件表格和设置页分别拥有滚动区域。表格每页 50 行，工具栏和页码不随列表滚出。

## Elevation & Depth

内容默认平面，以边框分层。只对配对对话框、通知、选中导航和输入区使用轻阴影。不在数据表上应用模糊。

## Shapes

组件控制 7px 圆角、容器 10–12px、模态框 16px。消息气泡通过角形状表达方向。全局滚动条可见，使用 scroll-thumb/scroll-track；forced-colors 采用系统色。

## Components

按钮由 .button 统一处理尺寸、禁用、悬停、按压和焦点；.primary 是安全主操作。搜索统一清除按钮；下拉使用原生 Windows 选择器，接受系统弹出层样式。模态框使用 HTML dialog/showModal，统一 modal() 负责取消、busy、错误与焦点。通知使用唯一 #toast live region。SVG 图标为项目手绘线图标，无 Apple SF 字体依赖。动画仅 120ms 颜色反馈，reduced-motion 禁用。中文直接使用具体动词，不显示内部协议词汇。

## Do's and Don'ts

- 保留内容和操作的固定位置；空、错误和加载状态要给出下一步。
- 批量操作报告数量，危险操作显示确认。
- 不为了 Apple 外观模拟 macOS 交通灯窗口按钮。
- 不以假在线设备或假进度装饰页面。
