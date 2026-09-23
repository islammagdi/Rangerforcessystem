import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Info,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  UserPlus,
  Building2,
  Mail,
  RefreshCcw,
  FileBarChart,
  ClipboardList,
  UserCog,
  ChevronLeft,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const GREEN_GRADIENT = "linear-gradient(to bottom, #00b867, #00522e)";

/* =========================================================
   نظام "البلوكات" — كل موضوع بيتكون من قايمة بلوكات مختلفة
   الأنواع المتاحة: فقرة / قائمة / خطوات / جدول / تنبيه / صورة

   عايز تضيف بلوك جديد لموضوع موجود؟ زوّد عنصر في مصفوفة
   content بتاعت الموضوع ده بس، مش محتاج تلمس أي حاجة تانية.
========================================================= */

type GuideBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | {
      type: "callout";
      tone: "info" | "warning" | "success";
      text: string;
    }
  | { type: "image"; src: string; caption?: string };

interface GuideSection {
  id: string;
  title: string;
  group: string;
  content: GuideBlock[];
}

/* =========================================================
   ✅ إضافة صور حقيقية (لقطات شاشة):

   1. حط ملف الصورة داخل فولدر public/guide-images/
   2. مثال: public/guide-images/issue-letter-step1.png
   3. ضيف بلوك من النوع ده في الموضوع المناسب:
      { type: "image", src: "/guide-images/issue-letter-step1.png",
        caption: "شاشة اختيار نوع الخطاب" }
========================================================= */

