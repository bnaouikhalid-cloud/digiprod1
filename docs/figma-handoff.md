# Figma Handoff Specification

## Figma status

No direct Figma integration was available. No `.fig` file is claimed. The responsive HTML prototype is the source of truth for an organized Figma recreation using the frames, styles and components below.

## Pages and frames

Figma page order:

1. `01 — Home`
2. `02 — Flexcel`
3. `03 — Services`
4. `Components`
5. `Styles`
6. `Prototype Flow`
7. `Content Notes`

Required frames:

- `01 — Home / Desktop` — 1440px wide, hug content height
- `01 — Home / Mobile` — 390px wide, hug content height
- `02 — Flexcel / Desktop` — 1440px wide, hug content height
- `02 — Flexcel / Mobile` — 390px wide, hug content height
- `03 — Services / Desktop` — 1440px wide, hug content height
- `03 — Services / Mobile` — 390px wide, hug content height

Use a separate short `Prototype Flow` frame to document conversion links rather than drawing connectors across production frames.

## Grids

Desktop 1440:

- Columns: 12
- Margin: 80px
- Gutter: 24px
- Column width: fluid
- Content width: 1280px

Mobile 390:

- Columns: 4
- Margin: 20px
- Gutter: 16px

Tablet 768:

- Columns: 8
- Margin: 32px
- Gutter: 20px

## Auto Layout rules

- Page frames: vertical Auto Layout, gap `0`, height `Hug contents`.
- Sections: vertical Auto Layout, horizontal padding by grid, vertical padding from spacing styles.
- Section headings: desktop horizontal with `Space between`; mobile vertical.
- Buttons: horizontal Auto Layout, gap 8px, minimum height 52px, horizontal padding 20px.
- Cards: vertical Auto Layout with content-aligned footer CTA.
- Forms: desktop two-column nested Auto Layout; mobile single column.
- Catalogue rows: desktop horizontal, mobile vertical.
- Never use absolute positioning for primary content; reserve it for decorative grids and connector lines.

## Spacing styles

- `Space / 08`
- `Space / 16`
- `Space / 24`
- `Space / 32`
- `Space / 40`
- `Space / 48`
- `Space / 64`
- `Space / 80`
- `Space / 96`
- `Space / 112`
- `Space / 128`
- `Space / 152`

Desktop section padding: 112–152px. Mobile section padding: 64–88px.

## Text styles

- `Display / Hero / Desktop`
- `Display / Hero / Mobile`
- `Display / H2 / Desktop`
- `Display / H2 / Mobile`
- `Display / H3`
- `Body / Lead`
- `Body / Default`
- `Body / Small`
- `Label / Eyebrow`
- `Label / System`

Use Outfit for display styles and Inter for all body/label styles.

## Color styles

- `Brand / Navy / 950`
- `Brand / Navy / 900`
- `Brand / Navy / 800`
- `Brand / Navy / 100`
- `Brand / Copper / 700`
- `Brand / Copper / 500`
- `Brand / Copper / 200`
- `Brand / Copper / 100`
- `Neutral / Ink`
- `Neutral / Muted`
- `Neutral / Line`
- `Neutral / White`
- `Neutral / Soft`
- `Signal / Excel`
- `Signal / WhatsApp`
- `State / Error`
- `State / Success`

Values map directly to `styles/tokens.css`.

## Effects

- `Shadow / Small`: `0 8 24 / Navy 8%`
- `Shadow / Medium`: `0 18 50 / Navy 12%`
- `Shadow / Lift`: `0 30 80 / Navy 16%`
- `Focus / Copper`: 3px copper outline with 3px offset
- Avoid blurred glass effects except the sticky navigation surface.

## Icon sizing

- Inline UI icon: 16px
- Button icon: 16–18px
- Tool badge: 36–42px
- Product mark: 48–56px
- Minimum icon touch container: 44px

The prototype uses original CSS badges and simple typographic marks. If Lucide is introduced in Figma, use the 2px stroke set consistently and retain its ISC licence entry.

## Component set

- `Navigation / Desktop` — Default, Scrolled
- `Navigation / Mobile` — Closed, Open
- `Button` — Primary, Accent, Secondary, Light, Quiet × Default, Hover, Focus, Loading, Disabled
- `Form Field` — Text, Email, Tel, Select, Textarea, Checkbox × Empty, Focus, Error, Complete
- `Enquiry Form` — Home, Flexcel, Services × Default, Loading, Error, Success
- `CTA / Conversion Band`
- `CTA / Mobile Sticky`
- `Testimonial` — Requires Approval, Verified (reserved)
- `Case Study` — Requires Approval, Verified (reserved)
- `FAQ Item` — Closed, Open
- `Use Case Item` — Closed, Open
- `Workflow / Home`
- `Workflow / Flexcel` — Before, After
- `Workflow / Services`
- `Process Step` — First, Middle, Last
- `Service Catalogue Item`

## Navigation variants

- Desktop initial: translucent white, no shadow.
- Desktop scrolled: opaque white, subtle border and shadow.
- Mobile closed: logo + 48px menu control.
- Mobile open: full-height drawer below the fixed header, large rows and persistent conversion action.

## CTA variants and preselection

Every CTA connects to the same page’s `#enquiry` section and sets both:

- `help_type`
- `primary_challenge` where relevant

Prototype examples:

- `Automate My Current Process` → Process automation / Repeated manual work
- `Review My Excel & Tally Flow` → Tally integration / Disconnected tools
- `Build My Custom Portal` → Custom application / Disconnected tools
- `Plan My Technology Roadmap` → Fractional CTO / Technology direction

## Responsive constraints

- Text and content containers: left/right constraint.
- Full-width section surfaces: left/right scale.
- Hero visual: fixed aspect on desktop, hug height on mobile.
- Workflow columns: horizontal on desktop, vertical on mobile.
- Sticky copy: sticky only at 1024px and above.
- Mobile sticky CTA: fixed to bottom, hidden when the enquiry section intersects.
- No fixed-height mobile content frames.

## Prototype connections

- Header Products → Flexcel page.
- Header Services → Services page.
- Home secondary hero CTA → Home workflow section.
- Flexcel secondary hero CTA → Before/after workflow.
- Services secondary hero CTA → Partnership models.
- All conversion CTAs → contextual enquiry form.
- FAQ rows → open/close interaction.
- Flexcel before/after tabs → change variant.
- Mobile menu → overlay open/close; Escape and background close behavior noted.
- Form submit → Loading → Success state.

## Layer naming

Use semantic slash-separated names:

- `Section / Home / Hero`
- `Section / Flexcel / Integration Journey`
- `Section / Services / Catalogue`
- `Content / Heading Group`
- `Workflow / Input / WhatsApp`
- `Workflow / Core / Flexcel`
- `Workflow / Output / Founder View`
- `CTA / Primary / Context Name`
- `Form / Field / Work Email`
- `Proof / Testimonial / Vikram Shah / Requires Approval`

Avoid names such as `Frame 42`, `Group 16` or `Rectangle 9` in handoff frames.

