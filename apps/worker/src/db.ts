import type { Kit } from "@prepsync/core";

export type KitData = Omit<Kit, "version">;

export interface KitRow {
  id: string;
  user_id: string;
  version: number;
  data: string;
  created_at: string;
  updated_at: string;
}

export interface RunRow {
  id: string;
  user_id: string;
  kit_id: string | null;
  status: string;
  steps: string;
  idempotency_key: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseKitData(row: KitRow): KitData {
  return JSON.parse(row.data) as KitData;
}

export function kitFromRow(row: KitRow) {
  return {
    _id: row.id,
    userId: row.user_id,
    version: row.version,
    ...parseKitData(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findKitRow(
  db: D1Database,
  id: string,
  userId: string
): Promise<KitRow | null> {
  return db
    .prepare("SELECT * FROM kits WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<KitRow>();
}
