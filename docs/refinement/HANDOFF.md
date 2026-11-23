# Jump the Car — native refinement handoff

## Changes owned
- `game.js`: cached layered mountain/forest/meadow scenery, themed native sky/moon, textured-looking asphalt and reflective landing edge, landing-plane contact ellipse plus cheap night headlight wedge. Clouds remain behind gameplay and stop for manual/reduced motion. Existing detailed SVG cars retained. Native Canvas fonts consume fontFamily. Level thumbnails now use page-native school lettering because SVG image documents cannot inherit the page font.
- `styles.css`: remove alternate native font declarations, preserve layout.
- `tools/physics-check.cjs`: native night and stopped-cloud regressions.
- `tools/browser-check.cjs`: day/night captures alongside normal/light captures.

## Checks
`make check` PASS: every original 60Hz tick matches at 10/15/20/30/60 FPS over 14 cars/100 levels and six obstacle kinds, including bounded stalls, pause, retry and airborne finish. `QA_DIR="$PWD/docs/refinement" node tools/browser-check.cjs` PASS at 1280×800 and 360×740: touch, actual first-track completion in four jumps, retry, native Home, gate, hidden/audio freeze, light/normal world invariance and offline persistence. Day/night captured as `jump-<width>-<theme>-scene.png`; existing browser runner does not include a short-landscape gameplay screenshot. No exhaustive all-car/all-track completion claim.

## Scope and integration
Approved bounded native visual pass, 23 November 2026. Work directly in the shared checkout; no commit/push. No shared `family-v2/` or service-worker edits by this worker. Those diff entries belong to Main's propagated kit/cache revision. Pre-existing `.DS_Store` left untouched. No new engines, paid artwork, packages, antialiasing, postprocessing or shadow-map budgets. Existing normal-quality shadows remain optional; default light mode unchanged. Audio OFF on load, saves, unlocked choices, Home and educational lock behavior preserved.

School lettering uses the existing FamilyV2 font, not a substitute. Existing source-generated Canvas/3D text waits on fontReady (Banana now also defers initial Phaser construction). Theme getters have OS/light fallback; motion getters gate decorative animation, not physical movement or mission clocks. Main owns shared-kernel CSS/font/cache exact-copy verification.

## Evidence and limits
`check.txt` and `browser.txt` hold the executed native checks and Chromium 151.0.7922.34 browser results. Screenshots are bounded task evidence in this folder. `browser-first-failures.txt`, where present, preserves early diagnostic failures; it is not the final result. `git diff --check` passed for all four checkouts. No Chromium 95 download or execution; no physical old-tablet CPU/GPU, battery, native OS gestures or exhaustive level playthrough certification. Rendering samples are desktop observations only. No claim of photorealism or exhaustive visual audit.

A green model/build test is not substituted for browser interaction. Tests continue to exercise native inputs, educational pauses, audio, Home and offline reload. No physics tuning was introduced. The bounded pass stops after focused implementation and evidenced fixes rather than extending to every track.
