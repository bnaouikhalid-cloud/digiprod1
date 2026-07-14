# Quality Assurance Report

Run date: 13 July 2026  
Local target: `http://127.0.0.1:8080/`

## Result

**Pass — no blocking prototype defects found.**

## Automated browser matrix

Pages:

- Home
- Flexcel
- Services

Widths tested for every page:

- 360px
- 390px
- 430px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

Assertions passed at all 24 page/width combinations:

- Exact requested viewport applied.
- No document or body horizontal overflow.
- Exactly one H1.
- No duplicate IDs.
- No broken images.
- Outfit and Inter loaded locally.
- Correct desktop/mobile navigation breakpoint.
- Correct mobile sticky-CTA breakpoint.
- No browser log or runtime errors.

## Interaction tests

Passed on all three pages:

- Mobile menu opens.
- Mobile menu closes with Escape.
- CTA preselects the intended enquiry category.
- Empty form submission exposes inline invalid states.
- Valid prototype submission enters loading state and then success state.
- Source-page tracking is populated.
- CTA-context tracking is populated.
- Every explicit form label resolves to a real control.

Additional Flexcel test:

- Before/after tabs update `aria-selected`, panel visibility and keyboard-ready tab state.

## HTML validation

`html-validate` result: **0 errors, 0 warnings** across:

- `home/index.html`
- `flexcel/index.html`
- `services/index.html`

## Accessibility audit

Automated Lighthouse accessibility scores:

- Home: **100**
- Flexcel: **100**
- Services: **100**

This does not replace human assistive-technology testing before production. Recommended pre-launch checks remain VoiceOver/NVDA reading order, real-device keyboard behavior and client-approved copy review.

## Link and asset validation

- All local HTML `href` and `src` references resolve.
- Root, Home, Flexcel, Services, CSS, JavaScript, image and font requests return HTTP 200 locally.
- External DigiProd links used by the prototype returned HTTP 200 at audit time:
  - About Us
  - Knowledge Hub
  - Privacy Policy

## Production limitation

The enquiry form is an intentionally non-transmitting static prototype. It demonstrates validation, context preselection, loading and success states. Production launch requires DigiProd’s approved lead endpoint, server-side validation, consent logging, spam protection, error monitoring and an approved privacy/data-retention flow.

