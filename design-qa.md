# Satellite homepage design QA

Source: D:/Lantern/design/device-satellite-home-v1.png
Implementation: qa/satellite-home-reference-state.png
Comparison: qa/satellite-comparison.png
Viewport: 1487 x 1058 CSS px. Both screenshots are 1487 x 1058 px; implementation captured with scale=css to normalize Windows DPI.
State: four illustrative devices matching the selected concept; fixtures exist only in the test harness. Production uses actual discovered/paired devices.

## Findings

- P2: The first comparison shows lighter/thinner orbit lines and device outlines, weakening the paired/unpaired distinction. Increase orbit and device outlines to 2px and use #dce2e9 for orbit lines.
- P2: Peer labels are lighter than the selected design. Use the existing Chinese-capable system stack with a 550 weight.
- P3: Mathematical circular orbits place the upper-left device slightly lower than the generated mock. Keep the node exactly on its orbit to support coherent motion.

## Required fidelity surfaces

Typography: fix peer weight. Layout: circle sizes, four-device positions, spacing and pure homepage match the reference structure. Color: fix line contrast. Assets: official Fluent desktop/laptop vectors, no raster placeholders. Copy: actual names/status only; no invented production devices or extra navigation.

## Iteration history

First pass: recorded two P2 findings (line contrast and peer label weight).
Second pass: changed orbit and device outlines to 2px, orbit color to #dce2e9, peer label weight to 550, and adjusted icon size. Re-captured the same fixture at the same viewport. Full comparison evidence: qa/satellite-comparison-revised.png. Focused center/paired-device comparison: qa/satellite-focused-comparison.png, two equal 420×460 source regions with no geometric scaling.
The post-fix full and focused comparisons show no actionable P0/P1/P2 differences.

## Interaction verification

The real Electron integration test verifies HTTPS discovery identity, unpaired node pairing form, paired node direct chat, messages/files, screenshots and image previews. The fixture-based satellite test verifies 4-node reference state, offline history, motion, hover/focus pause, upright labels, zoom/pan/reset, stable DOM, arrival/departure, reduced motion and 780×580 layout. No renderer errors were observed.

## Residual P3 details and test gaps

- Official Fluent desktop/laptop glyphs have small shape differences from the generated design; the files and their MIT notice are packaged, rather than baking generated icons into a raster homepage.
- The implemented surface is flat rather than the source image's very slight tonal variation, consistent with the user's restrained utility direction.
- Nodes follow mathematically circular tracks, resulting in a small initial upper-left position difference from the generated mock.
- Actual Windows 10, physical multi-machine networking and multi-monitor DPI still require field validation.

## Implementation checklist

Pure graph homepage, state-driven nodes, click flows, motion preferences, main information access, input preservation, narrow viewport and regression tests: complete.

final result: passed

## 0.3.1 user-directed revision

The user explicitly added two home actions and removed the local-node action and chat sidebar. These are approved deviations from the original pure-graph mock, not fidelity defects. Current qa/satellite-home-reference-state.png (1487×1058) and qa/06-inline-image.png show compact top-right controls and a full-width conversation. Rings, typography, spacing and palette remain consistent with the approved design. No new actionable P0/P1/P2 findings in the revised surfaces.

Verified: static DIV local marker opens no modal, two home buttons, refresh IPC and real HTTPS presence, pairing-code access, paired/offline/unpaired paths, chat sidebar hidden, spring keyframe overshoot with 0/260/560ms delays, motion preference, keyboard/hover, gestures, actual file/chat/screenshot workflows. Animation departure test uses a MutationObserver to observe its short class transition reliably. Nine backend tests and both Electron suites pass. Physical multi-PC and Windows 10 tests remain outstanding.

## 0.3.2 conversation and screenshot revision

Source: D:/Lantern/design/chat-composer-reference.png (user attachment). Scope is composer shape/background/layout only, with existing functionality. No microphone or model controls were added. Current implementation has the light gray rounded surface, input above tools, existing three tool buttons below and compact upward send. Viewport responsiveness: qa/06-inline-image.png and qa/08-chat-narrow.png. Single-row Back/device navigation replaces brand and duplicate heading. Image layer evidence: qa/07-image-viewer.png; no generic form chrome remains. Official Fluent SVG assets provide all new icons. No actionable P0/P1/P2 issues observed in these surfaces.

