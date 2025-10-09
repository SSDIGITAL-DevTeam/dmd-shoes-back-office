Variants & Variant Prices – Multilingual (id/en)

FormData structure used on product create/update:

attributes:
- attributes[0][name][id] = "Ukuran EU"
- attributes[0][name][en] = "EU Size"
- attributes[0][options][0][id] = "36"
- attributes[0][options][0][en] = "36"

variant_prices:
- variant_prices[0][labels][0][id] = "Ukuran EU: 36"
- variant_prices[0][labels][0][en] = "EU Size: 36"
- variant_prices[0][price] = 499000
- variant_prices[0][stock] = 10
- variant_prices[0][active] = 1
- variant_prices[0][size_eu] = 36 (optional; included when option is numeric)

Notes
- Variant names and options are captured per language.
- UI renders inputs per selected language; values fallback to the other language when missing.
- For 1D variants, group prices map to the displayed first option label; for 2D+, combination keys are stable based on EN labels internally.
