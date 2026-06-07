# Visualization Fixes Plan — ALL APPLIED

## File 1: static/style.css

### Change A ✅ — Bump dark-mode viz fill opacities
Final values: `0.45` / `0.45` / `0.2` / `0.5` / `0.5` / `0.35` / `0.35` / `0.45`

### Change B ✅ — Bump light-mode viz fill opacities
Final values: `0.4` / `0.4` / `0.2` / `0.5` / `0.5` / `0.35` / `0.35` / `0.45`

### Change C ✅ — Add `alignment-baseline: middle` to diamond-text and action-box

### Change D ✅ — Fix console scrolling (min-height: 0 on #memory-pane, #viz-pane, #console-pane)

### Change K (round 2) ✅ — Layout: right-panes scrollable, viz-pane dynamic height
- `.right-panes { overflow-y: auto; }` — entire right column scrolls
- `#memory-pane, #viz-pane, #console-pane { flex: none; }` — each sizes to own content
- `#viz-content { overflow: visible; flex: none; min-height: auto; }` — no internal scrollbar
- `#memory-pane .scrollable { max-height: 120px; }` — memory stays compact with internal scroll
- `.scrollable` — `min-height: 0` removed (reverts to auto)

### Change L (round 2) ✅ — Add SVG glow filter to active diamond
- `<filter id="diamond-glow">` with `feDropShadow` matching arithmetic's `box-shadow`
- Applied to diamond element when `!isPending`

## File 2: static/script.js

### Change E ✅ — Clear console on code edit

### Change F ✅ — Fix renderSi diamond text and label positions
Font 11px, text Y dy+1, Oui/Non labels repositioned, action boxes widened/repositioned

### Change G ✅ — Nested Si diamond support via siConditionStack
State variable, stack loop in renderViz, isOuter param, opacity reduction, reset

### Change H ✅ — Fix renderCas value centering
valText Y 18, branch text Y 87

### Change J ✅ — Cas animation phases in frontend
renderCas accepts casStep/casCurrent/casChecked, handles evaluating/checking/matched states

## File 3: interpreter.py

### Change I ✅ — Cas animation phases in backend
Evaluating → checking each case → matched, with `cas_step` / `cas_current` / `cas_checked` in snapshots
