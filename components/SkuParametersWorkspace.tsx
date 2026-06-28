"use client";

import { ArrowLeft, Check, ChevronLeft, ChevronRight, CirclePlus, Edit3, Link2, PackageSearch, RotateCcw, Save, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copyProductSkuTranslationAction, saveProductSkuAction } from "@/app/[locale]/(admin)/sku-parameters/actions";
import {
  CertificationEditor,
  ImageUploadEditor,
  normalizeCertifications,
  normalizeImageUrls,
  type CertificationItem,
} from "@/components/CatalogMediaEditors";
import { inputClass } from "@/components/FormControls";
import type { ParameterDefinition, ProductSku, ProductSystem } from "@/lib/admin-data";
import type { Dictionary, Locale } from "@/lib/i18n";

type SystemParameter =
  | { id: string; kind: "defined"; parameterCode: string; optionCodes: string[]; showInDetail: boolean; usedAsTag: boolean }
  | { id: string; kind: "text"; code: string; name: string; value: string; showInDetail: boolean; usedAsTag: boolean };

type ParameterGroup =
  | { id: string; code: string; name: string; type: "normal"; parameters: SystemParameter[] }
  | { id: string; code: string; name: string; type: "table"; table: { name: string; description: string; columns: string[]; rows: string[][] } };

type SkuOverride = {
  parameterId: string;
  optionCodes?: string[];
  textValue?: string;
  showInDetail?: boolean;
  usedAsTag?: boolean;
};

type DraftSku = Omit<ProductSku, "base_info" | "parameter_overrides" | "custom_labels" | "images" | "certifications"> & {
  base_info: Record<string, unknown>;
  parameter_overrides: SkuOverride[];
  custom_labels: string[];
  images: string[];
  certifications: CertificationItem[];
};

const NEW_SKU_ID = "__new_sku";

function codeFromName(value: string, fallback: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || fallback;
}

function compactInputSize(value: string, min = 6, max = 26) {
  return Math.max(min, Math.min(max, value.length + 1));
}

function emptySku(): ProductSku {
  return {
    id: NEW_SKU_ID,
    sku_code: "",
    slug: null,
    system_id: null,
    status: "draft",
    sort: 0,
    price: null,
    sample_fee: null,
    sample_fee_deductible: false,
    sample_available: true,
    updated_at: "",
    name: "",
    intro: null,
    description: null,
    base_info: {},
    parameter_overrides: [],
    custom_labels: [],
    images: [],
    certifications: [],
    system: null,
    has_current_translation: true,
    translation_locale: null,
    is_fallback: false,
  };
}

function normalizeGroups(value: unknown[]): ParameterGroup[] {
  return value
    .map((raw) => {
      const group = raw as Partial<ParameterGroup>;
      if (group.type === "table") {
        const table = (group as { table?: { name?: string; description?: string; columns?: unknown[]; rows?: unknown[] } }).table ?? {};
        return {
          id: group.id || "",
          code: typeof group.code === "string" && group.code.trim() ? group.code.trim() : codeFromName(group.name || "table_group", group.id || "table_group"),
          name: group.name || "Table",
          type: "table" as const,
          table: {
            name: table.name || group.name || "Table",
            description: table.description || "",
            columns: Array.isArray(table.columns) ? table.columns.map(String) : [],
            rows: Array.isArray(table.rows) ? table.rows.map((row) => (Array.isArray(row) ? row.map(String) : [])) : [],
          },
        };
      }
      return {
        id: group.id || "",
        code: typeof group.code === "string" && group.code.trim() ? group.code.trim() : codeFromName(group.name || "parameter_group", group.id || "parameter_group"),
        name: group.name || "Group",
        type: "normal" as const,
        parameters: Array.isArray((group as { parameters?: unknown[] }).parameters)
          ? ((group as { parameters: unknown[] }).parameters
              .map((rawParam) => {
                const parameter = rawParam as Record<string, unknown>;
                if (parameter.kind === "defined") {
                  return {
                    id: typeof parameter.id === "string" ? parameter.id : "",
                    kind: "defined" as const,
                    parameterCode: typeof parameter.parameterCode === "string" ? parameter.parameterCode : "",
                    optionCodes: Array.isArray(parameter.optionCodes) ? parameter.optionCodes.map(String) : [],
                    showInDetail: parameter.showInDetail !== false,
                    usedAsTag: parameter.usedAsTag === true,
                  };
                }
                return {
                  id: typeof parameter.id === "string" ? parameter.id : "",
                  kind: "text" as const,
                  code: typeof parameter.code === "string" ? parameter.code : "text_parameter",
                  name: typeof parameter.name === "string" ? parameter.name : "Text parameter",
                  value: typeof parameter.value === "string" ? parameter.value : "",
                  showInDetail: parameter.showInDetail !== false,
                  usedAsTag: parameter.usedAsTag === true,
                };
              }) as SystemParameter[])
          : [],
      };
    })
    .filter((group) => group.type === "normal" || group.type === "table");
}

