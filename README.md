# Steryle

A surgical & medical supplies marketplace — **Next.js web app + Expo mobile
app** in a pnpm + Turborepo monorepo, sharing one catalogue package.

The catalogue holds **real medical device and equipment data**: 833 SKUs,
genuine brands (Romsons, Polymed, 3M, B. Braun, BD, Dispovan, Nipro, Tynor,
Flamingo and ~140 more), real prices and real product photography.

Steryle stocks courier-shippable devices, instruments and consumable supplies
only. Deliberately **not** listed: pharmaceuticals, medicines and other
ingestibles; and bulky goods such as hospital beds, mattresses, wheelchairs,
commodes and hospital linens. Both exclusions are enforced in
`scripts/scrape-surginatal.mjs` and asserted by the `@steryle/core` test suite,
so a re-scrape cannot reintroduce them.

> Independent demo storefront for educational use. No payments are processed
> and no orders ship.

## Design language

A blue marketplace system. **Brand blue** (`brand-600`) carries primary actions
and wayfinding, **teal** (`accent-600`) marks secondary emphasis, and the
neutral scale is cool-tinted so it sits with the blues rather than fighting
them. Rose flags discounts, green confirms stock and ratings.

**Web and mobile share one palette.** Tokens live in
`packages/config/tokens.js` and are mirrored by `apps/web`'s Tailwind v4
`@theme` block and `apps/mobile`'s NativeWind config — change a token once and
both apps follow.

## Workspace layout

```
apps/
  web/        @steryle/web     Next.js 16 App Router + Tailwind v4  (port 4173)
  admin/      @steryle/admin   Ops portal (port 4174)
  api/        @steryle/api     Hono → Lambda (SST); /api/* proxied from web/admin
  mobile/     @steryle/mobile  Expo 54 + expo-router + NativeWind v4
packages/
  core/       @steryle/core    Catalogue data, domain types, cart logic (shared)
  db/         @steryle/db      DynamoDB single-table client + repos
  config/     @steryle/config  Shared tsconfig / eslint / prettier / design tokens
scripts/
  scrape-surginatal.mjs       Re-scrapes the live catalogue
  deploy-backend.sh           SST deploy (profile steryle-admin)
```

Backend is SST v3 (DynamoDB + API Gateway + Lambda), same shape as SuperPhysio.
AWS profile: `steryle-admin`, region `ap-south-1`.

## Getting started

```bash
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install

pnpm deploy:backend   # once — creates DynamoDB + API
pnpm seed             # catalogue + demo customers into DynamoDB

pnpm dev:web          # http://localhost:4173
pnpm dev:admin        # http://localhost:4174 (needs TABLE_NAME + AWS_PROFILE)
pnpm dev:api          # http://localhost:8787
pnpm dev:mobile       # Expo
```

Turbo fans out across the workspace:

```bash
pnpm build       # Next.js production build + Expo iOS/Android bundles
pnpm lint
pnpm typecheck
pnpm test
```

## The catalogue (shared data package)

- `packages/core/src/data/products.json` — the full SKU list (833 real SKUs)
- `packages/core/src/data/categories.json` — the 23 categories

Each SKU carries `sku`, `name`, `brand`, `category`, `categorySlug`, `slug`,
`variant`, `unit`, `price`, `mrp`, `discountPct`, `rating`, `reviews`,
`inStock`, `hsn`, `description`, `highlights` and `images`.

SKUs use a flat `STR-1000NN` sequence with no embedded category meaning.
`images` mixes root-relative paths for photography committed to
`apps/web/public/products/` with absolute CDN URLs for the rest; the mobile app
resolves the relative ones against `extra.apiUrl` in `apps/mobile/app.config.js`.

`packages/core` also owns the shared domain logic both apps reuse — catalogue
queries (`searchProducts`, `sortProducts`, `getProductsByCategory`), cart
mutations and totals (`addToCart`, `cartTotals`) and INR formatting — so pricing
and cart maths can never drift between web and mobile.

Re-scrape any time:

```bash
pnpm scrape:catalog                    # default: 60 products / category
PER_CATEGORY=100 pnpm scrape:catalog   # pull more per category
```

The scraper reads `surginatal.com/api/v1/{category,filter-products}` and
normalises the response into the schema above.

## Web app

Next.js 16 App Router, React 19, Tailwind CSS v4 (CSS-based `@theme` config, no
`tailwind.config`). Cart state is a module-level store read through
`useSyncExternalStore`, so the server and first client render agree on an empty
cart before `localStorage` hydrates. Product, category, `sitemap.xml` and
`robots.txt` routes are statically generated.

## Mobile app

Expo SDK 54, expo-router (file-based routes with a `(tabs)` group), NativeWind v4
for styling, Zustand for the cart (persisted to `AsyncStorage`) and TanStack
Query wired up for when the catalogue moves behind an API. Screens: shop, browse,
search, cart, category, product detail and checkout.

```bash
pnpm --filter @steryle/mobile ios       # or: android
pnpm --filter @steryle/mobile build     # Metro bundle for both platforms
```

## Deployment

- **Web** — AWS Amplify Hosting via `amplify.yml` (installs from the repo root
  so workspace packages resolve, then builds `apps/web`).
- **Mobile** — EAS profiles in `apps/mobile/eas.json` (`development`,
  `internal`, `production`).
- **CI** — `.github/workflows/ci.yml` runs lint, typecheck, test and build on
  every PR and push to `main`.
