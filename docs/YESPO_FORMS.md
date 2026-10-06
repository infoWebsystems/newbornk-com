# Kyiv production forms in Kalles

Verified against live Dawn theme 133779652768 and the NEWBORN K Yespo account on 2026-10-07.

## Newsletter

Dawn's footer uses Shopify's native customer form. The production Yespo signup experience is the published welcome popup 35732, opened automatically or by gift launcher 35733. The separate Yespo footer form 32641 is unpublished and is not used here.

Kalles now opens the published welcome popup from its footer using the exact invocation shown in Yespo:

```js
eS('showForm', { formVariantId: 'f35732v35732' });
```

The existing Yespo app embed supplies the SDK, popup and gift launcher. The footer no longer collects an email through Shopify. Consent, double opt-in, confirmation email and the welcome event remain owned by the published Yespo form. No duplicate SDK or unpublished widget is activated.

The footer trigger and help/error copy support Ukrainian and English. The popup uses the production Ukrainian content; this change does not create an English Yespo form.

## Existing integrations retained

| Integration | Kalles state |
| --- | --- |
| Yespo SDK, popup and gift launcher | Same enabled app embed as Dawn |
| Yespo App Inbox | Existing Kalles `#app-inbox` mount and integration retained |
| KeyCRM chat | Existing Kyiv integration retained |
| REZ restock | Enabled; existing Kalles variant integration retained |
| Judge.me reviews | Enabled in Kalles |
| Pandectes, Instagram, Multifeeds, Klaviyo embeds | Match Dawn's enabled state |
| AOV cart and Wishlist Hero | Remain disabled; Kalles cart/Chekly and native wishlist are intentional |
| Shopify Inbox | Remains disabled; support chat is KeyCRM |

App embed settings were compared rather than copied wholesale. This change does not modify shared Yespo publication rules, app account settings or the live theme.

## Verification and limits

- Footer click opens the real Yespo popup in unpublished preview theme 199582843040, including email input, consent and privacy link.
- Mobile preview checked at 390px; Shopify's preview toolbar can cover the popup's bottom edge and is absent on the public storefront.
- Signup integration, Yespo recommendation and REZ regression suites: 16 passing tests.
- Liquid block schema and both locale JSON files parse successfully.
- Missing SDK function or synchronous SDK errors show a retry message. A queued SDK call does not itself prove the remote popup loaded; actual popup opening was checked in the browser.
- A separately authorized fresh test alias was submitted through the real preview popup. The popup displayed its “check your email” confirmation, but the contact was not found in Yespo and neither the Yespo single-send report nor Gmail showed the confirmation email during the check. Double opt-in and welcome delivery are therefore **not verified**; resolve this before production launch. No automatic resubmission or changes to shared marketing rules were made.

Only the newsletter block, its JS asset and Ukrainian/English locale files were pushed to the unpublished preview. Publication is a separate step.
