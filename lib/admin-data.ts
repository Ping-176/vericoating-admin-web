import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

type Translation = {
  locale: string;
  name?: string | null;
  label?: string | null;
  description?: string | null;
  intro?: string | null;
  base_info?: Record<string, unknown> | null;
  parameter_groups?: unknown[] | null;
  parameter_overrides?: unknown[] | null;
  custom_labels?: string[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function pickTranslation<T extends Translation>(translations: T[] | T | null | undefined, locale: Locale): T | null {
  const rows = Array.isArray(translations) ? translations : translations ? [translations] : [];
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "zh") ?? rows.find((row) => row.locale === "en") ?? null;
}

function translationState<T extends Translation>(translations: T[] | T | null | undefined, locale: Locale) {
  const rows = Array.isArray(translations) ? translations : translations ? [translations] : [];
  const current = rows.find((row) => row.locale === locale) ?? null;
  const fallback = current ?? rows.find((row) => row.locale === "zh") ?? rows.find((row) => row.locale === "en") ?? null;
  return {
    translation: fallback,
    hasCurrentTranslation: Boolean(current),
    translationLocale: fallback?.locale ?? null,
    isFallback: Boolean(fallback && fallback.locale !== locale),
  };
}

function jsonArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export interface ParameterOption {
  id: string;
  code: string;
  canonical_value: string | null;
  label: string;
  description: string | null;
  is_active: boolean;
  sort: number;
  has_current_translation: boolean;
  translation_locale: string | null;
  is_fallback: boolean;
}

export interface ParameterDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  select_type: "single" | "multiple";
  value_type: "option" | "text" | "number";
  is_active: boolean;
  sort: number;
  options: ParameterOption[];
  has_current_translation: boolean;
  translation_locale: string | null;
  is_fallback: boolean;
}

export interface ProductSystem {
  id: string;
  system_code: string;
  status: string;
  sort: number;
  updated_at: string;
  name: string;
  intro: string | null;
  description: string | null;
  base_common: Record<string, unknown>;
  base_info: Record<string, unknown>;
  parameter_groups: unknown[];
  certifications: unknown[];
  has_current_translation: boolean;
  translation_locale: string | null;
  is_fallback: boolean;
}

export interface ProductSku {
  id: string;
  sku_code: string;
  slug: string | null;
  system_id: string | null;
  status: string;
  sort: number;
  price: number | string | null;
  sample_fee: number | string | null;
  sample_fee_deductible: boolean;
  sample_available: boolean;
  updated_at: string;
  name: string;
  intro: string | null;
  description: string | null;
  base_info: Record<string, unknown>;
  parameter_overrides: unknown[];
  custom_labels: string[];
  images: unknown[];
  certifications: unknown[];
  system: { system_code: string; name: string } | null;
  has_current_translation: boolean;
  translation_locale: string | null;
  is_fallback: boolean;
}

export interface SkuOption {
  id: string;
  sku_code: string;
  name: string;
}

export interface SampleRequest {
  id: string;
  request_no: string;
  sku_id: string | null;
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
  sku: SkuOption | null;
}

export interface RfqRequest {
  id: string;
  request_no: string;
  sku_id: string | null;
  company: string;
  contact_name: string;
  email: string;
  country: string | null;
  application: string | null;
  substrate: string | null;
  finish: string | null;
  annual_volume: string | null;
  requirements: string | null;
  timeline: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  sku: SkuOption | null;
}

function mapParameter(row: Record<string, unknown>, locale: Locale): ParameterDefinition {
  const state = translationState(row.parameter_definition_translations as Translation[] | null, locale);
  const translation = state.translation;
  const options = ((row.parameter_definition_options as Array<Record<string, unknown>> | null) ?? [])
    .map((option) => {
      const optionState = translationState(option.parameter_definition_option_translations as Translation[] | null, locale);
      const optionTranslation = optionState.translation;
      return {
        id: String(option.id),
        code: String(option.code),
        canonical_value: (option.canonical_value as string | null) ?? null,
        label: optionTranslation?.label ?? String(option.code),
        description: optionTranslation?.description ?? null,
        is_active: Boolean(option.is_active),
        sort: Number(option.sort ?? 0),
        has_current_translation: optionState.hasCurrentTranslation,
        translation_locale: optionState.translationLocale,
        is_fallback: optionState.isFallback,
      };
    })
    .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));

  return {
    id: String(row.id),
    code: String(row.code),
    name: translation?.name ?? String(row.code),
    description: translation?.description ?? null,
    select_type: row.select_type === "multiple" ? "multiple" : "single",
    value_type: row.value_type === "text" || row.value_type === "number" ? row.value_type : "option",
    is_active: Boolean(row.is_active),
    sort: Number(row.sort ?? 0),
    options,
    has_current_translation: state.hasCurrentTranslation,
    translation_locale: state.translationLocale,
    is_fallback: state.isFallback,
  };
}

