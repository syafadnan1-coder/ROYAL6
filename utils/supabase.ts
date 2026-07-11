/**
 * ============================================================
 * خدمة Supabase الحقيقية لمصنع رويال
 * Real Supabase Integration - Royal Pipes Factory
 * ============================================================
 * 
 * هذا الملف يدير الاتصال الفعلي بـ Supabase ويقوم بـ:
 * - حفظ المنتجات في قاعدة بيانات سحابية حقيقية
 * - جلب المنتجات لكل الزوار من حول العالم
 * - تزامن لحظي بين كل المتصفحات
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Product, Agent, Banner, Message, SiteSettings } from "../data/initialData";

const STORAGE_KEY = "royal_supabase_config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

let supabaseClient: SupabaseClient | null = null;
let currentConfig: SupabaseConfig | null = null;

/**
 * الحصول على إعدادات Supabase المحفوظة
 */
export function getSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      return {
        url: config.url || "",
        anonKey: config.anonKey || "",
        enabled: !!config.enabled
      };
    }
  } catch (e) {
    console.error("Error reading Supabase config:", e);
  }
  return { url: "", anonKey: "", enabled: false };
}

/**
 * حفظ إعدادات Supabase
 */
export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  currentConfig = config;
  // إعادة إنشاء العميل عند تغيير الإعدادات
  if (config.enabled && config.url && config.anonKey) {
    try {
      supabaseClient = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error("Failed to create Supabase client:", e);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
}

/**
 * هل Supabase مفعّل ومتصل؟
 */
export function isSupabaseEnabled(): boolean {
  const config = currentConfig || getSupabaseConfig();
  return !!(config.enabled && config.url && config.anonKey);
}

/**
 * تهيئة العميل عند بدء التشغيل
 */
export function initSupabase(): boolean {
  const config = getSupabaseConfig();
  currentConfig = config;
  if (config.enabled && config.url && config.anonKey) {
    try {
      supabaseClient = createClient(config.url, config.anonKey);
      return true;
    } catch (e) {
      console.error("Failed to initialize Supabase:", e);
      return false;
    }
  }
  return false;
}

/**
 * اختبار اتصال Supabase حقيقي (يجرّب جلب جدول products)
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{
  success: boolean;
  message: string;
  tablesExist?: boolean;
}> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: "يرجى إدخال URL ومفتاح API" };
    }

    if (!url.startsWith("https://") || !url.includes("supabase.co")) {
      return { success: false, message: "رابط Supabase غير صحيح. يجب أن يبدأ بـ https://...supabase.co" };
    }

    const testClient = createClient(url, anonKey);
    
    // اختبار جلب products
    const { error: productsError } = await testClient
      .from("products")
      .select("id")
      .limit(1);

    if (productsError) {
      // إذا كان الخطأ "table not found" نخبر المستخدم بإنشاء الجداول
      if (productsError.message.includes("relation") || 
          productsError.message.includes("does not exist") ||
          productsError.code === "42P01") {
        return {
          success: false,
          message: "✗ تم الاتصال بـ Supabase لكن الجداول غير موجودة! يجب تنفيذ ملف SQL أولاً في SQL Editor.",
          tablesExist: false
        };
      }
      // خطأ في المصادقة
      if (productsError.message.includes("JWT") || productsError.message.includes("Invalid")) {
        return { success: false, message: "✗ مفتاح API غير صحيح. تأكد من نسخ anon/public key بشكل صحيح." };
      }
      return { success: false, message: "خطأ: " + productsError.message };
    }

    return {
      success: true,
      message: "✓ ممتاز! الاتصال يعمل والجداول جاهزة. سيتم استخدام Supabase الآن لكل العمليات.",
      tablesExist: true
    };
  } catch (e: any) {
    return { success: false, message: "فشل الاختبار: " + (e?.message || "خطأ غير معروف") };
  }
}

// ============================================
// PRODUCTS - المنتجات
// ============================================

export async function sbGetProducts(): Promise<Product[]> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: String(p.id),
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    description: p.description || "",
    price: parseFloat(p.price) || 0,
    unit: p.unit || "حبة",
    image: p.image || "",
    specifications: p.specifications || [],
    isAvailable: p.is_available !== false
  }));
}

export async function sbAddProduct(product: Omit<Product, "id">): Promise<Product> {
  if (!supabaseClient) throw new Error("لم يتم تفعيل السحابة");
  
  // إذا كانت الصورة base64 طويلة جداً، نضغطها أكثر
  let finalImage = product.image || "";
  if (finalImage.startsWith("data:image") && finalImage.length > 500000) {
    console.warn("Image is large, this might cause issues");
  }
  
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .insert({
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        description: product.description || "",
        price: Number(product.price) || 0,
        unit: product.unit || "حبة",
        image: finalImage,
        specifications: product.specifications || [],
        is_available: product.isAvailable !== false
      })
      .select()
      .single();
    
    if (error) {
      // رسائل خطأ مفصلة بالعربي
      const msg = error.message || "";
      if (msg.includes("row-level security") || msg.includes("RLS") || error.code === "42501") {
        throw new Error("⚠️ سياسات الأمان (RLS) تمنع الإضافة! الحل: اذهب لـ Supabase → SQL Editor ونفّذ كود الإصلاح من تبويب 'ربط السحابة' (زر 'إصلاح سياسات الأمان')");
      }
      if (msg.includes("does not exist") || msg.includes("relation")) {
        throw new Error("⚠️ جدول 'products' غير موجود! نفّذ كود SQL أولاً في Supabase SQL Editor");
      }
      if (msg.includes("violates check constraint")) {
        throw new Error("⚠️ التصنيف غير مسموح! يجب أن يكون: plumbing, electricity, building, agriculture");
      }
      if (msg.includes("duplicate key")) {
        throw new Error("⚠️ هذا المنتج موجود مسبقاً");
      }
      throw new Error(`خطأ Supabase: ${msg} (كود: ${error.code || "?"})`);
    }
    
    return { ...product, id: String(data.id), image: finalImage };
  } catch (e: any) {
    if (e.message?.includes("Failed to fetch") || e.message?.includes("NetworkError")) {
      throw new Error("⚠️ فشل الاتصال بالإنترنت أو رابط Supabase خطأ");
    }
    throw e;
  }
}

// نقل كل البيانات المحلية للسحابة دفعة واحدة
export async function sbMigrateLocalData(data: {
  products: Product[];
  agents: Agent[];
  banners: Banner[];
}): Promise<{ products: Product[]; agents: Agent[]; banners: Banner[]; errors: string[] }> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  
  const result = {
    products: [] as Product[],
    agents: [] as Agent[],
    banners: [] as Banner[],
    errors: [] as string[]
  };
  
  // رفع المنتجات (فقط التي لها IDs محلية)
  for (const p of data.products) {
    try {
      if (!isValidSupabaseId(p.id)) {
        const { id: _ignored, ...productData } = p;
        const newProduct = await sbAddProduct(productData);
        result.products.push(newProduct);
      } else {
        result.products.push(p); // موجود بالفعل في السحابة
      }
    } catch (e: any) {
      result.errors.push(`فشل رفع المنتج "${p.name}": ${e.message}`);
    }
  }
  
  // رفع الوكلاء
  for (const a of data.agents) {
    try {
      if (!isValidSupabaseId(a.id)) {
        const { id: _ignored, ...agentData } = a;
        const newAgent = await sbAddAgent(agentData);
        result.agents.push(newAgent);
      } else {
        result.agents.push(a);
      }
    } catch (e: any) {
      result.errors.push(`فشل رفع الوكيل "${a.name}": ${e.message}`);
    }
  }
  
  // رفع البانرات
  for (const b of data.banners) {
    try {
      if (!isValidSupabaseId(b.id)) {
        const { id: _ignored, ...bannerData } = b;
        const newBanner = await sbAddBanner(bannerData);
        result.banners.push(newBanner);
      } else {
        result.banners.push(b);
      }
    } catch (e: any) {
      result.errors.push(`فشل رفع البانر "${b.title}": ${e.message}`);
    }
  }
  
  return result;
}

// أداة تشخيص الاتصال - اختبر إضافة منتج تجريبي
export async function sbDiagnose(): Promise<{ ok: boolean; tests: Array<{ name: string; ok: boolean; msg: string }> }> {
  const tests = [];
  
  // اختبار 1: الاتصال أساسي
  if (!supabaseClient) {
    return { ok: false, tests: [{ name: "الاتصال", ok: false, msg: "لم يتم تفعيل السحابة - الصق URL والمفتاح" }] };
  }
  tests.push({ name: "الاتصال بـ Supabase", ok: true, msg: "✓ متصل" });
  
  // اختبار 2: قراءة جدول products
  try {
    const { error } = await supabaseClient.from("products").select("id").limit(1);
    if (error) {
      tests.push({ name: "قراءة جدول products", ok: false, msg: error.message });
      return { ok: false, tests };
    }
    tests.push({ name: "قراءة جدول products", ok: true, msg: "✓ يمكن القراءة" });
  } catch (e: any) {
    tests.push({ name: "قراءة جدول products", ok: false, msg: e.message });
    return { ok: false, tests };
  }
  
  // اختبار 3: محاولة إضافة منتج تجريبي
  try {
    const testProduct = {
      name: "_test_product_" + Date.now(),
      category: "plumbing",
      subcategory: "اختبار",
      description: "هذا منتج اختبار وسيُحذف تلقائياً",
      price: 0.01,
      unit: "حبة",
      image: "",
      specifications: [],
      is_available: false
    };
    const { data, error } = await supabaseClient.from("products").insert(testProduct).select().single();
    if (error) {
      const msg = error.message || "";
      if (msg.includes("row-level security") || error.code === "42501") {
        tests.push({ 
          name: "اختبار الإضافة", 
          ok: false, 
          msg: "❌ سياسات الأمان (RLS) تمنع الإضافة - يجب تنفيذ كود الإصلاح" 
        });
      } else {
        tests.push({ name: "اختبار الإضافة", ok: false, msg: msg });
      }
      return { ok: false, tests };
    }
    tests.push({ name: "اختبار الإضافة", ok: true, msg: "✓ تمت الإضافة بنجاح" });
    
    // اختبار 4: حذف المنتج التجريبي
    if (data?.id) {
      await supabaseClient.from("products").delete().eq("id", data.id);
      tests.push({ name: "تنظيف منتج الاختبار", ok: true, msg: "✓ تم الحذف" });
    }
  } catch (e: any) {
    tests.push({ name: "اختبار الإضافة", ok: false, msg: e.message });
    return { ok: false, tests };
  }
  
  return { ok: true, tests };
}

/**
 * يتحقق إذا كان ID صالح لـ Supabase (رقم)
 */
export function isValidSupabaseId(id: string | number): boolean {
  if (typeof id === "number") return true;
  const numId = Number(id);
  return !isNaN(numId) && numId > 0 && Number.isInteger(numId);
}

export async function sbUpdateProduct(product: Product): Promise<Product> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  
  // إذا كان ID غير صالح (محلي مثل p1, p_123)، نضيف بدلاً من تحديث
  if (!isValidSupabaseId(product.id)) {
    console.log(`Product ID '${product.id}' is local, creating new product in cloud instead`);
    const { id: _ignored, ...productWithoutId } = product;
    return await sbAddProduct(productWithoutId);
  }
  
  const { error } = await supabaseClient
    .from("products")
    .update({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description,
      price: product.price,
      unit: product.unit,
      image: product.image,
      specifications: product.specifications || [],
      is_available: product.isAvailable
    })
    .eq("id", Number(product.id));
  
  if (error) {
    // إذا كان الخطأ "Row not found"، نضيف المنتج بدلاً من تحديثه
    if (error.code === "PGRST116" || error.message?.includes("0 rows")) {
      console.log("Product not found in cloud, creating new one");
      const { id: _ignored, ...productWithoutId } = product;
      return await sbAddProduct(productWithoutId);
    }
    throw error;
  }
  return product;
}

