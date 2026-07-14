# DigiProd Brand Audit

Audit date: 13 July 2026  
Concept: **Growth Without Workflow Disruption**

## Sources inspected

- <https://www.digiprod.in/>
- <https://www.digiprod.in/wa/>
- <https://www.digiprod.in/flexcel/>
- <https://www.digiprod.in/services/>
- Live stylesheet: <https://www.digiprod.in/assets/index-BJ0Uock9.css>
- Existing logo: <https://www.digiprod.in/images/2e39bfe174c403beaceaa9de8c6742267189d31b.png>
- Existing Flexcel mark: <https://www.digiprod.in/brand/flexcel-icon.svg>

The pages were inspected from their live server-rendered HTML, linked CSS and JavaScript. The in-app rendered-browser connection was unavailable during research, so visual decisions were cross-checked against the delivered CSS, asset dimensions and the final local browser render.

## Existing brand foundations

| Foundation | Live value or behavior | Redesign use |
|---|---|---|
| Primary navy | `#20456e` | Primary buttons, links, key product surfaces |
| Dark navy | `#183352` | Strong section surfaces and secondary depth |
| Deep navy | `#10243b` | High-contrast sections, dashboards and footer |
| Copper / gold | `#d9a066` | Brand accent, workflow checkpoints and highlighted CTAs |
| Copper hover | `#c58f55` on live site | Refined as the darker copper state `#c48a52` |
| White | `#ffffff` | Main background and clean operational surfaces |
| Muted background | `#f8fafc` / `#f8f9fa` | Section contrast and form-detail surfaces |
| Border | `#e2e8f0` | Refined to `#d9e1e8` for stronger visibility |
| WhatsApp signal | `#25d366`, plus `#008069` | Integration cue only; not a replacement brand color |
| Excel signal | `#217346` | Integration cue only |
| Display face | `Outfit`, sans-serif | Preserved and loaded locally |
| Body face | `Inter`, system-ui, sans-serif | Preserved and loaded locally |

The complete implementation is in [`styles/tokens.css`](../styles/tokens.css). Secondary navy and copper tones are derived from the existing palette; no unrelated purple, neon or generic-blue identity was introduced.

## Typography audit

The live CSS declares:

```css
--font-display: "Outfit", sans-serif;
--font-body: "Inter", system-ui, sans-serif;
```

Live headings frequently use Outfit at weight 900, uppercase, italic, with tight tracking. Body copy uses Inter or the system sans stack. The live build declares the families but does not load font files.

The redesign preserves both intended families and loads the official variable fonts locally. It refines the hierarchy as follows:

- Display: Outfit, mostly 520–760, sentence case, tight but readable tracking.
- Body: Inter, mostly 400–760.
- Hero: fluid `48–102px` desktop range and `43–70px` mobile range.
- Section title: fluid `36–70px` range.
- Body: 16px base; important supporting copy 18–21px.
- Uppercase is reserved for short eyebrows and system labels.

This is a readability refinement, not a new typographic identity. The heavy uppercase-italic treatment is reduced because it made long benefit-led headlines harder to scan.

## Logo usage

- Existing logo file: 1319 × 580 PNG with transparency.
- Preserved without redraw, recoloring or distortion.
- Header use: approximately 38–42px tall in the prototype.
- Footer use: on a white holding surface for contrast against deep navy.
- Minimum clear space: at least half the icon height around the mark.
- Do not place the full logo directly over a busy workflow illustration.
- The existing Flexcel SVG is used as a product identifier on the Flexcel hero.

## Existing UI language

The live design uses:

- Fixed white navigation.
- Copper filled primary buttons.
- Navy product and process surfaces.
- Rounded cards and large-radius panels.
- Fine operational grids.
- Excel, WhatsApp and Tally motifs.
- Inline Lucide icons.
- Interactive process visuals rather than generic stock photography.

## Refined visual system

The redesign keeps the above language and modernizes it through:

- More white space and stronger editorial composition.
- A 1280px content container and consistent grid.
- Fewer isolated rounded cards.
- Clearer surface contrast between story chapters.
- Stronger distinction between primary, secondary and quiet CTAs.
- Original HTML/CSS workflow diagrams.
- Restrained shadows and 8px-based spacing.
- Sentence-case benefit headlines.
- Accessible focus indicators using the existing copper accent.

## Button audit and refinement

Live primary buttons use a copper fill, white text, uppercase tracking, a 16px radius and a small hover scale. The redesign preserves the rounded, confident interaction language but gives conversion hierarchy to navy:

- **Primary**: navy fill, white text, used for the next conversion step.
- **Accent**: copper fill, deep-navy text, used on dark workflow sections.
- **Secondary**: white/translucent fill with navy border.
- **Light**: white fill on navy sections.
- **Quiet**: compact border treatment for low-priority actions.

All variants have a 52px minimum height, visible keyboard focus, hover feedback and disabled/loading states.

## Claim and trust treatment

The source pages contain conflicting or unsupported statistics, security superlatives, time promises and guarantees. Examples include conflicting founder totals, on-time percentages, “bank-grade”/“military-grade” phrasing, exact ROI claims and named-testimonial impact metrics.

The redesign does not carry these claims into launch-ready copy. Source-site testimonials and case summaries are retained only with a visible **Requires Client Approval** label. See `testimonial-audit.md` and `copy-audit.md`.