function draftSku(sku: ProductSku, system?: ProductSystem | null): DraftSku {
  const draft = {
    ...sku,
    base_info: sku.base_info ?? {},
    parameter_overrides: Array.isArray(sku.parameter_overrides) ? (sku.parameter_overrides as SkuOverride[]) : [],
    custom_labels: sku.custom_labels ?? [],
    images: normalizeImageUrls(sku.images ?? []),
    certifications: normalizeCertifications(sku.certifications ?? []),
  };
  if (sku.is_fallback && system) applySystemToSku(draft, system);
  return draft;
}

function jsonText(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberField(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function hasOwnValue(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function applySystemToSku(draft: DraftSku, system: ProductSystem | null) {
  draft.system_id = system?.id ?? null;
  if (!system) return;

  draft.sku_code = system.system_code;
  draft.name = system.name;
  draft.status = system.status;
  draft.sort = system.sort;
  draft.intro = system.intro;
  draft.description = system.description;
  draft.base_info = { ...draft.base_info, ...(system.base_info ?? {}) };

  const systemBaseInfo = system.base_info ?? {};
  if (hasOwnValue(systemBaseInfo, "price")) draft.price = numberField(systemBaseInfo.price);
  if (hasOwnValue(systemBaseInfo, "sampleFee")) draft.sample_fee = numberField(systemBaseInfo.sampleFee);
}

export function SkuParametersWorkspace({
  locale,
  t,
  skus,
  systems,
  parameters,
  initialSelectedId,
  createMode = false,
}: {
  locale: Locale;
  t: Dictionary;
  skus: ProductSku[];
  systems: ProductSystem[];
  parameters: ParameterDefinition[];
  initialSelectedId?: string;
  createMode?: boolean;
}) {
  const [search, setSearch] = useState("");
  const allSkus = useMemo(() => (createMode ? [emptySku(), ...skus] : skus), [createMode, skus]);
  const [selectedId] = useState<string | null>(initialSelectedId ?? (createMode ? NEW_SKU_ID : null));
  const [labelDraft, setLabelDraft] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DraftSku>>(() =>
    Object.fromEntries(allSkus.map((sku) => [sku.id, draftSku(sku, systems.find((system) => system.id === sku.system_id) ?? null)])),
  );
  const selected = selectedId ? drafts[selectedId] : null;
  const selectedIndex = selected ? skus.findIndex((sku) => sku.id === selected.id) : -1;
  const previousSku = selectedIndex > 0 ? skus[selectedIndex - 1] : null;
  const nextSku = selectedIndex >= 0 && selectedIndex < skus.length - 1 ? skus[selectedIndex + 1] : null;
  const linkedSystem = systems.find((system) => system.id === selected?.system_id) ?? null;

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return skus;
    return skus.filter((sku) => [sku.sku_code, sku.name, sku.system?.name ?? "", ...sku.custom_labels].join(" ").toLowerCase().includes(keyword));
  }, [search, skus]);

  const updateSku = (updater: (draft: DraftSku) => void) => {
    if (!selectedId) return;
    setDrafts((current) => {
      const next = { ...current, [selectedId]: structuredClone(current[selectedId]) };
      updater(next[selectedId]);
      return next;
    });
  };

  const addLabel = () => {
    const next = labelDraft.trim();
    if (!next) return;
    updateSku((draft) => {
      if (!draft.custom_labels.includes(next)) draft.custom_labels.push(next);
    });
    setLabelDraft("");
  };

  if (!selected) {
    return (
      <section className="panel list-page">
        <div className="list-header">
          <div className="panel-title">
              <PackageSearch size={18} />
            <h2>{t.skuParameters}</h2>
          </div>
          <div className="list-tools">
              <label className="search-box">
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
              </label>
              <Link className="primary-button" href={`/${locale}/sku-parameters/new`}>
                <CirclePlus size={16} />
                {t.create}
              </Link>
          </div>
        </div>
          <div className="entity-table-wrap">
            <table className="entity-table">
              <thead>
                <tr>
                  <th className="px-4 py-3">{t.skuName}</th>
                  <th className="px-4 py-3">{t.systemParameters}</th>
                  <th className="px-4 py-3">{t.customLabels}</th>
                  <th className="px-4 py-3">{t.preview}</th>
                  <th className="px-4 py-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sku) => (
                  <tr key={sku.id}>
                    <td>
                      <strong>{sku.name}</strong>
                      <code>{sku.sku_code}</code>
                    </td>
                    <td className="muted-cell">{sku.system?.name ?? "-"}</td>
                    <td>
                      <div className="tag-row compact table-tags">
                        {sku.custom_labels.length ? sku.custom_labels.map((label) => <span className="tag" key={label}>{label}</span>) : <span className="muted-cell">-</span>}
                      </div>
                    </td>
                    <td>
                      <span className="count-pill">{sku.parameter_overrides.length}</span>
                    </td>
                    <td className="table-action-cell">
                      <Link className="primary-button compact-action" href={`/${locale}/sku-parameters/${sku.id}`}>
                        <Edit3 size={15} />
                        {t.edit}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length ? <p className="p-8 text-center text-sm font-bold text-admin-muted">{t.empty}</p> : null}
      </section>
    );
  }

  const inheritedCertifications = normalizeCertifications(linkedSystem?.certifications ?? []);
  const certificationItems = selected.certifications.length ? selected.certifications : inheritedCertifications;
  const certificationStatusLabel = !selected.certifications.length && inheritedCertifications.length ? t.systemParameters : undefined;

  return (
    <form action={saveProductSkuAction} className="content-stack">
      <input type="hidden" name="locale" value={locale} />
      {selected.id !== NEW_SKU_ID ? <input type="hidden" name="id" value={selected.id} /> : null}
      <input type="hidden" name="base_info" value={jsonText(selected.base_info)} />
      <input type="hidden" name="parameter_overrides" value={jsonText(selected.parameter_overrides)} />
      <input type="hidden" name="custom_labels" value={jsonText(selected.custom_labels)} />
      <input type="hidden" name="images" value={jsonText(selected.images)} />
      <input type="hidden" name="certifications" value={jsonText(selected.certifications)} />
      <input type="hidden" name="from_locale" value={selected.translation_locale ?? (locale === "zh" ? "en" : "zh")} />

      <div className="toolbar-panel editor-toolbar">
          <div className="editor-title">
            <Link className="text-button" href={`/${locale}/sku-parameters`}>
              <ArrowLeft size={15} />
              {t.back}
            </Link>
            <div>
              <span className="eyebrow">{t.skuParameters}</span>
              <h2>{selected.name || t.createSku}</h2>
            </div>
          </div>
          <div className="editor-side-actions">
            <label className="compact-field">
              <span>{t.systemParameters}</span>
              <select
                className={inputClass}
                name="system_id"
                value={selected.system_id ?? ""}
                onChange={(event) => {
                  const system = systems.find((item) => item.id === event.target.value) ?? null;
                  updateSku((draft) => applySystemToSku(draft, system));
                }}
              >
                <option value="">-</option>
                {systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.system_code} · {system.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
      </div>

      {selected.id !== NEW_SKU_ID && selected.is_fallback ? (
        <section className="translation-notice">
          <div>
            <strong>{t.translationMissing}</strong>
            <span>{selected.translation_locale ? `${selected.translation_locale.toUpperCase()} -> ${locale.toUpperCase()}` : locale.toUpperCase()}</span>
          </div>
          <button className="ghost-button" formAction={copyProductSkuTranslationAction}>
            {t.copyFromLanguage}
          </button>
        </section>
      ) : null}

      <section className="group-card base-info-card">
        <h2>{t.basic}</h2>
        <div className="base-form-grid">
          <label className="field">
            <span>{t.productId}</span>
            <input className={inputClass} name="base_productId" value={stringField(selected.base_info.productId)} onChange={(event) => updateSku((draft) => (draft.base_info.productId = event.target.value))} />
          </label>
          <Input label={t.skuCode} name="sku_code" value={selected.sku_code} update={(value) => updateSku((draft) => (draft.sku_code = value))} required />
          <Input label={t.skuName} name="name" value={selected.name} update={(value) => updateSku((draft) => (draft.name = value))} required />
          <Input label={t.slug} name="slug" value={selected.slug ?? ""} update={(value) => updateSku((draft) => (draft.slug = value))} />
          <label className="field">
            <span>{t.status}</span>
            <select className={inputClass} name="status" value={selected.status} onChange={(event) => updateSku((draft) => (draft.status = event.target.value))}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <Input label={t.sort} name="sort" type="number" value={String(selected.sort)} update={(value) => updateSku((draft) => (draft.sort = Number(value)))} />
          <Input label={t.price} name="price" type="number" value={String(selected.price ?? "")} update={(value) => updateSku((draft) => (draft.price = value))} />
          <Input label={t.sampleFee} name="sample_fee" type="number" value={String(selected.sample_fee ?? "")} update={(value) => updateSku((draft) => (draft.sample_fee = value))} />
          <BaseInfoFields baseInfo={selected.base_info} t={t} update={(field, value) => updateSku((draft) => (draft.base_info[field] = value))} />
          <label className="field span-2">
            <span>{t.intro}</span>
            <input className={inputClass} name="intro" value={selected.intro ?? ""} onChange={(event) => updateSku((draft) => (draft.intro = event.target.value))} />
          </label>
          <label className="field span-2">
            <span>{t.description}</span>
            <input className={inputClass} name="description" value={selected.description ?? ""} onChange={(event) => updateSku((draft) => (draft.description = event.target.value))} />
          </label>
        </div>
      </section>

      <section className="group-card labels-card">
        <div className="group-header">
          <div>
            <span className="pill violet">SKU</span>
            <input className="group-name" readOnly value={t.customLabels} />
          </div>
        </div>
        <div className="inline-input label-input">
          <input className={inputClass} value={labelDraft} onChange={(event) => setLabelDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addLabel())} />
          <button className="icon-button" onClick={addLabel} type="button" title={t.create} aria-label={t.create}>
            <CirclePlus size={16} />
          </button>
        </div>
        <div className="tag-row">
          {selected.custom_labels.map((label) => (
            <button className="tag removable" key={label} onClick={() => updateSku((draft) => (draft.custom_labels = draft.custom_labels.filter((item) => item !== label)))} type="button">
              {label}
              <X size={13} />
            </button>
          ))}
        </div>
      </section>

      <ImageUploadEditor
        title={t.images}
        t={t}
        images={selected.images}
        onChange={(images) => updateSku((draft) => (draft.images = images))}
      />

      <CertificationEditor
        title={t.certifications}
        t={t}
        items={certificationItems}
        statusLabel={certificationStatusLabel}
        onChange={(items) => updateSku((draft) => (draft.certifications = items))}
      />

      {linkedSystem ? (
        normalizeGroups(linkedSystem.parameter_groups).map((group) => (
          <SkuGroupCard key={group.id || group.code || group.name} group={group} parameters={parameters} sku={selected} t={t} updateSku={updateSku} />
        ))
      ) : (
        <section className="group-card p-8 text-center text-sm font-bold text-admin-muted">
          {t.systemParameters}: -
        </section>
      )}

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-admin-line bg-admin-bg/92 py-4 backdrop-blur">
        <RecordSwitchButtons
          previousHref={previousSku ? `/${locale}/sku-parameters/${previousSku.id}` : null}
          nextHref={nextSku ? `/${locale}/sku-parameters/${nextSku.id}` : null}
          t={t}
        />
        <button className="primary-button">
          <Save size={16} />
          {t.save}
        </button>
      </div>
    </form>
  );
}

