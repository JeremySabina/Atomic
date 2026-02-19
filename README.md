# Atomic - Restaurant Food Cost Estimator

A lightweight web app for restaurant operators to:

- Build an ingredient price library.
- Build recipe drafts with **size-specific quantities** (small/medium/large).
- Save a draft as a full recipe after adding all ingredients.
- Generate food cost + suggested menu price by size.

## Run locally

Open `index.html` in your browser.

## How it works

1. Add ingredients with unit price (e.g., $/lb, $/oz, $/each).
2. In Recipe Generator, add one or more ingredients to the recipe draft and set quantity per size.
3. Remove draft rows anytime, then click **Create Full Recipe** when ready.
4. The cost table references ingredient library prices automatically.
5. Set your target food cost % to get suggested menu pricing by size.

Data is persisted in browser `localStorage`.
