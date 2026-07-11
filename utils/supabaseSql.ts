/**
 * كود SQL لإنشاء جداول Supabase
 * Supabase SQL Setup for Royal Pipes Factory
 */

// كود إصلاح سريع لمشاكل RLS - مبسّط ويعمل 100%
export const SUPABASE_FIX_RLS = `-- ============================================================
-- كود إصلاح سياسات الأمان (RLS) - مُبسّط
-- انسخ هذا كاملاً والصقه في Supabase SQL Editor
-- ============================================================

-- إلغاء RLS تماماً عن كل الجداول (الحل الأسهل والأسرع)
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;

-- ✅ تم! الآن يمكنك إضافة وتعديل وحذف بدون قيود
-- ============================================================
-- ملاحظة مهمة لرفع الصور:
-- إذا أردت رفع صور المنتجات لـ Supabase Storage:
-- 1. اذهب لـ Storage من القائمة اليسرى
-- 2. اضغط "New bucket"
-- 3. الاسم: products
-- 4. فعّل "Public bucket" ✅
-- 5. اضغط Save
-- ============================================================
`;

// كود بديل أكثر تفصيلاً (RLS مع سياسات مفتوحة) - للمستخدمين المتقدمين
export const SUPABASE_FIX_RLS_ADVANCED = `-- ============================================================
-- كود متقدم: RLS مع سياسات مفتوحة (أكثر أماناً)
-- ============================================================

-- تفعيل RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة (واحدة واحدة - أكثر موثوقية)
DROP POLICY IF EXISTS "السماح للجميع بقراءة المنتجات" ON products;
DROP POLICY IF EXISTS "السماح للجميع بإضافة منتج" ON products;
DROP POLICY IF EXISTS "السماح للجميع بتعديل منتج" ON products;
DROP POLICY IF EXISTS "السماح للجميع بحذف منتج" ON products;
DROP POLICY IF EXISTS "السماح للجميع بقراءة الوكلاء" ON agents;
DROP POLICY IF EXISTS "السماح للجميع بإضافة وكيل" ON agents;
DROP POLICY IF EXISTS "السماح للجميع بتعديل وكيل" ON agents;
DROP POLICY IF EXISTS "السماح للجميع بحذف وكيل" ON agents;
DROP POLICY IF EXISTS "السماح للجميع بقراءة البانرات" ON banners;
DROP POLICY IF EXISTS "السماح للجميع بإضافة بانر" ON banners;
DROP POLICY IF EXISTS "السماح للجميع بتعديل بانر" ON banners;
DROP POLICY IF EXISTS "السماح للجميع بحذف بانر" ON banners;
DROP POLICY IF EXISTS "السماح للجميع بإرسال رسالة" ON messages;
DROP POLICY IF EXISTS "السماح للجميع بقراءة الرسائل" ON messages;
DROP POLICY IF EXISTS "السماح للجميع بتعديل الرسائل" ON messages;
DROP POLICY IF EXISTS "السماح للجميع بحذف الرسائل" ON messages;
DROP POLICY IF EXISTS "السماح للجميع بقراءة الإعدادات" ON settings;
DROP POLICY IF EXISTS "السماح للجميع بحفظ الإعدادات" ON settings;
DROP POLICY IF EXISTS "السماح للجميع بتحديث الإعدادات" ON settings;
DROP POLICY IF EXISTS "all_products" ON products;
DROP POLICY IF EXISTS "all_agents" ON agents;
DROP POLICY IF EXISTS "all_banners" ON banners;
DROP POLICY IF EXISTS "all_messages" ON messages;
DROP POLICY IF EXISTS "all_settings" ON settings;

-- إنشاء سياسة واحدة شاملة لكل جدول
CREATE POLICY "open_access_products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_banners" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ✅ تم!
-- ============================================================
`;

