"use client";

import { CirclePlus, ListChecks, Save, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  copyParameterDefinitionTranslationAction,
  deleteParameterDefinitionAction,
  saveParameterDefinitionAction,
} from "@/app/[locale]/(admin)/parameter-definition/actions";
import { inputClass } from "@/components/FormControls";
import type { ParameterDefinition, ParameterOption } from "@/lib/admin-data";
import type { Dictionary, Locale } from "@/lib/i18n";

type OptionDraft = Pick<
  ParameterOption,
  "id" | "code" | "label" | "canonical_value" | "description" | "is_active" | "sort" | "has_current_translation" | "translation_locale" | "is_fallback"
>;
type ParameterDraft = ParameterDefinition & { clientId: string; isDraft?: boolean };
type ParameterInputType = "single" | "multiple" | "text";

function optionPayload(options: OptionDraft[]) {
  return JSON.stringify(
    options.map((option, index) => ({
      code: option.code.trim(),
      label: option.label.trim(),
      canonical_value: option.canonical_value || null,
      description: option.description || null,
      is_active: option.is_active,
      sort: index,
    })),
  );
}

function emptyOption(index: number, value: string): OptionDraft {
  const text = value.trim();
  return {
    id: "",
    code: text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `option_${index + 1}`,
    label: text,
    canonical_value: null,
    description: null,
    is_active: true,
    sort: index,
    has_current_translation: true,
    translation_locale: null,
    is_fallback: false,
  };
}

