# Editorial Website Refresh Implementation Plan

> **For agentic workers:** Implement the approved design with independent build and review support. Preserve all existing publishing and delivery contracts.

**Goal:** Publish the selected editorial design with the current Articul8 AI role and Seoul location.

**Architecture:** A Hugo homepage consumes profile content and structured editorial data. Existing publication pages keep the theme and gain matching colors/type through its custom stylesheet hook.

**Tech Stack:** Hugo extended 0.97.3, existing Wowchemy modules, HTML/CSS, minimal progressive-enhancement JavaScript, Netlify.

**Spec:** `docs/superpowers/specs/2026-10-26-editorial-refresh-design.md`

## Global constraints

- Preserve publication URLs, CV, contact delivery, analytics, unrelated static files, and existing hosting.
- Current role: Korea GTM Lead, Articul8 AI. Previous role: AI/ML Analytic Scientist, Nationwide. Location: Seoul, South Korea.
- No fabricated role dates, metrics, or achievements; no contact submissions during checks.

## Review focus

- Long headings and navigation must fit 390px and 1440px viewports.
- Keyboard focus, contrast, reduced-motion settings, and anchors remain usable.
- Contact fields keep exact existing Netlify contract and visible labels.
- Publication detail pages, CV, metadata, and social links continue working.
- Publish the reviewed commit and verify it at the existing domain.

## Tasks

- [ ] Update author profile, SEO description, and homepage presentation data; check no current Nationwide/Columbus claims remain outside historical documents.
- [ ] Implement `layouts/index.html`, `static/css/editorial.css`, and theme custom SCSS; preserve semantic markup, metadata, form, and analytics.
- [ ] Build with the pinned Hugo version. Check generated internal links, assets, form fields, sitemap, and publication pages; inspect desktop/mobile in browser.
- [ ] Independent final review, correct concrete findings, commit and publish via existing Git/Netlify route, verify domain result.