function RecordSwitchButtons({ previousHref, nextHref, t }: { previousHref: string | null; nextHref: string | null; t: Dictionary }) {
  return (
    <div className="record-switch-buttons">
      {previousHref ? (
        <Link className="icon-button" href={previousHref} title={t.previous} aria-label={t.previous}>
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <button className="icon-button" type="button" title={t.previous} aria-label={t.previous} disabled>
          <ChevronLeft size={18} />
        </button>
      )}
      {nextHref ? (
        <Link className="icon-button" href={nextHref} title={t.next} aria-label={t.next}>
          <ChevronRight size={18} />
        </Link>
      ) : (
        <button className="icon-button" type="button" title={t.next} aria-label={t.next} disabled>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

function Input({ label, name, value, update, type = "text", required }: { label: string; name: string; value: string; update: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className={inputClass} name={name} type={type} value={value} onChange={(event) => update(event.target.value)} required={required} />
    </label>
  );
}

function BaseInfoFields({ baseInfo, t, update }: { baseInfo: Record<string, unknown>; t: Dictionary; update: (field: string, value: string) => void }) {
  const fields = [
    ["moq", t.moq],
    ["sampleLeadTime", t.sampleLeadTime],
  ];
  return (
    <>
        {fields.map(([field, label]) => (
          <label className={`field ${field.includes("Description") || field.includes("Intro") ? "span-2" : ""}`} key={field}>
            <span>{label}</span>
            <input className={inputClass} name={`base_${field}`} value={stringField(baseInfo[field])} onChange={(event) => update(field, event.target.value)} />
          </label>
        ))}
    </>
  );
}

function SkuGroupCard({ group, parameters, sku, t, updateSku }: { group: ParameterGroup; parameters: ParameterDefinition[]; sku: DraftSku; t: Dictionary; updateSku: (updater: (draft: DraftSku) => void) => void }) {
  if (group.type === "table") {
    return (
      <section className="group-card">
        <div className="group-header">
          <div>
            <span className="pill amber">Table</span>
            <div className="group-title-line">
              <input className="group-name" readOnly value={group.name} size={compactInputSize(group.name, 5, 24)} />
              <code className="group-code-readonly">{group.code}</code>
            </div>
          </div>
          <span className="status-badge inherited">
            <Link2 size={13} />
            {t.systemParameters}
          </span>
        </div>
        <div className="matrix-scroll">
          <table className="matrix-table">
            <thead>
              <tr>{group.table.columns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {group.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>{group.table.columns.map((_, columnIndex) => <td key={columnIndex}>{row[columnIndex] ?? "-"}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="group-card">
      <div className="group-header">
        <div>
          <span className="pill green">{t.parameterOptions}</span>
          <div className="group-title-line">
            <input className="group-name" readOnly value={group.name} size={compactInputSize(group.name, 5, 24)} />
            <code className="group-code-readonly">{group.code}</code>
          </div>
        </div>
      </div>
      <div className="sku-param-stack">
        {group.parameters.map((parameter) => {
          const override = sku.parameter_overrides.find((item) => item.parameterId === parameter.id);
          return (
            <SkuParameterRow
              key={parameter.id}
              parameter={parameter}
              definition={parameter.kind === "defined" ? parameters.find((item) => item.code === parameter.parameterCode) : undefined}
              override={override}
              t={t}
              update={(next) =>
                updateSku((draft) => {
                  const index = draft.parameter_overrides.findIndex((item) => item.parameterId === parameter.id);
                  if (index >= 0) draft.parameter_overrides[index] = next;
                  else draft.parameter_overrides.push(next);
                })
              }
              restore={() => updateSku((draft) => (draft.parameter_overrides = draft.parameter_overrides.filter((item) => item.parameterId !== parameter.id)))}
            />
          );
        })}
      </div>
    </section>
  );
}

function SkuParameterRow({
  parameter,
  definition,
  override,
  t,
  update,
  restore,
}: {
  parameter: SystemParameter;
  definition?: ParameterDefinition;
  override?: SkuOverride;
  t: Dictionary;
  update: (override: SkuOverride) => void;
  restore: () => void;
}) {
  const inherited = !override;
  const activeShow = override?.showInDetail ?? parameter.showInDetail;
  const activeTag = override?.usedAsTag ?? parameter.usedAsTag;
  const activate = () =>
    update(
      parameter.kind === "defined"
        ? { parameterId: parameter.id, optionCodes: parameter.optionCodes, showInDetail: parameter.showInDetail, usedAsTag: parameter.usedAsTag }
        : { parameterId: parameter.id, textValue: parameter.value, showInDetail: parameter.showInDetail, usedAsTag: parameter.usedAsTag },
    );

  return (
    <article className={`sku-param ${inherited ? "inherited" : "overridden"}`}>
      <div className="parameter-label">
        <strong className="text-sm font-black">{parameter.kind === "defined" ? definition?.name ?? parameter.parameterCode : parameter.name}</strong>
        <code className="text-xs text-admin-muted">{parameter.kind === "defined" ? parameter.parameterCode : parameter.code}</code>
      </div>

      {parameter.kind === "defined" && definition ? (
        <ValueControl
          definition={definition}
          value={override?.optionCodes ?? parameter.optionCodes}
          onChange={(value) => update({ parameterId: parameter.id, optionCodes: value, showInDetail: activeShow, usedAsTag: activeTag })}
        />
      ) : parameter.kind === "text" ? (
        <input className={inputClass} value={override?.textValue ?? parameter.value} onChange={(event) => update({ parameterId: parameter.id, textValue: event.target.value, showInDetail: activeShow, usedAsTag: activeTag })} />
      ) : null}

      <div className="toggle-pair">
        <Toggle label={t.preview} active={activeShow} onClick={() => update({ parameterId: parameter.id, ...(parameter.kind === "defined" ? { optionCodes: override?.optionCodes ?? parameter.optionCodes } : { textValue: override?.textValue ?? parameter.value }), showInDetail: !activeShow, usedAsTag: activeTag })} />
        <Toggle label={t.customLabels} active={activeTag} onClick={() => update({ parameterId: parameter.id, ...(parameter.kind === "defined" ? { optionCodes: override?.optionCodes ?? parameter.optionCodes } : { textValue: override?.textValue ?? parameter.value }), showInDetail: activeShow, usedAsTag: !activeTag })} />
      </div>

      {inherited ? (
        <button className="ghost-button compact-action" onClick={activate} type="button">
          <Edit3 size={14} />
          {t.edit}
        </button>
      ) : (
        <button className="restore-link" onClick={restore} type="button">
          <RotateCcw size={14} />
          {t.restore}
        </button>
      )}
    </article>
  );
}

function ValueControl({ definition, value, onChange }: { definition: ParameterDefinition; value: string[]; onChange: (value: string[]) => void }) {
  if (definition.select_type === "single") {
    return (
      <select className="value-control px-2" value={value[0] ?? ""} onChange={(event) => onChange(event.target.value ? [event.target.value] : [])}>
        <option value="">-</option>
        {definition.options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <div className="tag-row compact">
      {definition.options.map((option) => {
        const active = value.includes(option.code);
        return (
          <button
            className={`tag ${active ? "selected-option" : ""}`}
            key={option.code}
            onClick={() => onChange(active ? value.filter((item) => item !== option.code) : [...value, option.code])}
            type="button"
          >
            {active ? <Check size={13} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`toggle ${active ? "active green" : ""}`} onClick={onClick} type="button">
      <Check size={13} />
      {label}
    </button>
  );
}
