"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.db = void 0;
exports.getSql = getSql;
exports.getDb = getDb;
/**
 * Database client.
 *
 * Two things drive the shape of this module:
 *
 * 1. Connection is lazy. Next.js collects page metadata during `next build`,
 *    where `DATABASE_URL` is often absent (Amplify injects it at runtime).
 *    Connecting on import would fail the build, so the pool is created on
 *    first query instead.
 * 2. The pool is cached on `globalThis`. Dev-server hot reloads re-evaluate
 *    modules, which would otherwise leak a pool per reload until Postgres
 *    starts refusing connections.
 */
var postgres_js_1 = require("drizzle-orm/postgres-js");
var postgres_1 = require("postgres");
var schema = require("./schema");
exports.schema = schema;
function connectionString() {
    var url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance.');
    }
    return url;
}
var globalForDb = globalThis;
function getSql() {
    if (!globalForDb.__stryleSql) {
        globalForDb.__stryleSql = (0, postgres_1.default)(connectionString(), {
            // Serverless targets (Amplify/Lambda) should each hold few connections.
            max: process.env.NODE_ENV === 'production' ? 5 : 1,
            idle_timeout: 20,
            connect_timeout: 10,
        });
    }
    return globalForDb.__stryleSql;
}
function getDb() {
    if (!globalForDb.__stryleDb) {
        globalForDb.__stryleDb = (0, postgres_js_1.drizzle)(getSql(), { schema: schema });
    }
    return globalForDb.__stryleDb;
}
/**
 * Ergonomic handle so callers can write `db.select()` instead of `getDb().select()`.
 * Every property access resolves through `getDb()`, preserving the lazy connect.
 */
exports.db = new Proxy({}, {
    get: function (_target, prop, receiver) {
        return Reflect.get(getDb(), prop, receiver);
    },
});
