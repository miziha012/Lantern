---
version: alpha
name: "Lantern"
description: "Windows 局域网文件与聊天工作台，卫星图首页与紧凑的聊天工具界面"
colors:
  primary: "#0868cf"
  primary-hover: "#0553ab"
  ink: "#202733"
  muted: "#657183"
  background: "#f7f7f8"
  surface: "#ffffff"
  sidebar: "#f4f5f6"
  line: "#dbe1e8"
  selection: "#e8f0fa"
  success: "#16784c"
  danger: "#b52e38"
  scroll-thumb: "#a8b5c5"
  scroll-track: "#edf1f5"
  satellite-background: "#fafbfc"
  orbit-line: "#dce2e9"
typography:
  sans:
    fontFamily: "Segoe UI, Microsoft YaHei UI, Microsoft YaHei, sans-serif"
  mono:
    fontFamily: "Consolas, monospace"
rounded:
  DEFAULT: "6px"
  control: "5px"
  dialog: "9px"
spacing:
  sidebar: "210px"
  content: "22px"
components:
  button: {}
  table: {}
  dialog: {}
  search: {}
---

# Lantern设计规范

## Overview

### Creative North Star

首页以用户选择的设备卫星图为视觉目标：本机居中，已配对和附近设备位于两条淡灰轨道，默认只显示设备图。聊天、文件和设置页面保留紧凑工具布局，截图位于聊天输入区。移除宣传口号、装饰叠纸空状态和大标题。参考 Apple 桌面侧栏和工具栏的信息层级，保留 Windows 窗口与键盘习惯。来源：用户要求 Apple 风格及社区 skill https://github.com/tzzs/apple-design-skill ，不是 Apple 官方组件实现。

### Product context and register

产品工具，中文界面；用户在同一局域网中管理两台 Windows 电脑的文件。不推断地区、无日本业务要求。按用户要求采用简洁的普通工具界面，白底、灰色设备栏、低饱和蓝色选中态。内容区域保持白色，避免整屏玻璃、营销大标题、假数据和装饰图表。

Token ownership: ui/style.css 的 :root 是运行时规范来源，本文件镜像已接受的值。colors 的每个键直接映射 --同名 CSS 变量；sans/mono 映射 --font/--mono。组件通过语义变量消费；截图叠层为系统辅助界面的独立高对比变体。

## Colors

primary 用于安全主操作、选中和焦点。success 仅完成状态，danger 用于错误与删除文案；所有状态附文字。surface 承载文件内容，sidebar 承载导航。首版提供浅色主题和 forced-colors 系统适配。

## Typography

Segoe UI 搭配微软雅黑；标题 16–18px、对话设备名 14px、正文 14px、表格 12px、辅助信息 10–12px。正文行高 1.5。技术指纹与配对码用 Consolas。路径可换行，文件名截断后通过 title 和定位操作访问原值。

## Layout

桌面外壳固定视口，58px 顶栏与可伸缩内容区；聊天页不显示设备侧栏，文件和设置页保留 210px 设备栏；小于 1000px 时设备栏 180px。最低窗口 780×580。聊天记录、文件表格和设置页分别拥有滚动区域。表格每页 50 行，工具栏和页码不随列表滚出。

## Elevation & Depth

内容默认平面，以边框分层。只对模态框和临时通知使用轻阴影，普通导航、输入区与文件卡片无阴影。不在数据表上应用模糊。

## Shapes

按钮 5px 圆角、内容容器 6–7px、模态框 9px。消息气泡通过角形状表达方向。全局滚动条可见，使用 scroll-thumb/scroll-track；forced-colors 采用系统色。

## Components

按钮由 .button 统一处理尺寸、禁用、悬停、按压和焦点；.primary 是安全主操作。搜索统一清除按钮；下拉统一使用 ui/controls 的 React Bits Glide Select，负责弹层与键盘交互；原生 select 仅作隐藏的数据桥接。模态框使用 HTML dialog/showModal，统一 modal() 负责取消、busy、错误与焦点。通知使用唯一 #toast live region。功能图标来自 Lucide 的官方静态 SVG，由 scripts/build-icons.cjs 统一输出；不使用字体图标。常规控件使用 120ms 颜色反馈；卫星图采用下述弹性入场与慢速轨道，reduced-motion 禁用。中文直接使用具体动词，不显示内部协议词汇。

