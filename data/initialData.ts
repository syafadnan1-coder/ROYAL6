export interface Product {
  id: string;
  name: string;
  category: string; // 'plumbing' | 'electricity' | 'building' | 'agriculture'
  subcategory: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  specifications?: string[];
  isAvailable: boolean;
}

export interface Agent {
  id: string;
  name: string;
  governorate: string;
  phone: string;
  address: string;
  logoUrl?: string;
  isAuthorized: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  expiryDate: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface SiteSettings {
  logoText: string;
  tagline: string;
  salesManager: string;
  phoneSales: string;
  phoneAccounts: string;
  phoneInquiry: string;
  phoneDelivery: string;
  whatsapp: string;
  email: string;
  address: string;
  facebook: string;
  twitter: string;
  instagram: string;
  primaryColor: string;
  secondaryColor: string;
  aboutVision: string;
  aboutMission: string;
  aboutGoal: string;
  aboutHistory: string;
  foundedYear: string;
}

export const YEMEN_GOVERNORATES = [
  "عدن",
  "تعز",
  "حضرموت",
  "إب",
  "الضالع",
  "البيضاء",
  "مأرب",
  "الجوف",
  "صعدة",
  "عمران",
  "ذمار",
  "الحديدة",
  "لحج",
  "أبين",
  "شبوة",
  "المهرة",
  "ريمة",
  "المحويت",
  "حجة",
  "سقطرى"
];

export const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "السباكة",
  electricity: "الكهرباء",
  building: "مواد البناء",
  agriculture: "الزراعة البلاستيكية"
};

