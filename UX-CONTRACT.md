# Lantern交互契约

## Business context

用户决策见 PRODUCT.md。权限、数据保存、删除与协议规则均以 PRODUCT.md 为依据。没有账单、法律表单或账户功能。

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Table Selection | ui/app.js selected / renderTable | 本契约 | 本页、Shift 连选 | scripts/e2e.cjs |
| Select/Listbox | ui/controls/GlideSelect.jsx + index.jsx | 本契约 / DESIGN.md | 筛选 / 弹窗目标设备 | scripts/e2e.cjs |
| Date | Glide Select 天数筛选 | 本契约 | 最近 1/7/30 天 | scripts/e2e.cjs |
| Form | modal() 与 settings-form | 本契约 | 模态、设置 | scripts/e2e.cjs |
| Scrollbar | ui/style.css 全局基线 | DESIGN.md | 截图界面无滚动 | scripts/e2e.cjs |
| Toast | toast() / #toast | 本契约 | 成功、错误 | scripts/e2e.cjs |
| CRUD | loadFiles / fileAction IPC | PRODUCT.md | 本地、收发记录 | scripts/e2e.cjs |

## Flow ledger

- 顶部按钮进入文件管理和设置；点击 Lantern 返回首页。聊天页不显示设备侧栏，其他管理页保留设备列表。默认未配对空状态不伪造数据。
- 配对必须明确核对目标指纹、输入六位码；失败保留输入并显示可操作错误。忙碌时禁用提交，不允许关闭。
- Enter 发送，Shift+Enter 换行；IME 组合期间不发送。粘贴图片与拖入文件先预览、可移除。
- 离线保留消息草稿与附件；消息失败可手动重发。传输失败保留偏移量与任务，用户重试恢复。
- 接收自动开关关闭后，卡片与文件页均可批准或拒绝每个文件。
- 筛选或切换目录清空选择；排序和翻页保留选择，批量栏始终显示确切数量。全选仅本页可操作项目。每页 50 项，过滤后页码归一。
- 搜索、排序等在当前桌面会话中保留，不放入 URL：路径和查询为本地私有、不可共享的桌面状态。
- 文件移动和回收站删除在本应用模态中确认。复制/移动使用系统目录选择器，同名冲突报错，批量部分失败显示每项。不永久删除用户文件；移动跨卷使用先复制成功再删除源。
- 清除记录不属于本版功能。解除配对保留本地文件。移除目录仅停止显示。
- 本地目录修改后手动刷新。文件名排序使用 zh-CN 数字排序；日期采用当前电脑系统时区、zh-CN 显示。
- 所有搜索都有清除；表格空、无结果、加载、目录失败有明确文案。模态的 Escape、焦点限制/恢复由 dialog 提供，打开时聚焦取消。
- 截图每个显示器单独叠层，框选、Enter 复制、Esc 取消。取消不改变剪贴板，确认才写入；不自动发送。

## Verification boundaries

本机双 HTTPS 实例验证协议；Electron 自动化验证本地工作流。不把自动化通过等同于两台真实 Windows 10/11、多显示器缩放矩阵与防火墙实测通过。

- 已完成图片在聊天中直接显示，保持完整长宽比，不裁剪；点击可打开大图。预览协议仅按传输 ID 读取已完成且受支持的位图文件，不允许任意路径或 SVG。
- 默认接收路径为软件目录/fileManagement；开发测试的独立数据目录有独立接收文件夹。旧自定义目录保留，旧默认目录改用新默认，但不搬动已有文件。

- 截图入口位于聊天输入区，悬停/键盘聚焦显示当前配置的快捷键，Escape 隐藏提示。
- 附近设备显示前必须验证实际 HTTPS hello 响应；按证书身份去重，45 秒未成功验证则隐藏，已信任证书不重复显示。保留不同证书的同名设备。处理网卡、端口与名称更新，测试实例禁止广播。
- 发布须等待用户对当前版本明确说“发布”，详见 AGENTS.md。

## Satellite homepage contract

- ui/satellite.js owns graph identity, layout, stable node updates, motion and gestures. It consumes actual snapshot peers/discovered data and de-duplicates by certificate identity; no sample devices in production.
- The default page shows the graph with Refresh and Manual connection at top right. The center is non-interactive. Manual connection shows the local code and opens local information, preserving address/fingerprint/files/settings access. Refresh re-queries discovery and paired-device presence; concurrent refreshes share one task, busy state disables the button, and errors appear as toast text.
- Paired nodes, online or offline, directly enter chat without a pairing dialog. New devices open the existing pairing form with address/port filled in; certificate confirmation remains required.
- The brand and conversation back button return to the device homepage. The contextual return-to-chat button preserves the selected conversation and drafts.
- Hover/focus pauses movement to avoid moving click targets. Labels stay upright. Windows reduced-motion preferences disable graph animations. Dragging is only on blank graph regions; device buttons retain native keyboard operation. Wheel zoom, double-click or 0 reset have no additional permanent chrome.
- Entry/departure transitions preserve focus; when a focused device vanishes, focus returns to the map container.
- Verification owners: scripts/e2e.cjs for real HTTPS chat/file integration, scripts/satellite-qa.cjs for reference-state layout, click states, animation, gestures, stable refresh and accessibility settings.

- Entrance order: local marker, inner ring, outer ring, each with elastic overshoot. Reduced motion shows all immediately. Chat fills the content width without a left device sidebar.

## Chat and capture 0.3.2

