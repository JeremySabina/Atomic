# Atomic - Restaurant Food Cost Estimator

A lightweight web app for restaurant operators to:

- Build an ingredient price library.
- Create recipe line items that automatically reference ingredient prices.
- Generate a cost breakdown by size (small/medium/large).
- Estimate menu prices from a target food cost percentage.

## Run locally

Open `index.html` in your browser.

## How it works

1. Add ingredients with unit price (e.g., $/lb, $/oz, $/each).
2. Build your recipe by selecting ingredients and quantities.
3. The recipe generator pulls current ingredient prices from your library.
4. Set size multipliers and target food cost % to get suggested menu prices.

Data is persisted in browser `localStorage`.
