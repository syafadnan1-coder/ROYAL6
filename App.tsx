import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Settings,
  MessageSquare,
  Users,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle,
  Award,
  Lock,
  Unlock,
  Sliders,
  X,
  Menu,
  Send,
  Grid,
  AlertTriangle,
  Compass,
  HelpCircle,
  Activity,
  Truck,
  Calculator,
  PhoneCall,
  Sprout,
  Zap,
  Building2,
  Wrench,
  Cloud,
  Globe,
  Download,
  FileCode,
  Copy,
  Package,
  Server,
  CheckCircle2,
  FileText,
  Eye
} from "lucide-react";

import {
  INITIAL_PRODUCTS,
  INITIAL_AGENTS,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
  INITIAL_MESSAGES,
  YEMEN_GOVERNORATES,
  CATEGORY_LABELS,
  Product,
  Agent,
  Banner,
  Message,
  SiteSettings
} from "./data/initialData";

import { downloadBackendZip, downloadFile, downloadNetlifyReady, FILES } from "./utils/downloadHelper";

import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseEnabled,
  initSupabase,
  testSupabaseConnection,
  sbGetProducts,
  sbAddProduct,
  sbUpdateProduct,
  sbDeleteProduct,
  sbGetAgents,
  sbAddAgent,
  sbUpdateAgent,
  sbDeleteAgent,
  sbGetBanners,
  sbAddBanner,
  sbUpdateBanner,
  sbDeleteBanner,
  sbGetMessages,
  sbAddMessage,
  sbMarkMessageRead,
  sbDeleteMessage,
  sbGetSettings,
  sbUpdateSettings,
  sbDiagnose,
  sbMigrateLocalData,
  ensureProductsBucket,
  type SupabaseConfig
} from "./utils/supabase";
import { SUPABASE_SQL, SUPABASE_FIX_RLS, SUPABASE_FIX_RLS_ADVANCED } from "./utils/supabaseSql";
import ImageUpload from "./components/ImageUpload";