Screenshot regression reproduced before fix on this PC: 1536x864 display vs 1536x816 overlay, with 1920x1080 screenshot (125% scaling). After fix actual overlay bounds and viewport equal 1536x864. Normalized edges are mapped to the PNG-normalized capture raster; 200x120 DIP selection yielded 250x150 pixels and the clipboard bitmap SHA-256 exactly matched the selected image pixels. Native isFullScreen() reported false despite correct display coverage on this Windows environment; verification relies on actual content bounds and pixels, not that state flag. Physical multi-display mixed-DPI and Windows 10 remain unverified.

Verification: JavaScript syntax, 11 backend tests including DPI/boundary coordinate cases, satellite suite, source Electron e2e, packaged 0.3.2 Electron e2e. Tests cover image previous/next boundaries, zoom, arrow navigation, Escape, current-conversation scope, header/composer layout, original file/chat/directory operations and screenshot pixel equality. Packaged narrow chat has no horizontal overflow. Static audit still reports event-binding false positives because controls are wired in external JS; its report is retained and not claimed clean. Runtime tests observe no renderer errors.

## 0.3.3 selected logo and Back state

The user's exact selected logo is retained in D:/Lantern/design/logos/selected-infinity.png. A transparent cutout was generated with the built-in image tool; icon-size rasterization and ICO container conversion preserve the selected infinity concept. The earlier halo output was rejected and is not consumed. Accepted assets/logo.png and assets/icon.ico show the blue/teal over-under mark without data particles. UI evidence: qa/02-files.png. Back hover evidence: qa/09-back-hover.png, with full horizontal padding, neutral background and rounded corners. No new P0/P1/P2 findings observed.

Packaged Electron 0.3.3 e2e passed, including navigation, file management, gallery, screenshot exact-pixel regression and narrow layout; no renderer errors. The local afterPack resource editor applies the selected Windows executable icon and Lantern product/file metadata; file version verified 0.3.3. Static external-JS action-binding findings remain documented, not treated as a clean strict audit. No network protocol behavior changed.

## 0.3.4 shared control revision

Explicit references: https://www.reactbits.dev/micro/glide-select and https://www.reactbits.dev/micro/squish-switch. Official JSX/CSS is used in shared React roots, with retained upstream/runtime licenses. Source options and settings remain bridged to their existing native values and IPC workflows. Visual evidence: qa/10-glide-select.png, qa/11-squish-switch.png, qa/12-glide-narrow.png and qa/13-settings-narrow.png. Inputs have no border/outline/shadow; primary and neutral command buttons retain readable semantic colors with shared 8px radius/overlay hover. No actionable P0/P1/P2 findings remain on these surfaces.

A first visual pass exposed a CSS-variable specificity issue that made primary buttons transparent; the default variable declaration was removed and primary contrast is now covered by the e2e suite. Narrow testing reproduced a popup closing during ancestor layout scrolling; menus now track their anchors, clamping or flipping within the viewport, and only dismiss when the anchor leaves it or the user dismisses. A packaged narrow test confirms viewport containment. Dynamic reduced-motion testing exposed the runtime hook's initial-only value; an explicit media-query subscription now updates the switch live and resets spring swell/flow when needed. Canceled switch drags restore their initial state without a later click double-toggle.

Validation: 11 backend tests, syntax plus JSX bundle build, source e2e, satellite e2e, packaged 0.3.4 e2e and narrow/reduced-motion controls checks passed. E2E includes actual option pointer/keyboard selection, gliding highlight, modal Escape isolation, switch click/keyboard/drag/cancel, input focus styles, primary contrast, settings persistence, real chat/file transfer and screenshot pixel equality. No renderer or console errors observed. Small-window control checks are retained in scripts/controls-qa.cjs. Static source audit still reports external event-binding false positives; see qa/premium-audit-0.3.4.json, not a clean strict audit claim.

The app ships only compiled control JS/CSS/legal notice (~392 KiB), not the React/Motion node_modules or JSX source directory. The source archive contains build dependencies and control sources for reproducibility. Physical Windows 10/multi-PC/mixed-DPI validation boundaries are unchanged. This revision is local only.