## Do's and Don'ts

- 保留内容和操作的固定位置；空、错误和加载状态要给出下一步。
- 批量操作报告数量，危险操作显示确认。
- 不为了 Apple 外观模拟 macOS 交通灯窗口按钮。
- 不以假在线设备或假进度装饰页面。

聊天中的已完成图片通过受限本地协议加载，保持长宽比，object-fit: contain；点击查看大图。文件和压缩包用各自的 SVG 图标与文件名表示。

截图入口与文件附件操作同处聊天输入区工具栏。统一 tooltip 在悬停或键盘焦点时显示当前快捷键，Escape 可关闭，位置不引起布局跳动。

## Satellite homepage

Visual source: D:/Lantern/design/device-satellite-home-v1.png, explicitly selected by the user. No raster assets are required for the interactive graph; the rings are data-visualization geometry. Desktop/laptop/back icons now use official Lucide SVG assets, copied into assets/icons with the ISC notice.

Owner: ui/satellite.js SatelliteMap. Runtime map colors live in ui/satellite.css and mirror the corresponding colors above; remaining tokens come from ui/style.css. Self circle is about 192px and peer circles about 88px at the 1487×1058 reference size, scaling responsively with the map. Two initial orbit radii are about 265px and 408px.

The default homepage shows the graph and two compact top-right actions: Refresh and Manual connection. The center is a static, non-focusable local-computer marker. Manual connection exposes the local pairing code and a Local information action for addresses, fingerprint, settings and files. Unpaired nodes open the existing pairing form; paired nodes open chat, including offline history.

Motion: positions remain static at rest for crisp labels; elastic entry and direct zoom/pan interaction remain. Permanent orbit/counter-rotation was removed during the clarity revision. Homepage entrance reveals the local marker at 0ms, inner ring at 260ms, outer ring at 560ms, using 700/760ms spring-like scale keyframes with overshoot. Peer arrival/departure uses 620/200ms opacity/scale; panel transitions use 160ms. Ring buttons remain inert during entrance. Chat has no device sidebar; choose other devices from the homepage. Reduced-motion removes these animations. Stable node DOM is retained during one-second state refreshes. Wheel zoom, background dragging, double-click/0 reset are supported without adding toolbar controls.

## Chat revision 0.3.2

Explicit user reference: D:/Lantern/design/chat-composer-reference.png. Recreate its restrained light-gray rounded input surface, top text area and bottom action row. Composer uses #f5f5f5, 23px radius and 14/16/12px padding. Preserve the existing screenshot/file/folder, drag/drop, paste, attachments, Enter/Shift+Enter and send capabilities; do not import model selectors, microphone or extra actions from the reference. The blue 36px upward-arrow send button uses the existing brand color. Existing system typography and Fluent icons stay canonical.

Conversation navigation occupies one topbar: Back plus selected device name/status on the left; file management/settings on the right. No brand mark/name or repeated conversation heading in chat. Other pages retain their brand navigation. Image previews use a viewport-sized dialog with dark backdrop, an uncropped image, zoom controls, previous/next and a close control. No generic form frame, title row or open-file footer. Image fit is preserved initially; zoom scrolls within the stage.

## Accepted logo and back navigation 0.3.3

The user selected the blue-to-teal infinity mark with subtle over/under crossing, without data particles. Exact selected reference: D:/Lantern/design/logos/selected-infinity.png. Transparent production derivative: selected-infinity-cutout.png. Runtime assets/logo.png and multi-resolution assets/icon.ico derive from it. Use this logo for brand navigation, Windows window/taskbar and executable/shortcut icon. Chat retains Back/device text and does not reintroduce the brand in its header.