const GUIDE_SECTIONS: GuideSection[] = [
  // ═══════════════════════════════════════════════
  // عام
  // ═══════════════════════════════════════════════
  {
    id: "overview",
    group: "عام",
    title: "الموقف العام (الصفحة الرئيسية)",
    content: [
      {
        type: "p",
        text: "أول صفحة بتظهر بعد تسجيل الدخول، وبتديك نظرة سريعة على حالة القوة كلها.",
      },
      {
        type: "p",
        text: "قسم 'الموقف العام' بيعطيك نظرة سريعة عن موقف القوة من حيث الخوارج والقوة العامة:",
      },
      {
        type: "list",
        items: [
          "عدد المتطوعين",
          "عدد المجندين",
          "إجمالي القوة الفعلية",
          "خوارج المتطوعين",
          "خوارج المجندين",
          "إجمالي الخوارج",
        ],
      },
      {
        type: "callout",
        tone: "success",
        text: "جميع الأرقام محدّثة تلقائيًا من قاعدة البيانات، مفيش داعي لأي تحديث يدوي.",
      },
      {
        type: "p",
        text: "قسم 'تحليل الخوارج' فيه رسومات بيانية توضح حالة الخوارج بالنسبة للقوة العامة:",
      },
      {
        type: "list",
        items: [
          "الرسم البياني على اليمين: يوضح نسبة الخوارج من القوة العامة مع العدد الكلي للخوارج",
          "الرسم البياني على اليسار: يوضح أعلى الوحدات في عدد الخوارج، بحيث تكون دايمًا نُصب عينك",
        ],
      },
      {
        type: "p",
        text: "قسم 'دفعة الرديف' بيوضح تفاصيل دفعة الرديف التالية: العدد الكلي، وإحصائية عامة عن إجمالي من سلّم تحقيق الشخصية العسكرية والرخصة من هذه الدفعة.",
      },
      {
        type: "callout",
        tone: "warning",
        text: "قسم 'التنبيهات' في أول الشاشة بيظهر في حالة وجود تحذيرات مهمة، زي أفراد تجاوزوا تاريخ التسريح ولسه بالخدمة، أو أفراد بياناتهم ناقصة. التحذير الخاص بالتسريح قابل للضغط، وبيوديك مباشرة لصفحة دفعات الرديف وهو فاتح الدفعة المطلوبة أوتوماتيك.",
      },
    ],
  },
  {
    id: "roles",
    group: "عام",
    title: "الصلاحيات (الأدوار في النظام)",
    content: [
      {
        type: "p",
        text: "بداخل المنظومة يوجد أنواع مستخدمين حسب حدود وظيفة كل مستخدم، موضحة في الجدول التالي:",
      },
      {
        type: "table",
        headers: [
          "الصفحة / الميزة",
          "مدير النظام",
          "مسئول شؤون أفراد",
          "أرشيف وإنهاء خدمة",
          "مستخدم عادي",
        ],
        rows: [
          ["الاستعلام عن فرد", "نعم", "نعم", "نعم", "نعم"],
          ["إضافة قوة جديدة", "نعم", "نعم", "—", "—"],
          ["بيان الوحدات", "نعم", "نعم", "نعم", "نعم"],
          ["إصدار خطاب", "نعم", "نعم", "—", "—"],
          ["سجل الخطابات", "نعم", "نعم", "نعم", "نعم"],
          ["اليوميات", "نعم", "نعم", "نعم", "نعم"],
          ["دفعات الرديف", "نعم", "—", "نعم", "—"],
          ["إدارة الوحدات", "نعم", "—", "—", "—"],
          ["إدارة دفعات الرديف", "نعم", "—", "—", "—"],
          ["إدارة المستخدمين", "نعم", "—", "—", "—"],
          ["النسخ الاحتياطي", "نعم", "—", "—", "—"],
          ["سجل العمليات", "نعم", "—", "—", "—"],
          ["رؤساء فرع التنظيم", "نعم", "—", "—", "—"],
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // الأفراد
  // ═══════════════════════════════════════════════
  {
    id: "individual-query",
    group: "الأفراد",
    title: "الاستعلام عن فرد",
    content: [
      {
        type: "p",
        text: "صفحة البحث عن أي فرد في النظام (برقمه العسكري أو اسمه).",
      },
      {
        type: "steps",
        items: [
          {
            title: "اختر فئة الفرد",
            text: "عند فتح التاب، اختر فئة الفرد لحصر البحث في المجندين، أو الرتب العالية، أو كلاهما.",
          },
          {
            title: "حدد طريقة البحث",
            text: "بالاسم أو بالرقم العسكري. يكفي كتابة جزء من الاسم أو الرقم فقط لعرض كل الأفراد المطابقين.",
          },
          {
            title: "فلترة النتائج",
            text: "تقدر تفلتر النتائج مرة أخرى حسب: الاسم، الحالة (على القوة/ملحق)، الوحدة الأساسية، الدرجة.",
          },
          {
            title: "جدول النتائج",
            text: "بيعرض الفرد بالرقم العسكري، الدرجة، الاسم، الوحدة، مكان الإلحاق، وحالته، مع زرار إجراء لرؤية تفاصيل الفرد.",
          },
        ],
      },
    ],
  },
  {
    id: "soldier-detail",
    group: "الأفراد",
    title: "صفحة تفاصيل بيانات الفرد",
    content: [
      {
        type: "p",
        text: "تعرض كل تفاصيل الفرد (نفس بيانات نتيجة البحث)، بالإضافة إلى تاريخ التسريح في حالة كونه مجندًا.",
      },
      {
        type: "list",
        items: [
          "قسم خاص يعرض جميع الخطابات اللي اتصدرت لهذا الفرد، مع إمكانية إنشاء خطاب جديد له مباشرة",
          "إمكانية تعديل بيانات الفرد وحفظ التعديلات من نفس الشاشة",
        ],
      },
    ],
  },
  {
    id: "add-soldier",
    group: "الأفراد",
    title: "إضافة قوة جديدة",
    content: [
      {
        type: "p",
        text: "الجزء اللي بيسمح بتحديث وإضافة أفراد جدد لقاعدة البيانات، إما فرد واحد أو مجموعة أفراد كاملة.",
      },
      {
        type: "p",
        text: "1) إضافة فرد واحد:",
      },
      {
        type: "steps",
        items: [
          {
            title: "تحديد فئة الفرد",
            text: "اختيار فئة الفرد (مجند/متطوع) عن طريق القيد.",
          },
          {
            title: "بيانات الفرد الأساسية",
            text: "إدخال الرقم العسكري (13 رقم)، اختيار الدرجة (في حالة المجند لا يوجد سوى 'جندي' فقط)، وإدخال الاسم رباعي على الأقل.",
          },
          {
            title: "دفعة الرديف (للمجند)",
            text: "يتم اختيار دفعة الرديف الخاصة به.",
          },
          {
            title: "الوحدة والموقف",
            text: "اختيار وحدة أساسية من القائمة المنسدلة. لو الموقف 'ملحق'، بيتفعّل حقل جهة الإلحاق. لو الموقف 'على القوة'، الحقل ده بيتجمّد تلقائيًا.",
          },
          {
            title: "المراجعة والضم",
            text: "الضغط على زرار 'المراجعة والضم' لمراجعة بيانات الفرد قبل الحفظ النهائي.",
          },
        ],
      },
      {
        type: "callout",
        tone: "warning",
        text: "لا يُسمح باختيار دفعة رديف سابقة (ماضية) لفرد على القوة أو ملحق. يمكن اختيار دفعة رديف ماضية فقط في حالة الفرد 'منتهي خدمته'.",
      },
      {
        type: "p",
        text: "2) إضافة مجموعة أفراد:",
      },
      {
        type: "steps",
        items: [
          {
            title: "تحميل نموذج القيد الموحد",
            text: "تحميل ملف النموذج وملء البيانات فيه.",
          },
          {
            title: "رفع الملف",
            text: "إعادة رفع الملف بعد ملء بياناته. النظام بيمسح كل القيم ويظهر إحصائية بعدد الأفراد داخل الملف.",
          },
          {
            title: "مراجعة الإحصائية",
            text: "عدد الأفراد الجدد اللي هيُضموا للقوة، عدد الأفراد الموجودين بالفعل ببيانات جديدة هتتحدّث، وعدد الأفراد اللي فيه خطأ في بياناتهم لازم يتصحح (عن طريق زرار التعديل) قبل المراجعة والضم النهائي.",
          },
          {
            title: "الحفظ النهائي",
            text: "بعد الحفظ، تظهر شاشة النجاح فيها ملخص العملية واسم المستخدم اللي قام بإضافة القوة.",
          },
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "عند ملء نموذج القيد، لازم تختار كل البيانات من القوائم المنسدلة الموجودة فيه، عشان ميحصلش خطأ أثناء رفع الملف.",
      },
      {
        type: "callout",
        tone: "warning",
        text: "الرقم العسكري هو المعرّف الوحيد للفرد داخل المنظومة. لا يُسمح بتكرار الأرقام العسكرية.",
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // الوحدات
  // ═══════════════════════════════════════════════
  {
    id: "units-report",
    group: "الوحدات",
    title: "بيان الوحدات",
    content: [
      {
        type: "p",
        text: "بيعرض كل وحدات النظام مع إحصائيات كل وحدة (القوة، الجنود، ضباط الصف، الخوارج).",
      },
      {
        type: "table",
        headers: ["نوع الوحدة", "الوصف", "مثال"],
        rows: [
          [
            "أساسية",
            "الوحدات النظامية القتالية اللي يلتحق بها الفرد عند انتهاء فترة التدريب، وعلى أساسها يتم حساب قوة الأفراد",
            "سرية القيادة، كتيبة القيادة",
          ],
          [
            "إدارية",
            "الوحدات اللي يلتحق بها الفرد خارج وحدته الأساسية (أماكن إلحاق)",
            "فرع العمليات، سائق عربة إسعاف",
          ],
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "الوحدة الأساسية لفرد ممكن تكون وحدة إدارية لفرد تاني — مثال: فرد يتبع كتيبة القيادة أساسًا، لكنه ملحق حاليًا بسرية القيادة.",
      },
      {
        type: "p",
        text: "شاشة تفاصيل الوحدة تعرض كل المعلومات الخاصة بيها (سواء أساسية أو إدارية). في حالة الوحدة الأساسية تعرض:",
      },
      {
        type: "list",
        items: [
          "إحصائية الوحدة: إجمالي القوة، الجنود، ضباط الصف، إجمالي الخوارج",
          "رسم بياني يوضح موقف القوة",
          "جدول أفراد الوحدة: رقم عسكري، درجة، اسم، نوع الخدمة (مجند/متطوع)، حالة الفرد (بالوحدة/خارج الوحدة)، وتاريخ التسريح في حالة المجند",
        ],
      },
      {
        type: "callout",
        tone: "success",
        text: "يمكن طباعة كشف أفراد الوحدة، مع وجود فلترة للبيانات حسب حالة الفرد وفئته.",
      },
    ],
  },
  {
    id: "manage-units",
    group: "الوحدات",
    title: "إدارة الوحدات (Admin فقط)",
    content: [
      {
        type: "p",
        text: "من خلالها يستطيع الأدمن التحكم في إنشاء وتعديل جميع الوحدات الموجودة بالنظام.",
      },
      {
        type: "list",
        items: [
          "إجمالي الوحدات",
          "الوحدات الأساسية",
          "الوحدات الإدارية",
          "الوحدات النشطة",
          "الوحدات المغلقة",
        ],
      },
      {
        type: "p",
        text: "بالإضافة لجدول فيه كل وحدات النظام، وتقدر منه تعدّل اسم وحدة أو تضيف وحدة جديدة أو تلغي وحدة نشطة.",
      },
      {
        type: "callout",
        tone: "warning",
        text: "لا يمكن إلغاء وحدة أساسية نشطة في حالة وجود أفراد بها — لازم أولًا نقل الأفراد لوحدة أخرى.",
      },
      {
        type: "steps",
        items: [
          {
            title: "الضغط على زر 'إضافة وحدة'",
            text: "",
          },
          {
            title: "إدخال اسم الوحدة الجديد",
            text: "",
          },
          {
            title: "اختيار نوعها (أساسية/إدارية) والحفظ",
            text: "",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // الخطابات
  // ═══════════════════════════════════════════════
  {
    id: "issue-letter",
    group: "الخطابات",
    title: "إصدار خطاب",
    content: [
      {
        type: "p",
        text: "من خلالها يتم إصدار جميع الخطابات: إلحاق أو إنهاء إلحاق. عملية إصدار الخطاب بتتم على 4 مراحل:",
      },
      {
        type: "steps",
        items: [
          {
            title: "المرحلة الأولى: تحديد نوع الخطاب",
            text: "إلحاق أو إنهاء إلحاق.",
          },
          {
            title: "المرحلة الثانية: تحديد الأفراد المعنيين",
            text: "عن طريق إدخال الرقم العسكري لكل فرد (فرد واحد أو أكتر داخل نفس الخطاب).",
          },
          {
            title: "المرحلة الثالثة: بيانات الخطاب",
            text: "جهة الخطاب (اللي بتتكتب بعد كلمة 'إلى /')، مكان الإلحاق (بيتطبق على كل الأفراد، وممكن تعدّله لكل فرد لوحده من الجدول بعد كده)، سبب الخطاب (بيتكتب من أول كلمة 'وذلك بناءً على ...')، وملاحظات اختيارية (مثال: 'صورة إلى سرية القيادة').",
          },
          {
            title: "المرحلة الرابعة: المراجعة والتصديق النهائي",
            text: "عرض كل بيانات الخطاب: النوع، رقم الخطاب، جهة الخطاب، تاريخ الخطاب، عدد الأفراد، ورئيس الفرع الحالي. بعدها بيانات الأفراد المعنيين، ثم معاينة شكل الخطاب قبل الطباعة.",
          },
        ],
      },
      {
        type: "table",
        headers: ["الزرار", "بيعمل إيه"],
        rows: [
          [
            "تأكيد وحفظ الخطاب",
            "بيحفظ الخطاب نهائيًا، وبيغيّر أماكن الإلحاق لجميع الأفراد بالأماكن اللي اتحددت",
          ],
          [
            "طباعة وتحميل المعاينة",
            "بيحمّل نسخة من الجواب للمعاينة فقط، قبل الحفظ النهائي، مع البقاء في نفس الصفحة",
          ],
          ["إلغاء", "بيلغي العملية ويرجّعك للصفحة الرئيسية"],
        ],
      },
      {
        type: "callout",
        tone: "warning",
        text: "بعد الحفظ يظهر رقم الخطاب، وتكون حالة الخطاب داخل المنظومة 'غير موثق' لحين رفع نسخة الخطاب المصدّق عليها من رئيس الفرع.",
      },
      {
        type: "callout",
        tone: "info",
        text: "توقيع رئيس الفرع بيتحدّث تلقائيًا حسب الرئيس الحالي، ويمكن تحديده وتجديده من خلال شاشة 'رؤساء فرع التنظيم'.",
      },
    ],
  },
  {
    id: "letter-number",
    group: "الخطابات",
    title: "تكوين رقم الخطاب",
    content: [
      {
        type: "p",
        text: "رقم الخطاب له تكوين معيّن بيتولّد تلقائيًا:",
      },
      {
        type: "table",
        headers: ["الجزء", "عدد الأرقام", "المعنى"],
        rows: [
          ["أول 8 أرقام", "8", "تاريخ الخطاب"],
          [
            "الرقم التاسع",
            "1",
            "نوع الخطاب (1 = إلحاق، 2 = إنهاء إلحاق)",
          ],
          [
            "الأرقام 10 و11 و12",
            "3",
            "تسلسل الخطاب في نفس اليوم",
          ],
        ],
      },
      {
        type: "callout",
        tone: "success",
        text: "مثال: خطاب إلحاق بتاريخ 16/8/2026 وهو الخطاب رقم 4 في نفس اليوم → الرقم يكون 160820261004. لو بعده اتعمل خطاب إنهاء إلحاق في نفس اليوم → رقمه يكون 160820262005.",
      },
    ],
  },
  {
    id: "branch-heads",
    group: "الخطابات",
    title: "رؤساء فرع التنظيم",
    content: [
      {
        type: "p",
        text: "شاشة رؤساء فرع التنظيم من خلالها يمكن تعديل أو إضافة أو تعيين الرئيس الحالي للفرع.",
      },
      {
        type: "callout",
        tone: "info",
        text: "توقيع رئيس الفرع اللي بيظهر في كل خطاب جديد بيتحدّث تلقائيًا حسب مين هو الرئيس الحالي المُعيَّن هنا، من غير أي تدخل يدوي في كل خطاب.",
      },
    ],
  },
  {
    id: "letters-archive",
    group: "الخطابات",
    title: "سجل الخطابات",
    content: [
      {
        type: "p",
        text: "يوجد به جميع الخطابات اللي اتعملت من خلال المنظومة، وفيه طريقتين للبحث:",
      },
      {
        type: "p",
        text: "الطريقة الأولى: الأرشيف العام",
      },
      {
        type: "list",
        items: [
          "عرض جميع الخطابات المسجلة: رقم الخطاب، تاريخ الخطاب، نوع الخطاب، جهة الخطاب، عدد الأفراد، حالة الخطاب، والإجراء",
          "فلترة برقم الخطاب أو جزء منه",
          "فلترة بالمدة (من - إلى)",
          "فلترة بحالة الخطاب",
          "فلترة بنوع الخطاب",
        ],
      },
      {
        type: "p",
        text: "الطريقة الثانية: البحث بالفرد",
      },
      {
        type: "list",
        items: [
          "إدخال الرقم العسكري للفرد → بيظهر اسمه، درجته، وحدته الأساسية، ووحدة إلحاقه الحالية (لو موجودة)",
          "نفس جدول الخطابات السابق، لكن فيه بس الخطابات المرتبطة بالفرد ده",
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // دفعات الرديف
  // ═══════════════════════════════════════════════
  {
    id: "reserve-batches",
    group: "دفعات الرديف",
    title: "دفعات الرديف",
    content: [
      {
        type: "p",
        text: "من خلال هذه الشاشة يتم التعامل مع جميع دفعات الرديف الموجودة، عن طريق اختيار دفعة رديف معينة والبحث.",
      },
      {
        type: "p",
        text: "بعد البحث، تظهر إحصائية بسيطة عن الدفعة:",
      },
      {
        type: "list",
        items: [
          "تاريخ الدفعة",
          "عدد الجنود",
          "إجمالي من سلّم تحقيق الشخصية العسكرية والرخصة",
          "إجمالي من تحقيق شخصيته أو رخصته 'تالفة'",
        ],
      },
      {
        type: "p",
        text: "جدول بجميع الجنود المستحقين للتسريح، فيه حالة الكارنيه والرخصة لكل فرد (الرخصة مفتوحة فقط لمن هو سائق)، وتقدر تحدد الحالة: تم الاستلام / لم يتم الاستلام / تالف.",
      },
      {
        type: "table",
        headers: ["الزرار", "بيعمل إيه"],
        rows: [
          [
            "إنهاء خدمة الأفراد",
            "بتحدد جميع الأفراد المطلوبين وتدوس الزرار لإنهاء خدمتهم",
          ],
          [
            "ترحيل دفعة",
            "بتحدد الأفراد وتختار دفعة الرديف القادمة لترحيلهم ليها",
          ],
          ["طباعة الكشف", "طباعة قائمة الأفراد كاملة"],
        ],
      },
      {
        type: "callout",
        tone: "warning",
        text: "عند تغيير حالة كارنيه أو رخصة لأي فرد، لازم تدوس زر 'حفظ التعديلات' أسفل الجدول عشان التعديلات تتحفظ فعليًا.",
      },
    ],
  },
  {
    id: "manage-reserve-batches",
    group: "دفعات الرديف",
    title: "إدارة دفعات الرديف (Admin فقط)",
    content: [
      {
        type: "p",
        text: "صفحة مخصصة لمدير النظام فقط، لإضافة أو حذف دفعات رديف.",
      },
      {
        type: "callout",
        tone: "info",
        text: "بتعرض كمان إحصائيات عامة: إجمالي عدد الدفعات، عدد الدفعات القادمة، عدد الدفعات السابقة، والدفعة القادمة بشكل بارز.",
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // اليوميات
  // ═══════════════════════════════════════════════
  {
    id: "daily-reports",
    group: "اليوميات",
    title: "اليوميات",
    content: [
      {
        type: "p",
        text: "من خلال هذه الشاشة يتم طباعة أي يومية حسب التفصيل التالي:",
      },
      {
        type: "table",
        headers: ["اسم اليومية", "الوصف"],
        rows: [
          [
            "يومية عددية بقوة الوحدة",
            "إجمالي القوة والخوارج داخل الوحدة المحددة",
          ],
          [
            "يومية عددية بخوارج الوحدات",
            "بيان عددي بالخوارج على مستوى جميع الوحدات الأساسية",
          ],
          [
            "كشف الأفراد الملحقين خارج وحدة",
            "كشف تفصيلي للأفراد الملحقين خارج وحدتهم الأساسية",
          ],
          [
            "يومية عددية بخوارج وحدة",
            "بيان بأماكن الخوارج من الوحدة المحددة",
          ],
          [
            "كشف الأفراد الملحقين على وحدة",
            "كشف الأفراد الملحقين من خارج الوحدة المحددة",
          ],
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // التقارير والسجلات
  // ═══════════════════════════════════════════════
  {
    id: "activity-log",
    group: "التقارير والسجلات",
    title: "سجل العمليات (Admin فقط)",
    content: [
      {
        type: "p",
        text: "سجل كامل بكل عملية حصلت في النظام: مين عملها، إمتى، وإيه تفاصيلها (تسجيل دخول، تعديل بيانات فرد، إصدار خطاب، إنهاء خدمة، ترحيل، طباعة، وغيرها).",
      },
      {
        type: "callout",
        tone: "success",
        text: "مفيد جدًا للمراجعة والمساءلة، لأنه بيوضح مين المسؤول عن أي تغيير حصل في البيانات.",
      },
    ],
  },
  {
    id: "data-backup",
    group: "التقارير والسجلات",
    title: "النسخ الاحتياطي للبيانات (Admin فقط)",
    content: [
      {
        type: "p",
        text: "صفحة لعمل نسخة احتياطية من بيانات النظام، كإجراء أمان ضد فقدان البيانات.",
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // المستخدمون
  // ═══════════════════════════════════════════════
  {
    id: "manage-users",
    group: "المستخدمون",
    title: "إدارة المستخدمين (Admin فقط)",
    content: [
      {
        type: "p",
        text: "من هنا بينشأ حسابات الدخول للنظام. حاليًا الحساب بيتربط بفرد موجود بالفعل في قاعدة البيانات (بالرقم العسكري).",
      },
      {
        type: "steps",
        items: [
          {
            title: "الضغط على زر 'إضافة مستخدم'",
            text: "",
          },
          {
            title: "إدخال الرقم العسكري للفرد",
            text: "لازم يكون الفرد بالخدمة، وليس تم تسريحه أو نقله خارج السلاح.",
          },
          {
            title: "مراجعة بيانات الفرد",
            text: "تظهر بيانات الفرد واسم المستخدم الخاص به تلقائيًا.",
          },
          {
            title: "تحديد الصلاحية",
            text: "اختيار صلاحية المستخدم الجديد من القائمة.",
          },
          {
            title: "الحفظ",
            text: "عند نجاح إنشاء المستخدم، يمكن الدخول على بياناته لعمل إعادة تعيين كلمة المرور لاحقًا.",
          },
        ],
      },
      {
        type: "table",
        headers: ["البيان", "القيمة"],
        rows: [
          [
            "اسم المستخدم (تسجيل الدخول)",
            "الرقم العسكري متبوعًا بـ @auth.local",
          ],
          ["كلمة المرور الافتراضية", "123456789 (يجب تعديلها لاحقًا)"],
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "يمكن لمدير النظام توقيف حساب مستخدم مؤقتًا من غير ما يحذفه — مفيد لو حد اتنقل أو محتاج توقف دخوله مؤقتًا.",
      },
    ],
  },
  {
    id: "forgot-password",
    group: "المستخدمون",
    title: "نسيت كلمة المرور",
    content: [
      {
        type: "steps",
        items: [
          {
            title: "من صفحة تسجيل الدخول",
            text: "دوس 'نسيت كلمة المرور؟' واكتب الإيميل بتاعك.",
          },
          {
            title: "الإشعار",
            text: "الطلب بيوصل كإشعار لمدير النظام.",
          },
          {
            title: "الموافقة",
            text: "الأدمن بيقدر يوافق على الطلب ويعيد تعيين كلمة المرور من صفحة الإشعارات مباشرة.",
          },
        ],
      },
    ],
  },
  {
    id: "user-menu",
    group: "المستخدمون",
    title: "القائمة الشخصية (الأفاتار)",
    content: [
      {
        type: "p",
        text: "الأفاتار الخاص بالمستخدم الحالي، أعلى الشاشة على اليسار، عند الضغط عليه يمكن للمستخدم:",
      },
      {
        type: "list",
        items: [
          "تغيير كلمة المرور الحالية",
          "الدخول على دليل استخدام المنظومة (نفس الصفحة اللي إنت فاتحها دلوقتي)",
        ],
      },
    ],
  },
  {
    id: "system-dev",
    group: "المستخدمون",
    title: "مصمم المنظومة",
    content: [
      {
        type: "p",
        text: "صمم هذه المنظومة",
      },
      {
        type: "list",
        items: [
          "جندى / اسلام مجدى عبدالستار",
          "دفعة رديف: 01/03/2025",
          "رقم هاتف: 01140187813",
        ],
      },
    ],
  },
];

const GROUPS = Array.from(new Set(GUIDE_SECTIONS.map((s) => s.group)));

/* =========================================================
   أيقونة كل قسم — لون واحد موحّد (أخضر المنظومة) في كل مكان
========================================================= */

const GROUP_ICONS: Record<string, LucideIcon> = {
  عام: LayoutGrid,
  الأفراد: UserPlus,
  الوحدات: Building2,
  الخطابات: Mail,
  "دفعات الرديف": RefreshCcw,
  اليوميات: FileBarChart,
  "التقارير والسجلات": ClipboardList,
  المستخدمون: UserCog,
};

function getGroupIcon(group: string): LucideIcon {
  return GROUP_ICONS[group] ?? LayoutGrid;
}

/* استخراج أول فقرة نصية من محتوى الموضوع، تُستخدم كوصف مختصر في الكارت */
function getExcerpt(section: GuideSection): string {
  const firstParagraph = section.content.find(
    (b) => b.type === "p"
  ) as { text: string } | undefined;

  return firstParagraph?.text ?? "";
}

/* هل الموضوع مطابق لكلمة البحث (في العنوان أو أي بلوك جواه) */
function sectionMatches(section: GuideSection, term: string): boolean {
  if (!term) return true;

  if (section.title.toLowerCase().includes(term)) return true;

  return section.content.some((block) => {
    if (block.type === "p") return block.text.toLowerCase().includes(term);

    if (block.type === "list")
      return block.items.some((i) => i.toLowerCase().includes(term));

    if (block.type === "steps")
      return block.items.some(
        (i) =>
          i.title.toLowerCase().includes(term) ||
          i.text.toLowerCase().includes(term)
      );

    if (block.type === "table")
      return block.rows.some((row) =>
        row.some((cell) => cell.toLowerCase().includes(term))
      );

    if (block.type === "callout") return block.text.toLowerCase().includes(term);

    return false;
  });
}

/* =========================================================
   عرض البلوكات
========================================================= */

const CALLOUT_STYLES = {
  info: {
    bg: "#eef1fd",
    border: "#c7cef7",
    text: "#1f3d97",
    icon: Info,
  },
  warning: {
    bg: "#fff8e8",
    border: "#f4d58d",
    text: "#8a6500",
    icon: AlertTriangle,
  },
  success: {
    bg: "#ebfaea",
    border: "#b9e6b4",
    text: "#26861d",
    icon: CheckCircle2,
  },
} as const;

function BlockRenderer({ block }: { block: GuideBlock }) {
  if (block.type === "p") {
    return (
      <p
        style={{
          ...F,
          fontSize: 14,
          color: "#4a5468",
          lineHeight: 1.9,
        }}
      >
        {block.text}
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="flex flex-col gap-2">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
              style={{ background: "#00b867" }}
            />

            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#4a5468",
                lineHeight: 1.8,
              }}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "steps") {
    return (
      <div className="relative pr-7">
        <div
          className="absolute top-2 bottom-2"
          style={{
            right: 11,
            width: 2,
            background: "#e2e7f0",
          }}
        />

        <div className="flex flex-col gap-5">
          {block.items.map((step, idx) => (
            <div key={idx} className="relative flex flex-col gap-0.5">
              <div
                className="absolute w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  right: -28,
                  top: 0,
                  background: GREEN_GRADIENT,
                }}
              >
                <span
                  style={{
                    ...F,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {idx + 1}
                </span>
              </div>

              <span
                style={{
                  ...F,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#2d3648",
                }}
              >
                {step.title}
              </span>

              {step.text && (
                <span
                  style={{
                    ...F,
                    fontSize: 13,
                    color: "#717d96",
                    lineHeight: 1.8,
                  }}
                >
                  {step.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div className="w-full overflow-x-auto rounded-[10px] border border-[#e2e7f0]">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr className="bg-[#f7f9fc]">
              {block.headers.map((h, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2.5 text-right border-b border-[#e2e7f0]"
                >
                  <span
                    style={{
                      ...F,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#717d96",
                    }}
                  >
                    {h}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {block.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#fafbff]">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-4 py-2.5 border-b border-[#f5f6fb]"
                  >
                    <span
                      style={{
                        ...F,
                        fontSize: 13,
                        color:
                          cell === "نعم"
                            ? "#00522E"
                            : cell === "—"
                            ? "#cbd2e0"
                            : "#2d3648",
                        fontWeight: cell === "نعم" ? 700 : 400,
                      }}
                    >
                      {cell}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "callout") {
    const style = CALLOUT_STYLES[block.tone];
    const Icon = style.icon;

    return (
      <div
        className="w-full rounded-[10px] px-4 py-3 flex items-start gap-2.5"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
        }}
      >
        <Icon
          size={16}
          style={{ color: style.text }}
          className="shrink-0 mt-0.5"
        />

        <span
          style={{
            ...F,
            fontSize: 13,
            fontWeight: 700,
            color: style.text,
            lineHeight: 1.8,
          }}
        >
          {block.text}
        </span>
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="w-full flex flex-col gap-2">
        <img
          src={block.src}
          alt={block.caption ?? ""}
          className="w-full rounded-[10px] border border-[#e2e7f0]"
        />

        {block.caption && (
          <figcaption
            className="text-center"
            style={{ ...F, fontSize: 12, color: "#a1aebe" }}
          >
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return null;
}

/* =========================================================
   كارت الموضوع (شاشة القائمة)
========================================================= */

function GuideCard({
  section,
  onClick,
}: {
  section: GuideSection;
  onClick: () => void;
}) {
  const Icon = getGroupIcon(section.group);
  const excerpt = getExcerpt(section);

  // ✅ كارت مخصص لموضوع معين بالـ id — أضف شرط زي ده لأي كارت
  // عايز شكله يختلف عن باقي الكروت
  if (section.id === "system-dev") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-right rounded-[12px] px-4 py-4 flex flex-col gap-2 items-center text-center"
        style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
      >
        <Icon size={22} style={{ color: "#fff" }} />
        <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#fff" }}>
          {section.title}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-right bg-white rounded-[12px] border border-[#eff0f6] px-4 py-4 hover:border-[#b9e6b4] hover:shadow-sm transition-all flex flex-col gap-2.5"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: "#DCF4DF" }}
        >
          <Icon size={18} style={{ color: "#00522E" }} />
        </div>

        <span
          style={{
            ...F,
            fontSize: 14,
            fontWeight: 700,
            color: "#2d3648",
          }}
        >
          {section.title}
        </span>
      </div>

      {excerpt && (
        <p
          className="line-clamp-2"
          style={{
            ...F,
            fontSize: 13,
            color: "#717d96",
            lineHeight: 1.7,
          }}
        >
          {excerpt}
        </p>
      )}
    </button>
  );
}

/* =========================================================
   شاشة القائمة (الكروت المجمّعة حسب القسم)
========================================================= */

function GuideListView({
  search,
  setSearch,
  onSelect,
}: {
  search: string;
  setSearch: (v: string) => void;
  onSelect: (id: string) => void;
}) {
  const term = search.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    return GROUPS.map((group) => ({
      group,
      sections: GUIDE_SECTIONS.filter(
        (s) => s.group === group && sectionMatches(s, term)
      ),
    })).filter((g) => g.sections.length > 0);
  }, [term]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div
        className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[10px] px-3 h-[48px] w-full max-w-md"
        dir="rtl"
      >
        <Search size={18} className="shrink-0 text-[#a1aebe]" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في الدليل..."
          className="flex-1 bg-transparent outline-none text-right"
          style={{ ...F, fontSize: 14, color: "#2d3648" }}
        />
      </div>

      {visibleGroups.length === 0 ? (
        <p
          className="text-center py-10"
          style={{ ...F, fontSize: 14, color: "#a1aebe" }}
        >
          لا توجد نتائج مطابقة لبحثك
        </p>
      ) : (
        visibleGroups.map(({ group, sections }) => {
          const GroupIcon = getGroupIcon(group);

          return (
            <div key={group} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <GroupIcon size={18} style={{ color: "#717d96" }} />

                <span
                  style={{
                    ...F,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#2d3648",
                  }}
                >
                  {group}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sections.map((s) => (
                  <GuideCard
                    key={s.id}
                    section={s}
                    onClick={() => onSelect(s.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* =========================================================
   شاشة التفاصيل
========================================================= */

function GuideDetailView({
  section,
  onBack,
  onSelect,
}: {
  section: GuideSection;
  onBack: () => void;
  onSelect: (id: string) => void;
}) {
  const Icon = getGroupIcon(section.group);

  const otherInGroup = GUIDE_SECTIONS.filter(
    (s) => s.group === section.group && s.id !== section.id
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Breadcrumb */}

      <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
        <button
          type="button"
          onClick={onBack}
          style={{ ...F, fontSize: 13, color: "#717d96" }}
          className="hover:text-[#2d3648] transition-colors"
        >
          دليل المنظومة
        </button>

        <ChevronLeft size={14} className="text-[#cbd2e0]" />

        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
          {section.group}
        </span>

        <ChevronLeft size={14} className="text-[#cbd2e0]" />

        <span style={{ ...F, fontSize: 13, fontWeight: 700, color: "#2d3648" }}>
          {section.title}
        </span>
      </div>

      <div className="bg-white rounded-[16px] border border-[#eff0f6] p-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 mb-5 hover:opacity-70 transition-opacity"
        >
          <ArrowRight size={16} style={{ color: "#00522E" }} />

          <span style={{ ...F, fontSize: 13, color: "#00522E" }}>
            العودة لدليل المنظومة
          </span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: GREEN_GRADIENT }}
          >
            <Icon size={20} style={{ color: "#fff" }} />
          </div>

          <h2
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 20,
              color: "#2d3648",
            }}
          >
            {section.title}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {section.content.map((block, idx) => (
            <BlockRenderer key={idx} block={block} />
          ))}
        </div>

        {otherInGroup.length > 0 && (
          <div className="mt-8 pt-5 border-t border-[#eff0f6]">
            <p
              style={{ ...F, fontSize: 13, color: "#717d96" }}
              className="mb-3"
            >
              صفحات أخرى في قسم "{section.group}"
            </p>

            <div className="flex flex-wrap gap-2.5">
              {otherInGroup.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className="flex items-center gap-1.5 bg-[#f7f9fc] hover:bg-[#f0f2f8] rounded-[8px] px-3 py-1.5 transition-colors"
                >
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                    {s.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   الصفحة
========================================================= */

export function UserGuidePage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const activeSection = GUIDE_SECTIONS.find((s) => s.id === activeId) ?? null;

  function handleSelect(id: string) {
    setActiveId(id);
    setSearch("");
  }

  function handleBack() {
    setActiveId(null);
  }

  return (
    <div className="flex flex-col gap-5 w-full pb-10" dir="rtl">
      {/* العنوان */}

      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#DCF4DF" }}
        >
          <BookOpen size={20} style={{ color: "#00522E" }} />
        </div>

        <div>
          <h1
            style={{
              ...F,
              fontWeight: 700,
              fontSize: "clamp(22px,4vw,30px)",
              color: "#2d3648",
            }}
          >
            دليل استخدام المنظومة
          </h1>

          <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
            شرح مفصّل لكل قسم وتاب في النظام
          </p>
        </div>
      </div>

      {activeSection ? (
        <GuideDetailView
          section={activeSection}
          onBack={handleBack}
          onSelect={handleSelect}
        />
      ) : (
        <GuideListView
          search={search}
          setSearch={setSearch}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}