## 0.3.5 chat Refine Frame revision

Official reference/source: https://www.reactbits.dev/micro/refine-frame?status=refining and https://reactbits.dev/r/RefineFrame-JS-CSS.json. The official frame is integrated with real transfer/decode phases, Chinese status text, existing Fluent icons and the current 8px image/command language. It uses contain-fit rather than the reference's cover-fit to preserve the accepted uncropped image requirement. Unknown incoming dimensions retain a fallback aspect until decode; this one-time size change is documented instead of claiming perfect reservation without metadata.

A first visual pass found intrinsic-width collapse that compressed a 320px landscape frame to the card's 110px minimum and squeezed the retry label. ImageTransferFrame now provides definite content width. The image-state suite checks the 320px landscape width, portrait ratio and visible chip text after entry transition. Current visual evidence: qa/15-refine-upload.png and qa/16-refine-loading.png. Labels are visible after their entry animation; narrow images place retry outside the frame. No actionable P0/P1/P2 findings remain in the revised image states.

State fixture checks use isolated local protocol images to exercise active progress, stable roots across snapshots, queued incoming transfer, gated image decode, a deliberate 404/reload, failed-send retry, completed gallery and dynamic reduced motion. Expected missing-resource errors are recorded separately, with no unexpected renderer errors. The real Electron integration holds an actual HTTPS offer while the desktop decodes its recorded outgoing image preview, verifies active Refine Frame before transfer completion, releases it, and completes the original chat/file/controls/screenshot flows. Both source and packaged 0.3.5 e2e pass. Screenshot pixel equality still passes at current 125% scaling.

Resource control: no continuous RAF after a stage target is reached, intermediate mosaic canvases released after completion, DPR capped at 1.5 and stable image roots retained instead of remounting at each progress update. Static source audit retains the known externally bound event warnings and is not represented as clean strict output. Scope: chat images only; viewer/composer/file transfer permission behavior stays within the documented contract. Revision remains local, without GitHub publication.

Final accessibility pass: removed aria-hidden from the interactive media container and kept the decorative canvas hidden instead. The image-state test finds the preview by its accessible name, focuses it and opens the existing gallery with Enter. The final packaged e2e was rerun successfully after this correction.

## 0.3.6 release: cross-volume receiving, clarity, Lucide

Root cause confirmed from the screenshot and code: incoming partials are stored in the app-data volume while the chosen receive directory can be another volume; fs.rename cannot cross volumes. core/files.finalizeReceived now stages/copies on the destination volume, verifies size and SHA-256, syncs, commits locally and then removes the partial. Failure preserves the partial and removes the current attempt's empty reservation/stage. Tests cover existing same-name files, simulated EXDEV, disk-full cleanup/retry and a real local HTTPS transfer between different Windows device IDs (4102157014 -> 3405553687), 2,097,225 bytes exactly matched. All 15 backend tests pass.

Functional icons are generated/copied from lucide-static with its ISC notice; the custom approved infinity brand is retained. Actual updated surfaces were viewed in qa/02-files.png and qa/satellite-home-reference-state.png. Text/status blur effects were removed, permanent orbit/counter motion and idle transform promotion stopped, entry transforms discarded on completion and node positions physically aligned. Completed media has no filter or transform; intentional in-progress image refinement remains. No new actionable P0/P1/P2 findings in these surfaces.

User-readable error formatting is shared across engine snapshots/protocol errors, main IPC, normal renderer and capture overlay. Existing raw EXDEV history and IPC wrappers are covered. Diagnostics stay in user data, excluded from source artifacts. Error/retry image tests verify no native code/path text appears in the visible message.

Packaged desktop regression and narrow/reduced-motion controls pass. A current desktop capture source lacks display_id despite a single valid monitor; only the unambiguous one-monitor/one-source fallback is used. The current OS clipboard rejects a standalone native 40x30 image write (immediate and delayed reads empty). Positive clipboard copy/paste tests are explicitly skipped, not reported successful; instead the readable unavailable message and cancel are tested. That limitation appears in README and release notes. The 125% selection geometry and prior successful-pixel evidence are retained, but this release does not claim current-host positive clipboard coverage.

