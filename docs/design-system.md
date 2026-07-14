# DigiProd Redesign System

## System intent

The system expresses a four-part story:

`Existing tools → connected automation → reliable control → scalable growth`

It is intentionally operational rather than futuristic. Excel-cell grids, flow checkpoints, chat inputs, Tally references and audit-style status labels are used as quiet structural motifs.

## Foundations

- Token source: `styles/tokens.css`
- Global reset and layout: `styles/global.css`
- Components: `styles/components.css`
- Breakpoint behavior: `styles/responsive.css`
- Spacing base: 8px
- Maximum content width: 1280px; 1312px at very wide viewports
- Desktop grid: 12 columns
- Tablet grid: 8 columns
- Mobile grid: 4 columns
- Desktop section spacing: 112–152px
- Mobile section spacing: 64–88px

## Color styles

| Figma-style name | Token | Value | Primary use |
|---|---|---:|---|
| Brand / Navy / 950 | `--color-navy-950` | `#10243b` | Dark sections, footer |
| Brand / Navy / 900 | `--color-navy-900` | `#183352` | Heading depth |
| Brand / Navy / 800 | `--color-navy-800` | `#20456e` | Primary action and link |
| Brand / Copper / 500 | `--color-gold-500` | `#d9a066` | Checkpoints and accent CTA |
| Brand / Copper / 100 | `--color-gold-100` | `#f7eadc` | Warm conversion surface |
| Neutral / Ink | `--color-ink` | `#1a2b3c` | Main body text |
| Neutral / Muted | `--color-muted` | `#5f6f7e` | Supporting text |
| Neutral / Line | `--color-line` | `#d9e1e8` | Dividers and inputs |
| Signal / Excel | `--color-excel` | `#217346` | Excel-only cue |
| Signal / WhatsApp | `--color-whatsapp` | `#008069` | WhatsApp-only cue |

## Typography styles

| Style | Typeface | Weight | Responsive size |
|---|---|---:|---:|
| Display / Hero | Outfit | 650 | 48–102px |
| Display / Section | Outfit | 650 | 36–70px |
| Display / H3 | Outfit | 600–650 | 22–40px |
| Body / Lead | Inter | 400–500 | 18–21px |
| Body / Default | Inter | 400 | 16px |
| Body / Small | Inter | 400–750 | 14px |
| Label / Eyebrow | Inter | 800 | 12px, uppercase |

## Core components and variants

- `Navigation / Desktop / Default`
- `Navigation / Desktop / Scrolled`
- `Navigation / Mobile / Closed`
- `Navigation / Mobile / Open`
- `Button / Primary / Default, Hover, Focus, Loading, Disabled`
- `Button / Accent / Default, Hover, Focus`
- `Button / Secondary / Default, Hover, Focus`
- `Button / Light / Default, Hover, Focus`
- `CTA / Inline Link`
- `CTA / Conversion Band`
- `CTA / Mobile Sticky Bar`
- `Workflow / Home / Connected Flow`
- `Workflow / Flexcel / Before`
- `Workflow / Flexcel / After`
- `Workflow / Services / Ecosystem`
- `Quote / Approval Required`
- `Case Study / Approval Required`
- `FAQ / Closed, Open, Focus`
- `Use Case / Closed, Open`
- `Form Field / Empty, Focus, Error, Complete`
- `Form / Default, Loading, Validation Error, Success`
- `Service / Catalogue Item`
- `Process / Step`

## Accessibility rules

- Text contrast targets WCAG AA or better.
- Copper is not used as small text on white unless the darker `#a96f3c` tone is used.
- Minimum action height is 44px; primary actions use 52px.
- All fields have persistent labels and linked error descriptions.
- Navigation drawer traps keyboard focus and closes on Escape.
- Tabs use `tablist`, `tab`, `tabpanel`, arrow-key movement and roving tabindex.
- Accordions use native `details/summary` semantics.
- Every status update is announced through an `aria-live` region.
- Motion is removed when `prefers-reduced-motion: reduce` is active.
- No information is communicated by color alone.

## Motion

- Micro interaction: 180ms.
- UI transition: 320ms.
- Story reveal: 720ms.
- Header background and shadow change after scrolling.
- Workflow status pulse is decorative and removed for reduced motion.
- No scroll hijacking, parallax or auto-advancing carousel.

## Content rules

- Lead with the business outcome before the technical mechanism.
- Keep one primary idea per paragraph.
- Avoid unsupported percentages, guarantees and universal time promises.
- Keep source-site proof labels visible until client approval.
- Every major story chapter ends with a contextual route to the enquiry form.