export const INITIAL_PRODUCTS: Product[] = [
  // === السباكة (Plumbing) - مواسير رويال يو بي في سي ===
  {
    id: "p1",
    name: "أنابيب رويال UPVC ضغط 16 بار - قطر 4 إنش",
    category: "plumbing",
    subcategory: "مواسير UPVC",
    description: "أنابيب يو بي في سي مصنوعة طبقًا للمواصفات القياسية الألمانية والأمريكية، عديمة التأثر بالأحماض والقلويات والأملاح، مثالية لشبكات مياه الشرب وشبكات الصرف الصحي وأغراض الآبار والصناعة.",
    price: 0,
    unit: "حبة / 5.8 متر",
    image: "images/WhatsApp Image 2026-06-27 at 5.27.13 PM (5).jpeg",
    specifications: ["القطر: 4 إنش (110 ملم)", "السماكة: 4.2 ملم", "الضغط: 16 بار", "وصلة جلبة ربل (حلقة مطاطية)", "المواصفات: ألمانية / أمريكية"],
    isAvailable: true
  },
  {
    id: "p2",
    name: "أنابيب رويال UPVC ضغط 10 بار - قطر 3 إنش",
    category: "plumbing",
    subcategory: "مواسير UPVC",
    description: "مواسير يو بي في سي عالية الجودة لشبكات التغذية والتمديدات الداخلية والخارجية، مقاومة للصدأ والتآكل وذات عمر افتراضي يفوق 50 عاماً.",
    price: 0,
    unit: "حبة / 5.8 متر",
    image: "images/WhatsApp Image 2026-06-24 at 2.25.57 AM (3).jpeg",
    specifications: ["القطر: 3 إنش (75 ملم)", "السماكة: 3.0 ملم", "الضغط: 10 بار", "وصلة جلبة عادية بالغراء", "اللون: رمادي / أبيض"],
    isAvailable: true
  },
  {
    id: "p3",
    name: "أنابيب رويال UPVC للصرف الصحي - قطر 6 إنش",
    category: "plumbing",
    subcategory: "مواسير الصرف الصحي",
    description: "أنابيب صرف صحي ومجاري UPVC ذات جودة عالية مع وصلة جلبة مطاطية محكمة الإغلاق لمنع التسريب نهائياً، تستخدم للشبكات المنزلية والتجارية.",
    price: 0,
    unit: "حبة / 5.8 متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.13 PM (3).jpeg",
    specifications: ["القطر: 6 إنش (160 ملم)", "السماكة: 4.0 ملم", "الضغط: 6 بار", "للصرف الصحي والمجاري", "وصلة بحلقة ربل مطاطية"],
    isAvailable: true
  },
  {
    id: "p4",
    name: "وصلات وكوع رويال UPVC - تشكيلة كاملة",
    category: "plumbing",
    subcategory: "وصلات وقطع UPVC",
    description: "مجموعة كاملة من وصلات وكوع وتي وبرابز وصواميل رويال UPVC من نصف إنش إلى 8 إنش، مصنعة بدقة عالية لتطابق المقاييس الدولية.",
    price: 0,
    unit: "تشكيلة",
    image: "/images/WhatsApp Image 2026-06-27 at 5.27.02 PM (2).jpeg",
    specifications: ["مقاسات: 1/2 إنش إلى 8 إنش", "ختم رويال الأصلي", "أبيض / رمادي", "وصلات غراء وحلقة مطاطية", "ضمان الجودة"],
    isAvailable: true
  },
  {
    id: "p5",
    name: "خزان مياه رويال بولي إيثيلين - 3 طبقات (سعة 1000 لتر)",
    category: "plumbing",
    subcategory: "خزانات مياه بولي إيثيلين",
    description: "خزان مياه صحي بولي إيثيلين ثلاث طبقات معزولة بالكامل تمنع نمو البكتيريا والطحالب، مصنع من مواد غذائية آمنة وصديقة للبيئة.",
    price: 0,
    unit: "خزان",
    image: "/images/WhatsApp Image 2026-06-27 at 5.27.09 PM (1).jpeg",
    specifications: ["السعة: 1000 لتر", "بولي إيثيلين 3 طبقات", "صديق للبيئة وآمن لمياه الشرب", "اللون: أزرق / أبيض", "ضمان 5 سنوات"],
    isAvailable: true
  },
  {
    id: "p6",
    name: "خزان مياه رويال فيبر جلاس - 4 طبقات (سعة 2000 لتر)",
    category: "plumbing",
    subcategory: "خزانات مياه فيبر جلاس",
    description: "خزان فيبر جلاس 4 طبقات معزولة، يحافظ على برودة المياه ويمنع تكون الطحالب نهائياً تحت أشعة الشمس المباشرة.",
    price: 0,
    unit: "خزان",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.01 PM (3).jpeg",
    specifications: ["السعة: 2000 لتر", "فيبر جلاس 4 طبقات", "مقاوم للأشعة فوق البنفسجية", "فتحات تهوية وتصريف مسبقة", "ضمان 10 سنوات"],
    isAvailable: true
  },
  {
    id: "p7",
    name: "أنابيب UPVC للآبار - قطر 6 إنش ضغط 16 بار",
    category: "plumbing",
    subcategory: "حافظات ومواسير الآبار",
    description: "أنابيب آبار رويال عالية الضغط مصممة خصيصاً للاستخدام في حافظات الآبار وأنابيب الضخ، تتحمل الضغط العالي وعمق الآبار.",
    price: 0,
    unit: "حبة / 5.8 متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.13 PM (4).jpeg",
    specifications: ["القطر: 6 إنش", "الضغط: 16 بار", "السماكة: 7.7 ملم", "مقاومة عالية للضغط", "للآبار العميقة والضحلة"],
    isAvailable: true
  },
  {
    id: "p8",
    name: "كوع رويال UPVC زاوية 90 درجة - 4 إنش",
    category: "plumbing",
    subcategory: "وصلات وقطع UPVC",
    description: "كوع 90 درجة يو بي في سي عالي الجودة للربط بين الأنابيب، مقاوم لضغط المياه العالي والتسريب.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.00 PM (1).jpeg",
    specifications: ["القطر: 4 إنش (110 ملم)", "المادة: UPVC متين", "الزاوية: 90 درجة", "وصلة بالغراء", "الضغط: PN16"],
    isAvailable: true
  },
  {
    id: "p9",
    name: "تي (قسام) رويال UPVC متساوي - 3 إنش",
    category: "plumbing",
    subcategory: "وصلات وقطع UPVC",
    description: "وصلة تي ثلاثية متساوية الأطراف لتفرع شبكات المياه والصرف الصحي، متانة ممتازة وسهولة في التركيب.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.00 PM.jpeg",
    specifications: ["المقاس: 3 إنش (75 ملم)", "النوع: متساوي T-Joint", "المادة: UPVC عالي النقاوة", "مقاوم للمواد الكيميائية", "الضغط: PN16"],
    isAvailable: true
  },
  {
    id: "p10",
    name: "محبس كروي رويال UPVC - مقاس 2 إنش",
    category: "plumbing",
    subcategory: "محابس وصمامات",
    description: "محبس كرة بلاستيكي ذو كفاءة عالية للتحكم بتدفق المياه وإغلاق الخطوط بالكامل، مقاوم للكلور والمواد الكيميائية.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-24 at 1.50.47 AM.jpeg",
    specifications: ["المقاس: 2 إنش", "المادة: UPVC", "يد تحكم مرنة وسهلة الاستخدام", "إغلاق محكم بنسبة 100%", "مقاوم لترسب الأملاح"],
    isAvailable: true
  },
  {
    id: "p11",
    name: "أنابيب رويال PPR للمياه الحارة والباردة - 32 ملم",
    category: "plumbing",
    subcategory: "مواسير وقطع PPR",
    description: "أنابيب بولي بروبلين (PPR) للتأسيس الداخلي للمياه الحارة والباردة، عزل حراري ممتاز وتتحمل درجات الحرارة المرتفعة.",
    price: 0,
    unit: "حبة / 4 متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.13 PM (1).jpeg",
    specifications: ["القطر الخارجي: 32 ملم (1 بوصة)", "المادة: بولي بروبلين كوبوليمر عشوائي", "تحمل حراري يصل لـ 95 درجة مئوية", "عمر افتراضي يزيد عن 50 سنة", "اللون: أخضر / أبيض"],
    isAvailable: true
  },
  {
    id: "p12",
    name: "كوع PPR رويال بسن نحاسي داخلي - 25 ملم × 1/2 إنش",
    category: "plumbing",
    subcategory: "مواسير وقطع PPR",
    description: "كوع PPR مدمج بسن نحاسي داخلي لتوصيل أنابيب التغذية بالخلاطات ومنافذ مياه الاستحمام والغسيل بمتانة فائقة.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.01 PM (2).jpeg",
    specifications: ["المقاس: 25 ملم × 1/2 إنش", "سن نحاسي داخلي عالي الجودة", "اللحام: حراري بمكواة اللحام", "مقاومة كاملة للتسريب والصدأ"],
    isAvailable: true
  },
  {
    id: "p13",
    name: "غراء رويال الأصلي للأنابيب UPVC - علبة 500 جرام",
    category: "plumbing",
    subcategory: "أدوات ومستلزمات السباكة",
    description: "مادة لاصقة مذيبة فائقة القوة مخصصة لربط مواسير وقطع UPVC ببعضها البعض، تضمن لحاماً كيميائياً صلباً مانعاً للتسريب.",
    price: 0,
    unit: "علبة",
    image: "./images/WhatsApp Image 2026-06-24 at 1.50.31 AM.jpeg",
    specifications: ["الوزن: 500 جرام", "مناسب للضغط العالي والمنخفض", "جفاف سريع ومتانة استثنائية", "مرفق بفرشاة داخلية لتسهيل التطبيق"],
    isAvailable: true
  },
  {
    id: "p14",
    name: "شريط تفلون رويال الأصلي لمانع التسريب",
    category: "plumbing",
    subcategory: "أدوات ومستلزمات السباكة",
    description: "شريط تفلون أبيض نقي 100% لتأمين ولف أسنان التوصيل النحاسية والبلاستيكية لمنع تسريب المياه نهائياً.",
    price: 0,
    unit: "شدة / 10 حبات",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.02 PM.jpeg",
    specifications: ["المادة: PTFE نقي 100%", "العرض: 12 ملم", "الطول: 10 أمتار للفة", "مرونة عالية في التمدد", "مقاوم لدرجات الحرارة والضغط"],
    isAvailable: true
  },
  {
    id: "p15",
    name: "محبس سكر زاوية نحاسي رويال - 1/2 إنش",
    category: "plumbing",
    subcategory: "محابس وصمامات",
    description: "محبس زاوية فاخر للتحكم بمنافذ المياه للمغاسل وسيفونات المراحيض، مصنوع من النحاس الخالص ومطلي بالكروم المقاوم للصدأ.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.09 PM.jpeg",
    specifications: ["المقاس: 1/2 × 1/2 إنش", "الهيكل: نحاس مطلي بالكروم", "مقبض تحكم مريح وناعم", "شكل جمالي مناسب للحمامات"],
    isAvailable: true
  },
  {
    id: "p16",
    name: "محبس دفن رويال PPR نحاسي بالكامل - 1 إنش",
    category: "plumbing",
    subcategory: "محابس وصمامات",
    description: "محبس دفن يركب داخل الجدران للتحكم في شبكة تغذية المياه الرئيسية للشقق والحمامات، مطلي بالكامل ومغطى بإكسسوار كروم فاخر.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.07 PM.jpeg",
    specifications: ["المقاس: 32 ملم (1 إنش)", "الهيكل الداخلي: نحاس صلب ثقيل", "اللحام: PPR حراري", "يد فراشة أنيقة سهلة الاستخدام"],
    isAvailable: true
  },
  {
    id: "p17",
    name: "وصلة عبور (كرنك) PPR رويال - مقاس 25 ملم",
    category: "plumbing",
    subcategory: "مواسير وقطع PPR",
    description: "وصلة تخطي أنابيب المياه المتقاطعة (كرنك)، تسهم في تقليل سماكة شبكة المياه وتمنع تلامس وتضارب مسارات الأنابيب.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.01 PM.jpeg",
    specifications: ["المقاس: 25 ملم", "النوع: وصلة عبور دائرية", "اللحام: حراري بالكامل", "توفير في المساحة والمظهر الجمالي"],
    isAvailable: true
  },
  {
    id: "p18",
    name: "مقص مواصير رويال للأنابيب البلاستيكية - 42 ملم",
    category: "plumbing",
    subcategory: "أدوات ومستلزمات السباكة",
    description: "أداة قص احترافية لقطع أنابيب PPR و PVC بسرعة وسهولة وبشكل مستقيم 100% دون التسبب في تشوه الأنبوب.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.12 PM.jpeg",
    specifications: ["أقصى قطر للقص: 42 ملم", "شفرة مصنوعة من الفولاذ المقاوم للصدأ", "هيكل ألومنيوم خفيف الوزن ومتين", "آلية رافعة مقواة لتقليل الجهد"],
    isAvailable: true
  },
  {
    id: "p19",
    name: "نقاص رويال UPVC من 4 إنش إلى 2 إنش",
    category: "plumbing",
    subcategory: "وصلات وقطع UPVC",
    description: "قطعة نقاص يو بي في سي تستخدم للتحويل من خط أنابيب رئيسي بقطر 4 إنش إلى خط فرعي بقطر 2 إنش لشبكات المياه والصرف.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.06 PM.jpeg",
    specifications: ["المقاس: 4 × 2 إنش", "المادة: UPVC فائق المتانة", "الربط: غراء لاصق", "مقاوم لارتفاع الضغط والحرارة"],
    isAvailable: true
  },

  // === الكهرباء (Electricity) ===
  {
    id: "e1",
    name: "أنابيب حماية كيبلات الكهرباء UPVC - 20 ملم",
    category: "electricity",
    subcategory: "أنابيب حماية الكيبلات",
    description: "أنابيب رويال UPVC مخصصة لتمديدات وحماية كيبلات الكهرباء داخل الجدران والأسقف، تمنع التلف وتسهل سحب الأسلاك.",
    price: 0,
    unit: "حبة / 3 متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.14 PM.jpeg",
    specifications: ["القطر: 20 ملم", "اللون: أبيض", "مقاومة للحريق", "سهلة الانحناء والتركيب", "مطابقة للمواصفات"],
    isAvailable: true
  },
  {
    id: "e2",
    name: "أنابيب حماية كيبلات الكهرباء UPVC - 25 ملم",
    category: "electricity",
    subcategory: "أنابيب حماية الكيبلات",
    description: "أنابيب حماية كهربائية ذات قطر متوسط مناسبة للكيبلات الرئيسية، مرنة ومتينة وذات عزل كهربائي ممتاز.",
    price: 0,
    unit: "حبة / 3 متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.13 PM.jpeg",
    specifications: ["القطر: 25 ملم", "اللون: أبيض", "مقاومة للحريق درجة V0", "عازل كهربائي ممتاز", "لا تتأثر بالرطوبة"],
    isAvailable: true
  },
  {
    id: "e3",
    name: "قاسم كهرباء اسود سطحي",
    category: "electricity",
    subcategory: "أسلاك وكابلات",
    description: "كابلات كهربائية نحاسية ذات نقاء 99.9% معزولة بطبقة PVC مزدوجة، مصممة لتحمل الأحمال المنزلية والصناعية بأمان تام.",
    price: 0,
    unit: "متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.14 PM (2).jpeg",
    specifications: ["المادة: نحاس نقي 99.9%", "المقاس: 3×2.5 ملم", "الجهد: 450/750 فولت", "مقاومة للرطوبة", "نوع: NYY"],
    isAvailable: true
  },
  {
    id: "e4",
    name: "لوحة توزيع كهرباء 12 خط أوتوماتيك",
    category: "electricity",
    subcategory: "لوحات توزيع وقواطع",
    description: "لوحة توزيع كهرباء معدنية مجهزة بباب حماية شفاف، مطلية بمسحوق إلكتروستاتيك متين ومضاد للصدأ.",
    price: 0,
    unit: "لوحة",
    image: "./images/WhatsApp Image 2026-06-24 at 2.25.55 AM.jpeg",
    specifications: ["السعة: 12 قاطع فرعي", "صاج فولاذي مجلفن", "درجة الحماية: IP41", "شريط نحاسي مدمج", "مع باب شفاف"],
    isAvailable: true
  },
  {
    id: "e5",
    name: "محبس كرة UPVC للكهرباء 2 إنش",
    category: "electricity",
    subcategory: "محابس وكوابح",
    description: "محبس كروي UPVC مقاوم لتركيبه في الخطوط الكهربائية الخارجية، عازل تماماً للماء والرطوبة.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-24 at 1.50.47 AM.jpeg",
    specifications: ["المقاس: 2 إنش", "البلاستيك: UPVC ذو جودة عالية", "إغلاق محكم", "مقاوم للأشعة فوق البنفسجية"],
    isAvailable: true
  },

  // === مواد البناء (Building Materials) ===
  {
    id: "b1",
    name: "محول بوش بكل المقاسات",
    category: "building",
    subcategory: "محولات بوش تواصيل بوش",
    description: "أسياخ حديد تسليح مشكل على البارد ذو قوة شد وانحناء استثنائية، مثالي لتسليح القواعد والأعمدة والأسقف الخرسانية.",
    price: .0,
    unit: "طن",
    image: "./images/WhatsApp Image 2026-06-27 at 5.28.36 PM.jpeg",
    specifications: ["القطر: 12 ملم", "الدرجة: Grade 60", "الطول: 12 متر", "مقاومة الصدأ", "تركي سابك معتمد"],
    isAvailable: true
  },
  {
    id: "b2",
    name: "موسير U.P.V.C الحفاظ بانواعة ",
    category: "building",
    subcategory: " ب  بانواعهاUPVC وانواع ومواصير",
    description: "أوصلات بلاستيكيه مقومه بورتلاندي عالي الجودة مصمم خصيصاً للمنشآت الخرسانية الملامسة للتربة والمياه الجوفية المالحة.",
    price: 0,
    unit: "كيس / 50 كجم",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.13 PM (4).jpeg",
    specifications: ["النوع: Type V مقاوم للكبريتات", "الوزن: 50 كجم", "زمن الشك: 90 دقيقة", "مطابق للمواصفات"],
    isAvailable: true
  },
  {
    id: "b3",
    name: "وصلة حار وبارد مشترك",
    category: "building",
    subcategory: "وصلة ماء مشترك",
    description: "وصلات upvc سن داخلي بانواعها الاصلي",
    price: 0,
    unit: "وصلات",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.01 PM (2).jpeg",
    specifications: ["المقاس: 20×20×40 سم", "عزل بوليسترين", "الوزن: 14 كجم", "مقاومة الكسر: 5 N/mm²"],
    isAvailable: true
  },
  {
    id: "b4",
    name: "رول عازل مائي بيتومين 4 ملم",
    category: "building",
    subcategory: "مواد عازلة",
    description: "لفائف عازلة للماء من البيتومين المعدل المقوى بطبقة بوليستر، مثالية لعزل الأسطح والحمامات وخزانات المياه.",
    price: .0,
    unit: "رول / 10 م²",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.14 PM (1).jpeg",
    specifications: ["السمك: 4 ملم", "الطول: 10×1 متر", "مغطى بحبيبات حماية UV", "تركيب بالصهر"],
    isAvailable: true
  },

  // === الزراعة البلاستيكية (Agriculture - NEW SECTION) ===
  {
    id: "ag1",
    name: "خراطيم ري بالتنقيط رويال - 16 ملم لفة 100 متر",
    category: "agriculture",
    subcategory: "خراطيم الري بالتنقيط",
    description: "خراطيم ري حديثة مع نقاطات مدمجة كل 30 سم، مصنعة من البولي إيثيلين عالي الكثافة LDPE المقاوم للأشعة فوق البنفسجية، توفر المياه بنسبة 70%.",
    price: 0,
    unit: "لفة / 100 متر",
    image: "./images/drip-irrigation-field.jpg",
    specifications: ["القطر: 16 ملم", "اللون: أسود", "النقاطات كل 30 سم", "تدفق 2-4 لتر/ساعة", "مقاوم لأشعة UV"],
    isAvailable: true
  },
  {
    id: "ag2",
    name: "أنابيب رويال PE ا غراء وانابيب ميائه- 20 ملم لفة",
    category: "agriculture",
    subcategory: "أنابيب البولي إيثيلين الزراعية",
    description: "أنابيب البولي إيثيلين السوداء عالية الكثافة HDPE للري الزراعي والتمديدات السطحية، مرنة وسهلة التركيب وذات عمر طويل.",
    price: 0,
    unit: "متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.13 PM (4).jpeg",
    specifications: ["القطر: 20 ملم", "PN10 (10 بار)", "اللون: أسود", "مقاوم لأشعة الشمس", "آمن للمزروعات"],
    isAvailable: true
  },
  {
    id: "ag3",
    name: "أنابيب رويال PE الزرقاء - 25 ملم لفة 100م",
    category: "agriculture",
    subcategory: "أنابيب البولي إيثيلين الزراعية",
    description: "أنابيب بولي إيثيلين زرقاء للري بالرش والتنقيط في الزراعات المكشوفة والصوبات الزراعية، مقاومة للضغط العالي.",
    price: .0,
    unit: "لفة / 100 متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.13 PM (1).jpeg",
    specifications: ["القطر: 25 ملم", "PN16 (16 بار)", "اللون: أزرق", "للري بالرش والتنقيط", "مرن وقابل للف"],
    isAvailable: true
  },
  {
    id: "ag4",
    name: "سد تريت بجميع المقاسات ",
    category: "agriculture",
    subcategory: "خ  سدادات الري الزراعية",
    description: "خراطيم وسدادات بانواع المقاسات والاتجاهات ري بلاستيكية حمراء مخصصة لشبكات الري الرئيسية في المزارع والحدائق الكبرى، تتميز بمقاومة عالية للضغط والاحتكاك.",
    price: 1.5,
    unit: "متر",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.12 PM (1).jpeg",
    specifications: ["القطر: 32 ملم", "اللون: أحمر", "PN16", "للري الرئيسي والفرعي", "مقاوم للظروف الجوية"],
    isAvailable: true
  },
  {
    id: "ag5",
    name: "رشاشات زراعية دوارة 360°",
    category: "agriculture",
    subcategory: "رشاشات الري",
    description: "رشاشات ري دوارة بزاوية 360 درجة تغطي مساحات واسعة، مثالية لري الحدائق والمسطحات الخضراء والمزارع المكشوفة.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.27.08 PM.jpeg",
    specifications: ["زاوية الرش: 360°", "مدى الرش: 12 متر", "ضغط التشغيل: 2-4 بار", "مادة بلاستيكية متينة", "قابل للتعديل"],
    isAvailable: true
  },
  {
    id: "ag6",
    name: "وصلات ومنفذات ري زراعية - تشكيلة",
    category: "agriculture",
    subcategory: "وصلات الري الزراعية",
    description: "مجموعة كاملة من الوصلات السريعة والمنفذات والمحابس للأنظمة الزراعية، تتضمن وصلات T و L وكاتم وفلاتر.",
    price: 0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-27 at 5.28.35 PM(1).jpeg",
    specifications: ["مقاسات: 16-32 ملم", "ربط سريع", "PE مقاوم لـ UV", "إحكام تام", "سهلة التركيب"],
    isAvailable: true
  },
  {
    id: "ag7",
    name: "فلاتر مياه زراعية رويال - 1 إنش",
    category: "agriculture",
    subcategory: "فلاتر الري",
    description: "فلاتر مياه شبكية مخصصة لأنظمة الري بالتنقيط، تمنع انسداد النقاطات وتحمي شبكة الري من الشوائب والرواسب.",
    price: .0,
    unit: "حبة",
    image: "./images/WhatsApp Image 2026-06-24 at 2.25.57 AM (3).jpeg",
    specifications: ["المقاس: 1 إنش", "نوع: شبكي 120 مش", "ضغط: 8 بار", "سهل التنظيف", "غطاء قابل للفك"],
    isAvailable: true
  },
  {
    id: "ag8",
    name: "غراء ومذيب رويال",
    category: "agriculture",
    subcategory: "غراء الاصلي ",
    description: "غراء مواصير سباكة ومواسير مياء غرا الاصلي",
    price: .0,
    unit: "خزان",
    image: "./images/WhatsApp Image 2026-06-24 at 1.50.31 AM.jpeg",
    specifications: ["السعة: 200 لتر", "مقاوم للأحماض والقواعد", "غطاء محكم", "مع منفذ تصريف", "للري والتسميد"],
    isAvailable: true
  }
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: "ag1",
    name: "شركة للبلاستيك",
    governorate: "حضرموت",
    phone: "",
    address: "رويال للبلاستيك",
    logoUrl: "./images/logo.jpeg",
    isAuthorized: true
  },
  {
    id: "ag2",
    name: "رويال للبلاستيك والأنابيب",
    governorate: "مارب",
    phone: "",
    address: "رويال للبلاستيك",
    logoUrl: "./images/logo.jpeg",
    isAuthorized: true
  },
  {
    id: "ag3",
    name: "رويال للبلاستيك",
    governorate: "الحديدة",
    phone: "",
    address: "رويال للبلاستيك",
    logoUrl: "./images/logo.jpeg",
    isAuthorized: true
  },
  {
    id: "ag4",
    name: "رويال للبلاستيك",
    governorate: "عدن",
    phone: "",
    address: "عدن - المنصورة - شارع التسعين - بجانب مستشفى الوالي",
    logoUrl: "./images/logo.jpeg",
    isAuthorized: true
  },
  {
    id: "ag5",
    name: "رويال للبلاستيك ",
    governorate: "عدن",
    phone: "782002220",
    address: "المكلا - شارع ستين المكلا - بجانب فندق رمادا",
    logoUrl: "./images/logo.jpeg",
    isAuthorized: true
  },
  {
    id: "ag6",
    name: "رويال للبلاستيك ",
    governorate: "تعز",
    phone: "782002220",
    address: "تعز - شارع جمال - عمارة الحميري - الدور الأرضي",
    logoUrl: "./images/logo.jpeg",
    isAuthorized: true
  },
  {
    id: "ag7",
    name: "مؤسسة رويال الحديثة للري بالتنقيط",
    governorate: "إب",
    phone: "782002220",
    address: "إب ن",
    logoUrl: "/images/royal-logo.png",
    isAuthorized: true
  },
  {
    id: "ag8",
    name: "رويال للبلاستيك ولانابيب",
    governorate: "ذمار",
    phone: "782002220",
    address: "مأرب -د",
    logoUrl: "/images/royal-logo.png",
    isAuthorized: true
  }
];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: "b1",
    title: "مصنع رويال للأنابيب - الجودة بكل المقاييس",
    subtitle: "منتجات يو بي في سي UPVC طبقاً للمواصفات القياسية الألمانية والأمريكية - الأنور للبلاستيك منذ 2013",
    imageUrl: "./images/WhatsApp Image 2026-06-24 at 1.50.42 AM (2).jpeg",
    link: "plumbing",
    expiryDate: "2026-12-31"
  },
  {
    id: "b2",
    title: "حلول الري الزراعي المتكاملة من رويال",
    subtitle: "خراطيم تنقيط، أنابيب PE، رشاشات وفلاتر - وفر مياهك حتى 70% وزد إنتاجك الزراعي",
    imageUrl: "./images/كرت-رويال-امام-9-5-يوفي.jpg-.jpg.jpeg",
    link: "agriculture",
    expiryDate: "2026-12-31"
  },
  {
    id: "b3",
    title: "أنابيب حماية كيبلات الكهرباء UPVC",
    subtitle: "حماية كاملة لشبكات الكهرباء داخل الجدران والأسقف - مقاومة للحريق ودرجات الحرارة العالية",
    imageUrl: "./images/WhatsApp Image 2026-06-24 at 2.25.57 AM (3).jpeg",
    link: "electricity",
    expiryDate: "2026-12-31"
  },
  {
    id: "b4",
    title: "شريكك الموثوق للتأسيس والبناء",
    subtitle: "حديد تسليح وأسمنت ومواد عازلة بأعلى المواصفات لمشاريع تدوم لأجيال",
    imageUrl: "./images/كرت-رويال-امام-9-5-يوفي.jpg-.jpg(1).jpeg",
    link: "building",
    expiryDate: "2026-12-31"
  }
];

