import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const STORAGE_KEY = "me-isp-lang";

type Dict = Record<string, string>;

const en: Dict = {
  // App
  "app.name": "ME Internet Manager",
  "app.tagline": "Manager",
  "common.signedInAs": "Signed in as",
  "common.signOut": "Sign out",
  "common.noRole": "no role",
  "common.language": "Language",
  "common.english": "English",
  "common.arabic": "العربية",
  "common.loading": "Loading…",
  "common.saving": "Saving…",
  "common.save": "Save",
  "common.saveChanges": "Save changes",
  "common.cancel": "Cancel",
  "common.create": "Create",
  "common.add": "Add",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.actions": "Actions",
  "common.none": "None",
  "common.name": "Name",
  "common.email": "Email",
  "common.password": "Password",
  "common.optional": "Optional",
  "common.yes": "Yes",
  "common.no": "No",
  "common.search": "Search",
  "common.change": "Change",
  "common.confirm": "Confirm",
  "common.processing": "Processing…",
  "common.deleted": "Deleted",
  "common.signingIn": "Signing in…",
  "common.creating": "Creating…",

  // Nav
  "nav.dashboard": "Dashboard",
  "nav.customers": "Customers",
  "nav.packages": "Packages",
  "nav.recharge": "Recharge",
  "nav.towers": "Towers",
  "nav.reports": "Reports",
  "nav.users": "Users & Roles",

  // Roles
  "role.admin": "Admin",
  "role.recharge": "Recharge",
  "role.viewer": "Viewer",

  // Status
  "status.all": "All status",
  "status.active": "Active",
  "status.suspended": "Suspended",
  "status.expired": "Expired",
  "status.pending": "Pending",

  // Service
  "service.pppoe": "PPPoE",
  "service.hotspot": "Hotspot",

  // Dashboard
  "dashboard.title": "Dashboard",
  "dashboard.subtitle": "Overview of your network and revenue.",
  "dashboard.totalCustomers": "Total Customers",
  "dashboard.onlineNow": "Online Now",
  "dashboard.todayRevenue": "Today's Revenue",
  "dashboard.monthlyRevenue": "Monthly Revenue",
  "dashboard.expiredCustomers": "Expired Customers",
  "dashboard.revenueChart": "Revenue — last 30 days",
  "dashboard.recentRecharges": "Recent Recharges",
  "dashboard.noRecharges": "No recharges yet.",

  // Customers
  "customers.title": "Customers",
  "customers.subtitle": "Manage broadband and hotspot subscribers.",
  "customers.add": "Add customer",
  "customers.searchPlaceholder": "Search name, code, username, phone…",
  "customers.col.code": "Code",
  "customers.col.name": "Name",
  "customers.col.service": "Service",
  "customers.col.package": "Package",
  "customers.col.tower": "Tower",
  "customers.col.status": "Status",
  "customers.empty": "No customers found.",
  "customers.updated": "Customer updated",
  "customers.created": "Customer created",
  "customers.formNew": "New customer",
  "customers.formEdit": "Edit customer",
  "customers.f.fullName": "Full name",
  "customers.f.phone": "Phone",
  "customers.f.address": "Address",
  "customers.f.serviceType": "Service type",
  "customers.f.status": "Status",
  "customers.f.username": "Username",
  "customers.f.password": "Password",
  "customers.f.package": "Package",
  "customers.f.tower": "Tower",
  "customers.f.sector": "Sector",
  "customers.detail.back": "Back to customers",
  "customers.detail.info": "Customer information",
  "customers.detail.code": "Customer code",
  "customers.detail.expiresAt": "Expires at",
  "customers.detail.online": "Online",
  "customers.detail.history": "Recharge history",
  "customers.detail.towerSector": "Tower / Sector",

  // Packages
  "packages.title": "Packages",
  "packages.subtitle": "Define service plans your customers subscribe to.",
  "packages.new": "New package",
  "packages.deleted": "Package deleted",
  "packages.empty": "No packages yet.",
  "packages.col.type": "Type",
  "packages.col.speed": "Speed",
  "packages.col.data": "Data",
  "packages.col.validity": "Validity",
  "packages.col.price": "Price",
  "packages.type.unlimited": "Unlimited",
  "packages.type.quota": "Quota",
  "packages.formNew": "New package",
  "packages.formEdit": "Edit package",
  "packages.f.speed": "Speed (e.g. 10/5 Mbps)",
  "packages.f.dataLimit": "Data limit (GB)",
  "packages.f.dataPlaceholder": "Leave empty for unlimited",
  "packages.f.validity": "Validity (days)",
  "packages.created": "Package created",
  "packages.updated": "Package updated",

  // Recharge
  "recharge.title": "Recharge",
  "recharge.subtitle": "Find a customer and apply a package recharge.",
  "recharge.noPerm": "No permission",
  "recharge.noPermDesc": "You need the Recharge or Admin role to recharge customers.",
  "recharge.step1": "1. Find customer",
  "recharge.step2": "2. Choose package",
  "recharge.searchPlaceholder": "Search by name, code, username, phone…",
  "recharge.selectPackage": "Select a package",
  "recharge.amount": "Amount",
  "recharge.validity": "Validity",
  "recharge.speed": "Speed",
  "recharge.days": "days",
  "recharge.confirm": "Confirm recharge",
  "recharge.success": "{name} recharged with {pkg}",

  // Towers
  "towers.title": "Towers & Sectors",
  "towers.subtitle": "Network infrastructure layout.",
  "towers.new": "New tower",
  "towers.empty": "No towers yet.",
  "towers.f.name": "Tower name",
  "towers.f.location": "Location",
  "towers.sectors": "Sectors",
  "towers.sectorName": "Sector name",
  "towers.devices": "Devices",
  "towers.deviceName": "Device name",
  "towers.ipOptional": "IP (optional)",
  "towers.added": "Tower added",
  "towers.sectorAdded": "Sector added",
  "towers.deviceAdded": "Device added",

  // Reports
  "reports.title": "Reports",
  "reports.subtitle": "Revenue, recharge activity and customer status.",
  "reports.dailyRevenue": "Daily revenue (30 days)",
  "reports.recentHistory": "Recent recharge history",
  "reports.activeCustomers": "Active Customers",
  "reports.col.date": "Date",
  "reports.col.customer": "Customer",
  "reports.col.package": "Package",
  "reports.col.validity": "Validity",
  "reports.col.amount": "Amount",
  "reports.empty": "No recharges yet.",

  // Users
  "users.title": "Users & Roles",
  "users.subtitle": "Assign Admin, Recharge or Viewer roles. Users sign up from the auth page.",
  "users.adminsOnly": "Admins only",
  "users.adminsOnlyDesc": "Only administrators can manage user roles.",
  "users.col.currentRoles": "Current roles",
  "users.col.toggle": "Toggle roles",
  "users.none": "none",
  "users.updated": "Roles updated",

  // Auth
  "auth.brandHeadline": "Run your ISP like the pros.",
  "auth.brandSub": "Manage broadband and hotspot customers, packages, towers, and recharges from one royal-grade dashboard.",
  "auth.copyright": "© ME Internet Manager",
  "auth.title": "Admin access",
  "auth.subtitle": "Sign in to manage your network. The first registered account becomes Admin.",
  "auth.signIn": "Sign in",
  "auth.signUp": "Sign up",
  "auth.createAccount": "Create account",
  "auth.welcome": "Welcome back",
  "auth.created": "Account created. You can sign in now.",
};