export default function App() {
  // --- State Management with LocalStorage persistence ---
  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [messages, setMessages] = useState<Message[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Search & Filter
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Agent selector
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("صنعاء");
  const [agentSearchQuery, setAgentSearchQuery] = useState<string>("");

  // Inquiry modal
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);
  const [inquiryName, setInquiryName] = useState<string>("");
  const [inquiryPhone, setInquiryPhone] = useState<string>("");
  const [inquiryEmail, setInquiryEmail] = useState<string>("");
  const [inquiryMessage, setInquiryMessage] = useState<string>("");
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);

  // Contact form
  const [contactName, setContactName] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactSubject, setContactSubject] = useState<string>("");
  const [contactText, setContactText] = useState<string>("");
  const [contactSuccess, setContactSuccess] = useState<boolean>(false);

  // Slider
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const slideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Admin sub-tab
  const [adminActiveTab, setAdminActiveTab] = useState<string>("dashboard");

  // CRUD modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState<boolean>(false);

  // Toast
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Download state
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // Supabase Cloud Integration State
  const [, setSupabaseConfig] = useState<SupabaseConfig>({ url: "", anonKey: "", enabled: false });
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");
  const [supabaseKey, setSupabaseKey] = useState<string>("");
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string; tablesExist?: boolean } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [showSqlCode, setShowSqlCode] = useState<boolean>(false);
  const [cloudActive, setCloudActive] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done">("idle");
  const [diagnoseResult, setDiagnoseResult] = useState<{ ok: boolean; tests: Array<{ name: string; ok: boolean; msg: string }> } | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);

  // --- Initialization with Supabase Cloud Sync ---
  useEffect(() => {
    const loadData = async () => {
      // أولاً: تحميل إعدادات Supabase
      const cfg = getSupabaseConfig();
      setSupabaseConfig(cfg);
      setSupabaseUrl(cfg.url);
      setSupabaseKey(cfg.anonKey);

      const cloudEnabled = initSupabase();
      setCloudActive(cloudEnabled);

      // إذا كانت السحابة مفعلة، نجلب البيانات من Supabase
      if (cloudEnabled) {
        setSyncStatus("syncing");
        try {
          // جلب المنتجات من السحابة
          const cloudProducts = await sbGetProducts();
          setProducts(cloudProducts.length > 0 ? cloudProducts : INITIAL_PRODUCTS);

          // جلب الوكلاء من السحابة
          const cloudAgents = await sbGetAgents();
          setAgents(cloudAgents.length > 0 ? cloudAgents : INITIAL_AGENTS);

          // جلب البانرات
          const cloudBanners = await sbGetBanners();
          setBanners(cloudBanners.length > 0 ? cloudBanners : INITIAL_BANNERS);

          // جلب الإعدادات
          const cloudSettings = await sbGetSettings();
          if (Object.keys(cloudSettings).length > 0) {
            setSettings({ ...INITIAL_SETTINGS, ...cloudSettings } as SiteSettings);
          } else {
            setSettings(INITIAL_SETTINGS);
          }

          // الرسائل
          try {
            const cloudMessages = await sbGetMessages();
            setMessages(cloudMessages);
          } catch (e) {
            console.warn("Could not fetch messages:", e);
            setMessages([]);
          }

          setSyncStatus("done");
          setTimeout(() => setSyncStatus("idle"), 2000);
        } catch (e: any) {
          console.error("فشل جلب البيانات من السحابة:", e);
          showAlert("⚠️ فشل الاتصال بالسحابة، يتم استخدام البيانات المحلية", "error");
          loadLocalData();
        }
      } else {
        loadLocalData();
      }
    };

    const loadLocalData = () => {
      const storedProducts = localStorage.getItem("royal_products");
      setProducts(storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS);
      if (!storedProducts) localStorage.setItem("royal_products", JSON.stringify(INITIAL_PRODUCTS));

      const storedAgents = localStorage.getItem("royal_agents");
      setAgents(storedAgents ? JSON.parse(storedAgents) : INITIAL_AGENTS);
      if (!storedAgents) localStorage.setItem("royal_agents", JSON.stringify(INITIAL_AGENTS));

      const storedBanners = localStorage.getItem("royal_banners");
      setBanners(storedBanners ? JSON.parse(storedBanners) : INITIAL_BANNERS);
      if (!storedBanners) localStorage.setItem("royal_banners", JSON.stringify(INITIAL_BANNERS));

      const storedSettings = localStorage.getItem("royal_settings_v2");
      setSettings(storedSettings ? JSON.parse(storedSettings) : INITIAL_SETTINGS);
      if (!storedSettings) localStorage.setItem("royal_settings_v2", JSON.stringify(INITIAL_SETTINGS));

      const storedMessages = localStorage.getItem("royal_messages");
      setMessages(storedMessages ? JSON.parse(storedMessages) : INITIAL_MESSAGES);
      if (!storedMessages) localStorage.setItem("royal_messages", JSON.stringify(INITIAL_MESSAGES));
    };

    loadData();

    const loggedIn = sessionStorage.getItem("royal_admin_logged");
    if (loggedIn === "true") {
      setIsAdminLoggedIn(true);
      setAdminUsername(sessionStorage.getItem("royal_admin_user") || "admin");
    }
  }, []);

  // Toast helper
  const showAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Auto slider
  useEffect(() => {
    if (banners.length > 0) {
      slideIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 6000);
    }
    return () => {
      if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    };
  }, [banners]);

  const handleNextSlide = () => {
    if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const handlePrevSlide = () => {
    if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const getSubcategories = (category: string) => {
    const subcats = new Set<string>();
    products
      .filter((p) => p.category === category || category === "all")
      .forEach((p) => subcats.add(p.subcategory));
    return Array.from(subcats);
  };

  const allSubcategories = getSubcategories(selectedMainCategory);

  const getGovernorateAgentCount = (gov: string) =>
    agents.filter((a) => a.governorate === gov && a.isAuthorized).length;

  // ---- CRUD: Products - مع تكامل Supabase الحقيقي ----
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const subcategory = formData.get("subcategory") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const unit = formData.get("unit") as string;
    const image = formData.get("image") as string;
    const isAvailable = formData.get("isAvailable") === "true";
    const specsText = formData.get("specifications") as string;
    const specifications = specsText ? specsText.split("\n").map((s) => s.trim()).filter(Boolean) : [];

    const useCloud = isSupabaseEnabled();
    let updatedProducts: Product[];

    try {
      if (id) {
        // تعديل منتج موجود
        const productData: Product = { id, name, category, subcategory, description, price, unit, image, specifications, isAvailable };
        let finalProduct: Product = productData;
        if (useCloud) {
          // sbUpdateProduct قد ترجع منتج جديد إذا كان ID محلي
          const result = await sbUpdateProduct(productData);
          finalProduct = { ...productData, ...result, specifications: result.specifications || specifications };
        }
        updatedProducts = products.map((p) => (p.id === id ? finalProduct : p));
        showAlert(useCloud
          ? "☁️✓ تم تحديث المنتج في السحابة - ينتشر فوراً لكل العملاء في اليمن والعالم!"
          : "✓ تم تعديل المنتج (محلياً فقط - فعّل السحابة للنشر)");
      } else {
        // إضافة منتج جديد
        const newProductData = { name, category, subcategory, description, price, unit, image, specifications, isAvailable };
        let newProduct: Product;
        if (useCloud) {
          newProduct = await sbAddProduct(newProductData);
        } else {
          newProduct = { ...newProductData, id: "p_" + Date.now() };
        }
        updatedProducts = [newProduct, ...products];
        showAlert(useCloud
          ? "☁️✓ تم نشر المنتج للسحابة! العملاء في كل اليمن يرونه الآن 🎉"
          : "✓ تم الإضافة محلياً (فعّل السحابة لنشره للعملاء)");
      }

      setProducts(updatedProducts);
      localStorage.setItem("royal_products", JSON.stringify(updatedProducts));
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (e: any) {
      showAlert("فشل الحفظ في السحابة: " + (e.message || "خطأ"), "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المنتج؟")) return;
    const useCloud = isSupabaseEnabled();
    try {
      if (useCloud) await sbDeleteProduct(id);
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      localStorage.setItem("royal_products", JSON.stringify(updated));
      showAlert(useCloud ? "☁️✓ تم الحذف من السحابة" : "✓ تم الحذف محلياً");
    } catch (e: any) {
      showAlert("فشل الحذف: " + (e.message || ""), "error");
    }
  };

  // ---- CRUD: Agents مع Supabase ----
  const handleSaveAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const governorate = formData.get("governorate") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const logoUrl = formData.get("logoUrl") as string || "./images/logo.jpeg";
    const isAuthorized = formData.get("isAuthorized") === "true";

    const useCloud = isSupabaseEnabled();
    let updatedAgents: Agent[];

    try {
      if (id) {
        const agentData: Agent = { id, name, governorate, phone, address, logoUrl, isAuthorized };
        let finalAgent: Agent = agentData;
        if (useCloud) {
          const result = await sbUpdateAgent(agentData);
          finalAgent = { ...agentData, ...result };
        }
        updatedAgents = agents.map((a) => (a.id === id ? finalAgent : a));
        showAlert(useCloud ? "☁️✓ تم تحديث الوكيل في السحابة" : "✓ تم التحديث محلياً");
      } else {
        const agentData = { name, governorate, phone, address, logoUrl, isAuthorized };
        let newAgent: Agent;
        if (useCloud) {
          newAgent = await sbAddAgent(agentData);
        } else {
          newAgent = { ...agentData, id: "ag_" + Date.now() };
        }
        updatedAgents = [newAgent, ...agents];
        showAlert(useCloud ? "☁️✓ تم نشر الوكيل للسحابة" : "✓ تم الإضافة محلياً");
      }

      setAgents(updatedAgents);
      localStorage.setItem("royal_agents", JSON.stringify(updatedAgents));
      setIsAgentModalOpen(false);
      setEditingAgent(null);
    } catch (e: any) {
      showAlert("فشل الحفظ: " + (e.message || ""), "error");
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الوكيل؟")) return;
    const useCloud = isSupabaseEnabled();
    try {
      if (useCloud) await sbDeleteAgent(id);
      const updated = agents.filter((a) => a.id !== id);
      setAgents(updated);
      localStorage.setItem("royal_agents", JSON.stringify(updated));
      showAlert(useCloud ? "☁️✓ حُذف من السحابة" : "✓ حُذف محلياً");
    } catch (e: any) {
      showAlert("فشل الحذف: " + (e.message || ""), "error");
    }
  };

  // ---- CRUD: Banners مع Supabase ----
  const handleSaveBanner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const link = formData.get("link") as string;
    const expiryDate = formData.get("expiryDate") as string;

    const useCloud = isSupabaseEnabled();
    let updatedBanners: Banner[];

    try {
      if (id) {
        const bannerData: Banner = { id, title, subtitle, imageUrl, link, expiryDate };
        let finalBanner: Banner = bannerData;
        if (useCloud) {
          const result = await sbUpdateBanner(bannerData);
          finalBanner = { ...bannerData, ...result };
        }
        updatedBanners = banners.map((b) => (b.id === id ? finalBanner : b));
        showAlert(useCloud ? "☁️✓ تم تحديث البانر في السحابة" : "✓ تم التحديث محلياً");
      } else {
        const bannerData = { title, subtitle, imageUrl, link, expiryDate };
        let newBanner: Banner;
        if (useCloud) {
          newBanner = await sbAddBanner(bannerData);
        } else {
          newBanner = { ...bannerData, id: "b_" + Date.now() };
        }
        updatedBanners = [...banners, newBanner];
        showAlert(useCloud ? "☁️✓ تم نشر البانر للسحابة" : "✓ تم الإضافة محلياً");
      }

      setBanners(updatedBanners);
      localStorage.setItem("royal_banners", JSON.stringify(updatedBanners));
      setIsBannerModalOpen(false);
      setEditingBanner(null);
    } catch (e: any) {
      showAlert("فشل الحفظ: " + (e.message || ""), "error");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا البانر؟")) return;
    const useCloud = isSupabaseEnabled();
    try {
      if (useCloud) await sbDeleteBanner(id);
      const updated = banners.filter((b) => b.id !== id);
      setBanners(updated);
      localStorage.setItem("royal_banners", JSON.stringify(updated));
      showAlert(useCloud ? "☁️✓ حُذف من السحابة" : "✓ حُذف محلياً");
    } catch (e: any) {
      showAlert("فشل الحذف: " + (e.message || ""), "error");
    }
  };

  // ---- Messages مع Supabase ----
  const handleMarkMessageRead = async (id: string) => {
    const useCloud = isSupabaseEnabled();
    try {
      if (useCloud) await sbMarkMessageRead(id);
      const updated = messages.map((m) => (m.id === id ? { ...m, isRead: true } : m));
      setMessages(updated);
      localStorage.setItem("royal_messages", JSON.stringify(updated));
      showAlert("✓ تم تمييز الرسالة كمقروءة");
    } catch (e: any) {
      showAlert("فشل: " + (e.message || ""), "error");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه الرسالة؟")) return;
    const useCloud = isSupabaseEnabled();
    try {
      if (useCloud) await sbDeleteMessage(id);
      const updated = messages.filter((m) => m.id !== id);
      setMessages(updated);
      localStorage.setItem("royal_messages", JSON.stringify(updated));
      showAlert(useCloud ? "☁️✓ حُذف من السحابة" : "✓ حُذف محلياً");
    } catch (e: any) {
      showAlert("فشل: " + (e.message || ""), "error");
    }
  };

  // ---- Settings مع Supabase ----
  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedSettings: SiteSettings = {
      logoText: formData.get("logoText") as string,
      tagline: formData.get("tagline") as string,
      salesManager: formData.get("salesManager") as string,
      phoneSales: formData.get("phoneSales") as string,
      phoneAccounts: formData.get("phoneAccounts") as string,
      phoneInquiry: formData.get("phoneInquiry") as string,
      phoneDelivery: formData.get("phoneDelivery") as string,
      whatsapp: formData.get("whatsapp") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      facebook: formData.get("facebook") as string,
      twitter: formData.get("twitter") as string,
      instagram: formData.get("instagram") as string,
      primaryColor: formData.get("primaryColor") as string,
      secondaryColor: formData.get("secondaryColor") as string,
      foundedYear: formData.get("foundedYear") as string,
      aboutVision: formData.get("aboutVision") as string,
      aboutMission: formData.get("aboutMission") as string,
      aboutGoal: formData.get("aboutGoal") as string,
      aboutHistory: formData.get("aboutHistory") as string
    };

    const useCloud = isSupabaseEnabled();
    try {
      if (useCloud) await sbUpdateSettings(updatedSettings);
      setSettings(updatedSettings);
      localStorage.setItem("royal_settings_v2", JSON.stringify(updatedSettings));
      showAlert(useCloud
        ? "☁️✓ تم حفظ الإعدادات في السحابة - تطبق على كل المتصفحات!"
        : "✓ حُفظ محلياً (فعّل السحابة للنشر)");
    } catch (e: any) {
      showAlert("فشل الحفظ: " + (e.message || ""), "error");
    }
  };

  // ---- Download Backend ZIP ----
  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      await downloadBackendZip();
      showAlert("✓ تم تحميل ملفات الموقع بنجاح! افتح الملف royal-website-backend.zip");
    } catch (err) {
      showAlert("فشل التحميل: " + (err as Error).message, "error");
    } finally {
      setIsDownloading(false);
    }
  };

  // ---- Download Netlify-Ready Package ----
  const handleDownloadNetlifyReady = async () => {
    try {
      setIsDownloading(true);
      await downloadNetlifyReady();
      showAlert("✓ تم تحميل الموقع جاهز للنشر! اسحب المجلد على Netlify Drop");
    } catch (err) {
      showAlert("فشل التحميل: " + (err as Error).message, "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFile = (filename: string, content: string) => {
    downloadFile(filename, content);
    showAlert(`✓ تم تحميل ${filename}`);
  };

  const handleCopyFile = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      showAlert("✓ تم نسخ محتوى الملف إلى الحافظة");
    }).catch(() => {
      showAlert("فشل النسخ", "error");
    });
  };

  // ---- Supabase Cloud Integration Handlers ----
  const handleTestSupabaseConnection = async () => {
    setIsTestingConnection(true);
    setSupabaseTestResult(null);
    const result = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setSupabaseTestResult(result);
    setIsTestingConnection(false);
  };

  const handleSaveSupabaseConfig = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      showAlert("يرجى إدخال URL ومفتاح API", "error");
      return;
    }
    // اختبار الاتصال أولاً
    setIsTestingConnection(true);
    const result = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setSupabaseTestResult(result);
    setIsTestingConnection(false);

    if (!result.success) {
      showAlert("⚠️ فشل الاختبار - راجع البيانات والجداول", "error");
      return;
    }

    // حفظ الإعدادات وتفعيل السحابة
    const newConfig: SupabaseConfig = {
      url: supabaseUrl.trim(),
      anonKey: supabaseKey.trim(),
      enabled: true
    };
    saveSupabaseConfig(newConfig);
    setSupabaseConfig(newConfig);
    setCloudActive(true);

    // إعادة تحميل البيانات من السحابة
    setSyncStatus("syncing");
    try {
      const [p, a, b, s, m] = await Promise.all([
        sbGetProducts().catch(() => []),
        sbGetAgents().catch(() => []),
        sbGetBanners().catch(() => []),
        sbGetSettings().catch(() => ({})),
        sbGetMessages().catch(() => [])
      ]);
      if (p.length > 0) setProducts(p);
      if (a.length > 0) setAgents(a);
      if (b.length > 0) setBanners(b);
      if (Object.keys(s).length > 0) setSettings({ ...settings, ...s } as SiteSettings);
      setMessages(m);
      setSyncStatus("done");
      showAlert("☁️🎉 تم تفعيل السحابة بنجاح! المنتجات تنتشر الآن لكل العملاء حول العالم!");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch (e: any) {
      showAlert("تم الحفظ لكن فشل التحميل: " + e.message, "error");
    }
  };

  const handleDisableCloud = () => {
    if (!confirm("هل أنت متأكد من إيقاف السحابة؟ ستعود البيانات لتُحفظ محلياً فقط.")) return;
    const newConfig: SupabaseConfig = { url: supabaseUrl, anonKey: supabaseKey, enabled: false };
    saveSupabaseConfig(newConfig);
    setSupabaseConfig(newConfig);
    setCloudActive(false);
    showAlert("⚠️ تم إيقاف السحابة - البيانات تُحفظ محلياً فقط");
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL).then(() => {
      showAlert("✓ تم نسخ كود SQL - الصقه الآن في Supabase SQL Editor");
    });
  };

  const handleCopyFixSql = () => {
    navigator.clipboard.writeText(SUPABASE_FIX_RLS).then(() => {
      showAlert("✓ تم نسخ كود الإصلاح - الصقه في Supabase SQL Editor ثم اضغط RUN");
    });
  };

  const handleDiagnose = async () => {
    if (!cloudActive) {
      showAlert("⚠️ فعّل السحابة أولاً!", "error");
      return;
    }
    setIsDiagnosing(true);
    setDiagnoseResult(null);
    try {
      const result = await sbDiagnose();
      setDiagnoseResult(result);
      if (result.ok) {
        showAlert("🎉 ممتاز! كل شيء يعمل بشكل صحيح - يمكنك إضافة المنتجات!");
      } else {
        showAlert("⚠️ تم اكتشاف مشكلة - راجع التفاصيل أدناه", "error");
      }
    } catch (e: any) {
      setDiagnoseResult({ ok: false, tests: [{ name: "خطأ غير متوقع", ok: false, msg: e.message }] });
    } finally {
      setIsDiagnosing(false);
    }
  };

  // رفع كل البيانات المحلية للسحابة دفعة واحدة
  const handleMigrateLocal = async () => {
    if (!cloudActive) {
      showAlert("⚠️ فعّل السحابة أولاً!", "error");
      return;
    }
    if (!confirm("⚠️ هذا سيرفع كل المنتجات والوكلاء والبانرات المحلية للسحابة. متابعة؟")) return;

    setIsDiagnosing(true);
    try {
      // محاولة إنشاء bucket تلقائياً
      await ensureProductsBucket();

      const result = await sbMigrateLocalData({ products, agents, banners });

      // تحديث الـ state بالـ IDs الجديدة من Supabase
      setProducts(result.products);
      setAgents(result.agents);
      setBanners(result.banners);
      localStorage.setItem("royal_products", JSON.stringify(result.products));
      localStorage.setItem("royal_agents", JSON.stringify(result.agents));
      localStorage.setItem("royal_banners", JSON.stringify(result.banners));

      if (result.errors.length === 0) {
        showAlert(`🎉 ممتاز! تم رفع ${result.products.length} منتج + ${result.agents.length} وكيل + ${result.banners.length} بانر للسحابة!`);
      } else {
        showAlert(`✓ تم الرفع مع ${result.errors.length} أخطاء - راجع Console`, "error");
        console.error("Migration errors:", result.errors);
      }
    } catch (e: any) {
      showAlert("فشل الرفع: " + e.message, "error");
    } finally {
      setIsDiagnosing(false);
    }
  };

  // ---- Auth ---- (إصلاح تجاهل المسافات وحالة الأحرف)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // تنظيف المدخلات من المسافات والأحرف غير المرئية
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/\s+/g, "");
    const cleanPassword = passwordInput.trim().replace(/\s+/g, "");

    if (cleanUsername === "admin" && cleanPassword === "11112222") {
      setIsAdminLoggedIn(true);
      setAdminUsername("admin");
      sessionStorage.setItem("royal_admin_logged", "true");
      sessionStorage.setItem("royal_admin_user", "admin");
      setLoginError("");
      showAlert("✓ أهلاً بك! تم تسجيل الدخول بنجاح كمدير للنظام");
    } else {
      setLoginError(`بيانات الدخول غير صحيحة. تأكد من كتابة: admin / admin123 بأحرف إنجليزية صغيرة بدون مسافات.`);
    }
  };

  // ---- ميزة جديدة: تعبئة تلقائية للبيانات ----
  const handleAutoFillLogin = () => {
    setUsernameInput("admin");
    setPasswordInput("");
    setLoginError("");
    showAlert("✓ تم تعبئة البيانات تلقائياً - اضغط الآن زر الدخول");
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminUsername("");
    sessionStorage.removeItem("royal_admin_logged");
    sessionStorage.removeItem("royal_admin_user");
    showAlert("تم تسجيل الخروج بنجاح");
  };

  // ---- Inquiry submit مع Supabase ----
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryProduct) return;
    const messageData = {
      name: inquiryName,
      phone: inquiryPhone,
      email: inquiryEmail || "بلا بريد",
      subject: `استفسار عن منتج: ${inquiryProduct.name}`,
      message: `طلب استفسار/سعر لمنتج: ${inquiryProduct.name} (التصنيف: ${inquiryProduct.subcategory}).\nالرسالة المخصصة: ${inquiryMessage}`
    };
    const useCloud = isSupabaseEnabled();
    try {
      let newInquiry: Message;
      if (useCloud) {
        newInquiry = await sbAddMessage(messageData);
      } else {
        newInquiry = {
          ...messageData,
          id: "m_" + Date.now(),
          createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
          isRead: false
        };
      }
      const updatedMessages = [newInquiry, ...messages];
      setMessages(updatedMessages);
      localStorage.setItem("royal_messages", JSON.stringify(updatedMessages));
      setInquirySuccess(true);
      setTimeout(() => {
        setInquirySuccess(false);
        setInquiryProduct(null);
        setInquiryName("");
        setInquiryPhone("");
        setInquiryEmail("");
        setInquiryMessage("");
      }, 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // ---- Contact submit مع Supabase ----
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageData = {
      name: contactName,
      phone: contactPhone,
      email: contactEmail,
      subject: contactSubject,
      message: contactText
    };
    const useCloud = isSupabaseEnabled();
    try {
      let newMessage: Message;
      if (useCloud) {
        newMessage = await sbAddMessage(messageData);
      } else {
        newMessage = {
          ...messageData,
          id: "m_" + Date.now(),
          createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
          isRead: false
        };
      }
      const updatedMessages = [newMessage, ...messages];
      setMessages(updatedMessages);
      localStorage.setItem("royal_messages", JSON.stringify(updatedMessages));
      setContactSuccess(true);
      setTimeout(() => {
        setContactSuccess(false);
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setContactSubject("");
        setContactText("");
      }, 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      prod.subcategory.toLowerCase().includes(productSearchQuery.toLowerCase());
    const matchesCategory = selectedMainCategory === "all" || prod.category === selectedMainCategory;
    const matchesSubcat = selectedSubcategory === "all" || prod.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcat;
  });

  // Filtered agents
  const filteredAgents = agents.filter((ag) => {
    const inGov = ag.governorate === selectedGovernorate;
    const matchesSearch =
      ag.name.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
      ag.address.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
      ag.phone.includes(agentSearchQuery);
    return inGov && matchesSearch;
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  // Category styling helper
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "plumbing":
        return { color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", chip: "bg-sky-100 text-sky-800" };
      case "electricity":
        return { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", chip: "bg-amber-100 text-amber-800" };
      case "building":
        return { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", chip: "bg-rose-100 text-rose-800" };
      case "agriculture":
        return { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", chip: "bg-emerald-100 text-emerald-800" };
      default:
        return { color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", chip: "bg-slate-100 text-slate-800" };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "plumbing":
        return <Wrench className="h-5 w-5" />;
      case "electricity":
        return <Zap className="h-5 w-5" />;
      case "building":
        return <Building2 className="h-5 w-5" />;
      case "agriculture":
        return <Sprout className="h-5 w-5" />;
      default:
        return <Grid className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Toast Alert */}
      {alertMessage && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 p-4 bg-white border-r-4 shadow-2xl rounded-lg transition-all duration-300 max-w-md"
          style={{ borderRightColor: settings.primaryColor }}
        >
          {alertMessage.type === "success" ? (
            <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
              <Check className="h-5 w-5" />
            </div>
          ) : (
            <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <p className="font-semibold text-sm text-slate-900">{alertMessage.text}</p>
        </div>
      )}

      {/* ============ TOP CONTACT BAR ============ 
      <div className="text-white text-[10px] sm:text-xs py-2 px-3 sm:px-4 border-b" style={{ backgroundColor: settings.primaryColor, borderColor: `${settings.primaryColor}` }}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-6 justify-center">
            <span className="flex items-center gap-1">
              <PhoneCall className="h-3 w-3 text-emerald-300" />
              <span className="opacity-80 hidden xs:inline">المبيعات:</span>
              <a href={`tel:${settings.phoneSales}`} className="font-bold text-white hover:text-emerald-200" dir="ltr">{settings.phoneSales}</a>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Calculator className="h-3 w-3 text-sky-300" />
              <span className="opacity-80">الحسابات:</span>
              <a href={`tel:${settings.phoneAccounts}`} className="font-bold text-white" dir="ltr">{settings.phoneAccounts}</a>
            </span>
            <span className="hidden md:flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-amber-300" />
              <span className="opacity-80">الاستفسار:</span>
              <a href={`tel:${settings.phoneInquiry}`} className="font-bold text-white" dir="ltr">{settings.phoneInquiry}</a>
            </span>
            <span className="hidden lg:flex items-center gap-1">
              <Truck className="h-3 w-3 text-rose-300" />
              <span className="opacity-80">التوصيل:</span>
              <a href={`tel:${settings.phoneDelivery}`} className="font-bold text-white" dir="ltr">{settings.phoneDelivery}</a>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/30 font-bold text-[10px]">
              ⭐ منذ {settings.foundedYear}
            </span>
            <a
              href={`https://wa.me/967782002220{settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-200 hover:text-emerald-100 transition-colors font-bold"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.487 4.966 1.488 5.4 0 9.791-4.385 9.794-9.78 0-2.614-1.018-5.071-2.868-6.924C16.63 2.083 14.172.822 11.56.822c-5.405 0-9.794 4.386-9.797 9.782-.001 1.838.5 3.618 1.448 5.174l-1.02 3.722 3.866-.964z" />
              </svg>
              <span className="hidden xs:inline">واتساب</span>
            </a>
          </div>
        </div>
      </div>

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
            <div className="relative">
              <img
                src="./images/logo.jpeg"
                alt="Royal Logo"
                className="h-14 w-14 rounded-xl object-cover shadow-md border-2 border-white"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black tracking-tight leading-tight" style={{ color: settings.primaryColor }}>
                مصنع رويال للأنابيب ومستلزمات مواد السباكة
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-wider">ROYAL - الجودة بكل المقاييس</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 relative">
            {[
              { id: "home", label: "الرئيسية" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === item.id ? "bg-slate-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                style={activeTab === item.id ? { color: settings.primaryColor } : {}}
              >
                {item.label}
              </button>
            ))}

            {/* Categories Dropdown with the three-line Menu icon */}
            <div className="relative group">
              <button
                onClick={() => {
                  setSelectedMainCategory("all");
                  setSelectedSubcategory("all");
                  setActiveTab("products");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${activeTab === "products" ? "bg-slate-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                style={activeTab === "products" ? { color: settings.primaryColor } : {}}
              >
                <Menu className="h-4 w-4" style={{ color: settings.primaryColor }} />
                <span>المنتجات والتصنيفات</span>
              </button>

              {/* Dropdown displaying the categories */}
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 hidden group-hover:block transition-all duration-200 z-50">
                {["plumbing", "electricity", "building", "agriculture"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedMainCategory(cat);
                      setSelectedSubcategory("all");
                      setActiveTab("products");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full text-right px-4 py-3 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                      {getCategoryIcon(cat)}
                    </div>
                    <span>{CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            {[
              { id: "agents", label: "نقاط البيع" },
              { id: "about", label: "عن المصنع" },
              { id: "contact", label: "شهايدنا المعتدة" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === item.id ? "bg-slate-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                style={activeTab === item.id ? { color: settings.primaryColor } : {}}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab("admin");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${activeTab === "admin"
                  ? "text-white shadow border-transparent"
                  : "text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
                }`}
              style={activeTab === "admin" ? { backgroundColor: settings.primaryColor } : {}}
            >
              <Settings className="h-4 w-4" />
              <span>لوحة التحكم</span>
              {isAdminLoggedIn && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
              {!isAdminLoggedIn && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">{unreadCount}</span>
              )}
            </button>
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/15 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>اطلب الآن</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-3">
            {!isAdminLoggedIn && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white py-3 px-4 shadow-inner space-y-1">
            {[
              { id: "home", label: "الرئيسية" },
              { id: "products", label: "المنتجات والكتالوج" },
              { id: "agents", label: "نقاط البيع بجميع المحافظات" },
              { id: "about", label: "عن المصنع" },
              { id: "contact", label: "تواصل معنا" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-right px-4 py-3 rounded-lg text-sm font-bold block ${activeTab === item.id ? "bg-slate-100" : "text-slate-600"
                  }`}
                style={activeTab === item.id ? { color: settings.primaryColor } : {}}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold ${activeTab === "admin" ? "text-white" : "text-slate-600 bg-slate-50"
                  }`}
                style={activeTab === "admin" ? { backgroundColor: settings.primaryColor } : {}}
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>لوحة التحكم</span>
                </span>
                {isAdminLoggedIn && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
              </button>
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow block"
              >
                تواصل واتساب مباشر
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ====================================== */}
      {/* HOMEPAGE                              */}
      {/* ====================================== */}
      {activeTab === "home" && (
        <main className="flex-1">
          {/* Hero Slider */}
          <section className="relative overflow-hidden text-white h-[420px] sm:h-[500px] lg:h-[600px]" style={{ backgroundColor: settings.primaryColor }}>
            {banners.length > 0 ? (
              <div className="relative h-full w-full">
                {banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      }`}
                  >
                    <div className="absolute inset-0 z-10" style={{ background: `linear-gradient(to left, ${settings.primaryColor}, ${settings.primaryColor}ee 50%, ${settings.primaryColor}66 100%)` }}></div>
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover sm:object-fill max-h-[420px] sm:max-h-[500px] lg:max-h-[600px]"
                    />
                    <div className="absolute inset-0 flex items-center z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="max-w-2xl text-right space-y-6">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 backdrop-blur-md rounded-full text-xs font-bold border border-amber-400/40 text-amber-300">
                            <Award className="h-3 w-3" />
                            ختم الجودة - منذ {settings.foundedYear}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-300 font-semibold">
                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                            ISO 9001 / 14001
                          </span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-white drop-shadow-lg">
                          {banner.title}
                        </h2>
                        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">{banner.subtitle}</p>
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <button
                            onClick={() => {
                              window.location.href = "./mantg.html";
                             }}
                            className="px-8 py-3.5 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            تصفح الكتلوج الجديد الآن
                          </button>
                          <a
                            href="/syrfar.html"
                            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl backdrop-blur-sm transition-all flex items-center gap-2"
                          >
                            <Phone className="" />
                            <span>شهايدنا المعتمدة</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-white/15 text-white hover:bg-white/30 transition-all border border-white/20 backdrop-blur-sm"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-white/15 text-white hover:bg-white/30 transition-all border border-white/20 backdrop-blur-sm"
                >
                  <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? "w-8 bg-amber-400" : "w-2.5 bg-white/40"
                        }`}
                    ></button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400 text-sm">لم يتم رفع عروض ترويجية حتى الآن.</p>
              </div>
            )}
          </section>

          {/* Categories Overview */}
          <section className="py-16 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
                <h3 className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>
                  أقسام الإنتاج الرئيسية
                </h3>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">حلول صناعية ومنتجات بلاستيكية متكاملة</h2>
                <div className="h-1.5 w-16 mx-auto rounded-full" style={{ backgroundColor: settings.primaryColor }}></div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  ينتج مصنع الأنور للبلاستيك (رويال) العديد من المقاسات والمنتجات بمختلف السماكات والأقطار لتلبي احتياجات السباكة والكهرباء ومواد البناء والري الزراعي.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Plumbing */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-sky-400 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between group">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 mb-2">أنظمة السباكة UPVC</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                      أنابيب يو بي في سي بالمواصفات الألمانية والأمريكية، خزانات مياه، وصلات وكوع.
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4">
                      <strong className="text-sky-700">{products.filter((p) => p.category === "plumbing").length}</strong> منتج
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMainCategory("plumbing");
                      setSelectedSubcategory("all");
                      setActiveTab("products");
                    }}
                    className="w-full py-2.5 bg-white hover:bg-sky-600 hover:text-white border border-sky-300 text-sky-700 text-xs font-bold rounded-lg transition-all"
                  >
                    تصفح القسم
                  </button>
                </div>

                {/* Electricity */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-amber-400 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between group">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 mb-2">الأنظمة الكهربائية</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                      أنابيب حماية الكيبلات، كابلات نحاسية، لوحات توزيع وقواطع كهربائية متينة.
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4">
                      <strong className="text-amber-700">{products.filter((p) => p.category === "electricity").length}</strong> منتج
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMainCategory("electricity");
                      setSelectedSubcategory("all");
                      setActiveTab("products");
                    }}
                    className="w-full py-2.5 bg-white hover:bg-amber-600 hover:text-white border border-amber-300 text-amber-700 text-xs font-bold rounded-lg transition-all"
                  >
                    تصفح القسم
                  </button>
                </div>

                {/* Building */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-rose-400 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between group">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 mb-2">مواد البناء</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                      حديد تسليح، أسمنت مقاوم، بلوك عازل ومواد عزل مائي بأعلى المواصفات.
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4">
                      <strong className="text-rose-700">{products.filter((p) => p.category === "building").length}</strong> منتج
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMainCategory("building");
                      setSelectedSubcategory("all");
                      setActiveTab("products");
                    }}
                    className="w-full py-2.5 bg-white hover:bg-rose-600 hover:text-white border border-rose-300 text-rose-700 text-xs font-bold rounded-lg transition-all"
                  >
                    تصفح القسم
                  </button>
                </div>

                {/* Agriculture - NEW */}
                <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group relative overflow-hidden">
                  <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    جديد
                  </span>
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sprout className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 mb-2">الزراعة البلاستيكية</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                      أنابيب وخراطيم الري بالتنقيط، رشاشات، فلاتر وأنظمة ري متكاملة للمزارع.
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4">
                      <strong className="text-emerald-700">{products.filter((p) => p.category === "agriculture").length}</strong> منتج
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMainCategory("agriculture");
                      setSelectedSubcategory("all");
                      setActiveTab("products");
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    تصفح القسم الجديد
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="py-16 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-10">
                <div className="text-right space-y-2">
                  <h3 className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>
                    أحدث المنتجات المتوفرة
                  </h3>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">منتجات رويال يو بي في سي UPVC</h2>
                  <p className="text-slate-500 text-sm max-w-xl">
                    منتجات رويال طبقاً للمواصفات القياسية العالمية - مقاومة للأحماض والقلويات والأملاح وعديمة التأثر بمعظم المحاليل الكيميائية.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedMainCategory("all");
                    setSelectedSubcategory("all");
                    setActiveTab("products");
                  }}
                  className="px-6 py-3 text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 self-start md:self-auto"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <span>عرض الكتالوج بالكامل</span>
                  <ChevronLeft className="" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((product) => {
                  const style = getCategoryStyle(product.category);
                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                    >
                      <div className="absolute top-4 right-4 z-10">
                        {product.isAvailable ? (
                          <span className="bg-emerald-500/95 text-white text-[10px] font-extrabold px-3 py-1 rounded-full backdrop-blur-sm">
                            متوفر
                          </span>
                        ) : (
                          <span className="bg-rose-500/95 text-white text-[10px] font-extrabold px-3 py-1 rounded-full backdrop-blur-sm">
                            غير متوفر
                          </span>
                        )}
                      </div>
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${style.chip}`}>
                              {CATEGORY_LABELS[product.category]}
                            </span>
                            <span className="text-slate-400 text-[10px] font-medium">•</span>
                            <span className="text-slate-500 text-[11px] font-semibold">{product.subcategory}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-sky-600 transition-colors leading-snug">
                            {product.name}
                          </h4>
                          <p className="text-slate-500 text-[12px] line-clamp-2 leading-relaxed">{product.description}</p>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">سعر تقريبي</p>
                            <p className="text-sm font-extrabold" style={{ color: settings.primaryColor }}>
                              {product.price > 0 ? `$${product.price.toFixed(2)}` : "اتصل للسعر"}
                              {product.price > 0 && (
                                <span className="text-[10px] text-slate-500 font-medium mr-1">/ {product.unit}</span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => setInquiryProduct(product)}
                            className="px-3.5 py-2 bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-600 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" />
                            <span>استفسار</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Why Royal - Features */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
                <h3 className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>
                  مميزات مواسير رويال
                </h3>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">لماذا رويال؟... الجودة بكل المقاييس</h2>
                <div className="h-1.5 w-16 mx-auto rounded-full" style={{ backgroundColor: settings.primaryColor }}></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "كفاءة عالية", desc: "كفاءة عالية في نقل السوائل نظراً لنعومة السطح الداخلي", icon: "💧" },
                  { title: "مرونة عالية", desc: "صناعة بأجود الخامات وفقاً للمواصفات الألمانية والأمريكية", icon: "🔧" },
                  { title: "عمر أطول", desc: "اختبارها عند ضغط أكثر من ضغط التشغيل لضمان عمر افتراضي طويل", icon: "⏱️" },
                  { title: "تنوع المقاسات", desc: "تنتج جميع المقاسات والأقطار من 20 ملي إلى 400 ملي", icon: "📏" },
                  { title: "مقاومة للصدأ", desc: "مقاومة الصدأ والأحماض المترسبة على السطح الداخلي والخارجي", icon: "🛡️" },
                  { title: "سهولة التركيب", desc: "اعتمادها على أدق المقاييس والأبعاد لتسهيل التركيب", icon: "⚙️" }
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-sky-300 hover:bg-white transition-all duration-300"
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h4 className="font-extrabold text-base mb-2" style={{ color: settings.primaryColor }}>{feature.title}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Usage / Applications */}
          <section className="py-12 sm:py-16 text-white" style={{ backgroundColor: settings.primaryColor }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-8 sm:mb-12">
                <h3 className="text-xs uppercase tracking-widest text-amber-300 font-extrabold">استخدامات منتجات رويال</h3>
                <h2 className="text-xl sm:text-3xl font-black text-white">تطبيقات متعددة لكافة المشاريع</h2>
                <div className="h-1 bg-amber-300 w-16 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {[
                  { name: "شبكات الصرف الصحي والمجاري", icon: "🚿" },
                  { name: "حافظات ومواسير الآبار", icon: "🏗️" },
                  { name: "شبكات الري الزراعي", icon: "🌱" },
                
                  { name: "شبكات مياه الشرب", icon: "🚰" },
                 
                  
                
                ].map((use, i) => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 sm:p-4 text-center hover:bg-white/20 hover:border-amber-300 transition-all duration-300"
                  >
                    <div className="text-2xl sm:text-3xl mb-2">{use.icon}</div>
                    <p className="text-[10px] sm:text-xs font-bold text-white leading-snug">{use.name}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 sm:p-6">
                  <p className="text-2xl sm:text-4xl font-black text-amber-300 mb-1">14+</p>
                  <p className="text-[10px] sm:text-xs text-white/80 font-bold">عاماً من الخبرة</p>
                </div>
               
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 sm:p-6">
                  <p className="text-2xl sm:text-4xl font-black text-sky-300 mb-1">{products.length}+</p>
                  <p className="text-[10px] sm:text-xs text-white/80 font-bold">منتج متنوع</p>
                </div>
               
              </div>
            </div>
          </section>

          {/* Yemen Agents Map */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>
                      نقاط البيع المعتمدة
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800">شبكة نقاط البيع تغطي كامل محافظات اليمن</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      نوصل جودة رويال إلى عتبة بيتك. تصفح قائمتنا الكاملة لنقاط البيع المعتمدة في جميع الـ 21 محافظة يمنية.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm">إحصائية سريعة للشبكة:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="bg-sky-50 p-2 rounded-lg text-sky-600">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">إجمالي نقاط البيع</p>
                          <p className="text-lg font-bold text-slate-900">{agents.length} نقطة</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="bg-sky-50 p-2 rounded-lg text-sky-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">محافظات نشطة</p>
                          <p className="text-lg font-bold text-slate-900">{new Set(agents.map((a) => a.governorate)).size} محافظة</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("agents");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full py-2.5 text-white font-bold text-xs rounded-xl shadow transition-all hover:opacity-90"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      تصفح نقاط البيع حسب محافظتك
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-slate-50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-base">مستكشف المحافظات</h3>
                      <span className="text-xs text-slate-500 font-semibold">اختر المحافظة لرؤية نقاط البيع</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-2 px-2">
                      {YEMEN_GOVERNORATES.map((gov) => {
                        const count = getGovernorateAgentCount(gov);
                        return (
                          <button
                            key={gov}
                            onClick={() => setSelectedGovernorate(gov)}
                            className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${selectedGovernorate === gov
                                ? "text-white border-transparent shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            style={selectedGovernorate === gov ? { backgroundColor: settings.primaryColor } : {}}
                          >
                            <span>{gov}</span>
                            {count > 0 && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${selectedGovernorate === gov ? "bg-amber-500 text-white" : "bg-sky-100 text-sky-800"
                                  }`}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          نقاط البيع في محافظة (<span style={{ color: settings.primaryColor }}>{selectedGovernorate}</span>)
                        </h4>
                        <span className="text-[11px] text-slate-500 font-semibold">{filteredAgents.length} نقطة بيع</span>
                      </div>
                      {filteredAgents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                          {filteredAgents.map((agent) => (
                            <div
                              key={agent.id}
                              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-sky-300 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={agent.logoUrl || "/images/royal-logo.png"}
                                  alt={agent.name}
                                  className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                                <div className="space-y-1">
                                  <h5 className="font-bold text-slate-900 text-xs leading-snug">{agent.name}</h5>
                                  <p className="text-slate-500 text-[11px] flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-sky-600 shrink-0" />
                                    <span className="line-clamp-1">{agent.address}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <a href={`tel:${agent.phone}`} className="text-slate-700 hover:text-sky-600 text-xs font-bold flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5 text-sky-600" />
                                  <span dir="ltr">{agent.phone}</span>
                                </a>
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>معتمد</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-10 px-6 text-center space-y-3">
                          <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
                          <h5 className="font-bold text-slate-800 text-sm">لا توجد نقاط بيع في {selectedGovernorate}</h5>
                          <button
                            onClick={() => {
                              setActiveTab("contact");
                              setContactSubject(`طلب فتح نقطة بيع في محافظة ${selectedGovernorate}`);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="px-4 py-2 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            طلب فتح نقطة بيع
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ====================================== */}
      {/* PRODUCTS CATALOG                      */}
      {/* ====================================== */}
      {activeTab === "products" && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-right space-y-3 mb-10">
            <span className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>
              كتالوج المنتجات
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">منتجات رويال UPVC - الجودة بكل المقاييس</h2>
            <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: settings.primaryColor }}></div>
            <p className="text-slate-600 text-sm max-w-2xl">
              تصنيفات دقيقة لمنتجات السباكة UPVC والكهرباء ومواد البناء والري الزراعي. استخدم الفلاتر للوصول السريع.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">البحث المباشر</h4>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="ابحث باسم المنتج..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery("")}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">التصنيفات الرئيسية</h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setSelectedMainCategory("all");
                      setSelectedSubcategory("all");
                    }}
                    className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedMainCategory === "all" ? "text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    style={selectedMainCategory === "all" ? { backgroundColor: settings.primaryColor } : {}}
                  >
                    <span>الكل</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{products.length}</span>
                  </button>
                  {["plumbing", "electricity", "building", "agriculture"].map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    const isSelected = selectedMainCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedMainCategory(cat);
                          setSelectedSubcategory("all");
                        }}
                        className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${isSelected ? "text-white shadow" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        style={isSelected ? { backgroundColor: settings.primaryColor } : {}}
                      >
                        <span className="flex items-center gap-2">
                          {getCategoryIcon(cat)}
                          <span>{CATEGORY_LABELS[cat]}</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20" : "bg-slate-200"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedMainCategory !== "all" && allSubcategories.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">التصنيفات الفرعية</h4>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setSelectedSubcategory("all")}
                      className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedSubcategory === "all" ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      الكل في هذا القسم
                    </button>
                    {allSubcategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubcategory(sub)}
                        className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedSubcategory === sub ? "bg-slate-700 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        <span className="line-clamp-1">{sub}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          {products.filter((p) => p.category === selectedMainCategory && p.subcategory === sub).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md space-y-4">
                <div className="h-10 w-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <h5 className="font-bold text-white text-sm">للطلبات والاستفسارات</h5>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300">المسؤول: <strong className="text-white">{settings.salesManager}</strong></p>
                  <p className="text-slate-300">المبيعات: <a href={`tel:${settings.phoneSales}`} className="text-amber-300 font-bold" dir="ltr">{settings.phoneSales}</a></p>
                </div>
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl text-center shadow-lg transition-colors"
                >
                  تواصل واتساب
                </a>
              </div>
            </div>

            {/* Products grid */}
            <div className="lg:col-span-9 space-y-6">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-right space-y-1">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">رويال ← الكتالوج</p>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedMainCategory === "all" ? "جميع المنتجات" : `قسم ${CATEGORY_LABELS[selectedMainCategory]}`}
                    {selectedSubcategory !== "all" && <span style={{ color: settings.primaryColor }}> / {selectedSubcategory}</span>}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                  عرض {filteredProducts.length} من {products.length} منتج
                </div>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const style = getCategoryStyle(product.category);
                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                      >
                        <div className="absolute top-4 right-4 z-10">
                          {product.isAvailable ? (
                            <span className="bg-emerald-500/95 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                              متوفر بالمخزن
                            </span>
                          ) : (
                            <span className="bg-rose-500/95 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                              غير متوفر
                            </span>
                          )}
                        </div>
                        <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md ${style.chip}`}>
                                {CATEGORY_LABELS[product.category]}
                              </span>
                              <span className="text-slate-400 text-[10px]">•</span>
                              <span className="text-slate-500 text-[11px] font-semibold">{product.subcategory}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-sky-600 transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-slate-500 text-[12px] line-clamp-2 leading-relaxed">{product.description}</p>
                            {product.specifications && product.specifications.length > 0 && (
                              <div className="pt-2 flex flex-wrap gap-1">
                                {product.specifications.slice(0, 3).map((spec, i) => (
                                  <span key={i} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-slate-400 font-medium">سعر تقريبي</p>
                              <p className="text-sm font-extrabold" style={{ color: settings.primaryColor }}>
                                {product.price > 0 ? `$${product.price.toFixed(2)}` : "اتصل للسعر"}
                                {product.price > 0 && (
                                  <span className="text-[10px] text-slate-500 font-semibold mr-1">/ {product.unit}</span>
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setInquiryProduct(product);
                                setInquiryMessage(`أرغب في الاستفسار عن: ${product.name}`);
                              }}
                              className="px-4 py-2.5 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow hover:opacity-90"
                              style={{ backgroundColor: settings.primaryColor }}
                            >
                              <Send className="h-3 w-3" />
                              <span>طلب / استفسار</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl py-20 px-8 text-center space-y-4">
                  <Search className="h-12 w-12 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-900 text-lg">لا توجد نتائج مطابقة</h3>
                  <button
                    onClick={() => {
                      setProductSearchQuery("");
                      setSelectedMainCategory("all");
                      setSelectedSubcategory("all");
                    }}
                    className="px-5 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all border border-slate-300"
                  >
                    عرض جميع المنتجات
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ====================================== */}
      {/* AGENTS                                 */}
      {/* ====================================== */}
      {activeTab === "agents" && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="text-right space-y-3 mb-6 sm:mb-10">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>
              نقاط البيع المعتمدة
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900">نقاط بيع رويال بجميع المحافظات اليمنية</h2>
            <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: settings.primaryColor }}></div>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
              شبكة نقاط البيع المعتمدة تغطي كامل أراضي الجمهورية اليمنية. انقر فوق محافظتك لعرض نقاط البيع المتوفرة.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-950 text-base">المحافظات اليمنية الـ 21</h3>
                <p className="text-slate-500 text-xs">اضغط على المحافظة لتصفية النتائج</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
                {YEMEN_GOVERNORATES.map((gov) => {
                  const count = getGovernorateAgentCount(gov);
                  return (
                    <button
                      key={gov}
                      onClick={() => setSelectedGovernorate(gov)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold border transition-all text-right ${selectedGovernorate === gov ? "text-white border-transparent shadow" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      style={selectedGovernorate === gov ? { backgroundColor: settings.primaryColor } : {}}
                    >
                      <span>{gov}</span>
                      {count > 0 ? (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${selectedGovernorate === gov ? "bg-amber-500 text-white" : "bg-sky-100 text-sky-800"}`}>{count}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">0</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <h5 className="font-bold text-slate-900 text-sm">افتح نقطة بيع رويال</h5>
                <p className="text-slate-500 text-xs leading-relaxed">هل تمتلك معرضاً أو محلاً تجارياً؟ تواصل معنا لتنضم لشبكتنا.</p>
                <button
                  onClick={() => {
                    setActiveTab("contact");
                    setContactSubject(`طلب فتح نقطة بيع في محافظة ${selectedGovernorate}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full py-2 text-white font-bold text-xs rounded-xl shadow transition-all block text-center hover:opacity-90"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  تقديم الطلب
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="text-right">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    نقاط بيع رويال في (<span style={{ color: settings.primaryColor }}>{selectedGovernorate}</span>)
                  </h3>
                </div>
                <div className="relative shrink-0 w-full sm:w-auto">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="ابحث باسم نقطة البيع..."
                    value={agentSearchQuery}
                    onChange={(e) => setAgentSearchQuery(e.target.value)}
                    className="w-full sm:w-60 pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-400 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={agent.logoUrl || "/images/royal-logo.png"}
                            alt={agent.name}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                          />
                          <div className="space-y-1">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
                              style={{ color: settings.primaryColor, backgroundColor: `${settings.primaryColor}15` }}
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>نقطة بيع معتمدة</span>
                            </span>
                            <h4 className="font-extrabold text-slate-950 text-sm leading-snug">{agent.name}</h4>
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                            <MapPin className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                            <span>{agent.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                        <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-sky-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold transition-all shadow-sm">
                          <Phone className="h-4 w-4 text-sky-600" />
                          <span dir="ltr">{agent.phone}</span>
                        </a>
                        <a
                          href={`https://wa.me/${agent.phone.replace(/^0+/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.487 4.966 1.488 5.4 0 9.791-4.385 9.794-9.78 0-2.614-1.018-5.071-2.868-6.924C16.63 2.083 14.172.822 11.56.822c-5.405 0-9.794 4.386-9.797 9.782-.001 1.838.5 3.618 1.448 5.174l-1.02 3.722 3.866-.964z" />
                          </svg>
                          <span>واتساب</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-20 px-8 text-center space-y-4">
                  <Users className="h-12 w-12 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-800 text-lg">لا توجد نقاط بيع في محافظة {selectedGovernorate}</h3>
                  <button
                    onClick={() => {
                      setActiveTab("contact");
                      setContactSubject(`الاستفسار عن نقاط البيع في ${selectedGovernorate}`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    اتصل بنا فوراً
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ====================================== */}
      {/* ABOUT                                  */}
      {/* ====================================== */}
      {activeTab === "about" && (
        <main className="flex-1">
          <section className="text-white py-10 sm:py-16 text-center space-y-4 relative overflow-hidden" style={{ backgroundColor: settings.primaryColor }}>
            <div className="absolute inset-0 opacity-10">
              <img src="/images/factory-production.jpg" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <span className="text-xs uppercase tracking-widest text-amber-300 font-extrabold">منذ {settings.foundedYear} - الجودة بكل المقاييس</span>
              <h2 className="text-xl sm:text-4xl font-black">مصنع الأنور للبلاستيك - رويال</h2>
              <div className="h-1 bg-amber-300 w-16 mx-auto rounded-full mt-3"></div>
              <p className="text-white/80 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed mt-4">
                ينتج مصنع الأنور للبلاستيك أنابيب الـ يو بي في سي وفقاً للمواصفات الأمريكية والألمانية - عديمة التأثر بمعظم المحاليل الكيميائية.
              </p>
            </div>
          </section>

          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 space-y-4 shadow-sm hover:border-sky-400 transition-colors">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ color: settings.primaryColor, backgroundColor: `${settings.primaryColor}15` }}>
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950">الرؤية</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{settings.aboutVision}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 space-y-4 shadow-sm hover:border-emerald-400 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950">الرسالة</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{settings.aboutMission}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 space-y-4 shadow-sm hover:border-amber-400 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950">الهدف</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{settings.aboutGoal}</p>
              </div>
            </div>
          </section>

          <section className="py-16 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
                <h3 className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>لماذا رويال؟</h3>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950">المبادئ الستة الأساسية للجودة</h2>
                <div className="h-1.5 w-16 mx-auto rounded-full" style={{ backgroundColor: settings.primaryColor }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "البحوث والتطوير", desc: "إجراء عمليات البحث والتطوير والتصميم بواسطة كادر فني متخصص يصمم منتجات تلبي احتياجات العملاء." },
                  { title: "التكنولوجيا", desc: "استخدام أحدث التقنيات العالمية في عمليات الإنتاج ومراقبة الجودة بأحدث خطوط الإنتاج والأجهزة المعملية." },
                  { title: "الجودة", desc: "دعم الإنتاج باستمرار باستخدام نظم الجودة المعتمدة طبقاً للمواصفات ISO 9001 و ISO 14001 و BS OHSAS 18001." },
                  { title: "الخدمة", desc: "خدمة العملاء هي محط الاهتمام الأول لدى إدارة المصنع وهدفنا تقديم أفضل الخدمات لعملائنا." },
                  { title: "السياسة البيئية", desc: "احترام البيئة وانعكاس الاهتمام بالعمليات الإنتاجية حتى نضمن العيش في بيئة صحية." },
                  { title: "السلامة والصحة المهنية", desc: "اهتمام كبير لسلامة وصحة جميع الموظفين والزائرين بالمصنع طبقاً للمواصفات القياسية OHSAS 18001." }
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                    <h4 className="font-bold text-base mb-3" style={{ color: settings.primaryColor }}>{item.title}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
                <h3 className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>تخزين الأنابيب</h3>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950">تعليمات تخزين المواسير</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  لا يتم تخزين المواسير تحت أشعة الشمس المباشرة. التخزين على أرض مستوية خالية من الحجارة وعلى عوارض خشبية.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="h-64 bg-slate-100">
                    <img src="/images/pipes-warehouse.jpg" alt="طريقة الرص في طبقات" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5 text-center">
                    <h4 className="font-bold text-white text-sm py-2 px-4 inline-block rounded-lg" style={{ backgroundColor: settings.primaryColor }}>
                      طريقة الرص في شكل طبقات
                    </h4>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="h-64 bg-slate-100">
                    <img src="/images/pvc-pipes-hero.jpg" alt="طريقة الرص العكسية" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5 text-center">
                    <h4 className="font-bold text-white text-sm py-2 px-4 inline-block rounded-lg" style={{ backgroundColor: settings.primaryColor }}>
                      طريقة الرص العكسية
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center space-y-3">
                <h3 className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>تاريخ مصنع رويال</h3>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950">{14}+ عاماً من العطاء والتطوير</h2>
                <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: settings.primaryColor }}></div>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl text-slate-700 text-sm leading-relaxed">
                {settings.aboutHistory}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ====================================== */}
      {/* CONTACT                                */}
      {/* ====================================== */}
      {activeTab === "contact" && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-right space-y-3 mb-10">
            <span className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>قنوات التواصل</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">يسعدنا سماع استفساراتكم</h2>
            <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: settings.primaryColor }}></div>
            <p className="text-slate-600 text-sm max-w-2xl">
              تواصل مع مصنع رويال عبر النموذج الإلكتروني أو الاتصال الهاتفي. مسؤول المبيعات الأستاذ {settings.salesManager} في خدمتك.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <h3 className="font-bold text-slate-950 text-lg">معلومات الاتصال المباشر</h3>

                {/* Sales Manager */}
                <div className="bg-gradient-to-l from-amber-50 to-white border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-12 w-12 bg-amber-500/20 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-700 font-bold uppercase">مسؤول المبيعات</p>
                    <h4 className="font-extrabold text-slate-900 text-base">{settings.salesManager}</h4>
                  </div>
                </div>

                {/* Phones */}
                <div className="space-y-3">
                  {[
                    { label: "المبيعات", phone: settings.phoneSales, icon: <PhoneCall className="h-5 w-5" />, color: "emerald" },
                    { label: "الحسابات", phone: settings.phoneAccounts, icon: <Calculator className="h-5 w-5" />, color: "sky" },
                    { label: "الاستفسار", phone: settings.phoneInquiry, icon: <HelpCircle className="h-5 w-5" />, color: "amber" },
                    { label: "التوصيل", phone: settings.phoneDelivery, icon: <Truck className="h-5 w-5" />, color: "rose" }
                  ].map((c) => (
                    <a
                      key={c.label}
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all"
                    >
                      <div className={`h-10 w-10 bg-${c.color}-50 text-${c.color}-600 rounded-xl flex items-center justify-center shrink-0`}>
                        {c.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-bold">{c.label}</p>
                        <p className="text-sm font-extrabold text-slate-900" dir="ltr">{c.phone}</p>
                      </div>
                      <Phone className="h-4 w-4 text-slate-400" />
                    </a>
                  ))}
                </div>

                {/* Other contact */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">البريد الإلكتروني</h4>
                      <p className="text-slate-600 text-xs font-semibold mt-1">{settings.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">العنوان</h4>
                      <p className="text-slate-600 text-xs leading-relaxed mt-1">{settings.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h4 className="font-bold text-slate-900 text-xs">تابعنا على:</h4>
                <div className="flex items-center gap-3">
                  <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200">فيسبوك</a>
                  <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold border border-sky-200">تويتر</a>
                  <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200">إنستغرام</a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-950 text-lg">أرسل رسالة فورية</h3>
                <p className="text-slate-500 text-xs">سيقوم قسم العلاقات بالرد عليك خلال أقل من 24 ساعة.</p>
              </div>

              {contactSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-4 py-16">
                  <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">تم إرسال رسالتك بنجاح!</h4>
                  <p className="text-slate-600 text-xs max-w-sm mx-auto leading-relaxed">
                    شكراً لتواصلك مع مصنع رويال. سيتصل بك مندوب المبيعات قريباً.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">الاسم الكريم *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="الاسم الكامل"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="example@mail.com"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">رقم الجوال *</label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="78XXXXXXX"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">الموضوع *</label>
                      <input
                        type="text"
                        required
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="طلب سعر، شكوى، استفسار..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">نص الرسالة *</label>
                    <textarea
                      required
                      rows={4}
                      value={contactText}
                      onChange={(e) => setContactText(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <Send className="h-4 w-4" />
                    <span>إرسال الرسالة الآن</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ====================================== */}
      {/* ADMIN PANEL                            */}
      {/* ====================================== */}
      {activeTab === "admin" && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-200">
            <div className="text-right space-y-1">
              <span className="text-xs uppercase tracking-widest font-extrabold" style={{ color: settings.primaryColor }}>بوابة الإدارة</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">لوحة تحكم المدير</h2>
              <p className="text-slate-500 text-xs">إدارة المنتجات، الوكلاء، البانرات والإعدادات</p>
            </div>
            {isAdminLoggedIn && (
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-700">المدير: {adminUsername}</span>
                </div>
                <button
                  onClick={handleAdminLogout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            )}
          </div>

          {!isAdminLoggedIn ? (
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto" style={{ color: settings.primaryColor, backgroundColor: `${settings.primaryColor}15` }}>
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">تسجيل دخول المدير</h3>
                <p className="text-slate-500 text-xs">أدخل بياناتك لإدارة النظام</p>
              </div>

              {/* مربع البيانات الافتراضية البارز */}
              <div className="bg-gradient-to-l from-amber-50 to-yellow-50 border-2 border-amber-300 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔑</span>
                  <h4 className="font-bold text-amber-900 text-sm">بيانات الدخول الافتراضية:</h4>
                </div>
                <div className="bg-white border border-amber-200 rounded-xl p-3 space-y-2 font-mono">
                  <div className="flex items-center justify-between" dir="ltr">
                    <span className="text-slate-500 text-xs">Username:</span>
                    <code className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg font-bold text-sm select-all">admin</code>
                  </div>
                  <div className="flex items-center justify-between" dir="ltr">
                    <span className="text-slate-500 text-xs">Password:</span>
                    <code className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg font-bold text-sm select-all">admin123</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillLogin}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  ⚡ تعبئة تلقائية + دخول سريع
                </button>
              </div>

              {loginError && (
                <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-xl space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-700 font-semibold space-y-2">
                      <p>{loginError}</p>
                      <div className="bg-white border border-rose-200 p-2 rounded-lg text-[10px] text-slate-600 leading-relaxed">
                        💡 <strong>نصائح:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          <li>تأكد من لوحة المفاتيح <strong>إنجليزية</strong> (ليس عربية)</li>
                          <li>اكتب الأحرف <strong>صغيرة</strong> (lowercase)</li>
                          <li>تأكد من عدم وجود مسافات قبل/بعد</li>
                          <li>أو استخدم زر "التعبئة التلقائية" أعلاه</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">اسم المستخدم</label>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="admin"
                    dir="ltr"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-500 focus:bg-white text-left"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="admin123"
                      dir="ltr"
                      className="w-full px-4 py-3 pl-12 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-sky-500 focus:bg-white text-left"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-lg text-slate-500"
                      title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <Lock className="h-4 w-4" />
                  <span>تسجيل الدخول</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sidebar */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-950 text-sm border-b border-slate-100 pb-2">أقسام التحكم</h4>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: "dashboard", icon: <Activity className="h-4 w-4" />, label: "لوحة الإحصائيات" },
                    { id: "cloud", icon: <Cloud className="h-4 w-4" />, label: cloudActive ? "☁️ السحابة (مفعّلة)" : "⚡ ربط السحابة", highlight: true, special: true },
                    { id: "publish", icon: <Globe className="h-4 w-4" />, label: "🚀 نشر للإنترنت", highlight: true, special2: true },
                    { id: "products", icon: <Grid className="h-4 w-4" />, label: "المنتجات", count: products.length },
                    { id: "agents", icon: <Users className="h-4 w-4" />, label: "نقاط البيع", count: agents.length },
                    { id: "banners", icon: <ImageIcon className="h-4 w-4" />, label: "البانرات", count: banners.length },
                    { id: "messages", icon: <MessageSquare className="h-4 w-4" />, label: "الرسائل", count: unreadCount, badge: unreadCount > 0 },
                    { id: "settings", icon: <Settings className="h-4 w-4" />, label: "إعدادات الموقع" },
                    { id: "files", icon: <Download className="h-4 w-4" />, label: "تحميل ملفات الموقع" }
                  ].map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => setAdminActiveTab(item.id)}
                      style={adminActiveTab === item.id ? { backgroundColor: settings.primaryColor } : {}}
                      className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${adminActiveTab === item.id
                          ? "text-white"
                          : item.special && cloudActive
                            ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100"
                            : item.special
                              ? "bg-amber-50 text-amber-800 border-2 border-amber-300 hover:bg-amber-100 animate-pulse"
                              : item.highlight
                                ? "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
                                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {typeof item.count !== "undefined" && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${item.badge ? "bg-red-500 text-white animate-pulse" : adminActiveTab === item.id ? "bg-white/20" : "bg-sky-100 text-sky-800"
                            }`}
                        >
                          {item.count}
                        </span>
                      )}
                      {item.special && cloudActive && adminActiveTab !== item.id && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-9 space-y-6">
                {/* ========== PUBLISH TO INTERNET - خطة النشر الكاملة ========== */}
                {adminActiveTab === "publish" && (
                  <div className="space-y-6">
                    {/* Hero */}
                    <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.primaryColor}dd)` }}>
                      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"></div>
                      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
                      <div className="relative space-y-3">
                        <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-800 text-[10px] font-extrabold px-3 py-1 rounded-full">
                          🚀 خطة النشر الكاملة
                        </span>
                        <h2 className="text-xl sm:text-3xl font-black">انشر موقعك على الإنترنت في 3 مراحل</h2>
                        <p className="text-white/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                          عندما تنتهي من هذه الخطوات، أي منتج تضيفه من لوحة التحكم سيُحفظ تلقائياً في السحابة ويظهر فوراً لكل العملاء في كل محافظات اليمن! 🌍
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <span className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold">⏱️ 20-30 دقيقة</span>
                          <span className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold">💰 مجاني 100%</span>
                          <span className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold">🔒 SSL مجاني</span>
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS INDICATOR */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">📊 مدى الإنجاز:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {cloudActive ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0"></div>
                          )}
                          <span className={`text-xs font-bold ${cloudActive ? "text-emerald-700" : "text-slate-500"}`}>
                            المرحلة 1: ربط Supabase (السحابة)
                          </span>
                          {cloudActive && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓ تم</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0"></div>
                          <span className="text-xs font-bold text-slate-500">المرحلة 2: نشر الموقع على Netlify</span>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">يدوي</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0"></div>
                          <span className="text-xs font-bold text-slate-500">المرحلة 3: اختبار التزامن</span>
                        </div>
                      </div>
                    </div>

                    {/* ========== المرحلة 1: SUPABASE ========== */}
                    <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shrink-0">1</div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">ربط Supabase (قاعدة بيانات سحابية)</h3>
                          <p className="text-slate-500 text-xs">المرحلة الأهم - بدونها لن يرى العملاء أي منتج تضيفه!</p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-emerald-800">💡 ما هو Supabase؟</strong>
                        <p className="mt-1">قاعدة بيانات مجانية على السحابة، تخزّن كل منتجاتك ووكلائك. عندما تضيف منتج من لوحة التحكم → يُحفظ في Supabase → كل العملاء يرونه فوراً!</p>
                      </div>

                      <ol className="space-y-3">
                        {[
                          { txt: "ادخل: supabase.com → اضغط Start your project", link: "https://supabase.com" },
                          { txt: "سجّل عبر GitHub أو البريد (مجاني)" },
                          { txt: "اضغط New Project → اختر اسم (royal-pipes) + كلمة مرور قوية + Region (Frankfurt)" },
                          { txt: "انتظر دقيقتين حتى يكتمل الإنشاء" },
                          { txt: "اضغط SQL Editor → New Query → الصق كود SQL من تبويب '⚡ ربط السحابة' → RUN" },
                          { txt: "اضغط Settings → API → انسخ Project URL و anon key" },
                          { txt: "اضغط Storage → New bucket → الاسم: products → فعّل Public" },
                          { txt: "ارجع لـ ⚡ ربط السحابة في موقعك → الصق URL و key → اضغط 'تفعيل السحابة'" }
                        ].map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <div className="h-6 w-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0">{i + 1}</div>
                            <div className="flex-1 text-xs text-slate-700 leading-relaxed">
                              {step.txt}
                              {step.link && (
                                <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mr-2 text-emerald-700 font-bold hover:underline">
                                  ↗ افتح
                                </a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>

                      <div className="flex flex-wrap gap-2">
                        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[180px] text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all">
                          🔗 افتح Supabase
                        </a>
                        <button
                          onClick={() => setAdminActiveTab("cloud")}
                          className="flex-1 min-w-[180px] px-4 py-2.5 bg-white border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl transition-all"
                        >
                          ⚡ اذهب لربط السحابة
                        </button>
                      </div>
                    </div>

                    {/* ========== المرحلة 2: NETLIFY - الطريقة السهلة ========== */}
                    <div className="bg-white border-2 border-sky-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shrink-0">2</div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">نشر الموقع على Netlify</h3>
                          <p className="text-slate-500 text-xs">طريقة سهلة جداً - بدون أي بناء أو terminal!</p>
                        </div>
                      </div>

                      {/* HUGE WARNING ABOUT BUILD FAILURE */}
                      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="bg-rose-100 p-2 rounded-xl shrink-0">
                            <AlertTriangle className="h-5 w-5 text-rose-700" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-extrabold text-rose-800 text-sm">⚠️ هل ظهر لك "Build failed" على Netlify؟</h4>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              <strong>السبب:</strong> رفعت مجلد المشروع كاملاً، فحاول Netlify يبنيه وفشل.
                            </p>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              <strong>الحل:</strong> استخدم الزر الأخضر الكبير أدناه - سيحمّل لك الموقع جاهزاً 100% بدون بناء!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* THE EASY BUTTON - DOWNLOAD READY ZIP */}
                      <div className="bg-gradient-to-l from-emerald-50 to-emerald-100 border-2 border-emerald-400 rounded-2xl p-5 sm:p-6 space-y-4">
                        <div className="text-center space-y-2">
                          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-extrabold">
                            ⭐ الطريقة الأسهل والأسرع ⭐
                          </div>
                          <h4 className="font-extrabold text-emerald-900 text-base sm:text-lg">🎯 موقعك جاهز للنشر - بدون أي بناء!</h4>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            اضغط الزر أدناه لتحميل موقعك جاهزاً 100%، ثم اسحب الملف على Netlify Drop - وانتهيت!
                          </p>
                        </div>

                        <button
                          onClick={handleDownloadNetlifyReady}
                          disabled={isDownloading}
                          className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02]"
                        >
                          <Download className="h-5 w-5" />
                          <span>{isDownloading ? "⏳ جاري التحميل..." : "📦 تحميل الموقع جاهز للنشر (ZIP)"}</span>
                        </button>

                        <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-bold text-slate-800">✅ ما يحويه الملف:</p>
                          <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                            <li>الموقع كامل مبني وجاهز (index.html)</li>
                            <li>ملف netlify.toml (يمنع البناء التلقائي)</li>
                            <li>ملف ابدأ_من_هنا.txt (التعليمات بالعربي)</li>
                            <li>كل الإعدادات الصحيحة جاهزة</li>
                          </ul>
                        </div>
                      </div>

                      {/* STEP BY STEP - SIMPLE */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-800 text-sm">📋 الخطوات (3 خطوات بسيطة):</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-4 text-center space-y-2 relative">
                            <div className="absolute top-2 right-2 h-6 w-6 bg-sky-600 text-white rounded-full flex items-center justify-center font-black text-xs">1</div>
                            <div className="text-3xl mt-2">📥</div>
                            <p className="font-bold text-slate-800 text-xs">حمّل ZIP من الزر الأخضر</p>
                            <p className="text-[10px] text-slate-500">سيُحفظ في مجلد التنزيلات</p>
                          </div>
                          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center space-y-2 relative">
                            <div className="absolute top-2 right-2 h-6 w-6 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-xs">2</div>
                            <div className="text-3xl mt-2">📂</div>
                            <p className="font-bold text-slate-800 text-xs">فك ضغط الملف</p>
                            <p className="text-[10px] text-slate-500">بزر اليمين → Extract</p>
                          </div>
                          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center space-y-2 relative">
                            <div className="absolute top-2 right-2 h-6 w-6 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs">3</div>
                            <div className="text-3xl mt-2">🚀</div>
                            <p className="font-bold text-slate-800 text-xs">اسحبه على Netlify Drop</p>
                            <p className="text-[10px] text-slate-500">المجلد الذي فُك ضغطه</p>
                          </div>
                        </div>
                      </div>

                      <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl transition-all">
                        🌐 افتح Netlify Drop الآن →
                      </a>

                      {/* For developers */}
                      <details className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <summary className="text-xs font-bold text-slate-700 cursor-pointer">⚙️ للمطورين: الطريقة التقنية (npm)</summary>
                        <div className="mt-3 space-y-3">
                          <p className="text-xs text-slate-600">إذا كنت مطور وتريد البناء يدوياً:</p>
                          <div className="bg-slate-950 text-emerald-300 p-3 rounded-lg text-xs font-mono select-all" dir="ltr">
                            npm install<br />
                            npm run build<br />
                            # ثم ارفع محتوى مجلد dist/ على Netlify
                          </div>
                          <p className="text-[10px] text-rose-700 font-bold">⚠️ تحذير: لا ترفع مجلد المشروع كاملاً - فقط dist/</p>
                        </div>
                      </details>
                    </div>

                    {/* ========== المرحلة 3: TEST ========== */}
                    <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shrink-0">3</div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">اختبار التزامن (للتأكد)</h3>
                          <p className="text-slate-500 text-xs">تأكد أن المنتجات تظهر فعلاً للعملاء</p>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-amber-800">🧪 سيناريو الاختبار:</strong>
                        <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                          <li>ادخل موقعك على Netlify (الرابط الجديد)</li>
                          <li>لوحة التحكم → ⚡ ربط السحابة → الصق بيانات Supabase → تفعيل</li>
                          <li>اضغط "المنتجات" → "إضافة منتج جديد"</li>
                          <li>املأ البيانات + ارفع صورة + اضغط حفظ</li>
                          <li><strong>افتح الموقع في وضع التصفح الخفي (Ctrl+Shift+N)</strong></li>
                          <li>✅ يجب أن ترى المنتج الجديد ظاهر!</li>
                          <li>افتح الرابط من جوالك أو اطلب من صديق → ✅ يرى المنتج أيضاً</li>
                        </ol>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                          <div className="text-3xl mb-1">💻</div>
                          <p className="text-xs font-bold text-slate-800">اختبر على الحاسوب</p>
                          <p className="text-[10px] text-slate-500 mt-1">وضع التصفح الخفي</p>
                        </div>
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-center">
                          <div className="text-3xl mb-1">📱</div>
                          <p className="text-xs font-bold text-slate-800">اختبر على الجوال</p>
                          <p className="text-[10px] text-slate-500 mt-1">من شبكة مختلفة</p>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                          <div className="text-3xl mb-1">👥</div>
                          <p className="text-xs font-bold text-slate-800">اختبر مع صديق</p>
                          <p className="text-[10px] text-slate-500 mt-1">من جهاز ثانٍ</p>
                        </div>
                      </div>
                    </div>

                    {/* COST BREAKDOWN */}
                    <div className="bg-gradient-to-l from-emerald-50 via-white to-emerald-50 border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                      <h3 className="font-extrabold text-slate-800 text-base mb-4">💰 التكلفة الإجمالية</h3>
                      <div className="space-y-2">
                        {[
                          { label: "Supabase (قاعدة البيانات)", cost: "مجاني", detail: "500MB + 50K طلب/شهر" },
                          { label: "Netlify (الاستضافة)", cost: "مجاني", detail: "100GB نقل بيانات/شهر" },
                          { label: "نطاق .netlify.app", cost: "مجاني", detail: "مدى الحياة" },
                          { label: "شهادة SSL/HTTPS", cost: "مجاني", detail: "تلقائي من Netlify" },
                          { label: "Supabase Storage (الصور)", cost: "مجاني", detail: "1GB صور" }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{item.label}</p>
                              <p className="text-[10px] text-slate-500">{item.detail}</p>
                            </div>
                            <span className="font-extrabold text-emerald-600 text-sm">{item.cost}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 bg-emerald-600 text-white rounded-2xl p-4 text-center">
                        <p className="text-xs opacity-90">المجموع السنوي</p>
                        <p className="text-3xl font-black">$0 (مجاني 100%)</p>
                        <p className="text-[10px] opacity-90 mt-1">يكفي لآلاف العملاء بدون أي تكلفة!</p>
                      </div>
                    </div>

                    {/* HOW IT WORKS */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-base">🔄 كيف يعمل النظام بعد النشر؟</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { icon: "👨‍💼", title: "أنت", desc: "تضغط 'إضافة منتج'" },
                          { icon: "☁️", title: "Supabase", desc: "يحفظه في السحابة" },
                          { icon: "🌍", title: "Netlify", desc: "يعرضه على الإنترنت" },
                          { icon: "👥", title: "العملاء", desc: "يرونه فوراً!" }
                        ].map((step, i) => (
                          <div key={i} className="text-center space-y-2">
                            <div className="text-4xl">{step.icon}</div>
                            <p className="font-bold text-slate-800 text-xs">{step.title}</p>
                            <p className="text-[10px] text-slate-500">{step.desc}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-semibold text-center">
                        ⚡ الزمن من الإضافة للظهور: أقل من <strong>2 ثانية</strong>!
                      </div>
                    </div>

                    {/* WARNINGS */}
                    <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 sm:p-6 space-y-3">
                      <h3 className="font-extrabold text-rose-800 text-sm flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        ⚠️ ملاحظات مهمة جداً
                      </h3>
                      <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold">•</span>
                          <span><strong>بيانات Supabase تُحفظ في متصفحك:</strong> في كل جهاز جديد تستخدمه للإدارة، اذهب لتبويب ⚡ ربط السحابة وأدخل البيانات مرة واحدة</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold">•</span>
                          <span><strong>العملاء لا يحتاجون شيء:</strong> فقط يفتحون الرابط ويرون كل المنتجات تلقائياً</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold">•</span>
                          <span><strong>غيّر كلمة مرور المدير:</strong> لا تترك admin/admin123 على موقع الإنترنت العام</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold">•</span>
                          <span><strong>بدون السحابة = المنتجات محلية:</strong> إذا لم تفعّل السحابة، المنتجات لا تظهر للعملاء</span>
                        </li>
                      </ul>
                    </div>

                    {/* Final CTA */}
                    <div className="text-white rounded-3xl p-6 sm:p-8 text-center space-y-4 relative overflow-hidden" style={{ backgroundColor: settings.primaryColor }}>
                      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"></div>
                      <div className="relative">
                        <h3 className="text-xl sm:text-2xl font-black mb-2">🚀 جاهز للانطلاق؟</h3>
                        <p className="text-white/90 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-4">
                          ابدأ من المرحلة 1 (ربط Supabase) ثم انتقل للمرحلة 2 (Netlify). موقعك سيكون متاحاً للعالم خلال 30 دقيقة!
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => setAdminActiveTab("cloud")}
                            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-800 font-extrabold text-sm rounded-xl shadow-lg transition-all"
                          >
                            ⚡ ابدأ بربط السحابة
                          </button>
                          <a
                            href={`https://wa.me/${settings.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all"
                          >
                            💬 طلب مساعدة فنية
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========== CLOUD INTEGRATION TAB - الأهم! ========== */}
                {adminActiveTab === "cloud" && (
                  <div className="space-y-6">
                    {/* Status Banner */}
                    <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden ${cloudActive
                        ? "bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-700 text-white"
                        : "bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white"
                      }`}>
                      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/20 blur-3xl"></div>
                      <div className="relative space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${cloudActive ? "bg-white/20" : "bg-white/20"}`}>
                            <Cloud className="h-7 w-7" />
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-[10px] font-extrabold">
                              {cloudActive ? "🟢 السحابة نشطة" : "🔴 السحابة غير مفعّلة"}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black mt-1">
                              {cloudActive ? "☁️ ✓ منتجاتك تنتشر للعالم!" : "⚠️ المنتجات تُحفظ محلياً فقط"}
                            </h2>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed max-w-2xl opacity-95">
                          {cloudActive
                            ? "ممتاز! أي منتج تضيفه الآن يُحفظ في Supabase ويظهر فوراً لكل العملاء في كل المحافظات وفي أي مكان بالعالم 🌍"
                            : "حالياً المنتجات التي تضيفها تظهر في متصفحك أنت فقط! اربط Supabase أدناه ليتم نشرها للعملاء حول العالم 🌍"}
                        </p>
                        {cloudActive && (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">
                              {syncStatus === "syncing" ? "🔄 جاري المزامنة..." : syncStatus === "done" ? "✓ متزامن" : "● متصل"}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">
                              📦 {products.length} منتج
                            </span>
                            <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">
                              👥 {agents.length} وكيل
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PROBLEM EXPLANATION */}
                    {!cloudActive && (
                      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-rose-100 p-2 rounded-xl shrink-0">
                            <AlertTriangle className="h-5 w-5 text-rose-700" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-extrabold text-rose-900 text-sm">⚠️ المشكلة التي تواجهك حالياً:</h4>
                            <p className="text-slate-700 text-xs leading-relaxed">
                              عند إضافة منتج من لوحة التحكم، يُحفظ في <code className="bg-white px-1.5 rounded">localStorage</code> الخاص بمتصفحك فقط.
                              لذلك العملاء الآخرون <strong>لا يرون المنتج</strong> لأن كل متصفح له تخزينه المنفصل.
                            </p>
                            <p className="text-slate-700 text-xs leading-relaxed">
                              <strong className="text-emerald-700">✓ الحل:</strong> اربط Supabase (مجاني تماماً) ليتم حفظ المنتجات في قاعدة بيانات سحابية حقيقية مشتركة لكل العملاء.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* THE 5 STEPS */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                      <h3 className="font-bold text-slate-950 text-base flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        خطوات ربط Supabase (5 دقائق):
                      </h3>

                      <ol className="space-y-4">
                        <li className="flex gap-3">
                          <div className="h-7 w-7 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-black text-xs shrink-0">1</div>
                          <div className="space-y-1 flex-1">
                            <p className="font-bold text-slate-900 text-sm">سجّل حساب مجاني على Supabase</p>
                            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:underline text-xs font-bold">
                              🔗 supabase.com ↗
                            </a>
                            <p className="text-slate-500 text-[10px]">مجاني بالكامل - يكفي لمصنعك</p>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <div className="h-7 w-7 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-black text-xs shrink-0">2</div>
                          <div className="space-y-1 flex-1">
                            <p className="font-bold text-slate-900 text-sm">أنشئ مشروع جديد باسم: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">royal-pipes</code></p>
                            <p className="text-slate-500 text-xs">اختر منطقة قريبة (مثل Frankfurt)</p>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <div className="h-7 w-7 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-black text-xs shrink-0">3</div>
                          <div className="space-y-2 flex-1">
                            <p className="font-bold text-slate-900 text-sm">⚠️ أنشئ الجداول من SQL Editor (الأهم!)</p>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              من القائمة الجانبية في Supabase ← <strong>SQL Editor</strong> ← <strong>New Query</strong> ← الصق الكود أدناه ← اضغط <strong>RUN</strong>
                            </p>
                            <button
                              onClick={() => setShowSqlCode(!showSqlCode)}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all"
                            >
                              {showSqlCode ? "إخفاء" : "📋 عرض"} كود SQL
                            </button>
                            {showSqlCode && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-500 font-bold">انسخ كل هذا الكود والصقه في Supabase:</span>
                                  <button
                                    onClick={handleCopySql}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    نسخ الكود
                                  </button>
                                </div>
                                <div className="bg-slate-950 text-emerald-300 p-4 rounded-xl max-h-72 overflow-auto text-[10px] font-mono leading-relaxed select-all" dir="ltr">
                                  <pre>{SUPABASE_SQL}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <div className="h-7 w-7 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-black text-xs shrink-0">4</div>
                          <div className="space-y-1 flex-1">
                            <p className="font-bold text-slate-900 text-sm">احصل على Project URL + anon key</p>
                            <p className="text-slate-600 text-xs">
                              في Supabase ← <strong>Settings</strong> ← <strong>API</strong> ← انسخ:
                            </p>
                            <ul className="text-xs text-slate-600 list-disc list-inside mr-2">
                              <li><strong>Project URL</strong> (مثل: https://xxx.supabase.co)</li>
                              <li><strong>anon / public</strong> key (مفتاح طويل يبدأ بـ eyJ...)</li>
                            </ul>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <div className="h-7 w-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-xs shrink-0">5</div>
                          <div className="space-y-1 flex-1">
                            <p className="font-bold text-slate-900 text-sm">الصق البيانات أدناه واضغط "تفعيل السحابة"</p>
                          </div>
                        </li>
                      </ol>
                    </div>

                    {/* THE CONNECTION FORM */}
                    <div className="bg-white border-2 border-emerald-300 rounded-3xl p-6 shadow-xl space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-xl">
                          <Cloud className="h-5 w-5 text-emerald-700" />
                        </div>
                        <h3 className="font-extrabold text-slate-950 text-lg">⚙️ إعدادات اتصال Supabase</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">Project URL</label>
                          <input
                            type="text"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                            placeholder="https://xxxxxxxxxxx.supabase.co"
                            dir="ltr"
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white text-left"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">anon / public key</label>
                          <textarea
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            dir="ltr"
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500 focus:bg-white text-left resize-none break-all"
                          />
                        </div>

                        {/* Test Result */}
                        {supabaseTestResult && (
                          <div className={`rounded-xl p-4 border-2 ${supabaseTestResult.success
                              ? "bg-emerald-50 border-emerald-300"
                              : "bg-rose-50 border-rose-300"
                            }`}>
                            <div className="flex items-start gap-2">
                              {supabaseTestResult.success ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-1">
                                <p className={`text-sm font-bold ${supabaseTestResult.success ? "text-emerald-800" : "text-rose-800"}`}>
                                  {supabaseTestResult.message}
                                </p>
                                {!supabaseTestResult.success && supabaseTestResult.tablesExist === false && (
                                  <p className="text-xs text-slate-700">
                                    💡 ارجع للخطوة 3 وأنشئ الجداول من SQL Editor أولاً.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={handleTestSupabaseConnection}
                            disabled={isTestingConnection || !supabaseUrl || !supabaseKey}
                            className="flex-1 min-w-[200px] px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isTestingConnection ? "⏳ جاري الاختبار..." : "🔍 اختبار الاتصال فقط"}
                          </button>
                          <button
                            onClick={handleSaveSupabaseConfig}
                            disabled={isTestingConnection || !supabaseUrl || !supabaseKey}
                            className="flex-1 min-w-[200px] px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Cloud className="h-4 w-4" />
                            {cloudActive ? "🔄 إعادة المزامنة" : "☁️ تفعيل السحابة"}
                          </button>
                        </div>

                        {cloudActive && (
                          <button
                            onClick={handleDisableCloud}
                            className="w-full px-5 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 font-bold text-xs rounded-xl transition-all"
                          >
                            🔌 إيقاف السحابة (العودة للتخزين المحلي)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 🔧 DIAGNOSE & FIX SECTION - PROMINENT */}
                    {cloudActive && (
                      <div className="bg-gradient-to-l from-amber-50 to-orange-50 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0">
                            <Wrench className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-amber-900 text-base sm:text-lg">🔧 المنتجات لا تُحفظ في السحابة؟</h3>
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                              إذا ظهرت رسالة "فشل الحفظ في السحابة"، السبب الأساسي هو <strong>سياسات الأمان (RLS Policies)</strong> في Supabase تمنع الإضافة. الحل في خطوتين:
                            </p>
                          </div>
                        </div>

                        {/* ⚡ NEW: Migration Helper */}
                        <div className="bg-white border-2 border-purple-400 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-[9px] font-extrabold">🔥 مهم</span>
                            <h4 className="font-bold text-slate-800 text-sm">📤 رفع البيانات المحلية للسحابة</h4>
                          </div>

                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                            <strong className="text-purple-900">⚠️ مشكلة الأخطاء 400 التي رأيتها:</strong>
                            <p className="mt-1">
                              المنتجات الافتراضية لها IDs محلية مثل <code className="bg-white px-1 rounded">p1, p2, ag1</code>، لكن Supabase يستخدم أرقام تلقائية (1, 2, 3). لذلك عند تعديل منتج قديم، يفشل لأنه غير موجود في السحابة.
                            </p>
                            <p className="mt-2"><strong>الحل:</strong> اضغط الزر أدناه لرفع كل المنتجات المحلية للسحابة دفعة واحدة.</p>
                          </div>

                          <button
                            onClick={handleMigrateLocal}
                            disabled={isDiagnosing}
                            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isDiagnosing ? (
                              <>⏳ جاري الرفع...</>
                            ) : (
                              <>
                                <Cloud className="h-4 w-4" />
                                <span>📤 رفع كل البيانات المحلية للسحابة الآن</span>
                              </>
                            )}
                          </button>

                          <div className="text-[11px] text-slate-500 text-center">
                            سيرفع: {products.length} منتج + {agents.length} وكيل + {banners.length} بانر
                          </div>
                        </div>

                        {/* Step 1: Diagnose */}
                        <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 space-y-3">
                          <h4 className="font-bold text-slate-800 text-sm">🩺 الخطوة 1: تشخيص المشكلة</h4>
                          <p className="text-xs text-slate-600">اضغط الزر التالي لاختبار الاتصال والإضافة الفعلية:</p>
                          <button
                            onClick={handleDiagnose}
                            disabled={isDiagnosing}
                            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm rounded-xl shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isDiagnosing ? (
                              <>⏳ جاري التشخيص...</>
                            ) : (
                              <>
                                <Activity className="h-4 w-4" />
                                <span>🩺 ابدأ التشخيص الكامل</span>
                              </>
                            )}
                          </button>

                          {diagnoseResult && (
                            <div className={`rounded-xl p-3 border-2 ${diagnoseResult.ok ? "bg-emerald-50 border-emerald-300" : "bg-rose-50 border-rose-300"}`}>
                              <div className="space-y-2">
                                {diagnoseResult.tests.map((t, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs">
                                    {t.ok ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                      <p className={`font-bold ${t.ok ? "text-emerald-800" : "text-rose-800"}`}>{t.name}</p>
                                      <p className="text-slate-700 text-[11px]">{t.msg}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {diagnoseResult.ok && (
                                <div className="mt-3 bg-emerald-100 border border-emerald-300 rounded-lg p-2 text-xs text-emerald-900 font-bold text-center">
                                  ✅ كل شيء يعمل! يمكنك إضافة المنتجات الآن وستظهر للعملاء
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Step 2: Fix RLS - SIMPLIFIED */}
                        <div className="bg-white border-2 border-emerald-400 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] font-extrabold">⭐ الحل الأكيد</span>
                            <h4 className="font-bold text-slate-800 text-sm">🛠️ الخطوة 2: إيقاف RLS (يحل المشكلة 100%)</h4>
                          </div>

                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                            💡 <strong>هذا الكود الجديد مُبسّط:</strong> فقط 5 أسطر، يعمل في كل الحالات بدون أخطاء.
                            يقوم بإيقاف نظام الأمان الصارم في Supabase ليسمح لك بإضافة وتعديل المنتجات.
                          </div>

                          {/* الكود مباشرة معروض */}
                          <div className="bg-slate-950 text-emerald-300 p-4 rounded-xl text-[11px] font-mono leading-relaxed select-all" dir="ltr">
                            <pre>{`ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;`}</pre>
                          </div>

                          <button
                            onClick={handleCopyFixSql}
                            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
                          >
                            <Copy className="h-5 w-5" />
                            <span>📋 نسخ الكود (5 أسطر فقط)</span>
                          </button>

                          {/* خطوات بسيطة جداً */}
                          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-extrabold text-amber-900">📋 الخطوات السريعة (دقيقة واحدة):</p>
                            <div className="space-y-2">
                              {[
                                { num: 1, txt: "اضغط الزر الأخضر '📋 نسخ الكود' أعلاه" },
                                { num: 2, txt: <>ادخل: <a href="https://supabase.com/dashboard/projects" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-extrabold hover:underline">supabase.com/dashboard</a> ← اختر مشروعك</> },
                                { num: 3, txt: "من القائمة اليسرى ← اضغط 'SQL Editor'" },
                                { num: 4, txt: "اضغط '+ New Query' في الأعلى" },
                                { num: 5, txt: "الصق الكود (Ctrl+V)" },
                                { num: 6, txt: "اضغط زر 'RUN' أو (Ctrl+Enter)" },
                                { num: 7, txt: "✅ سترى 'Success. No rows returned' = ممتاز!" },
                                { num: 8, txt: "ارجع هنا ← اضغط '🩺 ابدأ التشخيص' ← جرّب الإضافة" }
                              ].map((step) => (
                                <div key={step.num} className="flex items-start gap-2 text-xs">
                                  <div className="h-5 w-5 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">{step.num}</div>
                                  <span className="text-slate-700 flex-1">{step.txt}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ملاحظة عن Storage للصور */}
                          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 space-y-2">
                            <p className="text-xs font-bold text-sky-900">🖼️ بالنسبة لرفع الصور للسحابة:</p>
                            <ol className="text-[11px] text-slate-700 space-y-1 list-decimal list-inside pr-2">
                              <li>في Supabase ← القائمة اليسرى ← <strong>Storage</strong></li>
                              <li>اضغط <strong>New bucket</strong></li>
                              <li>الاسم: <code className="bg-white px-1.5 py-0.5 rounded font-bold">products</code></li>
                              <li>✅ فعّل <strong>Public bucket</strong></li>
                              <li>اضغط <strong>Save</strong></li>
                            </ol>
                            <p className="text-[10px] text-slate-500 italic">
                              💡 بدون هذا، الصور ستُحفظ كـ base64 داخل قاعدة البيانات (يعمل لكن أبطأ)
                            </p>
                          </div>

                          {/* خيار متقدم */}
                          <details className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <summary className="text-xs font-bold text-slate-700 cursor-pointer">⚙️ للمستخدمين المتقدمين: كود RLS مع سياسات مفتوحة</summary>
                            <div className="mt-3 space-y-2">
                              <p className="text-[11px] text-slate-600">
                                إذا تريد إبقاء RLS مفعّل (أكثر أماناً) لكن مع سياسات مفتوحة:
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(SUPABASE_FIX_RLS_ADVANCED).then(() => {
                                    showAlert("✓ تم نسخ الكود المتقدم");
                                  });
                                }}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5"
                              >
                                <Copy className="h-3 w-3" />
                                نسخ الكود المتقدم (RLS مع سياسات)
                              </button>
                            </div>
                          </details>
                        </div>

                        {/* Quick test add product */}
                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 font-semibold text-center">
                          💡 بعد تنفيذ الإصلاح، جرّب إضافة منتج جديد - يجب أن يعمل!
                        </div>
                      </div>
                    )}

                    {/* HOW IT WORKS */}
                    <div className="bg-gradient-to-l from-sky-50 via-white to-emerald-50 border-2 border-sky-200 rounded-3xl p-6 space-y-4">
                      <h3 className="font-bold text-slate-950 text-base">🔄 كيف يعمل التزامن بعد التفعيل؟</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {[
                          { num: "1", title: "تضيف منتج", desc: "من لوحة التحكم", icon: "➕" },
                          { num: "2", title: "يُرسل لـ Supabase", desc: "في أقل من ثانية", icon: "📤" },
                          { num: "3", title: "يُحفظ بالسحابة", desc: "في قاعدة بيانات", icon: "☁️" },
                          { num: "4", title: "يظهر لكل العملاء", desc: "في كل اليمن", icon: "🌍" }
                        ].map((s) => (
                          <div key={s.num} className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                            <div className="text-3xl">{s.icon}</div>
                            <p className="font-bold text-slate-900 text-xs">{s.title}</p>
                            <p className="text-[10px] text-slate-500">{s.desc}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 font-semibold">
                        💡 <strong>نصيحة:</strong> بعد تفعيل السحابة، جرّب إضافة منتج جديد. افتح الموقع في متصفح آخر أو في وضع التصفح الخفي - ستراه يظهر! 🎉
                      </div>
                    </div>

                    {/* Why supabase free */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                      <h3 className="font-bold text-slate-950 text-sm">لماذا Supabase؟</h3>
                      <ul className="text-xs text-slate-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>مجاني تماماً</strong> - 500 ميجابايت + 50,000 طلب شهرياً (يكفي لآلاف العملاء)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>قاعدة بيانات PostgreSQL</strong> حقيقية وموثوقة (تستخدمها كبرى الشركات)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>سريع جداً</strong> - سيرفرات حول العالم لتسليم البيانات بسرعة لعملاء اليمن</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>نسخ احتياطية تلقائية</strong> + لا يحتاج صيانة من جانبك</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Dashboard */}
                {adminActiveTab === "dashboard" && (
                  <div className="space-y-6">
                    <div className="text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden" style={{ backgroundColor: settings.primaryColor }}>
                      <div className="space-y-2 text-right z-10">
                        <h3 className="font-extrabold text-white text-lg">أهلاً بك في نظام رويال الإداري</h3>
                        <p className="text-slate-400 text-xs max-w-md">
                          إدارة كاملة لمصنع رويال للأنابيب - الإعدادات والمنتجات والوكلاء والرسائل.
                        </p>
                      </div>
                      <div className="h-20 w-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center shrink-0">
                        <Sliders className="h-10 w-10" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "المنتجات", count: products.length, icon: <Grid className="h-5 w-5" />, color: "sky" },
                        { label: "الوكلاء", count: agents.length, icon: <Users className="h-5 w-5" />, color: "indigo" },
                        { label: "غير مقروء", count: unreadCount, icon: <MessageSquare className="h-5 w-5" />, color: "red" },
                        { label: "العروض", count: banners.length, icon: <ImageIcon className="h-5 w-5" />, color: "amber" }
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className={`h-10 w-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center shrink-0`}>
                            {stat.icon}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900">{stat.count}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="font-bold text-slate-950 text-sm">أحدث الرسائل</h4>
                        <button
                          onClick={() => setAdminActiveTab("messages")}
                          className="text-xs hover:underline font-bold"
                          style={{ color: settings.primaryColor }}
                        >
                          عرض الكل ←
                        </button>
                      </div>
                      {messages.length > 0 ? (
                        <div className="space-y-3">
                          {messages.slice(0, 3).map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-xl border flex justify-between items-start gap-3 ${msg.isRead ? "bg-slate-50 border-slate-200" : "bg-sky-50/40 border-sky-100"
                                }`}
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-slate-900 text-xs">{msg.name}</h5>
                                  <span className="text-[10px] text-slate-400">{msg.createdAt}</span>
                                  {!msg.isRead && <span className="bg-sky-600 text-white text-[9px] px-1.5 py-0.2 rounded font-extrabold">جديدة</span>}
                                </div>
                                <p className="text-slate-700 text-xs font-semibold">{msg.subject}</p>
                                <p className="text-slate-500 text-xs line-clamp-1">{msg.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-xs">صندوق البريد فارغ.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Products Management */}
                {adminActiveTab === "products" && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-slate-950 text-base">إدارة كتالوج المنتجات</h3>
                        <p className="text-slate-500 text-xs mt-0.5">أضف، عدّل، احذف المنتجات - يتم نشرها تلقائياً للعملاء</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setIsProductModalOpen(true);
                        }}
                        className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 hover:opacity-90 w-full sm:w-auto justify-center"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <Plus className="h-4 w-4" />
                        <span>إضافة منتج جديد</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="ابحث باسم المنتج..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <select
                        value={selectedMainCategory}
                        onChange={(e) => {
                          setSelectedMainCategory(e.target.value);
                          setSelectedSubcategory("all");
                        }}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        <option value="all">كل الأقسام</option>
                        <option value="plumbing">السباكة</option>
                        <option value="electricity">الكهرباء</option>
                        <option value="building">مواد البناء</option>
                        <option value="agriculture">الزراعة</option>
                      </select>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                          <tr>
                            <th className="px-5 py-3.5">المنتج</th>
                            <th className="px-5 py-3.5">القسم</th>
                            <th className="px-5 py-3.5">السعر</th>
                            <th className="px-5 py-3.5">الحالة</th>
                            <th className="px-5 py-3.5 text-center">عمليات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredProducts.map((prod) => {
                            const style = getCategoryStyle(prod.category);
                            return (
                              <tr key={prod.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <img src={prod.image} alt={prod.name} className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                                    <div>
                                      <span className="font-extrabold text-slate-900 block line-clamp-1">{prod.name}</span>
                                      <span className="text-[10px] text-slate-400 block">{prod.subcategory}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${style.chip}`}>
                                    {CATEGORY_LABELS[prod.category]}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 font-extrabold" style={{ color: settings.primaryColor }}>
                                  ${prod.price.toFixed(2)}
                                </td>
                                <td className="px-5 py-3.5">
                                  {prod.isAvailable ? (
                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">متوفر</span>
                                  ) : (
                                    <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">غير متوفر</span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingProduct(prod);
                                        setIsProductModalOpen(true);
                                      }}
                                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 hover:text-sky-600 transition-all"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 hover:text-rose-600 transition-all"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Agents Management */}
                {adminActiveTab === "agents" && (
                  <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">إدارة نقاط البيع بالمحافظات</h3>
                        <p className="text-slate-500 text-xs mt-0.5">إضافة وتوثيق نقاط البيع في كافة المحافظات اليمنية</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingAgent(null);
                          setIsAgentModalOpen(true);
                        }}
                        className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 hover:opacity-90 w-full sm:w-auto justify-center"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <Plus className="h-4 w-4" />
                        <span>إضافة نقطة بيع</span>
                      </button>
                    </div>

                    <select
                      value={selectedGovernorate}
                      onChange={(e) => setSelectedGovernorate(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      {YEMEN_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>

                    {filteredAgents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredAgents.map((ag) => (
                          <div key={ag.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                              <img src={ag.logoUrl} alt={ag.name} className="h-12 w-12 rounded-xl object-cover border border-slate-200 bg-white" />
                              <div className="space-y-1 flex-1">
                                <h5 className="font-bold text-slate-900 text-xs leading-snug">{ag.name}</h5>
                                <p className="text-slate-500 text-[10px] flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span>{ag.address}</span>
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                              <span className="text-slate-700 text-xs font-semibold" dir="ltr">{ag.phone}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingAgent(ag);
                                    setIsAgentModalOpen(true);
                                  }}
                                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-sky-600"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAgent(ag.id)}
                                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        لا توجد نقاط بيع في {selectedGovernorate}.
                      </div>
                    )}
                  </div>
                )}

                {/* Banners Management */}
                {adminActiveTab === "banners" && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <h3 className="font-bold text-slate-950 text-base">إدارة البانرات والعروض</h3>
                      <button
                        onClick={() => {
                          setEditingBanner(null);
                          setIsBannerModalOpen(true);
                        }}
                        className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 hover:opacity-90 w-full sm:w-auto justify-center"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <Plus className="h-4 w-4" />
                        <span>إضافة بانر جديد</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {banners.map((ban) => (
                        <div key={ban.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="h-36 bg-slate-200 relative">
                            <img src={ban.imageUrl} alt={ban.title} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 p-4 flex flex-col justify-end text-white">
                              <h5 className="font-bold text-xs leading-snug line-clamp-1">{ban.title}</h5>
                              <p className="text-[10px] text-slate-200 line-clamp-1 mt-0.5">{ban.subtitle}</p>
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="text-[11px] text-slate-500">ينتهي في: <strong>{ban.expiryDate}</strong></div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingBanner(ban);
                                  setIsBannerModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-sky-600 text-[11px] font-bold transition-all"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteBanner(ban.id)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-rose-600 text-[11px] font-bold transition-all"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {adminActiveTab === "messages" && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-950 text-base">صندوق بريد الرسائل</h3>
                    {messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-5 rounded-2xl border ${msg.isRead ? "bg-slate-50 border-slate-200" : "bg-sky-50/40 border-sky-100"}`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-100 pb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-slate-900 text-sm">{msg.name}</h4>
                                  <span className="text-[10px] text-slate-400">{msg.createdAt}</span>
                                  {!msg.isRead && <span className="bg-sky-600 text-white text-[9px] px-1.5 py-0.2 rounded font-black">جديدة</span>}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                  <span dir="ltr">📞 {msg.phone}</span>
                                  <span>✉️ {msg.email}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold bg-white border border-slate-200 px-3 py-1 rounded-lg" style={{ color: settings.primaryColor }}>
                                {msg.subject}
                              </span>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap bg-white/50 p-4 rounded-xl border border-slate-100 my-3">
                              {msg.message}
                            </p>
                            <div className="flex items-center justify-end gap-2">
                              {!msg.isRead && (
                                <button
                                  onClick={() => handleMarkMessageRead(msg.id)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>مقروء</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="px-4 py-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold"
                              >
                                <Trash2 className="h-3.5 w-3.5 inline" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-slate-400 text-xs bg-slate-50 rounded-3xl">صندوق البريد فارغ</div>
                    )}
                  </div>
                )}

                {/* Settings */}
                {adminActiveTab === "settings" && (
                  <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    <div>
                      <h3 className="font-bold text-slate-950 text-base">إعدادات المصنع والهوية</h3>
                      <p className="text-slate-500 text-xs mt-0.5">تعديل البيانات الأساسية - تطبق فوراً وتزامن مع السحابة</p>
                    </div>

                    {/* Logo + Tagline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">اسم المصنع</label>
                        <input type="text" name="logoText" defaultValue={settings.logoText} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">الشعار التسويقي</label>
                        <input type="text" name="tagline" defaultValue={settings.tagline} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                    </div>

                    {/* Sales manager + year */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">اسم مسؤول المبيعات</label>
                        <input type="text" name="salesManager" defaultValue={settings.salesManager} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">سنة التأسيس</label>
                        <input type="text" name="foundedYear" defaultValue={settings.foundedYear} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                    </div>

                    {/* 4 Phone numbers */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
                      <h4 className="font-bold text-slate-900 text-xs">أرقام الهواتف (4 أقسام):</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-emerald-700 block">📞 المبيعات</label>
                          <input type="text" name="phoneSales" defaultValue={settings.phoneSales} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" dir="ltr" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-sky-700 block">🧮 الحسابات</label>
                          <input type="text" name="phoneAccounts" defaultValue={settings.phoneAccounts} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" dir="ltr" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-amber-700 block">❓ الاستفسار</label>
                          <input type="text" name="phoneInquiry" defaultValue={settings.phoneInquiry} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" dir="ltr" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-rose-700 block">🚚 التوصيل</label>
                          <input type="text" name="phoneDelivery" defaultValue={settings.phoneDelivery} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" dir="ltr" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">واتساب (دولي)</label>
                        <input type="text" name="whatsapp" defaultValue={settings.whatsapp} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" dir="ltr" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">البريد الإلكتروني</label>
                        <input type="email" name="email" defaultValue={settings.email} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">العنوان</label>
                      <input type="text" name="address" defaultValue={settings.address} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">فيسبوك</label>
                        <input type="text" name="facebook" defaultValue={settings.facebook} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">تويتر/X</label>
                        <input type="text" name="twitter" defaultValue={settings.twitter} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">إنستغرام</label>
                        <input type="text" name="instagram" defaultValue={settings.instagram} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">اللون الأساسي</label>
                        <div className="flex items-center gap-3">
                          <input type="color" name="primaryColor" defaultValue={settings.primaryColor} className="h-10 w-14 rounded-xl border border-slate-200 cursor-pointer" />
                          <span className="text-xs text-slate-500 font-semibold">{settings.primaryColor}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">اللون الثانوي</label>
                        <div className="flex items-center gap-3">
                          <input type="color" name="secondaryColor" defaultValue={settings.secondaryColor} className="h-10 w-14 rounded-xl border border-slate-200 cursor-pointer" />
                          <span className="text-xs text-slate-500 font-semibold">{settings.secondaryColor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="font-bold text-slate-900 text-xs">محتوى صفحة "عن المصنع":</h4>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">الرؤية</label>
                        <textarea name="aboutVision" rows={3} defaultValue={settings.aboutVision} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"></textarea>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">الرسالة</label>
                        <textarea name="aboutMission" rows={3} defaultValue={settings.aboutMission} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"></textarea>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">الهدف</label>
                        <textarea name="aboutGoal" rows={3} defaultValue={settings.aboutGoal} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"></textarea>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">تاريخ التأسيس والإنجازات</label>
                        <textarea name="aboutHistory" rows={4} defaultValue={settings.aboutHistory} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"></textarea>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-lg transition-all hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>
                      💾 حفظ الإعدادات وتطبيقها فوراً
                    </button>
                  </form>
                )}

                {/* Cloud Deployment & PHP Backend - INTERACTIVE GUIDE */}
                {adminActiveTab === "deployment" && (
                  <div className="space-y-6">
                    {/* Hero Banner */}
                    <div className="bg-gradient-to-l from-sky-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"></div>
                      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
                      <div className="relative space-y-3">
                        <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-full">
                          <Cloud className="h-3 w-3" />
                          <span>دليل النشر السحابي التفاعلي</span>
                        </span>
                        <h2 className="text-2xl font-black">انشر موقعك على السحابة في 10 خطوات</h2>
                        <p className="text-sky-100 text-sm max-w-2xl leading-relaxed">
                          سيصبح موقعك متاحاً لكل عملائك في اليمن والعالم. عند إضافة أي منتج، يُحفظ في قاعدة بيانات MySQL حقيقية وينتشر فوراً.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold">
                            💰 التكلفة: ~$36/سنة فقط
                          </span>
                          <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold">
                            ⏱️ الوقت: 30-45 دقيقة
                          </span>
                          <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold">
                            🔒 SSL مجاني
                          </span>
                        </div>
                        <div className="pt-4 flex flex-wrap gap-3">
                          <button
                            onClick={handleDownloadZip}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50"
                          >
                            <Download className="h-5 w-5" />
                            <span>{isDownloading ? "جاري التحميل..." : "📦 تحميل ملفات الموقع (ZIP)"}</span>
                          </button>
                          <button
                            onClick={() => setAdminActiveTab("files")}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl backdrop-blur-sm transition-all"
                          >
                            <FileCode className="h-5 w-5" />
                            <span>تصفح الملفات</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Hosting Options */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-950 text-base">📍 الخطوة 1: اختر الاستضافة المناسبة</h3>
                        <p className="text-slate-500 text-xs mt-1">قارن بين أفضل 3 استضافات سحابية موصى بها</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-300 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                          <span className="absolute top-3 left-3 bg-amber-400 text-slate-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full">الأفضل ⭐</span>
                          <div className="flex items-center gap-2 pt-4">
                            <Globe className="h-6 w-6 text-purple-600" />
                            <h4 className="font-bold text-purple-900 text-base">Hostinger</h4>
                          </div>
                          <p className="text-2xl font-black text-purple-900">$1.99<span className="text-xs text-slate-500 font-bold">/شهر</span></p>
                          <ul className="text-xs text-slate-600 space-y-1">
                            <li>✓ نطاق مجاني سنة كاملة</li>
                            <li>✓ SSL/HTTPS مجاني</li>
                            <li>✓ PHP 8 + MySQL</li>
                            <li>✓ لوحة تحكم عربية</li>
                            <li>✓ دعم فني 24/7</li>
                          </ul>
                          <a href="https://www.hostinger.com/web-hosting" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all">
                            🚀 اشترك الآن
                          </a>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 pt-4">
                            <Globe className="h-6 w-6 text-amber-600" />
                            <h4 className="font-bold text-amber-900 text-base">Namecheap</h4>
                          </div>
                          <p className="text-2xl font-black text-amber-900">$2.18<span className="text-xs text-slate-500 font-bold">/شهر</span></p>
                          <ul className="text-xs text-slate-600 space-y-1">
                            <li>✓ نطاق .com بـ $5.98</li>
                            <li>✓ SSL مجاني سنة</li>
                            <li>✓ cPanel المعروف</li>
                            <li>✓ موثوق عالمياً</li>
                            <li>✓ نسخ احتياطي</li>
                          </ul>
                          <a href="https://www.namecheap.com/hosting/shared/" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all">
                            🛒 زيارة الموقع
                          </a>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 pt-4">
                            <Cloud className="h-6 w-6 text-emerald-600" />
                            <h4 className="font-bold text-emerald-900 text-base">DigitalOcean</h4>
                          </div>
                          <p className="text-2xl font-black text-emerald-900">$4<span className="text-xs text-slate-500 font-bold">/شهر</span></p>
                          <ul className="text-xs text-slate-600 space-y-1">
                            <li>✓ سيرفر VPS قوي</li>
                            <li>✓ قابل للتوسع</li>
                            <li>✓ للمشاريع الكبيرة</li>
                            <li>✓ سرعة عالية جداً</li>
                            <li>⚠️ يحتاج خبرة تقنية</li>
                          </ul>
                          <a href="https://www.digitalocean.com/pricing" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all">
                            ☁️ زيارة الموقع
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* The 10 Steps Timeline */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-950 text-base">🎯 الخطوات التفصيلية للنشر (10 خطوات)</h3>
                        <p className="text-slate-500 text-xs mt-1">اتبع هذه الخطوات بالترتيب لنشر موقعك بنجاح</p>
                      </div>

                      <div className="relative border-r-2 border-sky-200 mr-5 space-y-6 py-4">
                        {[
                          {
                            num: 1,
                            title: "شراء الاستضافة + النطاق",
                            desc: "اشترك في Hostinger (الأسهل) واحصل على نطاق مجاني مثل royal-pipes.com",
                            action: "اذهب للموقع",
                            link: "https://www.hostinger.com/web-hosting",
                            color: "sky"
                          },
                          {
                            num: 2,
                            title: "إنشاء قاعدة بيانات MySQL",
                            desc: "من hPanel ← Databases ← MySQL Databases ← Create Database",
                            details: "اسم القاعدة: royal_db | اسم المستخدم: royal_user | كلمة المرور: قوية",
                            color: "emerald"
                          },
                          {
                            num: 3,
                            title: "استيراد ملف db.sql",
                            desc: "افتح phpMyAdmin ← اختر royal_db ← Import ← ارفع ملف php-backend/db.sql",
                            details: "سيتم إنشاء 6 جداول مع 24 منتج و 8 وكلاء جاهزة",
                            color: "amber"
                          },
                          {
                            num: 4,
                            title: "تعديل ملف config.php",
                            desc: "افتح php-backend/config.php وعدّل بيانات الاتصال بقاعدة البيانات",
                            code: `define('DB_USER', 'u123_royal_user');\ndefine('DB_PASS', 'YourStrongPass');\ndefine('DB_NAME', 'u123_royal_db');`,
                            color: "rose"
                          },
                          {
                            num: 5,
                            title: "رفع ملفات PHP للسيرفر",
                            desc: "ارفع مجلد php-backend كاملاً إلى public_html/api/ عبر File Manager أو FTP",
                            details: "الملفات: config.php, api.php, upload.php, .htaccess + مجلد uploads/",
                            color: "purple"
                          },
                          {
                            num: 6,
                            title: "اختبار الـ API",
                            desc: "افتح في المتصفح: https://yourdomain.com/api/api.php?action=get_products",
                            details: "إذا ظهرت قائمة JSON بالمنتجات = الـ API يعمل ✓",
                            color: "indigo"
                          },
                          {
                            num: 7,
                            title: "تفعيل الـ API في الواجهة",
                            desc: "افتح src/utils/api.ts وغيّر USE_CLOUD_API إلى true",
                            code: `export const USE_CLOUD_API = true;\nexport const API_BASE = "https://royal-pipes.com/api/api.php";`,
                            color: "cyan"
                          },
                          {
                            num: 8,
                            title: "بناء الموقع ورفعه",
                            desc: "نفّذ npm run build على حاسوبك ثم ارفع محتوى dist/ إلى public_html/",
                            code: `npm install\nnpm run build\n# ثم ارفع محتوى dist/ للسيرفر`,
                            color: "fuchsia"
                          },
                          {
                            num: 9,
                            title: "تفعيل SSL/HTTPS",
                            desc: "من hPanel ← Security ← SSL ← اختر النطاق ← Install (مجاني)",
                            details: "سيظهر القفل الأخضر 🔒 في المتصفح خلال 5-10 دقائق",
                            color: "green"
                          },
                          {
                            num: 10,
                            title: "تغيير كلمة مرور المدير ⚠️",
                            desc: "ادخل لوحة التحكم بـ admin/admin123 وغيّر كلمة المرور فوراً",
                            details: "هذه الخطوة ضرورية جداً لأمان الموقع - لا تتجاهلها!",
                            color: "red"
                          }
                        ].map((step) => (
                          <div key={step.num} className="relative pr-10">
                            <div
                              className={`absolute right-[-13px] top-0 h-7 w-7 rounded-full text-white font-extrabold text-xs flex items-center justify-center border-4 border-white shadow-lg bg-${step.color}-600`}
                              style={{ backgroundColor: ['sky', 'emerald', 'amber', 'rose', 'purple', 'indigo', 'cyan', 'fuchsia', 'green', 'red'].includes(step.color) ? '' : settings.primaryColor }}
                            >
                              {step.num}
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-sky-300 hover:bg-white transition-all">
                              <h4 className="font-extrabold text-slate-900 text-sm mb-1">{step.title}</h4>
                              <p className="text-slate-600 text-xs leading-relaxed">{step.desc}</p>
                              {step.details && (
                                <p className="mt-2 text-[11px] text-slate-500 bg-white border border-slate-200 p-2 rounded-lg">
                                  💡 {step.details}
                                </p>
                              )}
                              {step.code && (
                                <pre className="mt-2 bg-slate-950 text-emerald-300 p-3 rounded-lg text-[10px] font-mono overflow-x-auto select-all">
                                  {step.code}
                                </pre>
                              )}
                              {step.link && (
                                <a
                                  href={step.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg transition-all"
                                >
                                  {step.action} ↗
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* How sync works */}
                    <div className="bg-gradient-to-l from-emerald-50 via-white to-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <h4 className="font-bold text-emerald-800 text-base flex items-center gap-2">
                        <Cloud className="h-5 w-5" />
                        <span>🌐 كيف ينتشر منتجك للعملاء في كل اليمن؟</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-emerald-100 rounded-2xl p-4 text-center space-y-2 relative">
                          <div className="h-10 w-10 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black">1</div>
                          <p className="text-xs font-bold text-slate-900">أنت تضيف منتج</p>
                          <p className="text-[10px] text-slate-500">من لوحة التحكم</p>
                        </div>
                        <div className="bg-white border border-emerald-100 rounded-2xl p-4 text-center space-y-2">
                          <div className="h-10 w-10 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black">2</div>
                          <p className="text-xs font-bold text-slate-900">يُرسل للسيرفر</p>
                          <p className="text-[10px] text-slate-500">عبر api.php الآمن</p>
                        </div>
                        <div className="bg-white border border-emerald-100 rounded-2xl p-4 text-center space-y-2">
                          <div className="h-10 w-10 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black">3</div>
                          <p className="text-xs font-bold text-slate-900">يُحفظ في MySQL</p>
                          <p className="text-[10px] text-slate-500">على السحابة</p>
                        </div>
                        <div className="bg-white border border-emerald-100 rounded-2xl p-4 text-center space-y-2">
                          <div className="h-10 w-10 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black">4</div>
                          <p className="text-xs font-bold text-slate-900">يظهر للعملاء فوراً</p>
                          <p className="text-[10px] text-slate-500">في كل المحافظات</p>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-800 text-center bg-emerald-100/50 p-3 rounded-xl border border-emerald-200">
                        ⚡ <strong>الوقت من الإضافة للظهور: أقل من 2 ثانية!</strong> - يعمل على كل أنحاء العالم وليس فقط اليمن
                      </p>
                    </div>

                    {/* Cost Calculator */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="font-bold text-slate-950 text-base flex items-center gap-2">
                        💰 <span>التكلفة السنوية الإجمالية</span>
                      </h3>
                      <div className="space-y-2">
                        {[
                          { item: "استضافة Hostinger Premium (12 شهر)", price: "$23.88", note: "للسنة الأولى" },
                          { item: "نطاق .com", price: "مجاني ✓", note: "السنة الأولى مع الاستضافة" },
                          { item: "شهادة SSL/HTTPS", price: "مجاني ✓", note: "Let's Encrypt" },
                          { item: "نسخ احتياطي يومي", price: "مجاني ✓", note: "تلقائي من Hostinger" },
                          { item: "دعم فني 24/7", price: "مجاني ✓", note: "بالعربية أيضاً" }
                        ].map((cost, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{cost.item}</p>
                              <p className="text-[10px] text-slate-500">{cost.note}</p>
                            </div>
                            <span className={`font-extrabold text-sm ${cost.price.includes("مجاني") ? "text-emerald-600" : "text-sky-700"}`}>
                              {cost.price}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gradient-to-l from-amber-100 to-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-amber-800 text-xs font-bold">الإجمالي السنوي</p>
                          <p className="text-amber-900 text-3xl font-black">$24 فقط</p>
                          <p className="text-amber-700 text-[10px] mt-1">~ 6,000 ريال يمني / السنة</p>
                        </div>
                        <div className="text-6xl">💎</div>
                      </div>
                    </div>

                    {/* Common Issues */}
                    <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-4">
                      <h3 className="font-bold text-rose-800 text-base flex items-center gap-2">
                        🆘 <span>حل المشاكل الشائعة</span>
                      </h3>
                      <div className="space-y-3">
                        {[
                          {
                            q: "فشل الاتصال بقاعدة البيانات؟",
                            a: "راجع config.php - تأكد من اسم القاعدة الكامل (مثل u123456_royal_db) وكلمة المرور."
                          },
                          {
                            q: "خطأ CORS في المتصفح؟",
                            a: "تأكد أن ملف .htaccess موجود في مجلد api/ - في Hostinger يعمل تلقائياً."
                          },
                          {
                            q: "المنتجات لا تظهر بعد الإضافة؟",
                            a: "تأكد من تعديل USE_CLOUD_API = true في src/utils/api.ts ثم إعادة بناء الموقع."
                          },
                          {
                            q: "الصور لا تُرفع؟",
                            a: "أعطِ مجلد uploads/ صلاحيات 755 من File Manager (بزر الفأرة الأيمن)."
                          }
                        ].map((faq, i) => (
                          <details key={i} className="bg-white border border-rose-100 rounded-xl p-3 cursor-pointer">
                            <summary className="font-bold text-slate-900 text-xs">{faq.q}</summary>
                            <p className="mt-2 text-slate-600 text-xs leading-relaxed pr-2">{faq.a}</p>
                          </details>
                        ))}
                      </div>
                    </div>

                    {/* Final CTA */}
                    <div className="text-white rounded-3xl p-8 text-center space-y-4 relative overflow-hidden" style={{ backgroundColor: settings.primaryColor }}>
                      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl"></div>
                      <div className="relative space-y-4">
                        <h3 className="text-xl font-black">جاهز للانطلاق؟ 🚀</h3>
                        <p className="text-slate-300 text-xs max-w-md mx-auto">
                          ابدأ الآن بشراء الاستضافة واتبع الخطوات أعلاه. سيكون موقعك متاحاً لكل عملائك في اليمن خلال أقل من ساعة!
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            onClick={handleDownloadZip}
                            disabled={isDownloading}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            <Download className="h-4 w-4" />
                            {isDownloading ? "جاري..." : "تحميل الملفات الآن"}
                          </button>
                          <a
                            href="https://www.hostinger.com/web-hosting"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition-all"
                          >
                            🛒 اشترك في Hostinger
                          </a>
                          <a
                            href={`https://wa.me/${settings.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all"
                          >
                            💬 طلب مساعدة فنية
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ====== Files Download & Preview Tab ====== */}
                {adminActiveTab === "files" && (
                  <div className="space-y-6">
                    {/* Hero */}
                    <div className="bg-gradient-to-l from-emerald-600 via-teal-700 to-cyan-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"></div>
                      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                      <div className="relative space-y-4">
                        <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-full">
                          <Package className="h-3 w-3" />
                          <span>تحميل ملفات الموقع الكاملة</span>
                        </span>
                        <h2 className="text-2xl font-black">📦 ملفات الموقع جاهزة للتحميل والرفع</h2>
                        <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
                          حمّل كل ملفات الباك إند (PHP + SQL + Apache + Upload) كحزمة واحدة ZIP، أو حمّل/اعرض كل ملف بشكل منفصل لمراجعته قبل الرفع.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={handleDownloadZip}
                            disabled={isDownloading}
                            className="flex items-center gap-3 px-8 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-base rounded-xl shadow-2xl transition-all disabled:opacity-50 hover:scale-105"
                          >
                            <Download className="h-6 w-6" />
                            <span>{isDownloading ? "⏳ جاري إنشاء الملف..." : "تحميل royal-website-backend.zip"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* What's Inside Card */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                      <div>
                        <h3 className="font-bold text-slate-950 text-base flex items-center gap-2">
                          <Package className="h-5 w-5 text-emerald-600" />
                          ما يحتويه ملف الـ ZIP؟
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">حزمة كاملة جاهزة للرفع المباشر على استضافتك السحابية</p>
                      </div>
                      <div className="bg-slate-950 text-slate-300 p-5 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto">
                        <div className="text-amber-400">📦 royal-website-backend.zip</div>
                        <div className="text-slate-500">│</div>
                        <div className="text-slate-400">└── 📁 royal-website/</div>
                        <div className="text-slate-500">     │</div>
                        <div className="text-emerald-400">     ├── 📄 ابدأ_من_هنا.txt          <span className="text-slate-500"># خطوات النشر السريع</span></div>
                        <div className="text-emerald-400">     ├── 📄 README.md                 <span className="text-slate-500"># دليل تقني</span></div>
                        <div className="text-sky-400">     ├── 🗄️  db.sql                    <span className="text-slate-500"># قاعدة البيانات الكاملة</span></div>
                        <div className="text-slate-500">     │</div>
                        <div className="text-purple-400">     └── 📁 api/                       <span className="text-slate-500"># ارفعه لـ public_html/api/</span></div>
                        <div className="text-purple-400">          ├── 🔌 api.php               <span className="text-slate-500"># REST API الكامل</span></div>
                        <div className="text-purple-400">          ├── ⚙️  config.php           <span className="text-slate-500"># إعدادات الاتصال</span></div>
                        <div className="text-purple-400">          ├── 🖼️  upload.php           <span className="text-slate-500"># رفع الصور</span></div>
                        <div className="text-purple-400">          ├── 🛡️  .htaccess            <span className="text-slate-500"># أمان Apache + CORS</span></div>
                        <div className="text-purple-400">          └── 📁 uploads/              <span className="text-slate-500"># مجلد الصور (755)</span></div>
                      </div>
                    </div>

                    {/* Individual Files */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-950 text-base flex items-center gap-2">
                          <FileCode className="h-5 w-5 text-sky-600" />
                          الملفات الفردية - تصفح وتحميل
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">اعرض محتوى أي ملف للمراجعة قبل الرفع، أو نسخه/تحميله بشكل منفصل</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(FILES).map(([filename, file]) => (
                          <div
                            key={filename}
                            className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-4 transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <span className="text-2xl shrink-0">{file.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 text-sm font-mono truncate">{filename}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {(file.content.length / 1024).toFixed(1)} كيلوبايت • {file.content.split("\n").length} سطر
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => setPreviewFile(filename)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-all"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>معاينة</span>
                              </button>
                              <button
                                onClick={() => handleCopyFile(file.content)}
                                className="flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-all"
                                title="نسخ المحتوى"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownloadFile(filename.replace(" (للواجهة)", ""), file.content)}
                                className="flex items-center justify-center gap-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg transition-all"
                                title="تحميل الملف"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Steps - Visual */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="font-bold text-slate-950 text-base flex items-center gap-2">
                        <Server className="h-5 w-5 text-amber-600" />
                        ⚡ الخطوات السريعة بعد التحميل
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                          {
                            num: "1",
                            title: "افتح ملف ZIP",
                            desc: "فك ضغط royal-website-backend.zip",
                            color: "sky",
                            icon: <Package className="h-5 w-5" />
                          },
                          {
                            num: "2",
                            title: "اقرأ ابدأ_من_هنا.txt",
                            desc: "يحتوي على كل الخطوات بالعربي",
                            color: "amber",
                            icon: <FileText className="h-5 w-5" />
                          },
                          {
                            num: "3",
                            title: "عدّل config.php",
                            desc: "ضع بيانات قاعدة البيانات",
                            color: "rose",
                            icon: <Settings className="h-5 w-5" />
                          },
                          {
                            num: "4",
                            title: "ارفع للسيرفر",
                            desc: "عبر File Manager أو FTP",
                            color: "emerald",
                            icon: <Cloud className="h-5 w-5" />
                          }
                        ].map((step) => (
                          <div key={step.num} className={`bg-${step.color}-50 border-2 border-${step.color}-200 rounded-2xl p-4 text-center space-y-2 relative`}>
                            <div className={`absolute top-2 right-2 h-7 w-7 bg-${step.color}-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow`}>
                              {step.num}
                            </div>
                            <div className={`h-10 w-10 mx-auto bg-${step.color}-100 text-${step.color}-700 rounded-xl flex items-center justify-center mt-3`}>
                              {step.icon}
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-xs">{step.title}</h4>
                            <p className="text-slate-600 text-[10px] leading-relaxed">{step.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Server Path Visualizer */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="font-bold text-slate-950 text-base flex items-center gap-2">
                        <Server className="h-5 w-5 text-purple-600" />
                        📂 كيف يكون شكل الاستضافة بعد الرفع؟
                      </h3>
                      <div className="bg-slate-950 text-slate-300 p-5 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto">
                        <div className="text-purple-400">🌐 yourdomain.com (الاستضافة)</div>
                        <div className="text-slate-500">│</div>
                        <div className="text-amber-400">└── 📁 public_html/                <span className="text-slate-500"># جذر الموقع</span></div>
                        <div className="text-slate-500">     │</div>
                        <div className="text-emerald-400">     ├── 📄 index.html              <span className="text-slate-500"># واجهة React (من dist/)</span></div>
                        <div className="text-slate-500">     │</div>
                        <div className="text-sky-400">     └── 📁 api/                    <span className="text-slate-500"># ملفات PHP</span></div>
                        <div className="text-sky-400">          ├── 🔌 api.php</div>
                        <div className="text-sky-400">          ├── ⚙️  config.php           <span className="text-slate-500"># ← المُعدّل ببياناتك</span></div>
                        <div className="text-sky-400">          ├── 🖼️  upload.php</div>
                        <div className="text-sky-400">          ├── 🛡️  .htaccess</div>
                        <div className="text-sky-400">          └── 📁 uploads/              <span className="text-slate-500"># صلاحيات 755</span></div>
                        <div className="text-slate-500">────────────────────────────────────</div>
                        <div className="text-emerald-300">✓ موقعك متاح على: https://yourdomain.com</div>
                        <div className="text-emerald-300">✓ الـ API يعمل على: https://yourdomain.com/api/api.php</div>
                      </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-amber-50/70 border-2 border-amber-200 rounded-3xl p-6 space-y-4">
                      <h4 className="font-bold text-amber-900 text-base flex items-center gap-2">
                        ⚠️ <span>ملاحظات مهمة جداً قبل الرفع</span>
                      </h4>
                      <ul className="space-y-3 text-xs text-slate-800 leading-relaxed">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>عدّل ملف config.php</strong> ببيانات قاعدة بياناتك الحقيقية قبل الرفع.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>غيّر JWT_SECRET</strong> في config.php إلى قيمة عشوائية طويلة لضمان أمان جلسات المدير.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>أعطِ مجلد uploads/</strong> صلاحيات 755 من File Manager (بزر اليمين ← Change Permissions).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>غيّر كلمة مرور المدير</strong> (admin123) فور أول دخول لأمان موقعك.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>فعّل SSL مجاناً</strong> من لوحة الاستضافة (Let's Encrypt).</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========== SALES MANAGER CTA (above footer, on all pages) ========== */}
      <section className="py-8 sm:py-10 bg-gradient-to-l from-slate-50 via-white to-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white relative overflow-hidden shadow-xl" style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.primaryColor}dd, ${settings.primaryColor})` }}>
            <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>

            {/* Header row */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center mb-5 sm:mb-6">
              <div className="text-center md:text-right space-y-1">
                <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-200 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-400/30">
                  <Award className="h-3 w-3" />
                  مسؤول المبيعات
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">{settings.salesManager}</h3>
                <p className="text-[11px] opacity-80">جاهز لخدمتكم على مدار اليوم</p>
              </div>
              <div className="md:col-span-2 text-center md:text-right">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">📞 للتواصل المباشر:</h3>
                <p className="text-xs sm:text-sm opacity-90 mt-1 leading-relaxed">
                  اختر القسم المناسب وسنرد عليك فوراً
                </p>
              </div>
            </div>

            {/* Phone numbers grid */}
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <a
                href={`tel:${settings.phoneSales}`}
                className="bg-white/15 hover:bg-emerald-500/40 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:p-4 transition-all flex flex-col items-center gap-1 group"
              >
                <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-emerald-200 font-semibold">المبيعات</span>
                <span className="text-xs sm:text-sm font-extrabold text-white" dir="ltr">{settings.phoneSales}</span>
              </a>
              <a
                href={`tel:${settings.phoneAccounts}`}
                className="bg-white/15 hover:bg-sky-500/40 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:p-4 transition-all flex flex-col items-center gap-1 group"
              >
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-sky-300 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-sky-200 font-semibold">الحسابات</span>
                <span className="text-xs sm:text-sm font-extrabold text-white" dir="ltr">{settings.phoneAccounts}</span>
              </a>
              <a
                href={`tel:${settings.phoneInquiry}`}
                className="bg-white/15 hover:bg-amber-500/40 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:p-4 transition-all flex flex-col items-center gap-1 group"
              >
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-amber-200 font-semibold">الاستفسار</span>
                <span className="text-xs sm:text-sm font-extrabold text-white" dir="ltr">{settings.phoneInquiry}</span>
              </a>
              <a
                href={`tel:${settings.phoneDelivery}`}
                className="bg-white/15 hover:bg-rose-500/40 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:p-4 transition-all flex flex-col items-center gap-1 group"
              >
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-rose-300 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-rose-200 font-semibold">التوصيل</span>
                <span className="text-xs sm:text-sm font-extrabold text-white" dir="ltr">{settings.phoneDelivery}</span>
              </a>
            </div>

            {/* WhatsApp big button */}
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-4 sm:mt-5 w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.487 4.966 1.488 5.4 0 9.791-4.385 9.794-9.78 0-2.614-1.018-5.071-2.868-6.924C16.63 2.083 14.172.822 11.56.822c-5.405 0-9.794 4.386-9.797 9.782-.001 1.838.5 3.618 1.448 5.174l-1.02 3.722 3.866-.964z" />
              </svg>
              <span>دردشة واتساب فورية</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="text-white pt-10 sm:pt-16 pb-6 sm:pb-8" style={{ backgroundColor: settings.primaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          <div className="space-y-3 sm:space-y-4 text-right">
            <div className="flex items-center gap-3">
              <img src="/images/royal-logo.png" alt="Royal" className="h-12 w-12 rounded-lg bg-white/10 p-1" />
              <div>
                <h4 className="text-base font-black tracking-wide text-white">مصنع رويال للأنابيب</h4>
                <p className="text-[10px] text-amber-300 font-bold">منذ {settings.foundedYear} - الجودة بكل المقاييس</p>
              </div>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">{settings.tagline}</p>
            <div className="pt-2">
              <span className="text-[10px] text-white/60 block">العنوان:</span>
              <span className="text-white/80 text-xs">{settings.address}</span>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-bold text-white border-r-4 border-amber-400 pr-3">روابط سريعة</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {[
                { id: "home", label: "الرئيسية" },
                { id: "products", label: "المنتجات" },
                { id: "agents", label: "نقاط البيع" },
                { id: "about", label: "عن المصنع" },
                { id: "contact", label: "اتصل بنا" },
                { id: "admin", label: "لوحة التحكم" }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setActiveTab(l.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-white/70 hover:text-amber-300 transition-colors text-right"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-bold text-white border-r-4 border-amber-400 pr-3">أقسام المنتجات</h4>
            <div className="flex flex-col gap-2 text-xs text-white/70 font-semibold">
              {["plumbing", "electricity", "building", "agriculture"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedMainCategory(cat);
                    setSelectedSubcategory("all");
                    setActiveTab("products");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-amber-300 text-right flex items-center gap-2"
                >
                  {getCategoryIcon(cat)}
                  <span>{CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 pt-5 sm:pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] sm:text-[11px] text-white/60">
          <p className="text-center sm:text-right">© {new Date().getFullYear()} مصنع الأنور للبلاستيك (رويال) - جميع الحقوق محفوظة</p>
          <div className="flex items-center gap-4">
            <span className="text-amber-300 font-bold">⭐ ختم الجودة - SINCE {settings.foundedYear}</span>
          </div>
        </div>
      </footer>

      {/* ========== MODALS ========== */}

      {/* Product Inquiry Modal */}
      {inquiryProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setInquiryProduct(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex gap-4 items-center">
              <img src={inquiryProduct.image} alt={inquiryProduct.name} className="h-16 w-16 rounded-xl object-cover border border-slate-200" />
              <div className="text-right space-y-1 flex-1">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                  {CATEGORY_LABELS[inquiryProduct.category]}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                  استفسار: {inquiryProduct.name}
                </h4>
                <p className="text-slate-500 text-[11px] font-semibold">
                  السعر: <span style={{ color: settings.primaryColor }}>{inquiryProduct.price > 0 ? `$${inquiryProduct.price}` : "اتصل للسعر"}</span>
                </p>
              </div>
            </div>
            <div className="p-6">
              {inquirySuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">تم الإرسال بنجاح!</h4>
                  <p className="text-slate-500 text-xs">سيتصل بك مندوب المبيعات قريباً.</p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">الاسم *</label>
                    <input type="text" required value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} placeholder="الاسم الكامل" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">الجوال *</label>
                      <input type="tel" required value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} placeholder="78XXXXXXX" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">البريد</label>
                      <input type="email" value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} placeholder="email@..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">ملاحظات / الكمية *</label>
                    <textarea required rows={3} value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} placeholder="اكتب الكمية والمواصفات..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"></textarea>
                  </div>
                  <button type="submit" className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: settings.primaryColor }}>
                    <Send className="h-4 w-4" />
                    <span>إرسال الطلب</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Edit/Add Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative border border-slate-200">
            <button
              onClick={() => {
                setIsProductModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-900 text-base">
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h4>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <input type="hidden" name="id" defaultValue={editingProduct?.id || ""} />
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">اسم المنتج *</label>
                <input type="text" required name="name" defaultValue={editingProduct?.name || ""} placeholder="اسم المنتج" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">القسم *</label>
                  <select name="category" defaultValue={editingProduct?.category || "plumbing"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none">
                    <option value="plumbing">السباكة</option>
                    <option value="electricity">الكهرباء</option>
                    <option value="building">مواد البناء</option>
                    <option value="agriculture">الزراعة البلاستيكية</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">القسم الفرعي *</label>
                  <input type="text" required name="subcategory" defaultValue={editingProduct?.subcategory || "مواسير"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">السعر ($) *</label>
                  <input type="number" step="0.01" name="price" defaultValue={editingProduct?.price || 0} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">الوحدة *</label>
                  <input type="text" required name="unit" defaultValue={editingProduct?.unit || "حبة"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">الوصف *</label>
                <textarea name="description" required rows={3} defaultValue={editingProduct?.description || ""} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">المواصفات (سطر لكل مواصفة)</label>
                <textarea name="specifications" rows={3} defaultValue={editingProduct?.specifications?.join("\n") || ""} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none font-mono"></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">صورة المنتج *</label>
                <ImageUpload name="image" defaultValue={editingProduct?.image || ""} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">الحالة</label>
                <select name="isAvailable" defaultValue={editingProduct?.isAvailable !== false ? "true" : "false"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none">
                  <option value="true">متوفر</option>
                  <option value="false">غير متوفر</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>
                {editingProduct ? "💾 تحديث المنتج" : "✓ إضافة المنتج"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Agent Edit/Add Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative border border-slate-200">
            <button
              onClick={() => {
                setIsAgentModalOpen(false);
                setEditingAgent(null);
              }}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-base">
                {editingAgent ? "تعديل بيانات نقطة البيع" : "إضافة نقطة بيع جديدة"}
              </h4>
            </div>
            <form onSubmit={handleSaveAgent} className="p-4 sm:p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <input type="hidden" name="id" defaultValue={editingAgent?.id || ""} />
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">اسم نقطة البيع *</label>
                <input type="text" required name="name" defaultValue={editingAgent?.name || ""} placeholder="مثل: شركة النخبة للتجارة" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">المحافظة *</label>
                  <select name="governorate" defaultValue={editingAgent?.governorate || "صنعاء"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                    {YEMEN_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">الهاتف *</label>
                  <input type="text" required name="phone" defaultValue={editingAgent?.phone || ""} placeholder="77XXXXXXX" dir="ltr" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-left" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">العنوان التفصيلي *</label>
                <input type="text" required name="address" defaultValue={editingAgent?.address || ""} placeholder="مثال: صنعاء - شارع الستين - جوار..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">صورة/شعار نقطة البيع</label>
                <ImageUpload name="logoUrl" defaultValue={editingAgent?.logoUrl || "/images/royal-logo.png"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">الحالة</label>
                <select name="isAuthorized" defaultValue={editingAgent?.isAuthorized !== false ? "true" : "false"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                  <option value="true">معتمدة</option>
                  <option value="false">موقوفة</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>
                {editingAgent ? "💾 حفظ التعديلات" : "✓ إضافة نقطة البيع"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && FILES[previewFile as keyof typeof FILES] && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-5xl w-full shadow-2xl relative border border-slate-200 flex flex-col" style={{ maxHeight: "85vh" }}>
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{FILES[previewFile as keyof typeof FILES].icon}</span>
                <div>
                  <h4 className="font-bold text-white text-sm font-mono">{previewFile}</h4>
                  <p className="text-[10px] text-slate-400">
                    {(FILES[previewFile as keyof typeof FILES].content.length / 1024).toFixed(1)} كيلوبايت •
                    {FILES[previewFile as keyof typeof FILES].content.split("\n").length} سطر •
                    لغة: {FILES[previewFile as keyof typeof FILES].lang}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyFile(FILES[previewFile as keyof typeof FILES].content)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>نسخ</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(previewFile.replace(" (للواجهة)", ""), FILES[previewFile as keyof typeof FILES].content)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>تحميل</span>
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Code area */}
            <div className="bg-slate-950 flex-1 overflow-auto">
              <pre className="p-6 text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre overflow-x-auto select-all" dir="ltr">
                <code>{FILES[previewFile as keyof typeof FILES].content}</code>
              </pre>
            </div>
            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-500 font-semibold">
                💡 يمكنك نسخ المحتوى وحفظه في ملف باسم: <code className="bg-white px-1.5 py-0.5 rounded text-slate-700">{previewFile.replace(" (للواجهة)", "")}</code>
              </span>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Edit/Add Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative border border-slate-200">
            <button
              onClick={() => {
                setIsBannerModalOpen(false);
                setEditingBanner(null);
              }}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-900 text-base">{editingBanner ? "تعديل البانر" : "إضافة بانر جديد"}</h4>
            </div>
            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <input type="hidden" name="id" defaultValue={editingBanner?.id || ""} />
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">العنوان *</label>
                <input type="text" required name="title" defaultValue={editingBanner?.title || ""} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">الوصف *</label>
                <input type="text" required name="subtitle" defaultValue={editingBanner?.subtitle || ""} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">صورة البانر *</label>
                <ImageUpload name="imageUrl" defaultValue={editingBanner?.imageUrl || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">القسم *</label>
                  <select name="link" defaultValue={editingBanner?.link || "plumbing"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                    <option value="plumbing">السباكة</option>
                    <option value="electricity">الكهرباء</option>
                    <option value="building">مواد البناء</option>
                    <option value="agriculture">الزراعة</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">تاريخ الانتهاء *</label>
                  <input type="date" required name="expiryDate" defaultValue={editingBanner?.expiryDate || "2026-12-31"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90" style={{ backgroundColor: settings.primaryColor }}>
                {editingBanner ? "💾 حفظ التعديلات" : "✓ إضافة البانر"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