export async function sbDeleteProduct(id: string): Promise<void> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  // إذا كان ID محلي، نتجاهل (المنتج غير موجود أصلاً في السحابة)
  if (!isValidSupabaseId(id)) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", Number(id));
  if (error) throw error;
}

// ============================================
// AGENTS - الوكلاء
// ============================================

export async function sbGetAgents(): Promise<Agent[]> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const { data, error } = await supabaseClient
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: String(a.id),
    name: a.name,
    governorate: a.governorate,
    phone: a.phone,
    address: a.address,
    logoUrl: a.logo_url || "/images/royal-logo.png",
    isAuthorized: a.is_authorized !== false
  }));
}

export async function sbAddAgent(agent: Omit<Agent, "id">): Promise<Agent> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const { data, error } = await supabaseClient
    .from("agents")
    .insert({
      name: agent.name,
      governorate: agent.governorate,
      phone: agent.phone,
      address: agent.address,
      logo_url: agent.logoUrl,
      is_authorized: agent.isAuthorized
    })
    .select()
    .single();
  if (error) throw error;
  return { ...agent, id: String(data.id) };
}

export async function sbUpdateAgent(agent: Agent): Promise<Agent> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  if (!isValidSupabaseId(agent.id)) {
    const { id: _ignored, ...agentWithoutId } = agent;
    return await sbAddAgent(agentWithoutId);
  }
  const { error } = await supabaseClient
    .from("agents")
    .update({
      name: agent.name,
      governorate: agent.governorate,
      phone: agent.phone,
      address: agent.address,
      logo_url: agent.logoUrl,
      is_authorized: agent.isAuthorized
    })
    .eq("id", Number(agent.id));
  if (error) {
    if (error.code === "PGRST116" || error.message?.includes("0 rows")) {
      const { id: _ignored, ...agentWithoutId } = agent;
      return await sbAddAgent(agentWithoutId);
    }
    throw error;
  }
  return agent;
}