function mapSystem(row: Record<string, unknown>, locale: Locale): ProductSystem {
  const state = translationState(row.product_system_translations as Translation[] | null, locale);
  const translation = state.translation;
  return {
    id: String(row.id),
    system_code: String(row.system_code),
    status: String(row.status),
    sort: Number(row.sort ?? 0),
    updated_at: String(row.updated_at ?? ""),
    name: translation?.name ?? String(row.system_code),
    intro: translation?.intro ?? null,
    description: translation?.description ?? null,
    base_common: (row.base_common as Record<string, unknown> | null) ?? {},
    base_info: translation?.base_info ?? {},
    parameter_groups: jsonArray(translation?.parameter_groups),
    certifications: jsonArray(row.certifications as unknown[] | null),
    has_current_translation: state.hasCurrentTranslation,
    translation_locale: state.translationLocale,
    is_fallback: state.isFallback,
  };
}

function mapSku(row: Record<string, unknown>, locale: Locale): ProductSku {
  const state = translationState(row.product_sku_translations as Translation[] | null, locale);
  const translation = state.translation;
  const system = firstRelation(row.product_systems as Record<string, unknown> | Record<string, unknown>[] | null);
  const systemTranslation = system ? pickTranslation(system.product_system_translations as Translation[] | null, locale) : null;

  return {
    id: String(row.id),
    sku_code: String(row.sku_code),
    slug: (row.slug as string | null) ?? null,
    system_id: (row.system_id as string | null) ?? null,
    status: String(row.status),
    sort: Number(row.sort ?? 0),
    price: (row.price as number | string | null) ?? null,
    sample_fee: (row.sample_fee as number | string | null) ?? null,
    sample_fee_deductible: Boolean(row.sample_fee_deductible),
    sample_available: Boolean(row.sample_available),
    updated_at: String(row.updated_at ?? ""),
    name: translation?.name ?? String(row.sku_code),
    intro: translation?.intro ?? null,
    description: translation?.description ?? null,
    base_info: translation?.base_info ?? {},
    parameter_overrides: jsonArray(translation?.parameter_overrides),
    custom_labels: jsonArray(translation?.custom_labels),
    images: jsonArray(row.images as unknown[] | null),
    certifications: jsonArray(row.certifications as unknown[] | null),
    system: system
      ? {
          system_code: String(system.system_code),
          name: systemTranslation?.name ?? String(system.system_code),
        }
      : null,
    has_current_translation: state.hasCurrentTranslation,
    translation_locale: state.translationLocale,
    is_fallback: state.isFallback,
  };
}

function mapSkuOption(row: Record<string, unknown>, locale: Locale): SkuOption {
  const translation = pickTranslation(row.product_sku_translations as Translation[] | null, locale);
  return {
    id: String(row.id),
    sku_code: String(row.sku_code),
    name: translation?.name ?? String(row.sku_code),
  };
}

export async function getParameterDefinitions(locale: Locale) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parameter_definitions")
    .select(
      [
        "id,code,select_type,value_type,is_active,sort",
        "parameter_definition_translations(locale,name,description)",
        "parameter_definition_options(id,code,canonical_value,is_active,sort,parameter_definition_option_translations(locale,label,description))",
      ].join(","),
    )
    .order("sort", { ascending: true })
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => mapParameter(row, locale));
}

export async function getParameterDefinition(id: string, locale: Locale) {
  const rows = await getParameterDefinitions(locale);
  return rows.find((row) => row.id === id) ?? null;
}

export async function getProductSystems(locale: Locale) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_systems")
    .select("*, product_system_translations(locale,name,intro,description,base_info,parameter_groups)")
    .order("sort", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => mapSystem(row, locale));
}

export async function getProductSystem(id: string, locale: Locale) {
  const systems = await getProductSystems(locale);
  return systems.find((system) => system.id === id) ?? null;
}

