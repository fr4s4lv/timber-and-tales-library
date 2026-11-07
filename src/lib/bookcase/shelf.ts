export type DeviceClass = "phone" | "tablet";

/** Screens whose shortest side is below this are treated as iPhone-sized. */
export const PHONE_MAX_SHORT_SIDE = 600;

export const BOOKS_PER_SHELF_RANGE: Record<DeviceClass, { min: number; max: number; default: number }> = {
  phone: { min: 2, max: 6, default: 3 },
  tablet: { min: 3, max: 12, default: 6 },
};

export function deviceClassFor(screenW: number, screenH: number, windowW: number): DeviceClass {
  const shortSide = Math.min(screenW, screenH);
  if (shortSide < PHONE_MAX_SHORT_SIDE || windowW < PHONE_MAX_SHORT_SIDE) return "phone";
  return "tablet";
}

export function clampBooksPerShelf(device: DeviceClass, n: number): number {
  const r = BOOKS_PER_SHELF_RANGE[device];
  if (!Number.isFinite(n)) return r.default;
  return Math.min(r.max, Math.max(r.min, Math.round(n)));
}

/** Split books into shelf rows of `perShelf`, padding with empty shelves up to `minRows`. */
export function toShelfRows<T>(items: T[], perShelf: number, minRows: number): T[][] {
  const per = Math.max(1, Math.floor(perShelf));
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += per) rows.push(items.slice(i, i + per));
  while (rows.length < minRows) rows.push([]);
  return rows;
}
