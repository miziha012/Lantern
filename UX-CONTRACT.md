# Lantern交互契约

## Business context

用户决策见 PRODUCT.md。权限、数据保存、删除与协议规则均以 PRODUCT.md 为依据。没有账单、法律表单或账户功能。

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Table Selection | ui/app.js selected / renderTable | 本契约 | 本页、Shift 连选 | scripts/e2e.cjs |
| Select/Listbox | 原生 HTML select | DESIGN.md | 系统弹出层 | scripts/e2e.cjs |
| Date | 原生天数筛选 select | 本契约 | 最近 1/7/30 天 | scripts/e2e.cjs |
| Form | modal() 与 settings-form | 本契约 | 模态、设置 | scripts/e2e.cjs |
| Scrollbar | ui/style.css 全局基线 | DESIGN.md | 截图界面无滚动 | scripts/e2e.cjs |
| Toast | toast() / #toast | 本契约 | 成功、错误 | scripts/e2e.cjs |
| CRUD | loadFiles / fileAction IPC | PRODUCT.md | 本地、收发记录 | scripts/e2e.cjs |

## Flow ledger

- 顶部按钮进入文件管理和设置；点击 Lantern 返回聊天。侧栏只保留设备列表。默认未配对空状态不伪造数据。
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
