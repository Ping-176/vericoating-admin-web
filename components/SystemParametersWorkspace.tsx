"use client";

import { ArrowLeft, Check, ChevronLeft, ChevronRight, CirclePlus, CopyPlus, Edit3, Factory, FileSpreadsheet, Save, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copyProductSystemTranslationAction, saveProductSystemAction } from "@/app/[locale]/(admin)/system-parameters/actions";
import { CertificationEditor, normalizeCertifications, type CertificationItem } from "@/components/CatalogMediaEditors";
import { inputClass } from "@/components/FormControls";
import type { ParameterDefinition, ProductSystem } from "@/lib/admin-data";
import type { Dictionary, Locale } from "@/lib/i18n";

type DefinedParameter = {
  id: string;
  kind: "defined";
  parameterCode: string;
  optionCodes: string[];
  showInDetail: boolean;
  usedAsTag: boolean;
};

type TextParameter = {
  id: string;
  kind: "text";
  code: string;
  name: string;
  value: string;
  showInDetail: boolean;
  usedAsTag: boolean;
};

type MatrixTable = {
  name: string;
  description: string;
  columns: string[];
  rows: string[][];
};

type ParameterGroup =
  | { id: string; code: string; name: string; type: "normal"; parameters: Array<DefinedParameter | TextParameter> }
  | { id: string; code: string; name: string; type: "table"; table: MatrixTable };

type DraftSystem = Omit<ProductSystem, "base_info" | "parameter_groups" | "certifications"> & {
  base_info: Record<string, unknown>;
  parameter_groups: ParameterGroup[];
  certifications: CertificationItem[];
};

const NEW_SYSTEM_ID = "__new_system";
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

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

function emptySystem(): ProductSystem {
  return {
    id: NEW_SYSTEM_ID,
    system_code: "",
    status: "draft",
    sort: 0,
    updated_at: "",
    name: "",
    intro: null,
    description: null,
    base_common: {},
    base_info: {},
    parameter_groups: [],
    certifications: [],
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
        const table = (group as { table?: Partial<MatrixTable> }).table ?? {};
        return {
          id: group.id || makeId("grp"),
          code: typeof group.code === "string" && group.code.trim() ? group.code.trim() : codeFromName(group.name || "table_group", group.id || "table_group"),
          name: group.name || "Table group",
          type: "table" as const,
          table: {
            name: table.name || group.name || "Matrix",
            description: table.description || "",
            columns: Array.isArray(table.columns) && table.columns.length ? table.columns.map(String) : ["Parameter", "Value", "Standard", "Source"],
            rows: Array.isArray(table.rows) ? table.rows.map((row) => (Array.isArray(row) ? row.map(String) : [])) : [],
          },
        };
      }
      return {
        id: group.id || makeId("grp"),
        code: typeof group.code === "string" && group.code.trim() ? group.code.trim() : codeFromName(group.name || "parameter_group", group.id || "parameter_group"),
        name: group.name || "Parameter group",
        type: "normal" as const,
        parameters: Array.isArray((group as { parameters?: unknown[] }).parameters)
          ? ((group as { parameters: unknown[] }).parameters
              .map((rawParameter) => {
                const parameter = rawParameter as Record<string, unknown>;
                if (parameter.kind === "defined") {
                  return {
                    id: typeof parameter.id === "string" ? parameter.id : makeId("param"),
                    kind: "defined" as const,
                    parameterCode: typeof parameter.parameterCode === "string" ? parameter.parameterCode : "",
                    optionCodes: Array.isArray(parameter.optionCodes) ? parameter.optionCodes.map(String) : [],
                    showInDetail: parameter.showInDetail !== false,
                    usedAsTag: parameter.usedAsTag === true,
                  };
                }
                return {
                  id: typeof parameter.id === "string" ? parameter.id : makeId("text"),
                  kind: "text" as const,
                  code: typeof parameter.code === "string" ? parameter.code : "text_parameter",
                  name: typeof parameter.name === "string" ? parameter.name : "Text parameter",
                  value: typeof parameter.value === "string" ? parameter.value : "",
                  showInDetail: parameter.showInDetail !== false,
                  usedAsTag: parameter.usedAsTag === true,
                };
              }) as Array<DefinedParameter | TextParameter>)
          : [],
      };
    })
    .filter((group) => group.type === "normal" || group.type === "table");
}

