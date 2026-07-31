import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getOverview,
  getRevenueSeries,
  listAllProducts,
  listAllCustomers,
  listCategories,
  tableName,
} from "@steryle/db";

type Env = {
  Variables: Record<string, never>;
};

function isLambdaRuntime() {
  return Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT,
  );
}

export function createApp() {
  const app = new Hono<Env>();

  if (!isLambdaRuntime()) {
    const allowOrigins = (
      process.env.CORS_ORIGINS ||
      "http://localhost:4173,http://127.0.0.1:4173,http://localhost:4174,http://127.0.0.1:4174"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    app.use(
      "*",
      cors({
        origin: (origin) => {
          if (!origin) return allowOrigins[0] ?? "*";
          if (allowOrigins.includes("*")) return origin;
          return allowOrigins.includes(origin)
            ? origin
            : (allowOrigins[0] ?? origin);
        },
        credentials: true,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        exposeHeaders: ["Set-Cookie"],
      }),
    );
  }

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      service: "steryle-api",
      table: (() => {
        try {
          return tableName();
        } catch {
          return null;
        }
      })(),
    }),
  );

  app.get("/api/admin/overview", async (c) => {
    const windowDays = Number(c.req.query("windowDays") || 30);
    const overview = await getOverview(windowDays);
    return c.json(overview);
  });

  app.get("/api/admin/revenue-series", async (c) => {
    const days = Number(c.req.query("days") || 30);
    return c.json(await getRevenueSeries(days));
  });

  app.get("/api/admin/products", async (c) => {
    const products = await listAllProducts();
    return c.json({ products, total: products.length });
  });

  app.get("/api/admin/customers", async (c) => {
    const customers = await listAllCustomers();
    return c.json({ customers, total: customers.length });
  });

  app.get("/api/admin/categories", async (c) => {
    return c.json({ categories: await listCategories() });
  });

  app.notFound((c) => c.json({ error: "Not found" }, 404));
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: err.message || "Internal error" }, 500);
  });

  return app;
}
