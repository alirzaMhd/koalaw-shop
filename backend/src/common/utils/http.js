// src/common/utils/http.ts
// HTTP helpers: pagination parsing and envelope responses (if needed in custom handlers).
export function parsePagination(q, defaults = { page: 1, perPage: 12 }) {
    const pageRaw = (q?.page ?? defaults.page);
    const sizeRaw = (q?.perPage ?? defaults.perPage);
    const page = Math.max(1, parseInt(pageRaw, 10) || defaults.page);
    const perPage = Math.max(1, Math.min(100, parseInt(sizeRaw, 10) || defaults.perPage));
    const skip = (page - 1) * perPage;
    const take = perPage;
    return { page, perPage, skip, take };
}
export function buildMeta(total, page, perPage) {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    return { page, perPage, total, totalPages };
}
export function envelope(data) {
    return { success: true, data };
}
//# sourceMappingURL=http.js.map