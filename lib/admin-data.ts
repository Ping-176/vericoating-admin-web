import { createClient } from "@/lib/supabase/server";

export type DimensionTable = "categories" | "applications" | "finishes" | "glosses";

export const dimensionTables: DimensionTable[] = ["categories", "applications", "finishes", "glosses"];

export interface Dimension {
  id: string;
  code: string;
  name_en: string;
  name_zh: string | null;
  sort: number;
}

export interface ProductListItem {
  id: string;
  legacy_id: string;
  slug: string;
  name_en: string;
  name_zh: string | null;
  model: string | null;
  status: string;
  sample_available: boolean;
  sample_status: string | null;
  sort: number;
  updated_at: string;
  categories: Dimension | null;
  applications: Dimension | null;
  finishes: Dimension | null;
  glosses: Dimension | null;
  product_images: Array<{ url: string; slot: number; sort: number }> | null;
  product_documents: Array<{ doc_type: string; label?: string | null; file_url: string | null; sort?: number }> | null;
}

export interface ProductDetail extends ProductListItem {
  intro_en: string | null;
  intro_zh: string | null;
  description_en: string | null;
  description_zh: string | null;
  price_usd: number | string | null;
  moq: string | null;
  curing_schedule: string | null;
  category_id: string | null;
  application_id: string | null;
  finish_id: string | null;
  gloss_id: string | null;
  sample_fee_usd: number | string | null;
  sample_fee_deductible: boolean;
  sample_lead_time: string | null;
  tds_available: boolean;
  msds_available: boolean;
  unavailable_reason: string | null;
  basic_info: Record<string, unknown>;
  packaging_delivery: Record<string, unknown>;
  product_performance: Array<{
    test_item: string;
    standard_method: string | null;
    test_index: string | null;
    sort: number;
  }> | null;
  product_sample_specs: Array<{ spec: string; sort: number }> | null;
}

export interface SampleRequest {
  id: string;
  request_no: string;
  product_id: string;
  company: string;
  contact_name: string;
  email: string;
  country: string | null;
  phone: string | null;
  address: string | null;
  sample_spec: string | null;
  usage: string | null;
  courier: string | null;
  testing_conditions: string | null;
  notes: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  products: { legacy_id: string; name_en: string; name_zh: string | null } | null;
}

function maybeSingleRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getDimensions() {
  const supabase = await createClient();
  const entries = await Promise.all(
    dimensionTables.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select("id, code, name_en, name_zh, sort")
        .order("sort", { ascending: true })
        .order("name_en", { ascending: true });
      return [table, error ? [] : ((data ?? []) as Dimension[])] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<DimensionTable, Dimension[]>;
}

export async function getProducts(filters?: {
  search?: string;
  status?: string;
  category?: string;
  application?: string;
  finish?: string;
  gloss?: string;
  sample?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      [
        "id",
        "legacy_id",
        "slug",
        "name_en",
        "name_zh",
        "model",
        "status",
        "sample_available",
        "sample_status",
        "sort",
        "updated_at",
        "categories(id,code,name_en,name_zh,sort)",
        "applications(id,code,name_en,name_zh,sort)",
        "finishes(id,code,name_en,name_zh,sort)",
        "glosses(id,code,name_en,name_zh,sort)",
        "product_images(url,slot,sort)",
        "product_documents(doc_type,file_url)",
      ].join(","),
    )
    .order("sort", { ascending: true })
    .order("updated_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.category) query = query.eq("category_id", filters.category);
  if (filters?.application) query = query.eq("application_id", filters.application);
  if (filters?.finish) query = query.eq("finish_id", filters.finish);
  if (filters?.gloss) query = query.eq("gloss_id", filters.gloss);
  if (filters?.sample === "true") query = query.eq("sample_available", true);
  if (filters?.sample === "false") query = query.eq("sample_available", false);

  const search = filters?.search?.trim();
  if (search) {
    const term = `%${search.replaceAll("%", "\\%").replaceAll(",", " ")}%`;
    query = query.or(`legacy_id.ilike.${term},slug.ilike.${term},name_en.ilike.${term},name_zh.ilike.${term},model.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    ...row,
    categories: maybeSingleRelation(row.categories as Dimension | Dimension[] | null),
    applications: maybeSingleRelation(row.applications as Dimension | Dimension[] | null),
    finishes: maybeSingleRelation(row.finishes as Dimension | Dimension[] | null),
    glosses: maybeSingleRelation(row.glosses as Dimension | Dimension[] | null),
  })) as ProductListItem[];
}

export async function getProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      [
        "*",
        "categories(id,code,name_en,name_zh,sort)",
        "applications(id,code,name_en,name_zh,sort)",
        "finishes(id,code,name_en,name_zh,sort)",
        "glosses(id,code,name_en,name_zh,sort)",
        "product_images(url,slot,sort)",
        "product_performance(test_item,standard_method,test_index,sort)",
        "product_documents(doc_type,label,file_url,sort)",
        "product_sample_specs(spec,sort)",
      ].join(","),
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as Record<string, unknown>;

  return {
    ...row,
    categories: maybeSingleRelation(row.categories as Dimension | Dimension[] | null),
    applications: maybeSingleRelation(row.applications as Dimension | Dimension[] | null),
    finishes: maybeSingleRelation(row.finishes as Dimension | Dimension[] | null),
    glosses: maybeSingleRelation(row.glosses as Dimension | Dimension[] | null),
  } as ProductDetail;
}

export async function getDashboardData() {
  const products = await getProducts();
  const sampleRequests = await getSampleRequests({ limit: 5 });

  return {
    products,
    sampleRequests: sampleRequests.rows,
    sampleRequestsError: sampleRequests.error,
  };
}

export async function getSampleRequests(filters?: {
  search?: string;
  status?: string;
  product?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("sample_requests")
    .select("*, products(legacy_id,name_en,name_zh)")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.product) query = query.eq("product_id", filters.product);
  if (filters?.limit) query = query.limit(filters.limit);

  const search = filters?.search?.trim();
  if (search) {
    const term = `%${search.replaceAll("%", "\\%").replaceAll(",", " ")}%`;
    query = query.or(`request_no.ilike.${term},company.ilike.${term},contact_name.ilike.${term},email.ilike.${term},country.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) return { rows: [] as SampleRequest[], error: error.message };

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  return {
    rows: rows.map((row) => ({
      ...row,
      products: maybeSingleRelation(row.products as SampleRequest["products"] | SampleRequest["products"][] | null),
    })) as SampleRequest[],
    error: null as string | null,
  };
}

export async function getSampleRequest(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sample_requests")
    .select("*, products(legacy_id,name_en,name_zh)")
    .eq("id", id)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  if (!data) return { row: null, error: null };

  const raw = data as unknown as Record<string, unknown>;

  return {
    row: {
      ...raw,
      products: maybeSingleRelation(raw.products as SampleRequest["products"] | SampleRequest["products"][] | null),
    } as SampleRequest,
    error: null,
  };
}