export async function sbDeleteAgent(id: string): Promise<void> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  if (!isValidSupabaseId(id)) return;
  const { error } = await supabaseClient.from("agents").delete().eq("id", Number(id));
  if (error) throw error;
}

// ============================================
// BANNERS - البانرات
// ============================================

export async function sbGetBanners(): Promise<Banner[]> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const { data, error } = await supabaseClient.from("banners").select("*").order("id");
  if (error) throw error;
  return (data || []).map((b: any) => ({
    id: String(b.id),
    title: b.title,
    subtitle: b.subtitle || "",
    imageUrl: b.image_url,
    link: b.link_url || "",
    expiryDate: b.expiry_date
  }));
}

export async function sbAddBanner(banner: Omit<Banner, "id">): Promise<Banner> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const { data, error } = await supabaseClient
    .from("banners")
    .insert({
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.imageUrl,
      link_url: banner.link,
      expiry_date: banner.expiryDate
    })
    .select()
    .single();
  if (error) throw error;
  return { ...banner, id: String(data.id) };
}

export async function sbUpdateBanner(banner: Banner): Promise<Banner> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  if (!isValidSupabaseId(banner.id)) {
    const { id: _ignored, ...bannerWithoutId } = banner;
    return await sbAddBanner(bannerWithoutId);
  }
  const { error } = await supabaseClient
    .from("banners")
    .update({
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.imageUrl,
      link_url: banner.link,
      expiry_date: banner.expiryDate
    })
    .eq("id", Number(banner.id));
  if (error) {
    if (error.code === "PGRST116" || error.message?.includes("0 rows")) {
      const { id: _ignored, ...bannerWithoutId } = banner;
      return await sbAddBanner(bannerWithoutId);
    }
    throw error;
  }
  return banner;
}

