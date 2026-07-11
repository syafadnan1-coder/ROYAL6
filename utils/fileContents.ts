/**
 * محتويات ملفات الباك إند لتحميلها من لوحة التحكم
 * Backend File Contents for Download from Admin Panel
 */

export const FILE_CONFIG_PHP = `<?php
/**
 * ============================================================
 * ملف إعداد الاتصال بقاعدة البيانات
 * Royal Pipes Factory - Database Configuration
 * ============================================================
 * 
 * ⚠️ هام جداً: عدّل القيم التالية بمعلومات الاستضافة الخاصة بك
 *    قبل رفع الملفات إلى الخادم.
 */

// إعدادات قاعدة البيانات - عدّلها حسب استضافتك
c

// إعدادات JWT للجلسات (غيّر هذا السر لقيمة عشوائية طويلة!)
define('JWT_SECRET', 'royal-pipes-2026-secret-change-this-please-X9k2pL5mNqR8wB3vY7fT');

// إعدادات رفع الصور
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_URL', 'https://royalpvsplas.com/uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024);

if (!is_dir(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0755, true);
}

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://royalpvsplas.com',
    'https://www.royalpvsplas.com/'
    'https://tangerine-florentine-e88554.netlify.app'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins) || true) {
    header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'فشل الاتصال بقاعدة البيانات. تحقق من إعدادات config.php',
        'error'   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

function clean_input($data) {
    if (is_array($data)) return array_map('clean_input', $data);
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

function generate_token($user_id, $username) {
    $payload = [
        'user_id'  => $user_id,
        'username' => $username,
        'iat'      => time(),
        'exp'      => time() + (7 * 24 * 60 * 60)
    ];
    $payload_b64 = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $payload_b64, JWT_SECRET);
    return $payload_b64 . '.' . $signature;
}

function verify_token($token) {
    if (!$token || strpos($token, '.') === false) return false;
    list($payload_b64, $signature) = explode('.', $token, 2);
    $expected = hash_hmac('sha256', $payload_b64, JWT_SECRET);
    if (!hash_equals($expected, $signature)) return false;
    $payload = json_decode(base64_decode($payload_b64), true);
    if (!$payload || $payload['exp'] < time()) return false;
    return $payload;
}

function check_admin() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $token = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = str_replace('Bearer ', '', $token);
    return verify_token($token);
}

function send_response($status, $data = null, $message = '') {
    echo json_encode([
        'status'  => $status,
        'message' => $message,
        'data'    => $data
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

function send_error($message, $code = 400) {
    http_response_code($code);
    send_response('error', null, $message);
}
?>`;

export const FILE_HTACCESS = `# ============================================================
# إعدادات Apache لمصنع رويال للأنابيب
# Royal Pipes - Apache Configuration
# ============================================================

RewriteEngine On

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header always set Access-Control-Allow-Credentials "true"
</IfModule>

RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=204,L]

<FilesMatch "(config\\.php|\\.htaccess|\\.sql)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

<Files "api.php">
    Order Allow,Deny
    Allow from all
</Files>

<Files "upload.php">
    Order Allow,Deny
    Allow from all
</Files>

<Directory "uploads">
    <FilesMatch "\\.php$">
        Order Allow,Deny
        Deny from all
    </FilesMatch>
</Directory>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE text/css text/html text/plain
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
</IfModule>

AddDefaultCharset UTF-8`;

export const FILE_UPLOAD_PHP = `<?php
/**
 * ملف رفع الصور لمنتجات رويال
 * Royal Pipes - Image Upload Handler
 */

require_once 'config.php';

if (!check_admin()) {
    send_error('غير مصرح - يرجى تسجيل الدخول كمدير', 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('طريقة الطلب غير مدعومة', 405);
}

if (empty($_FILES['file'])) {
    send_error('لم يتم اختيار ملف للرفع');
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    send_error('خطأ في رفع الملف: ' . $file['error']);
}

if ($file['size'] > MAX_FILE_SIZE) {
    send_error('حجم الملف كبير جداً (الحد الأقصى 5 ميجا)');
}

$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!in_array($mime, $allowedTypes)) {
    send_error('نوع الملف غير مدعوم');
}

$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$newName = 'royal_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
$destination = UPLOAD_DIR . $newName;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    send_error('فشل حفظ الملف على الخادم');
}

$url = UPLOAD_URL . $newName;
send_response('success', ['url' => $url, 'name' => $newName], 'تم رفع الصورة بنجاح');
?>`;

export const FILE_README_MD = `# 🚀 موقع مصنع رويال للأنابيب - دليل التثبيت

## معلومات سريعة:
- **اسم المصنع:** مصنع رويال للأنابيب (الأنور للبلاستيك)
- **منذ:** 1982
- **مسؤول المبيعات:** رمزي القحطاني
- **الأقسام:** السباكة، الكهرباء، البناء، الزراعة البلاستيكية

## أرقام التواصل:
- 📞 المبيعات: 782002220
- 🧮 الحسابات: 782002225
- ❓ الاستفسار: 782002229
- 🚚 التوصيل: 784414445

## محتويات الحزمة:
\`\`\`
royal-website/
├── api/                    ← ارفع لـ public_html/api/
│   ├── config.php          ← عدّل بيانات قاعدة البيانات
│   ├── api.php             ← REST API كامل
│   ├── upload.php          ← رفع الصور
│   ├── .htaccess           ← إعدادات Apache
│   └── uploads/            ← مجلد الصور (صلاحيات 755)
├── db.sql                  ← استورده في phpMyAdmin
└── README.md               ← هذا الملف
\`\`\`

## خطوات التثبيت السريع:

### 1. اشترِ استضافة (موصى به: Hostinger)
🔗 https://www.hostinger.com/web-hosting

### 2. أنشئ قاعدة بيانات MySQL
- اسم القاعدة: royal_db
- اسم المستخدم: royal_user
- كلمة مرور قوية

### 3. استورد db.sql
- phpMyAdmin ← Import ← اختر db.sql

### 4. عدّل config.php
\`\`\`php
define('DB_HOST', 'localhost');
define('DB_USER', 'u123_royal_user');
define('DB_PASS', 'YourPassword');
define('DB_NAME', 'u123_royal_db');
\`\`\`

### 5. ارفع المجلد api/ إلى public_html/api/
- عبر File Manager أو FTP

### 6. ارفع الواجهة (index.html) إلى public_html/

### 7. فعّل SSL مجاناً من hPanel

### 8. ادخل بـ admin/admin123 وغيّر كلمة المرور!

---

## بيانات الدخول الافتراضية:
- اسم المستخدم: **admin**
- كلمة المرور: **admin123**

⚠️ **غيّرها فوراً بعد أول دخول!**

---

## للدعم الفني:
📞 رمزي القحطاني: 782002229
💬 واتساب: 967782002229

© 2026 مصنع الأنور للبلاستيك (Royal) - منذ 1982`;
