"use client";

import { CirclePlus, Eye, FileText, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { inputClass } from "@/components/FormControls";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n";

const bucketName = "product-images";

export type CertificationItem = {
  id: string;
  name: string;
  url: string;
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function stringFrom(value: unknown) {
  return typeof value === "string" ? value : "";
}

function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "file";
  const baseName = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${baseName || "catalog-file"}.${extension}`;
}

function nameFromFile(file: File) {
  return file.name.replace(/\.[^.]+$/, "").trim();
}

async function uploadCatalogFile(file: File, folder: "images" | "certifications") {
  const supabase = createClient();
  const path = `catalog/${folder}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucketName).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}

export function normalizeCertifications(value: unknown[]): CertificationItem[] {
  return value
    .map((raw) => {
      if (typeof raw === "string") {
        return { id: makeId("cert"), name: raw, url: "" };
      }
      const item = raw as Record<string, unknown>;
      return {
        id: stringFrom(item.id) || makeId("cert"),
        name: stringFrom(item.name) || stringFrom(item.label) || stringFrom(item.title),
        url: stringFrom(item.url) || stringFrom(item.fileUrl) || stringFrom(item.href),
      };
    })
    .filter((item) => item.name || item.url);
}

export function normalizeImageUrls(value: unknown[]): string[] {
  return value
    .map((raw) => {
      if (typeof raw === "string") return raw;
      const item = raw as Record<string, unknown>;
      return stringFrom(item.url) || stringFrom(item.src);
    })
    .filter(Boolean);
}

export function CertificationEditor({
  title,
  t,
  items,
  onChange,
  statusLabel,
}: {
  title: string;
  t: Dictionary;
  items: CertificationItem[];
  onChange: (items: CertificationItem[]) => void;
  statusLabel?: string;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addItem = () => onChange([...items, { id: makeId("cert"), name: "", url: "" }]);

  async function uploadForItem(file: File | undefined, item: CertificationItem) {
    if (!file) return;
    setUploadingId(item.id);
    setError(null);
    try {
      const url = await uploadCatalogFile(file, "certifications");
      onChange(items.map((current) => (current.id === item.id ? { ...current, name: current.name || nameFromFile(file), url } : current)));
    } catch {
      setError(t.uploadFailed);
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <section className="group-card media-card">
      <div className="group-header">
        <div>
          <span className="pill violet">{title}</span>
          <input className="group-name" readOnly value={title} />
        </div>
        <div className="row-actions">
          {statusLabel ? <span className="status-badge inherited">{statusLabel}</span> : null}
          <button className="ghost-button" onClick={addItem} type="button">
            <CirclePlus size={16} />
            {t.create}
          </button>
        </div>
      </div>

      <div className="media-list">
        {items.map((item, index) => {
          const uploading = uploadingId === item.id;
          return (
            <div className="cert-row" key={item.id}>
              <input
                className={inputClass}
                value={item.name}
                onChange={(event) => onChange(items.map((current, currentIndex) => (currentIndex === index ? { ...current, name: event.target.value } : current)))}
                placeholder={t.name}
              />
              <label className="ghost-button compact-action">
                {uploading ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
                {uploading ? t.uploading : item.url ? t.change : t.upload}
                <input
                  className="sr-only"
                  type="file"
                  disabled={uploadingId !== null}
                  onChange={(event) => {
                    void uploadForItem(event.currentTarget.files?.[0], item);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {item.url ? (
                <a className="ghost-button compact-action" href={item.url} target="_blank" rel="noreferrer">
                  <Eye size={15} />
                  {t.preview}
                </a>
              ) : (
                <span className="muted-cell inline-flex min-h-8 items-center">-</span>
              )}
              <button className="icon-button danger" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} type="button" title={t.delete} aria-label={t.delete}>
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
      {!items.length ? <p className="muted-cell">{t.empty}</p> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
    </section>
  );
}

export function ImageUploadEditor({
  title,
  t,
  images,
  onChange,
}: {
  title: string;
  t: Dictionary;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploadingIndex, setUploadingIndex] = useState<number | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File | undefined, index?: number) {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingIndex(index ?? "add");
    setError(null);
    try {
      const url = await uploadCatalogFile(file, "images");
      if (index === undefined) onChange([...images, url]);
      else onChange(images.map((current, currentIndex) => (currentIndex === index ? url : current)));
    } catch {
      setError(t.uploadFailed);
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <section className="group-card media-card">
      <div className="group-header">
        <div>
          <span className="pill violet">{title}</span>
          <input className="group-name" readOnly value={title} />
        </div>
        <input
          ref={addInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          disabled={uploadingIndex !== null}
          onChange={(event) => {
            void uploadImage(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <button className="ghost-button" disabled={uploadingIndex !== null} onClick={() => addInputRef.current?.click()} type="button">
          {uploadingIndex === "add" ? <Loader2 className="animate-spin" size={16} /> : <CirclePlus size={16} />}
          {uploadingIndex === "add" ? t.uploading : t.upload}
        </button>
      </div>

      <div className="image-upload-grid">
        {images.map((image, index) => {
          const uploading = uploadingIndex === index;
          return (
            <div className="image-upload-card" key={index}>
              <div className="image-preview">
                {image ? <img src={image} alt="" /> : <ImageIcon size={24} />}
                {uploading ? (
                  <div className="image-upload-overlay">
                    <Loader2 className="animate-spin" size={18} />
                    {t.uploading}
                  </div>
                ) : null}
              </div>
              <div className="image-card-actions">
                <label className="ghost-button compact-action">
                  <Upload size={15} />
                  {t.change}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    disabled={uploadingIndex !== null}
                    onChange={(event) => {
                      void uploadImage(event.currentTarget.files?.[0], index);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <button className="icon-button danger" onClick={() => onChange(images.filter((_, currentIndex) => currentIndex !== index))} type="button" title={t.delete} aria-label={t.delete}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {!images.length ? <p className="muted-cell">{t.empty}</p> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
    </section>
  );
}