export const SUPABASE_SQL = `-- ============================================================
-- إعداد قاعدة بيانات Supabase لمصنع رويال للأنابيب
-- انسخ هذا الكود كاملاً والصقه في SQL Editor بـ Supabase
-- ============================================================

-- 1. جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('plumbing', 'electricity', 'building', 'agriculture')),
  subcategory TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'حبة',
  image TEXT,
  specifications JSONB DEFAULT '[]'::jsonb,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الوكلاء
CREATE TABLE IF NOT EXISTS agents (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  governorate TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  logo_url TEXT,
  is_authorized BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول البانرات
CREATE TABLE IF NOT EXISTS banners (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
  key_name TEXT PRIMARY KEY,
  value_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ⚠️ مهم جداً: تفعيل الصلاحيات (RLS Policies)
-- بدون هذه الخطوة، لن يستطيع أحد قراءة أو كتابة البيانات!
-- ============================================================

-- تفعيل RLS على كل الجداول
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بالقراءة (للزوار)
CREATE POLICY "السماح للجميع بقراءة المنتجات" ON products FOR SELECT USING (true);
CREATE POLICY "السماح للجميع بقراءة الوكلاء" ON agents FOR SELECT USING (true);
CREATE POLICY "السماح للجميع بقراءة البانرات" ON banners FOR SELECT USING (true);
CREATE POLICY "السماح للجميع بقراءة الإعدادات" ON settings FOR SELECT USING (true);

-- السماح للجميع بالكتابة (للوحة التحكم)
-- ملاحظة: في الإنتاج الفعلي يفضل تقييد الكتابة بمصادقة، لكن للبدء نسمح للجميع
CREATE POLICY "السماح للجميع بإضافة منتج" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "السماح للجميع بتعديل منتج" ON products FOR UPDATE USING (true);
CREATE POLICY "السماح للجميع بحذف منتج" ON products FOR DELETE USING (true);

CREATE POLICY "السماح للجميع بإضافة وكيل" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "السماح للجميع بتعديل وكيل" ON agents FOR UPDATE USING (true);
CREATE POLICY "السماح للجميع بحذف وكيل" ON agents FOR DELETE USING (true);

CREATE POLICY "السماح للجميع بإضافة بانر" ON banners FOR INSERT WITH CHECK (true);
CREATE POLICY "السماح للجميع بتعديل بانر" ON banners FOR UPDATE USING (true);
CREATE POLICY "السماح للجميع بحذف بانر" ON banners FOR DELETE USING (true);

CREATE POLICY "السماح للجميع بإرسال رسالة" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "السماح للجميع بقراءة الرسائل" ON messages FOR SELECT USING (true);
CREATE POLICY "السماح للجميع بتعديل الرسائل" ON messages FOR UPDATE USING (true);
CREATE POLICY "السماح للجميع بحذف الرسائل" ON messages FOR DELETE USING (true);

CREATE POLICY "السماح للجميع بحفظ الإعدادات" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "السماح للجميع بتحديث الإعدادات" ON settings FOR UPDATE USING (true);

-- ============================================================
-- إدخال بيانات افتراضية (المنتجات والوكلاء)
-- ============================================================

INSERT INTO products (name, category, subcategory, description, price, unit, image, specifications, is_available) VALUES
('أنابيب رويال UPVC ضغط 16 بار - قطر 4 إنش', 'plumbing', 'مواسير UPVC', 'أنابيب يو بي في سي مصنوعة طبقاً للمواصفات القياسية الألمانية والأمريكية', 18.50, 'حبة / 5.8 متر', '/images/pvc-pipes-hero.jpg', '["القطر: 4 إنش","السماكة: 4.2 ملم","الضغط: 16 بار"]'::jsonb, true),
('أنابيب رويال UPVC ضغط 10 بار - قطر 3 إنش', 'plumbing', 'مواسير UPVC', 'مواسير يو بي في سي عالية الجودة', 13.00, 'حبة / 5.8 متر', '/images/pvc-pipes-hero.jpg', '["القطر: 3 إنش","الضغط: 10 بار"]'::jsonb, true),
('وصلات وكوع رويال UPVC', 'plumbing', 'وصلات ومحابس', 'تشكيلة كاملة من الوصلات', 2.50, 'حبة', '/images/pvc-fittings.jpg', '["مقاسات: 1/2 - 8 إنش"]'::jsonb, true),
('خزان مياه بلاستيكي 1000 لتر', 'plumbing', 'خزانات مياه', 'بولي إيثيلين 3 طبقات', 180.00, 'خزان', '/images/water-tank.jpg', '["1000 لتر"]'::jsonb, true),
('أنابيب حماية كيبلات 20 ملم', 'electricity', 'أنابيب حماية الكيبلات', 'لحماية كيبلات الكهرباء', 1.80, 'حبة / 3 متر', '/images/electrical-conduit.jpg', '["20 ملم","مقاوم للحريق"]'::jsonb, true),
('كابلات نحاسية NYY 3×2.5', 'electricity', 'أسلاك وكابلات', 'نحاس 99.9%', 2.20, 'متر', '/images/electrical-conduit.jpg', '["3×2.5 ملم"]'::jsonb, true),
('حديد تسليح 12 ملم', 'building', 'حديد تسليح', 'تركي درجة أولى', 850.00, 'طن', '/images/construction-site.jpg', '["12 ملم","Grade 60"]'::jsonb, true),
('أسمنت بورتلاندي 50 كجم', 'building', 'أسمنت', 'مقاوم للملوحة', 7.50, 'كيس', '/images/factory-production.jpg', '["50 كجم"]'::jsonb, true),
('خراطيم ري بالتنقيط 16 ملم', 'agriculture', 'خراطيم الري بالتنقيط', 'لفة 100 متر', 45.00, 'لفة', '/images/drip-irrigation-field.jpg', '["16 ملم","نقاطات كل 30 سم"]'::jsonb, true),
('أنابيب PE زراعية 20 ملم', 'agriculture', 'أنابيب البولي إيثيلين الزراعية', 'HDPE أسود', 0.85, 'متر', '/images/agriculture-irrigation.jpg', '["20 ملم","PN10"]'::jsonb, true),
('رشاشات زراعية 360°', 'agriculture', 'رشاشات الري', 'دوارة', 4.50, 'حبة', '/images/drip-irrigation-field.jpg', '["360°","مدى 12م"]'::jsonb, true);

INSERT INTO agents (name, governorate, phone, address, logo_url, is_authorized) VALUES
('شركة النخبة للتجارة', 'صنعاء', '777123456', 'صنعاء - شارع الستين', '/images/royal-logo.png', true),
('مؤسسة تهامة للري', 'الحديدة', '711223344', 'الحديدة - شارع صنعاء', '/images/royal-logo.png', true),
('المركز الملكي', 'عدن', '02244556', 'عدن - المنصورة', '/images/royal-logo.png', true),
('مكتب تعز المعتمد', 'تعز', '734556677', 'تعز - شارع جمال', '/images/royal-logo.png', true);

INSERT INTO banners (title, subtitle, image_url, link_url, expiry_date) VALUES
('مصنع رويال للأنابيب', 'منتجات UPVC طبقاً للمواصفات الألمانية - منذ 1982', '/images/pvc-pipes-hero.jpg', 'plumbing', '2026-12-31'),
('حلول الري الزراعي', 'وفر مياهك حتى 70%', '/images/drip-irrigation-field.jpg', 'agriculture', '2026-12-31');

INSERT INTO settings (key_name, value_text) VALUES
('logoText', 'مصنع رويال للأنابيب'),
('tagline', 'رويال... الجودة بكل المقاييس'),
('salesManager', 'رمزي القحطاني'),
('phoneSales', '782002220'),
('phoneAccounts', '782002220'),
('phoneInquiry', '782002229'),
('phoneDelivery', '782002220'),
('whatsapp', '967782002220'),
('email', 'info@royal-pipes.com'),
('address', 'الجمهورية اليمنية - صنعاء')
ON CONFLICT (key_name) DO NOTHING;

-- ============================================================
-- ✓ انتهت الإعدادات! اضغط زر RUN في الأعلى
-- ============================================================`;
