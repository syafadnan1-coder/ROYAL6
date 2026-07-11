/**
 * ============================================================
 * Royal Pipes API Client
 * عميل API للتواصل مع الباك إند الحقيقي على السحابة
 * ============================================================
 * 
 * كيفية الاستخدام بعد رفع الباك إند:
 * 1. عدّل API_BASE بعنوان الـ API الحقيقي
 * 2. غيّر USE_CLOUD_API إلى true
 * 3. استخدم دوال api.* في App.tsx بدلاً من localStorage
 */

// ⚙️ التحكم بمصدر البيانات
export const USE_CLOUD_API = true; // غيّر إلى true بعد رفع الباك إند للسحابة

// 🌐 عنوان الـ API على الاستضافة
export const API_BASE = "https://royalpvsplas.com/api/api.php";
export const UPLOAD_URL = "https://royalpvsplas.com/api/upload.php";

const getToken = () => sessionStorage.getItem("royal_admin_token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`
});

// مساعد طلبات
async function request(action: string, options: RequestInit = {}) {
  const url = `${API_BASE}?action=${action}`;
  const res = await fetch(url, options);
  return res.json();
}

export const api = {
  // 🔐 المصادقة
  login: (username: string, password: string) =>
    request("login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    }),

  verifyToken: () =>
    request("verify", { headers: authHeaders() }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request("change_password", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ oldPassword, newPassword })
    }),

  // 📦 المنتجات
  getProducts: (category?: string) =>
    request(`get_products${category ? `&category=${category}` : ""}`),

  addProduct: (product: any) =>
    request("add_product", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(product)
    }),

  updateProduct: (product: any) =>
    request("update_product", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(product)
    }),

  deleteProduct: (id: number | string) =>
    request(`delete_product&id=${id}`, {
      method: "DELETE",
      headers: authHeaders()
    }),

  // 👥 الوكلاء
  getAgents: (governorate?: string) =>
    request(`get_agents${governorate ? `&governorate=${governorate}` : ""}`),

  addAgent: (agent: any) =>
    request("add_agent", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(agent)
    }),

  updateAgent: (agent: any) =>
    request("update_agent", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(agent)
    }),

  deleteAgent: (id: number | string) =>
    request(`delete_agent&id=${id}`, {
      method: "DELETE",
      headers: authHeaders()
    }),

  // 🖼️ البانرات
  getBanners: () => request("get_banners"),
  
  addBanner: (banner: any) =>
    request("add_banner", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(banner)
    }),

  updateBanner: (banner: any) =>
    request("update_banner", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(banner)
    }),

  deleteBanner: (id: number | string) =>
    request(`delete_banner&id=${id}`, {
      method: "DELETE",
      headers: authHeaders()
    }),

  // 💬 الرسائل
  submitMessage: (message: any) =>
    request("submit_message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    }),

  getMessages: () => request("get_messages", { headers: authHeaders() }),

  markMessageRead: (id: number | string) =>
    request("mark_message_read", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id })
    }),

  deleteMessage: (id: number | string) =>
    request(`delete_message&id=${id}`, {
      method: "DELETE",
      headers: authHeaders()
    }),

  // ⚙️ الإعدادات
  getSettings: () => request("get_settings"),

  updateSettings: (settings: any) =>
    request("update_settings", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ settings })
    }),

  // 📊 الإحصائيات
  getStats: () => request("get_stats", { headers: authHeaders() }),

  // 🖼️ رفع الصور
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData
    });
    return res.json();
  }
};

export default api;
