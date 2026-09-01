const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export function parsePagination(url, defaultLimit = DEFAULT_LIMIT) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const rawLimit = parseInt(url.searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginationMeta(page, limit, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages };
}
