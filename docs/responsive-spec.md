# Responsive Specification

The mobile experience is a reordered single-column story, not a compressed desktop frame. Production QA must cover every width below.

## 1920px

- Content container increases to 1312px.
- Hero retains a balanced two-column layout with additional exterior whitespace.
- Story sections do not stretch text lines beyond the defined readable measures.
- Section spacing reaches the 152px maximum.

## 1440px

- Reference desktop frame.
- 12-column grid, 80px margins, 24px gutters, 1280px usable width.
- Hero uses approximately 5/7 columns for copy/visual.
- Header presents full navigation, direct line and primary CTA.
- Major section spacing: 112–152px.

## 1280px

- Fluid exterior gutter keeps content clear of the viewport edge.
- Header direct line may be removed before primary navigation is compressed.
- Two-column hero and major editorial compositions remain.

## 1024px

- Header changes to logo + accessible menu button.
- Hero becomes one column; copy appears before the visual.
- Sticky editorial content becomes static.
- Outcome grids change from three to two columns.
- Catalogue and ownership layouts become one column.
- Process steps use a 2 × 2 grid.

## 768px

- 8-column tablet grid, 32px margins, 20px gutters.
- Primary CTAs can remain side by side when their labels fit.
- Workflow visuals are simplified but retain readable labels.
- Enquiry copy and form stack vertically.

## 430px

- 4-column mobile grid, 20px margins, 16px gutters.
- Sticky mobile enquiry bar is active after the first scroll depth.
- Buttons become full width.
- Workflow input/result columns use two compact columns where space allows.
- Tables become stacked labelled blocks.
- Footer uses two columns after the full-width brand block.

## 390px

- Reference mobile frame.
- 20px margins and 16px gutters.
- Hero title scales within a 43–70px clamp.
- Before/after tabs stay side by side with 44px+ targets.
- Use-case summaries show number, title, summary and control on separate grid rows.
- All form fields are single column.
- Minimum touch target is 44px.

## 360px

- Exterior gutter becomes 16px.
- Tool and workflow chip pairs collapse to one column when necessary.
- Navigation logo and menu button are reduced without reducing target size below 44px.
- Footer becomes one column if text wrapping would produce narrow link columns.

## Content behavior

- Desktop hero workflow: input → automation core → results.
- Mobile hero workflow: inputs → automation core → results vertically.
- Desktop implementation paths: horizontal or wide-row sequence.
- Mobile implementation paths: numbered vertical sequence.
- Desktop comparison: three-column semantic table.
- Mobile comparison: one card per decision with labelled stacked states.
- Desktop CTA opportunities can sit beside copy.
- Mobile CTA opportunities become full-width buttons and the sticky enquiry bar provides continuity.

## QA acceptance criteria

- No horizontal overflow at 360, 390, 430, 768, 1024, 1280, 1440 or 1920px.
- No body copy line exceeds approximately 75 characters on wide screens.
- No workflow text is smaller than 11px; essential content remains 12px or larger.
- Focus rings are never clipped.
- Mobile menu and form remain usable with the on-screen keyboard.
- Sticky mobile CTA does not cover the final enquiry form or footer controls.

