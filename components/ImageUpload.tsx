import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, X, Loader, Link2 } from "lucide-react";
import { sbUploadImage, compressImage, isSupabaseEnabled } from "../utils/supabase";

interface ImageUploadProps {
  name: string;
  defaultValue?: string;
  onUploaded?: (url: string) => void;
}

export default function ImageUpload({ name, defaultValue = "", onUploaded }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>(defaultValue);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة كبير (الحد الأقصى 5 ميجا)");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("يجب اختيار ملف صورة فقط");
      return;
    }

    setError("");
    setUploading(true);

    try {
      let url: string;
      const cloudEnabled = isSupabaseEnabled();

      if (cloudEnabled) {
        // محاولة الرفع لـ Supabase Storage أولاً
        try {
          url = await sbUploadImage(file);
        } catch (e: any) {
          // إذا فشل، استخدم ضغط الصورة + base64 محلياً
          console.warn("Supabase upload failed, using base64:", e.message);
          url = await compressImage(file, 1200, 0.8);
        }
      } else {
        // بدون سحابة: ضغط + base64
        url = await compressImage(file, 1200, 0.8);
      }

      setImageUrl(url);
      onUploaded?.(url);
    } catch (e: any) {
      setError("فشل معالجة الصورة: " + (e?.message || ""));
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleClear = () => {
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {/* Mode switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            mode === "upload"
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          رفع من الجهاز
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            mode === "url"
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
          رابط
        </button>
      </div>

      {mode === "upload" ? (
        <>
          {/* Drag & Drop / Click area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${
              uploading
                ? "bg-sky-50 border-sky-300"
                : "bg-slate-50 border-slate-300 hover:bg-sky-50 hover:border-sky-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-center space-y-2">
              {uploading ? (
                <>
                  <Loader className="h-10 w-10 text-sky-600 mx-auto animate-spin" />
                  <p className="text-sm font-bold text-sky-700">جاري المعالجة والرفع...</p>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">اضغط لاختيار صورة من جهازك</p>
                  <p className="text-[10px] text-slate-500">JPG, PNG, WEBP - حد أقصى 5MB</p>
                  {isSupabaseEnabled() && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ☁️ سيُرفع للسحابة
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <input
          type="text"
          value={imageUrl}
          onChange={handleUrlChange}
          placeholder="https://example.com/image.jpg أو /images/photo.jpg"
          dir="ltr"
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-sky-500 focus:bg-white text-left"
        />
      )}

      {/* Hidden input for form submit */}
      <input type="hidden" name={name} value={imageUrl} />

      {/* Error message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded-lg font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Image preview */}
      {imageUrl && (
        <div className="relative bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
          <img
            src={imageUrl}
            alt="معاينة"
            className="w-full h-40 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%2364748b'%3Eفشل تحميل الصورة%3C/text%3E%3C/svg%3E";
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 left-2 p-1.5 bg-white/90 hover:bg-rose-500 hover:text-white text-slate-700 rounded-lg shadow-md transition-all"
            title="حذف الصورة"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="absolute bottom-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            صورة جاهزة
          </div>
        </div>
      )}
    </div>
  );
}