- Chat header: one Back action to device home and device name/status. Remove the former conversation header; file management remains in top navigation.
- Composer changes presentation only. Keep screenshot shortcut tooltip, file/folder picker, removable attachment previews, drag/drop, image paste, Enter sending, Shift+Enter newline and IME handling.
- Image viewer includes only the image layer, close, previous/next, zoom and position indicator. Gallery is scoped to completed supported images in the current conversation, ordered by time. First/last buttons are disabled at boundaries. Zoom resets on image switch; ArrowLeft/ArrowRight and +/- work, Escape/backdrop closes, dialog owns focus. Missing files show an error. Size recomputes when the window changes.
- Capture: Windows overlay must cover display bounds including taskbar, not just workArea. Normalize the captured NativeImage through PNG to one raster representation. Renderer sends selection edges normalized against the actual displayed screenshot bounds; main validates edges and maps both corners into bitmap pixels. Crop and clipboard use that same representation. Escape/cancel does not write the clipboard.
- Actual regression evidence: current monitor 1536x864 DIP, 1920x1080 pixels at 125%. Old overlay was 1536x816. Updated overlay is 1536x864; selection 200x120 DIP copies 250x150 pixels, with exact bitmap digest equality. 150%/200% coordinate tests are synthetic; physical mixed-DPI monitors still need field validation.

- 0.3.3: Approved infinity logo is applied to UI, window and Windows executable/shortcut resources. Back navigation stays at the same position and size during hover/press; hover is neutral gray and keyboard focus remains visible. No navigation/transfer behavior changes.

## Shared controls contract 0.3.4

- All authored selects use the shared Glide Select. Native hidden selects keep the existing IDs/values/change events for filtering and send-target validation; no visible duplicate or keyboard tab stop remains. Associated labels point to the visible trigger. Dynamic modal controls are mounted and unmounted by the shared bridge.
- Arrow keys/Home/End/typeahead navigate options; Enter/Space commits, Escape cancels without closing the parent dialog, Tab dismisses. Outside pointer dismisses the popup; ancestor scroll and window resize reposition it, or dismiss it if its anchor leaves the viewport. The active row stays visible during keyboard navigation. Popover placement is clamped to the viewport and can escape scrolling containers/dialog clipping.
- The Squish Switch updates the native auto-receive value on tap, label click, keyboard click and drag; canceling a drag restores the press-time value. Pointer completion must not double-toggle; later keyboard activation still works. SettingsView explicitly synchronizes programmatic values. Saving retains the existing settings IPC and error flow.
- Text-field focus is shown by fill/caret rather than a contour, per explicit user request. Command buttons share radius/hover/press timing; disabled and primary/danger/selection semantics remain distinct. Reduced-motion preferences remove component movement.
- Verification covers actual pointer and keyboard control interaction, gliding highlight, dynamic modal popover Escape isolation, switch drag/cancel, focused-input contour removal, primary contrast, settings persistence, original file/chat/screenshot flows and narrow layout. Source and license provenance are recorded in ui/controls/README.md.

## Chat image contract 0.3.5

- All supported bitmap transfers in the chat list use ImageTransferFrame/RefineFrame. Queued/waiting show a placeholder; sending/receiving/checking map to the active refining presentation and actual byte percentage; a finished transfer with undecoded image remains loading; loaded completion becomes clear and hides the status chip shortly afterward. Terminal transfers and image decode failures show error without an indefinite busy animation.
- Transfer failure retry invokes the existing retry IPC for outgoing files. Decode failure retry reloads the local image only. Incoming waiting-state accept/reject and active transfer cancellation remain available. Fullscreen gallery is available only for completed, successfully loaded images; no change to zoom/previous/next behavior.
- Stable image hosts are reconciled by transfer ID before updating the classic timeline. React roots survive progress-only updates and are disposed when removed or when changing conversations. Images keep their natural ratio; canvas uses contain rather than cover. Incoming dimensions cannot be known until available/decoded, so the initial unknown placeholder may change size once.
- The image protocol remains keyed by recorded transfer ID and supported bitmap name. It permits a recorded outgoing source during upload; incoming files require completion and a path. It never serves a partial receive file or accepts an arbitrary filesystem path.
- State/visual tests: scripts/image-frame-qa.cjs covers upload progress, stable roots, delayed decode, missing-image reload, transfer retry, uncropped portrait, gallery and reduced motion. scripts/e2e.cjs holds a real HTTPS offer to verify the desktop can decode an outgoing preview before the upload completes, then finishes the transfer and original workflows.

## Receive completion and clarity 0.3.6

- Verified incoming partials finalize with a same-volume rename when possible. EXDEV falls back to an exclusive staging file on the destination volume, size/hash verification, sync and a same-volume commit. Only after commit is the source partial removed. Failure removes this attempt's reservation/staging and retains the original partial for retry; a completed-size retry can finish without resending all bytes. Receive errors become persisted failed state with readable error text.
- Destination uniqueness/path validation and existing files are protected by the existing safeRelative/uniquePath rules. No arbitrary remote path or partial-image exposure is added.
- Error formatting is owned by core/errors.cjs, used by engine snapshots/protocol replies, main IPC handlers and renderer/capture errors. Technical diagnostics are local, not displayed in ordinary error surfaces.
- The satellite map remains interactive, with spring entrance, gestures and stable devices, while automatic continuous orbit and identity transform retention are removed for crisp text. Command/device glyphs are Lucide; brand geometry remains custom.
- A single captured screen without display_id is unambiguously matched only when both monitor/source counts equal one; multiple screens are never guessed. Screenshot copying confirms clipboard image size and retries short clipboard contention; if unavailable, the selection remains for retry and the user sees a clear message. The current host rejects even an isolated native image clipboard write; positive copy/paste checks are explicitly skipped, with unavailable-message/cancel behavior tested.