export const INITIAL_SETTINGS: SiteSettings = {
  logoText: "مصنع رويال للأنابيب",
  tagline: "رويال... الجودة بكل المقاييس - أنابيب ومستلزمات السباكة والزراعة والكهرباء",
  salesManager: "للتواصل ",
  phoneSales: "782002220",
  phoneAccounts: "782002220",
  phoneInquiry: "782002220",
  phoneDelivery: "782002220",
  whatsapp: "967782002220",
  email: "info@royal-pipes.com",
  address: "الجمهورية اليمنية ",
  facebook: "https://facebook.com/royal.pipes",
  twitter: "https://twitter.com/royal_pipes",
  instagram: "https://instagram.com/royal_pipes",
  primaryColor: "#1E3A8A",
  secondaryColor: "#7F8C8D",
  foundedYear: "2013",
  aboutVision: "أن يكون المصنع رائداً في مجال الصناعات البلاستيكية عالية الجودة وتعزيز تواجده في الأسواق المحلية والإقليمية من خلال التركيز على جودة المنتج والابتكار والتطوير والمصداقية مع العملاء.",
  aboutMission: "أن تكون منتجات رويال نموذجاً مميزاً للجودة والمواصفات والمقاييس العالمية، وأن نوفر لعملائنا منتجات وخدمات صناعية ذات جودة عالية.",
  aboutGoal: "تقديم أفضل المنتجات بجودة عالية ومواصفات ومقاييس عالمية والتوسع على المستوى المحلي والإقليمي لاستقطاب المزيد من العملاء وخلق الرضى لديهم.",
  aboutHistory: "تأسس مصنع الأنور للبلاستيك (Royal) عام 1982م ليصبح أحد أعرق المصانع المتخصصة في إنتاج أنابيب يو بي في سي (UPVC) والمواسير البلاستيكية ومستلزمات السباكة والكهرباء والري الزراعي في الجمهورية اليمنية. على مدى أكثر من 40 عاماً من العطاء والتطوير المستمر، حصلت منتجات رويال على شهادات الجودة العالمية ISO 9001 و ISO 14001 و BS OHSAS 18001، ووسعنا شبكة وكلائنا وموزعينا لتغطي كافة المحافظات اليمنية الـ 21، لنصبح الاسم الأول المرادف للجودة الملكية والمتانة الفائقة."
};

