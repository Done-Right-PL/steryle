"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discountPct = discountPct;
exports.toProduct = toProduct;
exports.toCategory = toCategory;
/**
 * `discountPct` is derived rather than stored so it can never contradict the
 * price and MRP an admin just edited.
 */
function discountPct(price, mrp) {
    if (mrp <= 0 || price >= mrp)
        return 0;
    return Math.round(((mrp - price) / mrp) * 100);
}
function toProduct(row) {
    var _a;
    return {
        sku: row.sku,
        name: row.name,
        brand: row.brand,
        category: row.category,
        categorySlug: row.categorySlug,
        slug: row.slug,
        variant: row.variant,
        unit: row.unit,
        price: row.price,
        mrp: row.mrp,
        discountPct: discountPct(row.price, row.mrp),
        currency: row.currency,
        rating: row.rating,
        reviews: row.reviews,
        inStock: row.inStock,
        hsn: (_a = row.hsn) !== null && _a !== void 0 ? _a : 0,
        description: row.description,
        highlights: row.highlights,
        images: row.images,
    };
}
function toCategory(row, productCount) {
    return {
        name: row.name,
        slug: row.slug,
        code: row.code,
        icon: row.icon,
        blurb: row.blurb,
        productCount: productCount,
    };
}
