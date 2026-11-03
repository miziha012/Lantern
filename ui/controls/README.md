# Lantern shared controls

Official React Bits source retrieved from:
- https://reactbits.dev/r/GlideSelect-JS-CSS.json
- https://reactbits.dev/r/SquishSwitch-JS-CSS.json

Descriptions/previews: https://www.reactbits.dev/micro/glide-select and https://www.reactbits.dev/micro/squish-switch.
License: assets/licenses/REACT-BITS-LICENSE.md (retained in application packages).

Adaptations: app light/blue palette, shared Lucide icons, browser top-layer popup placement, viewport placement and scroll tracking, active-row scrolling, visible trigger label association, native value/change bridge, switch canceled-pointer click suppression and live reduced-motion preference updates and hover scaling. JSX remains in this directory; compiled JS/CSS and legal notices are emitted with npm run build:ui. Source archives rebuild them through npm start / npm run pack:dir / test hooks. App packages exclude this source directory and include the emitted assets.

Regression owners: scripts/e2e.cjs and scripts/controls-qa.cjs.

Refine Frame source: https://reactbits.dev/r/RefineFrame-JS-CSS.json; same retained React Bits license. Adaptations: actual transfer/decode labels, contain-fit mosaic, stable timeline hosts, bounded/idle canvas work, live reduced-motion preference, semantic group and Lucide icons. Incoming unknown dimensions retain a fallback aspect until decode. Source/real-transfer checks: scripts/image-frame-qa.cjs and scripts/e2e.cjs.
