# Kyiv payment badges

The product trust block and footer share `snippets/nbk-payment-icons.liquid`.
Both use their existing `svg` and `height` theme settings. The default, outlet,
and gift-card product templates use 32px badges; the footer uses 28px badges.

Verified against the visible Kyiv Chekly checkout on 6 October 2026:

- `plata`: plata by mono card payment
- `liqpay`: LiqPay card payment
- `mono_installments`: monobank Purchase in Instalments
- `privat_installments`: PrivatBank Payment in Instalments
- `pay_on_receipt`: payment on collection in store or at the post office

Visa and Mastercard identify the existing card networks. The displayed list is
explicit, because Shopify's enabled payment types do not describe the external
Chekly checkout. Recheck Chekly when enabling or disabling a method and update
the `svg` lists in the three product templates and `sections/footer-group.json`.
Badges do not change gateway configuration or guarantee instalment eligibility.

Artwork: plata and monobank SVGs come from the visible Chekly payment selector;
the monobank wordmark uses the same black fill as that selector. LiqPay and
PrivatBank reuse the existing theme assets. Visa/Mastercard use Shopify's
`payment_type_svg_tag`. Payment on receipt has a generic banknote icon and a
localized label, because the checkout has no branded logo for that method.

Validation: previewed product and footer at desktop and 390px mobile, with
seven badges in each location, loaded logo assets, uniform heights and no badge
overflow. Ukrainian and English labels verified. Theme Check reports no errors
in changed files; the compatibility fallback for other existing payment keys
retains the legacy remote-asset warning. The theme has unrelated existing lint
findings. Schema setting IDs, SVG XML and product JSON also validated.
