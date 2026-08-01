/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "steryle",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "ap-south-1",
          ...(process.env.CI || process.env.GITHUB_ACTIONS
            ? {}
            : { profile: "steryle-admin" }),
        },
      },
    };
  },
  async run() {
    const table = new sst.aws.Dynamo("Steryle", {
      fields: {
        pk: "string",
        sk: "string",
        gsi1pk: "string",
        gsi1sk: "string",
        gsi2pk: "string",
        gsi2sk: "string",
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        gsi1: { hashKey: "gsi1pk", rangeKey: "gsi1sk" },
        gsi2: { hashKey: "gsi2pk", rangeKey: "gsi2sk" },
      },
      ttl: "expiresAt",
    });

    const corsOrigins = [
      "http://localhost:4173",
      "http://127.0.0.1:4173",
      "http://localhost:4174",
      "http://127.0.0.1:4174",
      "https://steryle.in",
      "https://www.steryle.in",
      "https://admin.steryle.in",
    ];

    // Production owns the public API hostname (Route53 zone: steryle.in).
    const apiDomain =
      $app.stage === "production" ? "api.steryle.in" : undefined;

    const api = new sst.aws.ApiGatewayV2("Api", {
      ...(apiDomain ? { domain: apiDomain } : {}),
      cors: {
        allowCredentials: true,
        allowOrigins: corsOrigins,
        allowHeaders: ["content-type", "authorization"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
        exposeHeaders: ["set-cookie"],
      },
    });

    api.route("$default", {
      handler: "apps/api/src/lambda.handler",
      link: [table],
      timeout: "30 seconds",
      memory: "1024 MB",
      environment: {
        CORS_ORIGINS: corsOrigins.join(","),
        // Echo OTP in API responses until SMS delivery is wired.
        OTP_ECHO: "true",
        // Mock Razorpay until live keys are set (RAZORPAY_MOCK=false + KEY_ID/SECRET).
        RAZORPAY_MOCK: process.env.RAZORPAY_MOCK ?? "true",
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? "",
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? "",
      },
      nodejs: {
        esbuild: {
          alias: {
            "@steryle/db": "./packages/db/src",
            "@steryle/core": "./packages/core/src",
          },
        } as Record<string, unknown>,
      },
    });

    return {
      api: api.url,
      apiDomain: apiDomain ?? "n/a",
      table: table.name,
    };
  },
});