Back is a neutral toolbar action, not a selected navigation tab. It uses 34px minimum height, 10px horizontal padding, 5px corner radius, transparent rest, background-token hover with ink text, line-token press, and no press translation. Keyboard focus uses a 2px primary outline with 2px offset. Geometry is stable in every state. This corrects the previous edge-hugging blue hover shown in the user's screenshot.

## Shared controls 0.3.4

The user selected React Bits Glide Select (https://www.reactbits.dev/micro/glide-select) and Squish Switch (https://www.reactbits.dev/micro/squish-switch). Their official JS/CSS source is integrated in ui/controls, with React/Motion bundled into isolated control roots. The remaining application keeps its current HTML/JS owners. Original license is included in assets/licenses/REACT-BITS-LICENSE.md, along with bundled runtime license notices.

Canonical runtime owner: ui/controls/theme.css, emitted in controls.bundle.css after application/satellite styles. --control-radius is 8px for command buttons. Rest/selected/primary colors keep their semantic roles; every command uses the same 120ms inset-overlay hover/press feedback and no press displacement. The image-viewer dark surface uses the same mechanism with an inverse-light overlay for contrast. Device graph nodes remain graphical targets with their accepted circular-face behavior, and the selected Squish Switch retains its own pill/elastic geometry.

Text inputs, search and textarea have no border, outline or focus shadow. Ordinary fields use #f4f5f7 fill and #edf1f6 focus fill with primary caret; search shares its surrounding fill. The reference-style chat composer keeps its existing shape and no focus contour. Buttons and switches retain keyboard focus indication.

Glide uses a white surface, neutral sliding highlight, primary checkmark, 34px trigger, 30px rows, 180ms pop and 220ms glide. Menus use the browser top layer, flip above/below and clamp to the viewport, including inside dialogs. Fluent icons replace Hugeicons to share existing assets. All four file filters and the dynamic send-target selector use the same component.

Squish uses a 52x28px track, white thumb, gray off/blue on state, with the upstream stretch and spring behavior. Pointer drag, keyboard toggle and Escape cancel work. Reduced motion suppresses translation/stretch and hover scaling. Official controlled-value semantics are bridged to the existing auto-receive setting; no persistence/API rules changed.

## Chat image states 0.3.5

Explicit reference: React Bits Refine Frame, https://www.reactbits.dev/micro/refine-frame?status=refining. Its official JSX/CSS is shared in ui/controls/RefineFrame, consumed only by ImageTransferFrame in the chat timeline. No generated-image or AI terminology is shown. Real transfer state and decoded-image state select queued/refining/complete/error, with Chinese progress labels. Known outgoing image paths can render locally during sending; incoming partial files remain inaccessible.

Frames preserve natural aspect and contain-fit image/mosaic pixels, capped at 340px width and 420px height without upscaling small images. Unknown incoming dimensions use a 300px 4:3 placeholder, then adapt once to decoded dimensions; this limitation is explicit rather than claiming dimension-free layout stability. A content wrapper gives the frame a definite intrinsic width, preventing shrink-to-min-content collapse. Small images keep their readable metadata outside the image and use an outside retry action when a chip/button would not fit.

Progress updates preserve image-root identity across timeline updates; a completed image does not replay on every poll or incoming message. Mosaic transitions use 90ms stages, stop their RAF when the stage target is reached, release intermediate canvases after completion and cap DPR at 1.5. Reduced-motion changes are observed live; no rotating/sweeping/mosaic transition is required in reduced mode. Group semantics retain the preview button and retry action in the accessibility tree. Completion returns to the original uncropped image/gallery flow.

## Clarity, icons and errors 0.3.6

All command/device/file/status glyphs use the official lucide-static package. scripts/build-icons.cjs owns inline icon markup, CSS mask aliases and provenance manifest; build-ui invokes it. The selected custom infinity brand logo remains a brand asset, not a command glyph. Assets/licenses/LUCIDE-LICENSE.txt is distributed; old Fluent dependency/assets are removed.

Remove blur animation from all text/status labels. At rest, the satellite canvas has no identity transform/will-change promotion, and orbit/counter motion is disabled. Entry wrappers discard their animation transforms after completing; node positions snap to the physical pixel grid. Device text uses a standard 600 weight. Hover uses color/border feedback rather than permanently scaling icons. Completed Refine Frame media has filter/transform none; only the explicitly requested loading-image refinement remains animated.

Errors shown in dialogs, toasts, timeline and file operations use core/errors.cjs via a small shared browser bundle. Native filesystem codes, paths, IPC prefixes and call stacks never appear as user instructions. Known cases explain disk space, permissions, missing files, connection failure and cross-volume compatibility. Raw diagnostic details remain local. Existing failed-job messages are sanitized in snapshots and at the renderer boundary.

## Chat spacing and controls 0.3.7

Shared theme owns all scrollbar skins: no arrow buttons, a transparent track and inset thumb. Chat messages keep 22px between content and the scrollbar (16px at narrow widths). Brand, file-name, table-sort and small icon command hit areas include internal hover padding, using the same 8px radius and inset feedback as other commands.

The composer starts at one 22px text line and grows on input, paste, draft restoration and width changes. At five lines (118px including padding), it scrolls internally; deleting or sending shrinks it again. Keep the timeline at its bottom only when already near the bottom. Enter/Shift+Enter/IME and existing attachment actions are preserved.

## Composer motion 0.3.8

Height grows and shrinks over 180ms with cubic-bezier(.2,.8,.2,1). Interrupted input retargets from the current visible height; five-line cap and shrinking remain intact. The timeline follows its bottom during the animation only if already near the bottom. Reduced-motion preference skips height animation, including live preference changes.

## Settings workspace and orbital motion 0.3.9

Selected visual: D:/Lantern/design/settings-layout/settings-design-3.png. Preserve its flat white, centered settings layout, left descriptions/right controls, restrained headings and section dividers. User amendment: 常规 / 连接与信任 are sticky page-position buttons, not tab panels. Both regions stay in one vertical scroller. Click/Enter scrolls to the section (instant for reduced motion); manual scrolling and resizing update aria-current=location. Anchoring never calls settingsView or discards unsaved values. General fields and save retain existing persistence/validation. Connection info and trusted peers follow below. Adequate section height lets the last anchor reach the top even with a short peer list. Form/scroll/toast semantics remain owned by app.js and the shared theme; React Bits owns the existing switch/select controls.

The device sidebar is removed from markup and rendering. Settings and file management share the full-width workspace and existing top navigation. Device access remains on the satellite home; no hidden duplicate discovery list is maintained.

Copy pairing code is an explicit, scoped main-process IPC. It reads the current code at click time, writes plain six-digit text, confirms the clipboard, and returns readable errors on contention. UI disables only its copy button while pending and reports success/failure through the shared live-region toast. Initial settings entry immediately fills code and local addresses; polling updates them without resetting edits.

This revision supersedes the static-orbit decision in 0.3.6: devices move slowly along their orbit by updating physical-pixel-snapped coordinates. Text wrappers do not rotate or counterrotate. RAF runs only for the visible, active home; hover, keyboard focus on a device, dragging, background state and reduced motion pause it. Phase and DOM identity survive polling, with no catch-up jump when resumed. Existing spring sequence remains local computer, inner ring, outer ring.

## Compact settings 0.3.11

Settings content max-width is 960px including 28px side padding; top padding 28px, group padding 22px, minimum form row 56px with 12px between rows. Title/section/field typography uses 26/18/14px. Inputs are 38px high. The auto-receive switch aligns to the same control-column start as the editable fields. Sticky anchors, one-page content, copy, and form behavior remain unchanged. The final connection section keeps its required anchor scroll space.

## Left-aligned settings 0.3.12

Settings content keeps the compact 960px maximum width but aligns to the workspace left with normal 28px padding (24px narrow). Remove the viewport-based minimum height on the final connection section. Anchors scroll within the natural document bounds; a short final section may stop at the page end, where the existing scrollspy marks 连接与信任 current. Do not add empty spacer height just to force an anchor to the top. This supersedes the final-section anchor spacer in 0.3.9/0.3.11.
