# Mobile UX preview — 2 November 2026

First preview from the approved mobile UX handoff. This change does not complete the entire handoff backlog.

## Review target

- Store: newbornk.com
- Unpublished theme: **Mobile UX review - 2 Nov 2026**, ID `201119891616`
- Preview: https://newbornk.com/?preview_theme_id=201119891616
- English: https://newbornk.com/en?preview_theme_id=201119891616
- Based on `kalles-main` at `2fdb576`; preview was duplicated from the current live theme to preserve its app settings and license.
- Only the nine theme files in this change were pushed. No live-theme publication, layout replacement, customer data changes, or app-admin changes were made.

## Changes

### Welcome popup

The existing Yespo welcome form is presented as a white, centered card with the real wordmark, a visible Email label, concise Ukrainian/English copy, and compact consent and offer conditions. The native input, submit action, validation, privacy link, and dismissal handlers remain in use.

The styling targets welcome widget `f35732v35732` and its nested shadow roots. Signup text is rewritten only while its native email input exists. Other native form states retain their content.

The dialog has a 44px close target, Escape/backdrop dismissal, keyboard focus containment and restoration. It does not focus the input automatically. A short viewport or keyboard scrolls the outer dialog, rather than creating a second scroller inside the form. Chat and gift launchers are hidden while the dialog is open.

### Mobile navigation

Five actions share equal widths and a common baseline, including the native Shopify account control. Labels fit a 320px viewport, zero-count badges are hidden, and safe-area spacing is included. Catalog links to the locale-aware All products collection. Native search, cart, wishlist and account behavior is preserved.

### Chat

The existing 30-second startup delay is retained. The widget starts closed, does not restore an earlier open state, and suppresses the unsolicited unread-message preview. The compact launcher and unread badge remain available; opening and closing the conversation manually still works.

## Validation performed

- JavaScript syntax checks and `git diff --check` passed.
- Shopify Theme Check found no findings in the changed files. The full theme still has pre-existing findings in 91 files.
- Read back all nine uploaded theme files from the unpublished theme and confirmed they match the working tree (JSON compared without Shopify-generated comments).
- Checked Ukrainian layouts at 320×640, 360×640, 390×844 and 430×932, and English at 320×640 and 390×844. No horizontal overflow or inner form scroller in these views.
- Checked a short 320×360 viewport: the whole dialog is scrollable and all controls remain reachable.
- Invalid email shows the native validation state with an accessible inline message. X, decline, Escape and keyboard focus wrap/restore were exercised.
- Catalog navigation, search entry, account menu and cart count updates were checked. Added one selected-size product, verified the cart line, then removed only that test line and restored the original cart contents.
- Chekly opened with the cart and checkout form. No order or payment was submitted.
- Chat was absent before the delay, appeared as a 44px launcher, stayed closed, and opened/closed manually.
- Isolated startup checks cover delayed and late load, one-time initialization and closed-state render options.

## Remaining before production approval

- Real iPhone/Safari and Android/Chrome acceptance, including the on-screen keyboard and device safe area. Browser viewport checks are not device testing.
- Authorized valid-email submission, native success/already-subscribed states, confirmation and welcome-email delivery. No new subscription was submitted in this stage.
- A valid performance baseline: PageSpeed returned quota exceeded, so no Lighthouse/Core Web Vitals score was obtained.
- Visual approval of this preview. Merging into a branch connected to the live theme can deploy it; keep the PR in draft until approval.

## Later handoff stages

- Footer density, remaining translations and service links.
- Size/filter data cleanup and KREW personalization based on verified Shopify/BAS data.
- Final mobile regression and an explicitly approved production rollout.