The user explicitly authorized publishing this revision. Source audit still reports known external-event-binding affordance warnings; runtime interaction verification, not a clean strict-static claim, is the evidence. Release remains a Windows x64 preview with physical dual-PC, Windows 10 and mixed-DPI field testing outstanding.

## Local 0.3.7

- Verified chat-layout-qa.cjs against real Electron: one/three/five/six lines, wrapped text, delete shrink, draft restoration, send reset, Shift+Enter, narrow viewport, shared scrollbar pseudo styling and brand hover inset. Reviewed desktop composer and brand-hover screenshots.
- Packaged local-0.3.7 Windows application passed the real pairing/chat/files/settings/images/capture E2E suite with no renderer errors. This run positively verified clipboard copying and exact capture pixels at 125% scaling (selection 200x120 CSS pixels, clipboard 250x150 pixels).
- Source syntax/build passed. Current revision remains local; no GitHub publication.

## Local 0.3.8

Composer animation checked in real Electron: intermediate growth frame, 180ms timing, interrupted retargeting, shrink, five-line cap and live reduced-motion cancellation. Existing composer/draft/scrollbar checks pass. Packaged local-0.3.8 passed pairing/chat/files/settings/images/capture E2E with no renderer errors and positive clipboard/exact-pixel capture verification. No publication.

## Settings and satellite 0.3.9 — selected visual implementation

- Source visual truth: D:/Lantern/design/settings-layout/settings-design-3.png, 1487x1058 pixels. User changes: section navigation scrolls to anchors rather than switching tab panels; add current pairing-code copy.
- Implementation: qa/settings-general-0.3.9.png, 1487x1058 CSS/pixel viewport, Playwright screenshot scale=css. Native Windows display scale is normalized by CSS screenshot capture. No image stretching/density mismatch in comparison.
- State: settings/general, auto-receive on, two paired devices below the fold. Source mock name differs from fixture name intentionally. Connections remain below general in the same scrolling page, superseding source hidden-tab interpretation. Topbar and footer retain real desktop app controls and sizes rather than new prototype chrome.
- Combined full-view comparison: qa/settings-comparison-final-0.3.9.png (2974x1058); source left, implementation right. Focused comparison: qa/settings-detail-final-0.3.9.png, ordinary inputs/labels, switch, path row, divider spacing. Also inspected qa/settings-connections-0.3.9.png, qa/settings-narrow-0.3.9.png and qa/files-no-sidebar-0.3.9.png.

### Comparison history and fixes

Initial comparison qa/settings-comparison-0.3.9.png found P2 native borders on anchor buttons, a denser/smaller initial type and spacing hierarchy, and P1 empty connection fields until the next snapshot poll. Anchor click also hit the scroll end before aligning the connection section. Fixed button border/background ownership, widened content to 1100px, increased descriptions to 16px, inputs to 15px, titles to 32/22px, expanded row rhythm, filled connection details immediately on entry, and gave the final section enough height to align below the sticky anchors. Recaptured and compared the final combined/full and detail images; no actionable P0/P1/P2 findings remain.

### Fidelity surfaces

- Typography: actual computed Segoe UI / Microsoft YaHei UI / Microsoft YaHei, 16px descriptions, 15px inputs, 13px helper text; headings 32/22px. Maintains the app's readable utility scale instead of copying generated text rasterization. Pair code uses clear 27px mono digits. No blurry rotating text.
- Spacing/layout: centered flat white layout, aligned description/control columns, thin separators, common 8px button radius. General and connection regions remain vertically arranged, with sticky anchors and full-width workspace. 780x580 no horizontal overflow; content scrolls vertically.
- Colors/tokens: existing blue #0868CF, dark #202733, muted #657183, white surfaces and pale borderless fields reused. Native black button outlines removed; keyboard focus retained.
- Images/icons: actual selected infinity logo asset and official Lucide glyphs; no generated screenshot used as a live UI. Existing Squish Switch remains functional.
- Copy: actual Chinese setting descriptions preserved, including restart requirement for device broadcast name. Removed source tab-navigation footnote because content now lives in the same page. Connection info/forget confirmation and readable copy failure text use actual app behavior.

### Behavior verification