function systemDraft(system: ProductSystem): DraftSystem {
  return {
    ...system,
    base_info: system.base_info ?? {},
    parameter_groups: normalizeGroups(system.parameter_groups),
    certifications: normalizeCertifications(system.certifications ?? []),
  };
}

function jsonText(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function SystemParametersWorkspace({
  locale,
  t,
  systems,
  parameters,
  initialSelectedId,
  createMode = false,
}: {
  locale: Locale;
  t: Dictionary;
  systems: ProductSystem[];
  parameters: ParameterDefinition[];
  initialSelectedId?: string;
  createMode?: boolean;
}) {
  const [search, setSearch] = useState("");
  const allSystems = useMemo(() => (createMode ? [emptySystem(), ...systems] : systems), [createMode, systems]);
  const [selectedId] = useState<string | null>(initialSelectedId ?? (createMode ? NEW_SYSTEM_ID : null));
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newGroupType, setNewGroupType] = useState<"normal" | "table">("normal");
  const [drafts, setDrafts] = useState<Record<string, DraftSystem>>(() => Object.fromEntries(allSystems.map((system) => [system.id, systemDraft(system)])));
  const selected = selectedId ? drafts[selectedId] : null;
  const selectedIndex = selected ? systems.findIndex((system) => system.id === selected.id) : -1;
  const previousSystem = selectedIndex > 0 ? systems[selectedIndex - 1] : null;
  const nextSystem = selectedIndex >= 0 && selectedIndex < systems.length - 1 ? systems[selectedIndex + 1] : null;

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return systems.filter((system) =>
      keyword ? [system.system_code, system.name, system.description ?? ""].join(" ").toLowerCase().includes(keyword) : true,
    );
  }, [systems, search]);

  const updateSelected = (updater: (draft: DraftSystem) => void) => {
    if (!selectedId) return;
    setDrafts((current) => {
      const next = { ...current, [selectedId]: structuredClone(current[selectedId]) };
      updater(next[selectedId]);
      return next;
    });
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    const groupCode = codeFromName(newGroupCode || newGroupName, `group_${Date.now()}`);
    updateSelected((draft) => {
      if (newGroupType === "normal") {
        draft.parameter_groups.push({ id: makeId("grp"), code: groupCode, name: newGroupName.trim(), type: "normal", parameters: [] });
      } else {
        draft.parameter_groups.push({
          id: makeId("grp"),
          code: groupCode,
          name: newGroupName.trim(),
          type: "table",
          table: { name: newGroupName.trim(), description: "", columns: ["Parameter", "Value", "Standard", "Source"], rows: [["", "", "", ""]] },
        });
      }
    });
    setNewGroupName("");
    setNewGroupCode("");
  };

  if (!selected) {
    return (
      <section className="panel list-page">
        <div className="list-header">
          <div className="panel-title">
              <Factory size={18} />
            <h2>{t.systemParameters}</h2>
          </div>
          <div className="list-tools">
              <label className="search-box">
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
              </label>
              <Link className="primary-button" href={`/${locale}/system-parameters/new`}>
                <CirclePlus size={16} />
                {t.create}
              </Link>
          </div>
        </div>
        <div className="entity-table-wrap">
            <table className="entity-table">
              <thead>
                <tr>
                  <th className="px-4 py-3">{t.systemName}</th>
                  <th className="px-4 py-3">{t.description}</th>
                  <th className="px-4 py-3">{t.parameterOptions}</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((system) => {
                  const groups = normalizeGroups(system.parameter_groups);
                  const normalCount = groups.filter((group) => group.type === "normal").length;
                  const tableCount = groups.filter((group) => group.type === "table").length;
                  return (
                    <tr key={system.id}>
                    <td>
                      <strong>{system.name}</strong>
                      <code>{system.system_code}</code>
                    </td>
                    <td className="muted-cell">{system.description ?? "-"}</td>
                    <td>
                      <span className="count-pill">{normalCount}</span>
                    </td>
                    <td>
                      <span className="count-pill">{tableCount}</span>
                    </td>
                    <td className="table-action-cell">
                      <Link className="primary-button compact-action" href={`/${locale}/system-parameters/${system.id}`}>
                        <Edit3 size={15} />
                        {t.edit}
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filtered.length ? <p className="p-8 text-center text-sm font-bold text-admin-muted">{t.empty}</p> : null}
      </section>
    );
  }

  return (
    <form action={saveProductSystemAction} className="content-stack">
      <input type="hidden" name="locale" value={locale} />
      {selected.id !== NEW_SYSTEM_ID ? <input type="hidden" name="id" value={selected.id} /> : null}
      <input type="hidden" name="base_common" value={jsonText(selected.base_common)} />
      <input type="hidden" name="base_info" value={jsonText(selected.base_info)} />
      <input type="hidden" name="parameter_groups" value={jsonText(selected.parameter_groups)} />
      <input type="hidden" name="certifications" value={jsonText(selected.certifications)} />
      <input type="hidden" name="from_locale" value={selected.translation_locale ?? (locale === "zh" ? "en" : "zh")} />

      <div className="toolbar-panel editor-toolbar">
          <div className="editor-title">
            <Link className="text-button" href={`/${locale}/system-parameters`}>
              <ArrowLeft size={15} />
              {t.back}
            </Link>
            <div>
              <span className="eyebrow">{t.systemParameters}</span>
              <h2>{selected.name || t.createSystem}</h2>
            </div>
          </div>
          <div className="new-group">
            <input className={inputClass} value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder={t.parameterOptions} />
            <input className={`${inputClass} font-mono`} value={newGroupCode} onChange={(event) => setNewGroupCode(codeFromName(event.target.value, ""))} placeholder={t.code} />
            <select className={inputClass} value={newGroupType} onChange={(event) => setNewGroupType(event.target.value as "normal" | "table")}>
              <option value="normal">{t.parameterOptions}</option>
              <option value="table">Table</option>
            </select>
            <button className="primary-button" onClick={addGroup} type="button">
              <CopyPlus size={16} />
              {t.create}
            </button>
          </div>
      </div>

      {selected.id !== NEW_SYSTEM_ID && selected.is_fallback ? (
        <section className="translation-notice">
          <div>
            <strong>{t.translationMissing}</strong>
            <span>{selected.translation_locale ? `${selected.translation_locale.toUpperCase()} -> ${locale.toUpperCase()}` : locale.toUpperCase()}</span>
          </div>
          <button className="ghost-button" formAction={copyProductSystemTranslationAction}>
            {t.copyFromLanguage}
          </button>
        </section>
      ) : null}

      <section className="group-card base-info-card">
        <h2>{t.basic}</h2>
        <div className="base-form-grid">
          <label className="field">
            <span>{t.systemCode}</span>
            <input className={inputClass} name="system_code" value={selected.system_code} onChange={(event) => updateSelected((draft) => (draft.system_code = event.target.value))} required />
          </label>
          <label className="field">
            <span>{t.systemName}</span>
            <input className={inputClass} name="name" value={selected.name} onChange={(event) => updateSelected((draft) => (draft.name = event.target.value))} required />
          </label>
          <label className="field">
            <span>{t.status}</span>
            <select className={inputClass} name="status" value={selected.status} onChange={(event) => updateSelected((draft) => (draft.status = event.target.value))}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="field">
            <span>{t.sort}</span>
            <input className={inputClass} name="sort" type="number" value={selected.sort} onChange={(event) => updateSelected((draft) => (draft.sort = Number(event.target.value)))} />
          </label>
          <AmountInput label={t.price} value={stringField(selected.base_info.price)} update={(value) => updateSelected((draft) => (draft.base_info.price = value))} />
          <AmountInput label={t.sampleFee} value={stringField(selected.base_info.sampleFee)} update={(value) => updateSelected((draft) => (draft.base_info.sampleFee = value))} />
          <BaseInfoFields baseInfo={selected.base_info} t={t} update={(field, value) => updateSelected((draft) => (draft.base_info[field] = value))} />
          <label className="field span-2">
            <span>{t.intro}</span>
            <input className={inputClass} name="intro" value={selected.intro ?? ""} onChange={(event) => updateSelected((draft) => (draft.intro = event.target.value))} />
          </label>
          <label className="field span-2">
            <span>{t.description}</span>
            <input className={inputClass} name="description" value={selected.description ?? ""} onChange={(event) => updateSelected((draft) => (draft.description = event.target.value))} />
          </label>
        </div>
      </section>

      <CertificationEditor
        title={t.certifications}
        t={t}
        items={selected.certifications}
        onChange={(items) => updateSelected((draft) => (draft.certifications = items))}
      />

      {selected.parameter_groups.map((group) => (
        <GroupCard
          group={group}
          key={group.id}
          parameters={parameters}
          t={t}
          updateGroup={(updater) =>
            updateSelected((draft) => {
              const target = draft.parameter_groups.find((item) => item.id === group.id);
              if (target) updater(target);
            })
          }
          deleteGroup={() => updateSelected((draft) => (draft.parameter_groups = draft.parameter_groups.filter((item) => item.id !== group.id)))}
        />
      ))}

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-admin-line bg-admin-bg/92 py-4 backdrop-blur">
        <RecordSwitchButtons
          previousHref={previousSystem ? `/${locale}/system-parameters/${previousSystem.id}` : null}
          nextHref={nextSystem ? `/${locale}/system-parameters/${nextSystem.id}` : null}
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

function AmountInput({ label, value, update }: { label: string; value: string; update: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className={inputClass} type="number" value={value} onChange={(event) => update(event.target.value)} />
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
            <input className={inputClass} value={stringField(baseInfo[field])} onChange={(event) => update(field, event.target.value)} />
          </label>
        ))}
    </>
  );
}