export async function sbDeleteBanner(id: string): Promise<void> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  if (!isValidSupabaseId(id)) return;
  const { error } = await supabaseClient.from("banners").delete().eq("id", Number(id));
  if (error) throw error;
}

// ============================================
// MESSAGES - الرسائل
// ============================================

export async function sbGetMessages(): Promise<Message[]> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: String(m.id),
    name: m.name,
    email: m.email || "",
    phone: m.phone || "",
    subject: m.subject,
    message: m.message_text,
    createdAt: m.created_at,
    isRead: m.is_read || false
  }));
}

export async function sbAddMessage(message: Omit<Message, "id" | "createdAt" | "isRead">): Promise<Message> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const { data, error } = await supabaseClient
    .from("messages")
    .insert({
      name: message.name,
      email: message.email,
      phone: message.phone,
      subject: message.subject,
      message_text: message.message,
      is_read: false
    })
    .select()
    .single();
  if (error) throw error;
  return {
    ...message,
    id: String(data.id),
    createdAt: data.created_at,
    isRead: false
  };
}

export async function sbMarkMessageRead(id: string): Promise<void> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  if (!isValidSupabaseId(id)) return;
  const { error } = await supabaseClient.from("messages").update({ is_read: true }).eq("id", Number(id));
  if (error) throw error;
}

