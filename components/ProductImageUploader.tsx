"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";

const maxImages = 4;
const bucketName = "product-images";

function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "png";
  const baseName = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${baseName || "product-image"}.${extension}`;
}

function text(locale: Locale) {
  return locale === "en"
    ? {
        add: "Upload images",
        change: "Change",
        remove: "Remove",
        empty: "No image",
        helper: "Up to 4 images. JPG, PNG, WebP and GIF are supported.",
        limit: "Only 4 images can be saved for one product.",
        uploading: "Uploading...",
        failed: "Upload failed. Please try again.",
      }
    : {
        add: "上传图片",
        change: "更换",
        remove: "删除",
        empty: "暂无图片",
        helper: "最多 4 张图片，支持 JPG、PNG、WebP、GIF。",
        limit: "单个产品最多保存 4 张图片。",
        uploading: "上传中...",
        failed: "上传失败，请重试。",
      };
}

export function ProductImageUploader({
  name,
  initialImages,
  locale,
}: {
  name: string;
  initialImages: string[];
  locale: Locale;
}) {
  const copy = text(locale);
  const [images, setImages] = useState(initialImages.slice(0, maxImages));
  const [uploadingSlot, setUploadingSlot] = useState<number | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File) {
    const supabase = createClient();
    const path = `product/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type || undefined,
      upsert: false,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleFiles(files: FileList | null, slot?: number) {
    const selectedFiles = [...(files ?? [])].filter((file) => file.type.startsWith("image/"));
    if (!selectedFiles.length) return;

    const freeSlots = slot === undefined ? maxImages - images.length : 1;
    const filesToUpload = selectedFiles.slice(0, freeSlots);
    if (!filesToUpload.length) {
      setError(copy.limit);
      return;
    }

    setError(null);
    setUploadingSlot(slot ?? "add");

    try {
      const urls = await Promise.all(filesToUpload.map(uploadOne));
      setImages((current) => {
        if (slot !== undefined) {
          const next = [...current];
          next[slot] = urls[0];
          return next.filter(Boolean).slice(0, maxImages);
        }
        return [...current, ...urls].slice(0, maxImages);
      });
    } catch {
      setError(copy.failed);
    } finally {
      setUploadingSlot(null);
    }
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name={name} value={images.join("\n")} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: maxImages }).map((_, index) => {
          const image = images[index];
          const isUploading = uploadingSlot === index;

          return (
            <div key={index} className="grid gap-3 rounded-lg border border-admin-line bg-admin-bg p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-admin-line bg-white">
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-admin-muted">
                    <span className="grid gap-2 text-center text-xs font-black">
                      <ImageIcon className="mx-auto" size={24} />
                      {copy.empty}
                    </span>
                  </div>
                )}
                {isUploading ? (
                  <div className="absolute inset-0 grid place-items-center bg-admin-primary/70 text-sm font-black !text-white">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      {copy.uploading}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <label className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-admin-primary bg-admin-primary px-3 text-xs font-black !text-white transition hover:bg-admin-accent-deep hover:!text-white">
                  <Upload size={15} />
                  {image ? copy.change : copy.add}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    disabled={uploadingSlot !== null}
                    onChange={(event) => {
                      void handleFiles(event.currentTarget.files, index);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {image ? (
                  <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center rounded-md border border-admin-line bg-white text-admin-primary transition hover:bg-admin-bg"
                    onClick={() => removeImage(index)}
                    aria-label={copy.remove}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={addInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          multiple
          disabled={uploadingSlot !== null || images.length >= maxImages}
          onChange={(event) => {
            void handleFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-admin-primary bg-admin-primary px-4 text-sm font-black !text-white transition hover:bg-admin-accent-deep hover:!text-white disabled:cursor-not-allowed disabled:opacity-55"
          disabled={uploadingSlot !== null || images.length >= maxImages}
          onClick={() => addInputRef.current?.click()}
        >
          {uploadingSlot === "add" ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {uploadingSlot === "add" ? copy.uploading : copy.add}
        </button>
        <span className="text-xs font-bold text-admin-muted">{copy.helper}</span>
      </div>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
