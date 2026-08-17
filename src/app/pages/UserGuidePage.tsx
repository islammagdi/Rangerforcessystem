import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

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
];

const GROUPS = Array.from(new Set(GUIDE_SECTIONS.map((s) => s.group)));

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
      <div className="flex flex-col gap-3">
        {block.items.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{
                  ...F,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {idx + 1}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
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
          </div>
        ))}
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
   الصفحة
========================================================= */

export function UserGuidePage() {
  const [activeId, setActiveId] = useState(GUIDE_SECTIONS[0].id);
  const [search, setSearch] = useState("");

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return GUIDE_SECTIONS;

    return GUIDE_SECTIONS.filter((s) => {
      if (s.title.toLowerCase().includes(term)) return true;

      return s.content.some((block) => {
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
        if (block.type === "callout")
          return block.text.toLowerCase().includes(term);
        return false;
      });
    });
  }, [search]);

  const activeSection =
    GUIDE_SECTIONS.find((s) => s.id === activeId) ?? GUIDE_SECTIONS[0];

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

      {/* البحث */}

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

      {/* المحتوى: قائمة + تفاصيل */}

      <div className="flex gap-5 items-start flex-wrap lg:flex-nowrap w-full">
        {/* القائمة الجانبية */}

        <div className="w-full lg:w-[300px] shrink-0 bg-white rounded-[16px] border border-[#eff0f6] overflow-hidden">
          {search.trim() ? (
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {filteredSections.length === 0 ? (
                <p
                  className="px-4 py-6 text-center"
                  style={{ ...F, fontSize: 13, color: "#a1aebe" }}
                >
                  لا توجد نتائج مطابقة
                </p>
              ) : (
                filteredSections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveId(s.id);
                      setSearch("");
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-[#f5f6fb] transition-colors"
                    style={{ ...F, fontSize: 13, color: "#2d3648" }}
                  >
                    {s.title}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {GROUPS.map((group) => (
                <div key={group} className="mb-1">
                  <p
                    className="px-4 pt-3 pb-1"
                    style={{
                      ...F,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#a1aebe",
                    }}
                  >
                    {group}
                  </p>

                  {GUIDE_SECTIONS.filter((s) => s.group === group).map(
                    (s) => {
                      const isActive = s.id === activeId;

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveId(s.id)}
                          className="w-full text-right px-4 py-2.5 transition-colors"
                          style={{
                            ...F,
                            fontSize: 14,
                            fontWeight: isActive ? 700 : 400,
                            color: isActive ? "#1f3d97" : "#2d3648",
                            background: isActive ? "#f0f2fd" : "transparent",
                          }}
                        >
                          {s.title}
                        </button>
                      );
                    }
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* المحتوى */}

        <div className="flex-1 min-w-0 w-full bg-white rounded-[16px] border border-[#eff0f6] p-6">
          <h2
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 20,
              color: "#2d3648",
              marginBottom: 16,
            }}
          >
            {activeSection.title}
          </h2>

          <div className="flex flex-col gap-4">
            {activeSection.content.map((block, idx) => (
              <BlockRenderer key={idx} block={block} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}