- scripts/settings-qa.cjs: both regions present, sticky scroll anchors, manual scrollspy, keyboard/smooth scrolling, draft survives scrolling/poll, initial code/address populated, fresh main-process code copied to real text clipboard, readable/retryable clipboard failure, field validation, switch/name/shortcut save, directory selection, forget confirmation/cancel, no sidebar in both workspaces, narrow overflow checks. No renderer errors.
- scripts/satellite-qa.cjs: ordered spring entrance, moving coordinates, physical-pixel alignment, hover/focus pause, stable refresh, upright text, zoom/pan/reset, device arrival/departure, reduced motion and narrow viewport. LANTERN_DISCOVERY=0.
- scripts/chat-layout-qa.cjs: existing auto-height/animation and other composer behavior pass after workspace changes.
- Packaged release/local-0.3.9/win-unpacked/Lantern.exe: real E2E pairing, chat, transfers, files, settings, anchor navigation and copied current code, image gallery and screenshots pass; positive clipboard image verification and exact 125% scaled crop pixels; no renderer errors.
- Build/syntax passed. Static audit retains actionless-button findings because its HTML scanner does not resolve external JS handlers; relevant runtime actions above are exercised, so this is not a claim of a clean static audit.

Follow-up polish: generated mock text weight differs slightly from Windows-native font rendering; existing shared type/control tokens intentionally take precedence. No required work remains for this scope. Revision remains local, no GitHub publication.

final result: passed

## Compact settings 0.3.11

User refinement supersedes the spacious reference rhythm: reduce width, group/row spacing and field size, retaining the selected page structure. Combined equal-size comparison: qa/settings-density-0.3.11.png, previous implementation left and compact implementation right, each 1487x1058 CSS pixels. Current captures: qa/settings-general-0.3.11.png, qa/settings-connections-0.3.11.png and qa/settings-narrow-0.3.11.png. Reviewed full layout plus native-resolution narrow fields, switch and anchor alignment.

Typography uses 26/18/14px headings/labels and 12px helpers; shared Windows font family, blue/white/pale-input tokens and official logo/Lucide assets remain intact. Main width is 960px vs 1164px, row height 56px vs 76px, groups have 22px vs 34px vertical padding, and the switch aligns with the input-column start. This concentrates related controls while retaining legible labels, uncropped paths and keyboard targets. No new features or copy changes. Clicking 常规 now returns to scrollTop=0 so the title is fully visible; connection anchor remains sticky, aligned and scroll-tracked. Narrow 780x580 layout has no horizontal overflow.

Verification: build/syntax and settings interaction suite passed (anchors, scrollspy, draft preservation, current code real clipboard copy, readable failure/retry, field validation/save, switch, directory, forget cancel and no sidebars). Packaged release/local-0.3.11/win-unpacked/Lantern.exe passed controls/narrow popup and reduced-motion switch checks, with no renderer errors. No actionable P0/P1/P2 findings. No GitHub publication.

final result: passed

## Left alignment and natural page end 0.3.12

User refinement: align settings to the left and remove the large bottom blank. Runtime owner ui/controls/theme.css now uses margin:0 for the compact content block and no viewport-based min-height for settings-connections. The existing end-of-scroll current-anchor rule handles the final section without extra empty content. The previous requirement to force the last anchor to the top is superseded by this user request.

Evidence: qa/settings-general-0.3.12.png and qa/settings-connections-0.3.12.png (1487x1058 CSS-pixel fixture screenshots); qa/settings-narrow-0.3.12.png at 780x580; qa/settings-packaged-0.3.12.png from the actual build. Reviewed left margin, natural content end, sticky/current anchor and copy controls. Existing typography, labels, white/blue tokens, logo and Lucide assets are unchanged; layout now starts at 28px rather than centering. No clipping or horizontal overflow.

Build/syntax passed. Settings suite passed with explicit left-inset and final-content-gap checks, plus unchanged form, clipboard and navigation coverage. Packaged release/local-0.3.12/win-unpacked/Lantern.exe verified 28px left inset and 72.6px after the last empty-state content (normal paragraph/group/container spacing), rather than a viewport-sized spacer; current anchor, copying the live code and returning to general scrollTop=0 all pass with no renderer errors. No GitHub publication. No actionable P0/P1/P2 findings.

final result: passed