const ar: Dict = {
  "app.name": "ME لإدارة الإنترنت",
  "app.tagline": "نظام الإدارة",
  "common.signedInAs": "تم تسجيل الدخول كـ",
  "common.signOut": "تسجيل الخروج",
  "common.noRole": "بدون صلاحية",
  "common.language": "اللغة",
  "common.english": "English",
  "common.arabic": "العربية",
  "common.loading": "جارٍ التحميل…",
  "common.saving": "جارٍ الحفظ…",
  "common.save": "حفظ",
  "common.saveChanges": "حفظ التغييرات",
  "common.cancel": "إلغاء",
  "common.create": "إنشاء",
  "common.add": "إضافة",
  "common.delete": "حذف",
  "common.edit": "تعديل",
  "common.actions": "إجراءات",
  "common.none": "لا يوجد",
  "common.name": "الاسم",
  "common.email": "البريد الإلكتروني",
  "common.password": "كلمة المرور",
  "common.optional": "اختياري",
  "common.yes": "نعم",
  "common.no": "لا",
  "common.search": "بحث",
  "common.change": "تغيير",
  "common.confirm": "تأكيد",
  "common.processing": "جارٍ المعالجة…",
  "common.deleted": "تم الحذف",
  "common.signingIn": "جارٍ تسجيل الدخول…",
  "common.creating": "جارٍ الإنشاء…",

  "nav.dashboard": "لوحة التحكم",
  "nav.customers": "المشتركون",
  "nav.packages": "الباقات",
  "nav.recharge": "تعبئة الرصيد",
  "nav.towers": "الأبراج",
  "nav.reports": "التقارير",
  "nav.users": "المستخدمون والصلاحيات",

  "role.admin": "مدير",
  "role.recharge": "موظف تعبئة",
  "role.viewer": "عرض فقط",

  "status.all": "كل الحالات",
  "status.active": "نشط",
  "status.suspended": "موقوف",
  "status.expired": "منتهٍ",
  "status.pending": "قيد الانتظار",

  "service.pppoe": "PPPoE",
  "service.hotspot": "هوت سبوت",

  "dashboard.title": "لوحة التحكم",
  "dashboard.subtitle": "نظرة عامة على شبكتك وإيراداتك.",
  "dashboard.totalCustomers": "إجمالي المشتركين",
  "dashboard.onlineNow": "المتصلون الآن",
  "dashboard.todayRevenue": "إيرادات اليوم",
  "dashboard.monthlyRevenue": "الإيرادات الشهرية",
  "dashboard.expiredCustomers": "المشتركون المنتهون",
  "dashboard.revenueChart": "الإيرادات — آخر 30 يومًا",
  "dashboard.recentRecharges": "أحدث عمليات التعبئة",
  "dashboard.noRecharges": "لا توجد عمليات تعبئة بعد.",

  "customers.title": "المشتركون",
  "customers.subtitle": "إدارة مشتركي البرودباند والهوت سبوت.",
  "customers.add": "إضافة مشترك",
  "customers.searchPlaceholder": "ابحث بالاسم، الكود، اسم المستخدم، الهاتف…",
  "customers.col.code": "الكود",
  "customers.col.name": "الاسم",
  "customers.col.service": "الخدمة",
  "customers.col.package": "الباقة",
  "customers.col.tower": "البرج",
  "customers.col.status": "الحالة",
  "customers.empty": "لا يوجد مشتركون.",
  "customers.updated": "تم تحديث المشترك",
  "customers.created": "تم إنشاء المشترك",
  "customers.formNew": "مشترك جديد",
  "customers.formEdit": "تعديل المشترك",
  "customers.f.fullName": "الاسم الكامل",
  "customers.f.phone": "الهاتف",
  "customers.f.address": "العنوان",
  "customers.f.serviceType": "نوع الخدمة",
  "customers.f.status": "الحالة",
  "customers.f.username": "اسم المستخدم",
  "customers.f.password": "كلمة المرور",
  "customers.f.package": "الباقة",
  "customers.f.tower": "البرج",
  "customers.f.sector": "القطاع",
  "customers.detail.back": "العودة إلى المشتركين",
  "customers.detail.info": "بيانات المشترك",
  "customers.detail.code": "كود المشترك",
  "customers.detail.expiresAt": "تاريخ الانتهاء",
  "customers.detail.online": "متصل",
  "customers.detail.history": "سجل التعبئة",
  "customers.detail.towerSector": "البرج / القطاع",

  "packages.title": "الباقات",
  "packages.subtitle": "حدّد خطط الخدمة التي يشترك بها المشتركون.",
  "packages.new": "باقة جديدة",
  "packages.deleted": "تم حذف الباقة",
  "packages.empty": "لا توجد باقات بعد.",
  "packages.col.type": "النوع",
  "packages.col.speed": "السرعة",
  "packages.col.data": "البيانات",
  "packages.col.validity": "المدة",
  "packages.col.price": "السعر",
  "packages.type.unlimited": "غير محدودة",
  "packages.type.quota": "محددة",
  "packages.formNew": "باقة جديدة",
  "packages.formEdit": "تعديل الباقة",
  "packages.f.speed": "السرعة (مثال: 10/5 ميجابت)",
  "packages.f.dataLimit": "حد البيانات (جيجابايت)",
  "packages.f.dataPlaceholder": "اتركه فارغًا لباقة غير محدودة",
  "packages.f.validity": "المدة (أيام)",
  "packages.created": "تم إنشاء الباقة",
  "packages.updated": "تم تحديث الباقة",

  "recharge.title": "تعبئة الرصيد",
  "recharge.subtitle": "ابحث عن مشترك وقم بتطبيق باقة تعبئة.",
  "recharge.noPerm": "لا توجد صلاحية",
  "recharge.noPermDesc": "تحتاج إلى صلاحية موظف التعبئة أو المدير لتعبئة المشتركين.",
  "recharge.step1": "١. اختر المشترك",
  "recharge.step2": "٢. اختر الباقة",
  "recharge.searchPlaceholder": "ابحث بالاسم، الكود، اسم المستخدم، الهاتف…",
  "recharge.selectPackage": "اختر باقة",
  "recharge.amount": "المبلغ",
  "recharge.validity": "المدة",
  "recharge.speed": "السرعة",
  "recharge.days": "يوم",
  "recharge.confirm": "تأكيد التعبئة",
  "recharge.success": "تمت تعبئة {name} بباقة {pkg}",

  "towers.title": "الأبراج والقطاعات",
  "towers.subtitle": "هيكل البنية التحتية للشبكة.",
  "towers.new": "برج جديد",
  "towers.empty": "لا توجد أبراج بعد.",
  "towers.f.name": "اسم البرج",
  "towers.f.location": "الموقع",
  "towers.sectors": "القطاعات",
  "towers.sectorName": "اسم القطاع",
  "towers.devices": "الأجهزة",
  "towers.deviceName": "اسم الجهاز",
  "towers.ipOptional": "عنوان IP (اختياري)",
  "towers.added": "تمت إضافة البرج",
  "towers.sectorAdded": "تمت إضافة القطاع",
  "towers.deviceAdded": "تمت إضافة الجهاز",

  "reports.title": "التقارير",
  "reports.subtitle": "الإيرادات، عمليات التعبئة وحالة المشتركين.",
  "reports.dailyRevenue": "الإيرادات اليومية (30 يومًا)",
  "reports.recentHistory": "أحدث سجل تعبئة",
  "reports.activeCustomers": "المشتركون النشطون",
  "reports.col.date": "التاريخ",
  "reports.col.customer": "المشترك",
  "reports.col.package": "الباقة",
  "reports.col.validity": "المدة",
  "reports.col.amount": "المبلغ",
  "reports.empty": "لا توجد عمليات تعبئة بعد.",

  "users.title": "المستخدمون والصلاحيات",
  "users.subtitle": "حدّد صلاحيات المدير، موظف التعبئة أو المشاهد. يقوم المستخدمون بالتسجيل من صفحة الدخول.",
  "users.adminsOnly": "للمديرين فقط",
  "users.adminsOnlyDesc": "فقط المديرون يمكنهم إدارة صلاحيات المستخدمين.",
  "users.col.currentRoles": "الصلاحيات الحالية",
  "users.col.toggle": "تبديل الصلاحيات",
  "users.none": "لا يوجد",
  "users.updated": "تم تحديث الصلاحيات",

  "auth.brandHeadline": "أدر شركتك للإنترنت باحترافية.",
  "auth.brandSub": "إدارة مشتركي البرودباند والهوت سبوت، الباقات، الأبراج، وعمليات التعبئة من لوحة تحكم واحدة.",
  "auth.copyright": "© ME لإدارة الإنترنت",
  "auth.title": "دخول المدير",
  "auth.subtitle": "سجّل الدخول لإدارة شبكتك. يصبح أول حساب مسجل مديرًا.",
  "auth.signIn": "تسجيل الدخول",
  "auth.signUp": "إنشاء حساب",
  "auth.createAccount": "إنشاء حساب",
  "auth.welcome": "أهلًا بعودتك",
  "auth.created": "تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.",
};

const dicts: Record<Lang, Dict> = { en, ar };

interface I18nCtx {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

function applyDocument(lang: Lang) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    applyDocument(lang);
  }, [lang]);

  const value = useMemo<I18nCtx>(() => ({
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    setLang: (l) => {
      setLangState(l);
      try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    },
    t: (key, vars) => {
      let s = dicts[lang][key] ?? dicts.en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
  }), [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}
