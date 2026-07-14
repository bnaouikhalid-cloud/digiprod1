# DigiProd Home, Flexcel & Services Redesign

High-fidelity static prototype for the **Growth Without Workflow Disruption** concept.

## Pages

- `/home/index.html` — benefit-led DigiProd Home page
- `/flexcel/index.html` — adoption and integration-focused Flexcel page
- `/services/index.html` — outcome-led DigiProd Services page
- `/about/index.html` — local DigiProd company page
- `/knowledge-hub/index.html` — local workflow and automation guides
- `/privacy/index.html` — local prototype privacy information
- `/` — redirects to `/home/index.html`

## Run locally

From the `digiprod-redesign` directory:

```powershell
node scripts/dev-server.mjs
```

Then open <http://localhost:8080/>.

No build step, paid API or credential is required.

## Static deployment

The project can be deployed directly to Vercel as a static directory. Set `digiprod-redesign` as the project root and leave the build command empty. Internal navigation uses explicit `index.html` files so the same links work under Vercel, ordinary static hosting and local `file://` previews.

## Interaction coverage

- Sticky/scrolled desktop header
- Accessible mobile navigation drawer
- Contextual CTAs at major story depths
- CTA-driven form preselection and hidden context tracking
- Source-page tracking
- Flexcel before/after tabs with keyboard behavior
- Native accessible FAQ and use-case accordions
- Form validation, error, loading and success states
- Mobile sticky enquiry bar
- Reduced-motion support

## Form note

The prototype intentionally does not transmit personal data. A valid submit demonstrates validation, loading and success states and clearly says the production endpoint must be connected. Before launch, connect the approved secure lead endpoint and show success only after a confirmed server response.

## Documentation

- `docs/brand-audit.md`
- `docs/copy-audit.md`
- `docs/testimonial-audit.md`
- `docs/asset-register.md`
- `docs/design-system.md`
- `docs/responsive-spec.md`
- `docs/figma-handoff.md`
- `docs/conversion-strategy.md`
- `docs/qa-report.md`

## Content integrity

- Existing copy has been reused and revised rather than discarded.
- Unsupported statistics, guarantees and security superlatives are excluded.
- Source-site testimonials and case summaries remain labelled **Requires Client Approval**.
- Anonymous avatar imagery, media logos and customer logos are not used.

## Browser support

Current evergreen Chrome, Edge, Firefox and Safari. The design degrades safely if `backdrop-filter` or `IntersectionObserver` is unavailable.