export const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1",
    name: "المهندس عادل الحميدي",
    email: "adel.eng@gmail.com",
    phone: "",
    subject: "طلب عرض أسعار كميات لمشروع سكني في تعز",
    message: "السلام عليكم، نحن بحاجة لطلب عرض أسعار مفصل لـ 500 حبة أنابيب UPVC مقاس 4 إنش، مع 150 خزان مياه 1000 لتر، بالإضافة إلى أنابيب حماية كهرباء للتأسيس الداخلي لعدد 12 شقة سكنية. أرجو التواصل معي هاتفياً.",
    createdAt: "2026-03-10 10:30",
    isRead: false
  },
  {
    id: "m2",
    name: "أحمد المزارع - مزرعة الياسمين",
    email: "ahmed@yasmin-farm.com",
    phone: "",
    subject: "استفسار عن شبكة ري بالتنقيط لـ 50 هكتار",
    message: "مرحباً، أرغب في تركيب شبكة ري بالتنقيط متكاملة لمزرعة مساحتها 50 هكتار في محافظة مأرب. أحتاج خراطيم تنقيط، أنابيب رئيسية وفرعية، رشاشات وفلاتر. يرجى تقديم عرض شامل مع جدول كميات.",
    createdAt: "2026-03-09 14:15",
    isRead: true
  }
];
