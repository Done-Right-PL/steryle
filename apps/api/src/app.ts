import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  createQuoteRequest,
  getOverview,
  getRevenueSeries,
  listAllProducts,
  listAllCustomers,
  listCategories,
  listQuoteRequests,
  tableName,
  updateQuoteStatus,
  type QuoteStatus,
} from "@steryle/db";

type Env = {
  Variables: Record<string, never>;
};

function isLambdaRuntime() {
  return Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT,
  );
}

const QUOTE_STATUSES = new Set<QuoteStatus>(["new", "contacted", "closed"]);

export function createApp() {
  const app = new Hono<Env>();

  if (!isLambdaRuntime()) {
    const allowOrigins = (
      process.env.CORS_ORIGINS ||
      "http://localhost:4173,http://127.0.0.1:4173,http://localhost:4174,http://127.0.0.1:4174,https://steryle.in,https://www.steryle.in"
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

  app.post("/api/quotes", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: "Invalid JSON body." }, 400);
    }
    const organisation =
      typeof body.organisation === "string" ? body.organisation.trim() : "";
    const requirement =
      typeof body.requirement === "string" ? body.requirement.trim() : "";
    if (organisation.length < 2 || organisation.length > 160) {
      return c.json({ error: "Organisation is required." }, 400);
    }
    if (requirement.length < 5 || requirement.length > 4000) {
      return c.json({ error: "Tell us a bit more about the requirement." }, 400);
    }
    const contactName =
      typeof body.contactName === "string" ? body.contactName.trim() : "";
    const contactPhone =
      typeof body.contactPhone === "string"
        ? body.contactPhone.replace(/\D/g, "").slice(0, 10)
        : "";

    const quote = await createQuoteRequest({
      organisation,
      requirement,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
    });
    return c.json({ ok: true, id: quote.id }, 201);
  });

  app.get("/api/admin/quotes", async (c) => {
    const quotes = await listQuoteRequests();
    return c.json({ quotes, total: quotes.length });
  });

  app.patch("/api/admin/quotes/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const status = body?.status as QuoteStatus | undefined;
    if (!status || !QUOTE_STATUSES.has(status)) {
      return c.json({ error: "status must be new, contacted, or closed." }, 400);
    }
    const updated = await updateQuoteStatus(id, status);
    if (!updated) return c.json({ error: "Quote not found." }, 404);
    return c.json({ quote: updated });
  });

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
