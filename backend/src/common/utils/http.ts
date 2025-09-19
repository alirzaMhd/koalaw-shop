// src/common/utils/http.ts
// HTTP helpers: pagination parsing and envelope responses (if needed in custom handlers).

export type PaginationInput = {
  page?: number | string;
  perPage?: number | string;
};

export function parsePagination(q?: PaginationInput, defaults = { page: 1, perPage: 12 }) {
  const pageRaw = (q?.page ?? defaults.page) as any;
  const sizeRaw = (q?.perPage ?? defaults.perPage) as any;
  const page = Math.max(1, parseInt(pageRaw, 10) || defaults.page);
  const perPage = Math.max(1, Math.min(100, parseInt(sizeRaw, 10) || defaults.perPage));
  const skip = (page - 1) * perPage;
  const take = perPage;
  return { page, perPage, skip, take };
}

export function buildMeta(total: number, page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return { page, perPage, total, totalPages };
}

export function envelope<T>(data: T) {
  return { success: true, data };
}