function makeDraft(): ParameterDraft {
  const clientId = `draft-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  return {
    id: "",
    clientId,
    isDraft: true,
    code: "",
    name: "",
    description: null,
    select_type: "single",
    value_type: "option",
    is_active: true,
    sort: 0,
    options: [],
    has_current_translation: true,
    translation_locale: null,
    is_fallback: false,
  };
}

export function ParameterDefinitionWorkspace({
  locale,
  t,
  parameters,
}: {
  locale: Locale;
  t: Dictionary;
  parameters: ParameterDefinition[];
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ParameterInputType>("all");
  const [items, setItems] = useState<ParameterDraft[]>(() => parameters.map((parameter) => ({ ...parameter, clientId: parameter.id })));
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      const inputType: ParameterInputType = item.value_type === "text" ? "text" : item.select_type;
      if (typeFilter !== "all" && inputType !== typeFilter) return false;
      if (!keyword) return true;
      return [item.code, item.name, ...item.options.map((option) => option.label)]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [items, search, typeFilter]);

  const addDraft = () => {
    setItems((current) => [makeDraft(), ...current]);
    setSearch("");
  };

  return (
    <section className="panel definition-panel">
      <div className="list-header">
        <div className="panel-title">
          <ListChecks size={18} />
          <h2>{t.parameterDefinition}</h2>
        </div>
        <div className="list-tools">
          <label className="filter-box">
            <span>{t.selectType}</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | ParameterInputType)}>
              <option value="all">{t.all}</option>
              <option value="single">{t.singleSelect}</option>
              <option value="multiple">{t.multiSelect}</option>
              <option value="text">{t.textValue}</option>
            </select>
          </label>
          <label className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.search}
            />
          </label>
          <button className="primary-button" onClick={addDraft} type="button">
            <CirclePlus size={16} />
            {t.create}
          </button>
        </div>
      </div>

      <div className="definition-list">
        {filtered.map((parameter) => (
          <ParameterCard
            key={parameter.clientId}
            locale={locale}
            parameter={parameter}
            t={t}
            removeDraft={() => setItems((current) => current.filter((item) => item.clientId !== parameter.clientId))}
          />
        ))}
      </div>
      {!filtered.length ? <p className="p-8 text-center text-sm font-bold text-admin-muted">{t.empty}</p> : null}
    </section>
  );
}

function ParameterCard({
  locale,
  parameter,
  t,
  removeDraft,
}: {
  locale: Locale;
  parameter: ParameterDraft;
  t: Dictionary;
  removeDraft: () => void;
}) {
  const [name, setName] = useState(parameter.name);
  const [code, setCode] = useState(parameter.code);
  const [inputType, setInputType] = useState<ParameterInputType>(parameter.value_type === "text" ? "text" : parameter.select_type);
  const [optionInput, setOptionInput] = useState("");
  const isTextParameter = inputType === "text";
  const hasFallbackContent = parameter.is_fallback || parameter.options.some((option) => option.is_fallback);
  const fallbackOptionLocale = parameter.options.find((option) => option.is_fallback)?.translation_locale;
  const sourceLocale =
    (parameter.is_fallback ? parameter.translation_locale : fallbackOptionLocale) ?? (locale === "zh" ? "en" : "zh");
  const [options, setOptions] = useState<OptionDraft[]>(
    parameter.options.map((option) => ({
      id: option.id,
      code: option.code,
      label: option.label,
      canonical_value: option.canonical_value,
      description: option.description,
      is_active: option.is_active,
      sort: option.sort,
      has_current_translation: option.has_current_translation,
      translation_locale: option.translation_locale,
      is_fallback: option.is_fallback,
    })),
  );

  const addOption = () => {
    const next = optionInput.trim();
    if (!next) return;
    const option = emptyOption(options.length, next);
    if (options.some((item) => item.code === option.code)) return;
    setOptions((current) => [...current, option]);
    setOptionInput("");
  };

  return (
    <form action={saveParameterDefinitionAction} className="definition-item editable">
      <input type="hidden" name="locale" value={locale} />
      {parameter.id ? <input type="hidden" name="id" value={parameter.id} /> : null}
      <input type="hidden" name="description" value="" />
      <input type="hidden" name="select_type" value={inputType === "multiple" ? "multiple" : "single"} />
      <input type="hidden" name="value_type" value={isTextParameter ? "text" : "option"} />
      <input type="hidden" name="sort" value={parameter.sort} />
      <input type="hidden" name="is_active" value={parameter.is_active ? "on" : ""} />
      <input type="hidden" name="options_json" value={isTextParameter ? "[]" : optionPayload(options)} />
      <input type="hidden" name="from_locale" value={sourceLocale} />

      <div className="definition-fields">
        <label className="field">
          <span>{t.name}</span>
          <input className={inputClass} name="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          <span>{t.code}</span>
          <input className={`${inputClass} font-mono`} name="code" value={code} onChange={(event) => setCode(event.target.value)} required />
        </label>
        <label className="field">
          <span>{t.selectType}</span>
          <select className={inputClass} value={inputType} onChange={(event) => setInputType(event.target.value as ParameterInputType)}>
            <option value="single">{t.singleSelect}</option>
            <option value="multiple">{t.multiSelect}</option>
            <option value="text">{t.textValue}</option>
          </select>
        </label>
      </div>

      {!isTextParameter ? (
        <div className="field definition-options-field">
          <span>{t.parameterOptions}</span>
          <div className="inline-input">
            <input
              className={inputClass}
              value={optionInput}
              onChange={(event) => setOptionInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addOption();
                }
              }}
              placeholder={t.parameterOptions}
            />
            <button className="icon-button" onClick={addOption} type="button" title={t.create}>
              <CirclePlus size={16} />
            </button>
          </div>
          <div className="option-editor">
            {options.map((option, index) => (
              <div className="option-row" key={`${option.id || "new"}-${option.code}-${index}`}>
                <input
                  className={inputClass}
                  value={option.label}
                  onChange={(event) =>
                    setOptions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              label: event.target.value,
                              has_current_translation: true,
                              translation_locale: locale,
                              is_fallback: false,
                            }
                          : item,
                      ),
                    )
                  }
                  placeholder={t.name}
                />
                {option.is_fallback ? (
                  <span className="option-locale-pill">{option.translation_locale?.toUpperCase() ?? "-"}</span>
                ) : null}
                <button
                  className="icon-button danger"
                  onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  type="button"
                  title={t.delete}
                  aria-label={t.delete}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="definition-card-actions">
        <div className="row-actions">
          {parameter.id && hasFallbackContent ? (
            <button className="ghost-button compact-action" formAction={copyParameterDefinitionTranslationAction} title={t.copyTranslation} aria-label={t.copyTranslation}>
              {t.copyTranslation}
            </button>
          ) : null}
          <button className="icon-button save" title={t.save} aria-label={t.save}>
            <Save size={16} />
          </button>
          {parameter.id ? (
            <button
              formAction={deleteParameterDefinitionAction}
              className="icon-button danger"
              title={t.delete}
              aria-label={t.delete}
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <button className="icon-button danger" onClick={removeDraft} type="button" title={t.delete} aria-label={t.delete}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
