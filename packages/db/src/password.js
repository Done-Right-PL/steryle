"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
/**
 * Password hashing for admin accounts.
 *
 * Uses scrypt from Node's standard library rather than bcrypt/argon2 so the
 * monorepo stays free of native build steps — those break Amplify's build
 * image and Turbo's cache portability. scrypt is memory-hard and a fine
 * choice here; the cost parameters are encoded in the digest so they can be
 * raised later without invalidating existing hashes.
 */
var node_crypto_1 = require("node:crypto");
var node_util_1 = require("node:util");
var scrypt = (0, node_util_1.promisify)(node_crypto_1.scrypt);
var COST = { N: 16384, r: 8, p: 1 };
var KEY_LENGTH = 64;
/** Encoded as `scrypt$N$r$p$salt$hash`, both binary parts base64. */
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function () {
        var salt, derived;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    salt = (0, node_crypto_1.randomBytes)(16);
                    return [4 /*yield*/, scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, __assign(__assign({}, COST), { 
                            // scrypt needs headroom above the default 32 MB limit at N=16384, r=8.
                            maxmem: 64 * 1024 * 1024 }))];
                case 1:
                    derived = (_a.sent());
                    return [2 /*return*/, [
                            'scrypt',
                            COST.N,
                            COST.r,
                            COST.p,
                            salt.toString('base64'),
                            derived.toString('base64'),
                        ].join('$')];
            }
        });
    });
}
function verifyPassword(password, stored) {
    return __awaiter(this, void 0, void 0, function () {
        var parts, nRaw, rRaw, pRaw, saltRaw, hashRaw, N, r, p, expected, derived;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parts = stored.split('$');
                    if (parts.length !== 6 || parts[0] !== 'scrypt')
                        return [2 /*return*/, false];
                    nRaw = parts[1], rRaw = parts[2], pRaw = parts[3], saltRaw = parts[4], hashRaw = parts[5];
                    N = Number(nRaw);
                    r = Number(rRaw);
                    p = Number(pRaw);
                    if (!N || !r || !p || !saltRaw || !hashRaw)
                        return [2 /*return*/, false];
                    expected = Buffer.from(hashRaw, 'base64');
                    return [4 /*yield*/, scrypt(password.normalize('NFKC'), Buffer.from(saltRaw, 'base64'), expected.length, {
                            N: N,
                            r: r,
                            p: p,
                            maxmem: 256 * 1024 * 1024,
                        })];
                case 1:
                    derived = (_a.sent());
                    // Lengths must match before timingSafeEqual, which throws on a mismatch.
                    return [2 /*return*/, derived.length === expected.length && (0, node_crypto_1.timingSafeEqual)(derived, expected)];
            }
        });
    });
}
