# Stryle — Surgical & Medical Supplies Store

A complete, production-style e-commerce storefront for surgical and medical
supplies, built with **Vite + React + Tailwind CSS**. It mirrors the structure
and feature set of a modern medical-supply store (category browsing, product
listings, search, filtering, cart, checkout).

The catalog is populated with **real product data scraped from SurgiNatal's
public storefront API** — genuine brands (Romsons, Polymed, 3M, B. Braun, BD,
Dispovan, Nipro, Tynor, Flamingo, and ~140 more), names, prices, images and
ratings.

> This is an independent demo storefront for educational use. Product data is
> sourced from SurgiNatal (surginatal.com); it is not affiliated with or
> endorsed by them.

## Features

- **Home page** — hero, trust badges, category grid, top deals, best sellers, bulk-order promo
- **Categories** — 12 categories with descriptions and product counts
- **Category page** — brand + in-stock filtering and 5 sort options
- **Product page** — gallery, pricing/discounts, quantity selector, add-to-cart / buy-now, specs, highlights, related products
- **Search** — matches name, brand, category, and SKU
- **Cart** — persisted to `localStorage`, quantity editing, subtotal / shipping / GST / total
- **Checkout** — shipping + payment form with an order-confirmation flow (demo only, no real payment)
- **Account & Support** — sign-in, contact, bulk-quote, and FAQ
- Responsive design, mobile menu, and a hand-built original line-icon set

## The SKU list (separate data file)

The product catalog is scraped from SurgiNatal and stored as standalone data:

- `src/data/products.json` — **the full SKU list** (~1,055 real SKUs)
- `src/data/categories.json` — the 25 real categories

Each SKU includes: `sku`, `name`, `brand`, `category`, `slug`, `variant`, `unit`,
`price`, `mrp`, `discountPct`, `rating`, `reviews`, `inStock`, `hsn`,
`description`, `highlights`, and `images` (real product photos).

Re-scrape the catalog any time with:

```bash
npm run gen:catalog                 # default: 60 products / category
PER_CATEGORY=100 npm run gen:catalog  # pull more per category
```

The scraper lives in `scripts/scrape-surginatal.mjs` — it pulls live categories
and products from `surginatal.com/api/v1/{category,filter-products}` and
normalises them into the storefront's schema.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Project structure

```
scripts/scrape-surginatal.mjs  # real catalog scraper (SurgiNatal API)
src/
  data/            # catalog.js helpers + products.json / categories.json
  context/         # CartContext (localStorage-backed cart)
  components/      # Header, Footer, ProductCard, Icons, Rating, etc.
  pages/           # Home, Categories, Category, Product, Search, Cart, Checkout, Account, 404
  App.jsx          # routes
  main.jsx         # entry
```

## Tech stack

- React 18 + React Router 6
- Vite 5
- Tailwind CSS 3
