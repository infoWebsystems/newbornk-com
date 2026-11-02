# Mobile UX preview — footer and service links

Unpublished theme: `201119891616`, **Mobile UX review - 2 Nov 2026**.
Base: `kalles-main` at `1675fde` (includes PRs 105 and 106).

## Changes

- Replace the repeated contact strip, large footer and separate copyright row with one compact section. Keep the original sections disabled in the group for rollback.
- Customer care and legal information use native details elements: collapsed on mobile, open on desktop, all content accessible without JavaScript.
- Keep Kyiv address, opening hours, phone, email, existing Google review link/count and social accounts. The Google rating/count is retained configuration, not a newly fetched live count.
- Preserve the native Yespo signup flow (`f35732v35732`). The footer opens that form; it is not a new Shopify newsletter form. Add a contact fallback if the widget cannot load.
- Keep the seven configured payment methods in one compact row and link to their terms. Icons do not activate a gateway or guarantee wallet availability.
- Translate service labels in Ukrainian and English while preserving existing page URLs. The generic collection heading and breadcrumb say “Всі товари / All products”.
- Add a visible return enquiry link to the existing contact form, with a request for the order number. It does not create a return automatically.
- Allow a mobile section-heading action to wrap below the title before splitting a word. Long headings keep whole words; short headings such as SALE can keep the action alongside. Desktop styling is unchanged.

## Validation

- UA and EN at 320, 360, 375, 390, 414 and 430 px: no horizontal page overflow, payment icons remain on one row, footer disclosures start closed.
- EN at 1280 px: three columns and open service groups.
- Footer height at 390 px: 878 px versus 1,742.5 px before this change (approximately 50% shorter).
- Opening Customer care reveals the existing delivery, returns, KREW, contact, about and account destinations.
- English Subscribe opens the translated Yespo modal. No test subscription or customer message submitted.
- English return CTA reaches `/en/pages/contact#ContactForm`, including request type and order-number fields.
- 24 targeted policy-layout, browse-localization, Yespo-signup and JSON-LD/H1 regression checks pass.
- Theme Check has no findings in changed files. Existing findings remain elsewhere in 91 theme files; the whole-theme check is not clean.
- Footer schema IDs are unique; static blocks are excluded from dynamic block order.
- Follow-up heading check: Ukrainian at 320, 360, 375, 390, 414, 430 and 1280 px, and English at 320, 390, 430 and 1280 px. DOM text ranges confirm each word in New arrivals occupies one line, with no horizontal page overflow.

## Acceptance still required

Real iPhone Safari and Android Chrome: keyboard, browser Back, safe areas, form validation, popup close/reopen, drawer/filter interaction, variant selection and checkout handoff. Desktop viewport emulation does not establish physical-device acceptance.

Stage 3 data work is tracked separately in `mobile-data-stage-2026-11-02.md`. This preview does not change discount calculations, customer balances, product variants, menu records, account type or payment configuration. Publication requires the agreed acceptance and explicit approval.

## Rollback

Restore the prior `sections/footer-group.json` to re-enable the original three sections. Revert this change to restore service labels, heading fallback and return-page CTA. Preview uploads were limited to the changed theme files; production was not published.