function GroupCard({
  group,
  parameters,
  t,
  updateGroup,
  deleteGroup,
}: {
  group: ParameterGroup;
  parameters: ParameterDefinition[];
  t: Dictionary;
  updateGroup: (updater: (group: ParameterGroup) => void) => void;
  deleteGroup: () => void;
}) {
  const [parameterToAdd, setParameterToAdd] = useState(parameters[0]?.code ?? "__text");

  const addParameter = () => {
    updateGroup((draft) => {
      if (draft.type !== "normal") return;
      if (parameterToAdd === "__text") {
        draft.parameters.push({ id: makeId("text"), kind: "text", code: "text_parameter", name: "Text parameter", value: "", showInDetail: true, usedAsTag: false });
      } else {
        const definition = parameters.find((item) => item.code === parameterToAdd);
        draft.parameters.push({
          id: makeId("param"),
          kind: "defined",
          parameterCode: parameterToAdd,
          optionCodes: definition?.options[0]?.code ? [definition.options[0].code] : [],
          showInDetail: true,
          usedAsTag: true,
        });
      }
    });
  };

  return (
    <section className="group-card">
      <div className="group-header">
        <div>
          <span className={`pill ${group.type === "table" ? "amber" : "green"}`}>
            {group.type === "table" ? "Table" : t.parameterOptions}
          </span>
          <div className="group-title-line">
            <input
              className="group-name"
              value={group.name}
              size={compactInputSize(group.name, 5, 24)}
              onChange={(event) =>
                updateGroup((draft) => {
                  draft.name = event.target.value;
                  if (draft.type === "table") draft.table.name = event.target.value;
                })
              }
            />
            <input
              className="group-code-input font-mono"
              value={group.code}
              size={compactInputSize(group.code, 5, 22)}
              onChange={(event) => updateGroup((draft) => (draft.code = codeFromName(event.target.value, "")))}
              placeholder={t.code}
            />
          </div>
        </div>
        <div className="add-param">
          {group.type === "normal" ? (
            <>
              <select className={inputClass} value={parameterToAdd} onChange={(event) => setParameterToAdd(event.target.value)}>
                <option value="__text">{t.textValue}</option>
                {parameters.map((parameter) => (
                  <option key={parameter.id} value={parameter.code}>
                    {parameter.name}
                  </option>
                ))}
              </select>
              <button className="ghost-button" onClick={addParameter} type="button">
                <CirclePlus size={16} />
                {t.create}
              </button>
            </>
          ) : null}
          <button className="icon-button danger" onClick={deleteGroup} type="button" title={t.delete} aria-label={t.delete}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {group.type === "normal" ? (
        <div className="param-grid">
          {group.parameters.map((parameter) => (
            <ParameterRow
              key={parameter.id}
              parameter={parameter}
              definitions={parameters}
              t={t}
              update={(updater) =>
                updateGroup((draft) => {
                  if (draft.type !== "normal") return;
                  const target = draft.parameters.find((item) => item.id === parameter.id);
                  if (target) updater(target);
                })
              }
              remove={() =>
                updateGroup((draft) => {
                  if (draft.type === "normal") draft.parameters = draft.parameters.filter((item) => item.id !== parameter.id);
                })
              }
            />
          ))}
        </div>
      ) : (
        <MatrixEditor table={group.table} t={t} updateTable={(updater) => updateGroup((draft) => draft.type === "table" && updater(draft.table))} />
      )}
    </section>
  );
}

