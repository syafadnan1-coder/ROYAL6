/**
 * ============================================================
 * مساعد تحميل ملفات الموقع كـ ZIP
 * Royal Pipes - Download Helper for Backend Files
 * ============================================================
 */

import JSZip from "jszip";
import { saveAs } from "file-saver";

// استيراد محتوى ملفات الباك إند الفعلية
import apiPhpContent from "../../php-backend/api.php?raw";
import configPhpContent from "../../php-backend/config.php?raw";
import uploadPhpContent from "../../php-backend/upload.php?raw";
import dbSqlContent from "../../php-backend/db.sql?raw";
import htaccessContent from "../../php-backend/.htaccess?raw";
import readmeMdContent from "../../php-backend/README.md?raw";
import apiClientContent from "./api.ts?raw";

/**
 * تحميل ملف نصي مفرد
 */
export function downloadFile(filename: string, content: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  saveAs(blob, filename);
}

/**
 * تحميل كل ملفات الباك إند كـ ZIP واحد
 */
export async function downloadBackendZip() {
  const zip = new JSZip();

  // مجلد api/ يحتوي على كل ملفات الباك إند
  const apiFolder = zip.folder("royal-website/api");
  if (apiFolder) {
    apiFolder.file("config.php", configPhpContent);
    apiFolder.file("api.php", apiPhpContent);
    apiFolder.file("upload.php", uploadPhpContent);
    apiFolder.file(".htaccess", htaccessContent);
    
    // مجلد uploads فارغ مع ملف .gitkeep
    const uploadsFolder = apiFolder.folder("uploads");
    if (uploadsFolder) {
      uploadsFolder.file(".gitkeep", "");
      uploadsFolder.file("README.txt", "هذا المجلد لحفظ صور المنتجات المرفوعة من لوحة التحكم\nThis folder stores uploaded product images.\n\nصلاحيات هذا المجلد يجب أن تكون 755 أو 777");
    }
  }

  // ملف db.sql في الجذر
  const rootFolder = zip.folder("royal-website");
  if (rootFolder) {
    rootFolder.file("db.sql", dbSqlContent);
    rootFolder.file("README.md", readmeMdContent);

    // ملف تعليمات سريعة بالعربي
    rootFolder.file("ابدأ_من_هنا.txt", `
🚀 ابدأ من هنا - دليل النشر السريع لمصنع رويال للأنابيب
===========================================================

خطوات النشر (10 خطوات سهلة):

1️⃣  اشترك في استضافة Hostinger:
    https://www.hostinger.com/web-hosting
    اختر Premium Plan + نطاق مجاني

2️⃣  ادخل hPanel → Databases → MySQL Databases
    أنشئ قاعدة باسم: royal_db
    أنشئ مستخدم + كلمة مرور قوية

3️⃣  افتح phpMyAdmin → اختر royal_db → Import
    ارفع ملف: db.sql
    ✓ ستظهر 6 جداول + 24 منتج + 8 وكلاء جاهزة

4️⃣  افتح ملف: api/config.php
    عدّل الأسطر التالية:
    
    define('DB_HOST', 'localhost');
    define('DB_USER', 'u123_royal_user');  ← اسم المستخدم من الخطوة 2
    define('DB_PASS', 'كلمة_المرور');       ← كلمة المرور
    define('DB_NAME', 'u123_royal_db');     ← اسم القاعدة الكامل

5️⃣  ارفع مجلد api/ كاملاً إلى:
    public_html/api/
    عبر File Manager أو FTP

6️⃣  اختبر API بفتح هذا الرابط في المتصفح:
    https://yourdomain.com/api/api.php?action=get_products
    
    إذا ظهرت بيانات JSON = الـ API يعمل ✓

7️⃣  ارفع ملف index.html (الموقع) إلى:
    public_html/

8️⃣  فعّل SSL/HTTPS:
    hPanel → Security → SSL → Install (مجاني)

9️⃣  ادخل موقعك واضغط "لوحة التحكم"
    سجّل بـ:
    اسم المستخدم: admin
    كلمة المرور: admin123

🔟  ⚠️ غيّر كلمة مرور المدير فوراً!
    من قسم "إعدادات الموقع"

============================================================
معلومات الاتصال للمصنع:
============================================================
👤 مسؤول المبيعات: رمزي القحطاني
📞 المبيعات:       782002220
🧮 الحسابات:      782002225
❓ الاستفسار:     782002229
🚚 التوصيل:       784414445
💬 واتساب:        967782002229
============================================================

🎉 موقعك الآن جاهز ومتاح لكل عملائك في اليمن والعالم!
عند إضافة أي منتج → يُحفظ في القاعدة → يظهر فوراً للعملاء

© 2026 مصنع الأنور للبلاستيك (Royal) - الجودة بكل المقاييس
`);
  }

  // إنشاء وتحميل الـ ZIP
  const blob = await zip.generateAsync({ 
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  saveAs(blob, "royal-website-backend.zip");
}

/**
 * تحميل ملف src/utils/api.ts (للواجهة)
 */
export function downloadApiClient() {
  downloadFile("api.ts", apiClientContent, "text/typescript");
}

/**
 * تحميل الموقع المبني جاهز للنشر على Netlify
 * هذا يحمّل الـ index.html الحالي + netlify.toml + تعليمات
 */
export async function downloadNetlifyReady() {
  const zip = new JSZip();

  // الحصول على الـ HTML الحالي للموقع (الذي يعمل الآن)
  const currentHtml = document.documentElement.outerHTML;
  
  // إصلاح المسارات النسبية إذا كانت موجودة
  const finalHtml = `<!DOCTYPE html>\n${currentHtml}`;

  const folder = zip.folder("royal-website-ready");
  if (!folder) return;

  // الملف الرئيسي
  folder.file("index.html", finalHtml);

  // ملف netlify.toml لمنع البناء التلقائي
  folder.file("netlify.toml", `# إعدادات Netlify - الموقع مبني مسبقاً
[build]
  publish = "."
  command = "echo 'Pre-built site - no build needed'"

# إعادة توجيه كل الروابط للموقع
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# منع البناء التلقائي
[build.environment]
  NETLIFY_USE_YARN = "false"
`);

  // ملف _redirects بديل (إذا فشل toml)
  folder.file("_redirects", "/*  /index.html  200\n");

  // ملف README بالعربي
  folder.file("ابدأ_من_هنا.txt", `
🚀 موقع مصنع رويال للأنابيب - جاهز للنشر على Netlify
==========================================================

✅ الموقع جاهز 100% - فقط ارفعه!

طريقة الرفع (دقيقة واحدة فقط):
==============================

1. ادخل: https://app.netlify.com/drop

2. اسحب هذا المجلد (royal-website-ready) كاملاً 
   وأفلته في الصندوق الكبير

3. انتظر 30 ثانية...

4. ✅ تم! ستحصل على رابط موقعك مثل:
   https://royal-pipes-xxx.netlify.app

==========================================================
⚠️ مهم جداً:
==========================================================

❌ لا ترفع مجلد المشروع كاملاً (سيفشل البناء)
✅ ارفع فقط مجلد "royal-website-ready" هذا (جاهز 100%)

==========================================================
بعد النشر:
==========================================================

1. افتح رابط موقعك من Netlify
2. ادخل لوحة التحكم: admin / admin123
3. اذهب لتبويب "⚡ ربط السحابة"
4. الصق بيانات Supabase
5. ✅ الآن أي منتج تضيفه سيظهر لكل العملاء!

==========================================================
للدعم الفني:
==========================================================

👤 رويال للانابيب
📞 المبيعات: 782002220
💬 واتساب: 967782002220

© 2026 مصنع الأنور للبلاستيك (Royal)
`);

  // ملف robots.txt للسماح بالـ SEO
  folder.file("robots.txt", `User-agent: *
Allow: /

Sitemap: /sitemap.xml
`);

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  saveAs(blob, "royal-website-netlify-ready.zip");
}

// تصدير محتويات الملفات للعرض
export const FILES = {
  "config.php": { content: configPhpContent, lang: "php", icon: "⚙️" },
  "api.php": { content: apiPhpContent, lang: "php", icon: "🔌" },
  "upload.php": { content: uploadPhpContent, lang: "php", icon: "🖼️" },
  "db.sql": { content: dbSqlContent, lang: "sql", icon: "🗄️" },
  ".htaccess": { content: htaccessContent, lang: "apache", icon: "🛡️" },
  "README.md": { content: readmeMdContent, lang: "markdown", icon: "📖" },
  "api.ts (للواجهة)": { content: apiClientContent, lang: "typescript", icon: "📦" }
};
