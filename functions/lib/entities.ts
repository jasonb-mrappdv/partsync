import { z } from 'zod';

// Entity registry: maps the SDK entity name (PascalCase) to the D1 table,
// the field whitelist used for INSERT/UPDATE, and a Zod schema for validation.
//
// Schemas mirror base44/entities/*.jsonc. `id`, `created_*`, `updated_*` are
// managed server-side and not part of these schemas.

const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : v);

const PartOrderSchema = z.object({
  part_number: z.preprocess(trim, z.string().min(1)),
  purchase_order: z.preprocess(trim, z.string().min(1)),
  vendor_id: z.string().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  vendor_order_number: z.string().optional().nullable(),
  tracking_number: z.string().optional().nullable(),
  estimated_delivery: z.string().optional().nullable(),
  customer_email: z.string().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  status: z.enum(['Pending', 'In Transit', 'Shipped', 'Delivered', 'Cancelled', 'Back Ordered']).optional(),
  notification_sent: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  part_category: z.string().optional().nullable(),
});

const ReturnLogSchema = z.object({
  part_number: z.preprocess(trim, z.string().min(1)),
  purchase_order: z.string().optional().nullable(),
  vendor_id: z.string().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  issue_type: z.enum(['Damaged in Transit', 'Wrong Item', 'Defective']),
  photo_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  log_status: z.enum(['Reported', 'Returned', 'Not Returnable', 'Credited', 'Denied']).optional(),
  reported_by: z.string().optional().nullable(),
  order_id: z.string().optional().nullable(),
});

const VendorSchema = z.object({
  name: z.preprocess(trim, z.string().min(1)),
  key_contact: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  directory: z.string().optional().nullable(),
  part_categories: z.array(z.string()).optional().nullable(),
  avg_score: z.number().optional().nullable(),
  total_orders: z.number().optional(),
  is_active: z.boolean().optional(),
});

const RoutingRuleSchema = z.object({
  rule_name: z.preprocess(trim, z.string().min(1)),
  description: z.string().optional().nullable(),
  part_category: z.string().optional().nullable(),
  vendor_id: z.preprocess(trim, z.string().min(1)),
  vendor_name: z.string().optional().nullable(),
  priority: z.number().optional(),
  is_active: z.boolean().optional(),
});

const TechnicianLogSchema = z.object({
  technician_name: z.preprocess(trim, z.string().min(1)),
  technician_email: z.string().optional().nullable(),
  quarter: z.preprocess(trim, z.string().min(1)),
  year: z.number().optional().nullable(),
  quarter_number: z.number().optional().nullable(),
  return_count: z.number().optional(),
  notes: z.string().optional().nullable(),
});

const UserSchema = z.object({
  role: z.enum(['admin', 'vendor', 'technician', 'user']).optional(),
  full_name: z.string().optional().nullable(),
  vendor_id: z.string().optional().nullable(),
});

export type EntityKey =
  | 'PartOrder'
  | 'ReturnLog'
  | 'Vendor'
  | 'RoutingRule'
  | 'TechnicianLog'
  | 'User';

export type EntityDef = {
  table: string;
  schema: z.ZodObject<z.ZodRawShape>;
  // JSON-encoded array fields — converted on read.
  jsonFields?: string[];
  // Boolean fields stored as integers in D1 — converted on read.
  boolFields?: string[];
};

export const entities: Record<EntityKey, EntityDef> = {
  PartOrder: { table: 'part_orders', schema: PartOrderSchema, boolFields: ['notification_sent'] },
  ReturnLog: { table: 'return_logs', schema: ReturnLogSchema },
  Vendor: { table: 'vendors', schema: VendorSchema, jsonFields: ['part_categories'], boolFields: ['is_active'] },
  RoutingRule: { table: 'routing_rules', schema: RoutingRuleSchema, boolFields: ['is_active'] },
  TechnicianLog: { table: 'technician_logs', schema: TechnicianLogSchema },
  User: { table: 'users', schema: UserSchema, boolFields: ['email_verified'] },
};

export const resolveEntity = (name: string): EntityDef | null => {
  return (entities as Record<string, EntityDef>)[name] ?? null;
};

export const fromRow = (def: EntityDef, row: Record<string, unknown>) => {
  const out: Record<string, unknown> = { ...row };
  if (def.jsonFields) {
    for (const f of def.jsonFields) {
      if (typeof out[f] === 'string') {
        try {
          out[f] = JSON.parse(out[f] as string);
        } catch {
          out[f] = null;
        }
      }
    }
  }
  if (def.boolFields) {
    for (const f of def.boolFields) {
      if (out[f] !== null && out[f] !== undefined) out[f] = Boolean(out[f]);
    }
  }
  return out;
};

export const toRow = (def: EntityDef, data: Record<string, unknown>) => {
  const out: Record<string, unknown> = { ...data };
  if (def.jsonFields) {
    for (const f of def.jsonFields) {
      if (Array.isArray(out[f]) || (typeof out[f] === 'object' && out[f] !== null)) {
        out[f] = JSON.stringify(out[f]);
      }
    }
  }
  if (def.boolFields) {
    for (const f of def.boolFields) {
      if (typeof out[f] === 'boolean') out[f] = out[f] ? 1 : 0;
    }
  }
  return out;
};

// Base44 sort syntax: '-field' = DESC, 'field' = ASC. Validate against
// known columns to prevent SQL injection.
export const parseSort = (sort: string | null, def: EntityDef): string => {
  if (!sort) return 'created_date DESC';
  const desc = sort.startsWith('-');
  const field = (desc ? sort.slice(1) : sort).trim();
  const allowed = new Set([
    ...Object.keys(def.schema.shape),
    'id',
    'created_date',
    'updated_date',
    'created_by',
  ]);
  if (!allowed.has(field)) return 'created_date DESC';
  return `${field} ${desc ? 'DESC' : 'ASC'}`;
};