function ParameterRow({
  parameter,
  definitions,
  t,
  update,
  remove,
}: {
  parameter: DefinedParameter | TextParameter;
  definitions: ParameterDefinition[];
  t: Dictionary;
  update: (updater: (parameter: DefinedParameter | TextParameter) => void) => void;
  remove: () => void;
}) {
  const definition = parameter.kind === "defined" ? definitions.find((item) => item.code === parameter.parameterCode) : null;
  return (
    <article className="parameter-row">
      <div className="parameter-label">
        {parameter.kind === "defined" ? (
          <>
            <strong className="text-sm font-black">{definition?.name ?? parameter.parameterCode}</strong>
            <code className="text-xs text-admin-muted">{parameter.parameterCode}</code>
          </>
        ) : (
          <>
            <input className={`${inputClass} compact-name-input`} value={parameter.name} onChange={(event) => update((draft) => draft.kind === "text" && (draft.name = event.target.value))} />
            <input className={`${inputClass} compact-code-input`} value={parameter.code} onChange={(event) => update((draft) => draft.kind === "text" && (draft.code = event.target.value))} />
          </>
        )}
      </div>
      {parameter.kind === "defined" && definition ? (
        <ValueControl definition={definition} value={parameter.optionCodes} onChange={(value) => update((draft) => draft.kind === "defined" && (draft.optionCodes = value))} />
      ) : parameter.kind === "text" ? (
        <input className={inputClass} value={parameter.value} onChange={(event) => update((draft) => draft.kind === "text" && (draft.value = event.target.value))} />
      ) : null}
      <div className="toggle-pair">
        <Toggle label={t.preview} active={parameter.showInDetail} onClick={() => update((draft) => (draft.showInDetail = !draft.showInDetail))} />
        <Toggle label={t.customLabels} active={parameter.usedAsTag} onClick={() => update((draft) => (draft.usedAsTag = !draft.usedAsTag))} />
      </div>
      <button className="icon-button danger" onClick={remove} type="button" title={t.delete} aria-label={t.delete}>
        <Trash2 size={15} />
      </button>
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

function MatrixEditor({ table, t, updateTable }: { table: MatrixTable; t: Dictionary; updateTable: (updater: (table: MatrixTable) => void) => void }) {
  const addRow = () => updateTable((draft) => draft.rows.push(draft.columns.map(() => "")));
  const addColumn = () =>
    updateTable((draft) => {
      draft.columns.push(`Column ${draft.columns.length + 1}`);
      draft.rows.forEach((row) => row.push(""));
    });
  const deleteColumn = (columnIndex: number) =>
    updateTable((draft) => {
      if (draft.columns.length <= 1) return;
      draft.columns.splice(columnIndex, 1);
      draft.rows.forEach((row) => row.splice(columnIndex, 1));
    });
  const deleteRow = (rowIndex: number) =>
    updateTable((draft) => {
      draft.rows.splice(rowIndex, 1);
    });

  return (
    <div className="matrix-block">
      <div className="matrix-actions">
        <button className="ghost-button" onClick={addRow} type="button">
          <CirclePlus size={16} />
          Row
        </button>
        <button className="ghost-button" onClick={addColumn} type="button">
          <FileSpreadsheet size={16} />
          Column
        </button>
      </div>
      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
              {table.columns.map((column, columnIndex) => (
                <th key={columnIndex}>
                  <div className="column-header-control">
                    <input className={inputClass} value={column} onChange={(event) => updateTable((draft) => (draft.columns[columnIndex] = event.target.value))} />
                    <button className="icon-button danger" disabled={table.columns.length <= 1} onClick={() => deleteColumn(columnIndex)} type="button" title={t.delete} aria-label={t.delete}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </th>
              ))}
              <th className="action-col">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {table.columns.map((_, columnIndex) => (
                  <td key={columnIndex}>
                    <input className={inputClass} value={row[columnIndex] ?? ""} onChange={(event) => updateTable((draft) => (draft.rows[rowIndex][columnIndex] = event.target.value))} />
                  </td>
                ))}
                <td className="action-col">
                  <button className="icon-button danger" onClick={() => deleteRow(rowIndex)} type="button" title={t.delete} aria-label={t.delete}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