export async function sbDeleteMessage(id: string): Promise<void> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  if (!isValidSupabaseId(id)) return;
  const { error } = await supabaseClient.from("messages").delete().eq("id", Number(id));
  if (error) throw error;
}

// ============================================
// SETTINGS - الإعدادات
// ============================================

export async function sbGetSettings(): Promise<Partial<SiteSettings>> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const { data, error } = await supabaseClient.from("settings").select("*");
  if (error) throw error;
  const settings: any = {};
  (data || []).forEach((row: any) => {
    settings[row.key_name] = row.value_text;
  });
  return settings;
}

export async function sbUpdateSettings(settings: SiteSettings): Promise<void> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  const entries = Object.entries(settings).map(([key, value]) => ({
    key_name: key,
    value_text: String(value)
  }));
  const { error } = await supabaseClient
    .from("settings")
    .upsert(entries, { onConflict: "key_name" });
  if (error) throw error;
}

// ============================================
// إنشاء bucket تلقائياً إذا لم يكن موجوداً
// ============================================
let bucketChecked = false;
export async function ensureProductsBucket(): Promise<boolean> {
  if (!supabaseClient) return false;
  if (bucketChecked) return true;
  
  try {
    // محاولة إنشاء bucket
    const { error } = await supabaseClient.storage.createBucket("products", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024
    });
    
    // إذا كان موجوداً مسبقاً = OK
    if (error && !error.message.toLowerCase().includes("already exists") && !error.message.toLowerCase().includes("duplicate")) {
      console.warn("Could not create bucket:", error.message);
      return false;
    }
    
    bucketChecked = true;
    return true;
  } catch (e) {
    console.warn("Bucket check failed:", e);
    return false;
  }
}

// ============================================
// رفع الصور إلى Supabase Storage (يصبح URL عام)
// ============================================
export async function sbUploadImage(file: File): Promise<string> {
  if (!supabaseClient) throw new Error("Supabase not initialized");
  
  // محاولة إنشاء bucket تلقائياً
  await ensureProductsBucket();
  
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `royal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  
  const { error } = await supabaseClient.storage
    .from("products")
    .upload(filename, file, { cacheControl: "3600", upsert: false });
  
  if (error) {
    const msg = error.message || "";
    if (msg.toLowerCase().includes("bucket not found") || msg.toLowerCase().includes("not found")) {
      throw new Error("⚠️ Bucket 'products' غير موجود. اذهب لـ Supabase → Storage → New bucket → اسم: products → فعّل Public");
    }
    if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("policy")) {
      throw new Error("⚠️ سياسات Storage تمنع الرفع. اذهب لـ Storage → اختر bucket products → Policies → أنشئ سياسة 'Public access'");
    }
    throw new Error("فشل رفع الصورة: " + msg);
  }
  
  const { data: urlData } = supabaseClient.storage
    .from("products")
    .getPublicUrl(filename);
  
  return urlData.publicUrl;
}

/**
 * تحويل صورة إلى base64 (لا يحتاج رفع للسحابة - الحل الفوري)
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * ضغط الصورة قبل التحويل لـ base64 (للحفاظ على حجم صغير)
 */
export function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