export async function getProductSkus(locale: Locale, filters?: { search?: string; status?: string; system?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("product_skus")
    .select(
      [
        "*",
        "product_sku_translations(locale,name,intro,description,base_info,parameter_overrides,custom_labels)",
        "product_systems(system_code,product_system_translations(locale,name))",
      ].join(","),
    )
    .order("sort", { ascending: true })
    .order("updated_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.system) query = query.eq("system_id", filters.system);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => mapSku(row, locale));
  const search = filters?.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter((sku) =>
      [sku.sku_code, sku.slug ?? "", sku.name, sku.system?.name ?? "", sku.system?.system_code ?? "", ...sku.custom_labels]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }
  return rows;
}

export async function getProductSku(id: string, locale: Locale) {
  const skus = await getProductSkus(locale);
  return skus.find((sku) => sku.id === id) ?? null;
}

export async function getSkuOptions(locale: Locale) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_skus")
    .select("id,sku_code,product_sku_translations(locale,name)")
    .order("sku_code", { ascending: true });

  if (error) return [] as SkuOption[];
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => mapSkuOption(row, locale));
}

export async function getDashboardData(locale: Locale) {
  const [skus, sampleRequests] = await Promise.all([getProductSkus(locale), getSampleRequests({ limit: 5 }, locale)]);

  return {
    skus,
    sampleRequests: sampleRequests.rows,
    sampleRequestsError: sampleRequests.error,
  };
}

function mapSampleRequest(row: Record<string, unknown>, locale: Locale): SampleRequest {
  const sku = firstRelation(row.product_skus as Record<string, unknown> | Record<string, unknown>[] | null);
  return {
    ...(row as unknown as Omit<SampleRequest, "sku">),
    sku: sku ? mapSkuOption(sku, locale) : null,
  };
}

function mapRfqRequest(row: Record<string, unknown>, locale: Locale): RfqRequest {
  const sku = firstRelation(row.product_skus as Record<string, unknown> | Record<string, unknown>[] | null);
  return {
    ...(row as unknown as Omit<RfqRequest, "sku">),
    sku: sku ? mapSkuOption(sku, locale) : null,
  };
}

export async function getSampleRequests(
  filters?: {
    search?: string;
    status?: string;
    product?: string;
    limit?: number;
  },
  locale: Locale = "zh",
) {
  const supabase = await createClient();
  let query = supabase
    .from("sample_requests")
    .select("*, product_skus(id,sku_code,product_sku_translations(locale,name))")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.product) query = query.eq("sku_id", filters.product);
  if (filters?.limit) query = query.limit(filters.limit);

  const search = filters?.search?.trim();
  if (search) {
    const term = `%${search.replaceAll("%", "\\%").replaceAll(",", " ")}%`;
    query = query.or(`request_no.ilike.${term},company.ilike.${term},contact_name.ilike.${term},email.ilike.${term},country.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) return { rows: [] as SampleRequest[], error: error.message };

  return {
    rows: ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => mapSampleRequest(row, locale)),
    error: null as string | null,
  };
}

export async function getSampleRequest(id: string, locale: Locale = "zh") {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sample_requests")
    .select("*, product_skus(id,sku_code,product_sku_translations(locale,name))")
    .eq("id", id)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  if (!data) return { row: null, error: null };

  return {
    row: mapSampleRequest(data as unknown as Record<string, unknown>, locale),
    error: null,
  };
}

export async function getRfqRequests(
  filters?: {
    search?: string;
    status?: string;
    product?: string;
    limit?: number;
  },
  locale: Locale = "zh",
) {
  const supabase = await createClient();
  let query = supabase
    .from("rfq_requests")
    .select("*, product_skus(id,sku_code,product_sku_translations(locale,name))")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.product) query = query.eq("sku_id", filters.product);
  if (filters?.limit) query = query.limit(filters.limit);

  const search = filters?.search?.trim();
  if (search) {
    const term = `%${search.replaceAll("%", "\\%").replaceAll(",", " ")}%`;
    query = query.or(
      [
        `request_no.ilike.${term}`,
        `company.ilike.${term}`,
        `contact_name.ilike.${term}`,
        `email.ilike.${term}`,
        `country.ilike.${term}`,
        `application.ilike.${term}`,
        `substrate.ilike.${term}`,
        `finish.ilike.${term}`,
        `annual_volume.ilike.${term}`,
        `requirements.ilike.${term}`,
        `timeline.ilike.${term}`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) return { rows: [] as RfqRequest[], error: error.message };

  return {
    rows: ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => mapRfqRequest(row, locale)),
    error: null as string | null,
  };
}

export async function getRfqRequest(id: string, locale: Locale = "zh") {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rfq_requests")
    .select("*, product_skus(id,sku_code,product_sku_translations(locale,name))")
    .eq("id", id)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  if (!data) return { row: null, error: null };

  return {
    row: mapRfqRequest(data as unknown as Record<string, unknown>, locale),
    error: null,
  };
}
