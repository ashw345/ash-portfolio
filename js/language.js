const translations = {
  zh: {
    // Nav
    nav_available: "接受项目合作",
    nav_ui: "UIUX设计",
    nav_graphic: "平面设计",
    nav_dev: "独立开发",
    nav_photo: "摄影",
    nav_contact: "联系我",

    // Index / UI Design
    ui_tag: "精选作品",
    ui_title: "<span class=\"uiux-letters\">UIUX</span> 设计",
    ui_subtitle: "界面设计、设计系统与交互原型——追求每一个像素背后的逻辑与克制。",

    // Projects (index)
    member_meta: "2025 &nbsp;—&nbsp; UIUX · 喜马拉雅会员",
    member_title: "会员等级 Redesign",
    member_desc: "喜马拉雅会员等级视觉体系升级——从老旧的金属勋章，到统一的 V1–V8 宝石等级体系，强化用户的进阶感与尊贵感。",
    member_link: "查看详情 →",

    wisdom_meta: "2025 &nbsp;—&nbsp; UIUX · 喜马拉雅解忧小店",
    wisdom_title: "智慧大师",
    wisdom_desc: "喜马拉雅解忧小店的 AI 情绪咨询产品——挑一位大师说出烦恼，得到一份能读、能存、能分享的深度解忧报告。",
    wisdom_link: "查看详情 →",

    skygo_meta: "2023 &nbsp;—&nbsp; UIUX · SKY GO 流媒体",
    skygo_title: "SKY GO 短视频创作",
    skygo_desc: "为英国流媒体平台 Sky 设计的短视频创作链路——让看剧的人成为创作者，把观看与创作接成闭环。",
    skygo_link: "查看详情 →",

    snapfit_meta: "02 / 2024 &nbsp;—&nbsp; UIUX · 移动端",
    snapfit_title: "闪电健身 SnapFIT",
    snapfit_desc: "为年轻用户设计的即时健身社交 APP，通过 PK 对战与角色养成机制，让运动变得有趣、有仪式感。",
    snapfit_link: "查看详情 →",

    lyft_meta: "03 / 2023 &nbsp;—&nbsp; UIUX · 移动端",
    lyft_title: "Lyft 街景模式",
    lyft_desc: "为 Lyft 网约车进行迭代设计，解决用户在打车过程中难以找到司机和上车点的问题，引入街景功能让打车更直观。",
    lyft_link: "查看详情 →",

    nexus_meta: "01 / 2024 &nbsp;—&nbsp; 设计系统",
    nexus_title: "Nexus UI",
    nexus_desc: "为金融科技团队构建的全面设计系统，强调严格的网格布局和以数据可视化为核心的组件规范，确保跨平台的一致性与可扩展性。",
    nexus_link: "查看详情 →",

    silent_meta: "02 / 2023 &nbsp;—&nbsp; 交互设计",
    silent_title: "Silent Forms",
    silent_desc: "为 SaaS 产品设计的零摩擦表单交互，通过实时反馈与渐进式验证让用户在不感知错误的情况下完成复杂数据录入。",
    silent_link: "查看详情 →",

    grid_meta: "03 / 2023 &nbsp;—&nbsp; 数据可视化",
    grid_title: "Grid Atlas",
    grid_desc: "开源数据网格组件库，为企业级应用提供高性能、可定制的表格解决方案，支持百万级数据行的秒级渲染。",
    grid_link: "查看详情 →",

    mono_meta: "04 / 2022 &nbsp;—&nbsp; 仪表板设计",
    mono_title: "Mono Dash",
    mono_desc: "面向数据分析师的极简仪表板框架，将复杂的多维度信息浓缩到关键指标与趋势线上，强调一眼洞察。",
    mono_link: "查看详情 →",

    // Dev page
    dev_tag: "精选作品",
    dev_title: "<span class=\"dev-title-zh\">独立开发</span><span class=\"dev-title-sub\">PROJECTS</span>",
    dev_subtitle: "独立开发的工具、游戏与应用——从零构建，由设计驱动，以体验为终点。",
    graphic_tag: "精选作品",
    graphic_title: "平面设计",
    graphic_subtitle: "品牌视觉、海报与排版——在静态画面中构建节奏与秩序。",

    asm_meta: "01 / 品牌视觉 · 博物馆",
    asm_title: "Air / Space Museum",
    asm_desc: "以斜杠、超粗字体与四色系统构建航空航天博物馆品牌，并延展到票券、腕带、导览物料与公共传播。",
    asm_link: "查看详情 →",
    asm_kicker: "品牌视觉 · 博物馆",
    asm_case_scope_label: "项目范围",
    asm_case_outputs_label: "设计产出",
    asm_case_role_label: "项目角色",
    asm_case_role: "品牌与平面设计师",
    asm_case_intro: "为航空航天博物馆建立一套鲜明、灵活且容易延展的视觉识别。设计以飞行轨迹般的斜杠为核心，将黑白影像、超粗字体与四种高识别度色彩组织成统一系统。",
    asm_case_scope: "品牌策略与视觉识别",
    asm_case_outputs: "标志、票券、导览物料、海报",
    asm_color_title: "色彩系统",
    asm_color_orange: "橙色",
    asm_color_yellow: "黄色",
    asm_color_teal: "青绿色",
    asm_color_lavender: "淡紫色",
    asm_color_intro: "四种颜色对应不同的参观体验，同时让严肃的航空主题保持开放与活力。",
    asm_logo_title: "标志系统",
    asm_logo_intro: "斜杠贯穿文字结构，既是分隔符，也是速度、方向与飞行轨迹的视觉线索。",
    asm_type_title: "字体规范",
    asm_type_intro: "Helvetica Now Display Extra Black 提供清晰、直接的标题层级，并在不同尺寸的印刷物中保持稳定识别。",
    asm_journey_title: "参观旅程",
    asm_touchpoint_intro: "品牌系统沿着观众的参观路径展开，从第一次接触、购票入场，到工作人员识别，形成连续而清晰的体验。",
    asm_exterior_title: "外立面应用",
    asm_exterior_billboard: "建筑外立面 · 户外广告牌",
    asm_exterior_citylight: "建筑外立面 · 灯箱海报",
    asm_stationery_caption: "品牌文具 · 初次接触",
    asm_wordmark_caption: "文字标志 · 核心识别",
    asm_admission_title: "入场票券系统",
    asm_staff_title: "工作人员识别",
    asm_campaign_title: "宣传物料",
    asm_campaign_intro: "折页、书签与纪念包装将四色系统带入可被拿走的物件，让不同载体仍保有统一的品牌节奏。",
    asm_campaign_caption: "宣传影像 · 纪念物料",
    asm_packaging_caption: "包装设计 · 零售延展",
    asm_poster_title: "海报",
    asm_poster_intro: "海报从画廊墙面延伸到室内吊旗与户外媒体，以高对比图像和超粗文字建立远距离识别。",

    huihui_meta: "01 / 2024 &nbsp;—&nbsp; 微信小程序",
    huihui_title: "会买·小程序",
    huihui_desc: "让用户直接写下自己的选购需求，系统据此匹配更合适的 3C 数码家电，并把难懂的规格参数翻译成清楚、实用的人话，帮助用户更轻松地做选择。",
    huihui_link: "查看详情 →",

    void_meta: "01 / 2024 &nbsp;—&nbsp; 游戏开发",
    void_title: "Void Runner",
    void_desc: "由小型独立团队全程开发的横版运动平台游戏，专注于高对比度视觉层次与精密的物理碰撞机制，在极简画面中构建丰富的操作张力。",
    void_link: "查看详情 →",

    syntax_meta: "02 / 2023 &nbsp;—&nbsp; 开发者工具",
    syntax_title: "Syntax Theme",
    syntax_desc: "为长时间编程设计的高对比度深色代码主题，通过精心调校的色调层次让眼睛舒适地沉浸其中，支持 VS Code / Neovim / JetBrains。",
    syntax_link: "查看详情 →",

    orbit_meta: "03 / 2023 &nbsp;—&nbsp; 网页应用",
    orbit_title: "Orbit CMS",
    orbit_desc: "为小型创意团队设计的轻量级内容管理系统，以编辑体验为优先，将发布流程压缩到最小摩擦。",
    orbit_link: "查看详情 →",

    echo_meta: "04 / 2022 &nbsp;—&nbsp; CLI 工具",
    echo_title: "Echo CLI",
    echo_desc: "面向设计师的命令行工具集，将重复性的文件批处理、资源导出与格式转换压缩为一行指令。",
    echo_link: "查看详情 →",

    // About
    about_tag: "About",
    about_title: "你好，我是",
    about_subtitle: "你好！我是一名 UIUX 设计师，纽约视觉艺术学院（SVA）平面设计 BFA。毕业后在喜马拉雅负责会员板块的设计；也在字节跳动做过 AIGC 方向的实习。现在专注 AI 产品设计 + Vibe Coding，把有趣的想法做成能用的产品——这个网站就是其中之一。",

    // Photography
    photo_label: "页面设计中  ·  Coming Soon",
    photo_back: "← 返回首页",

    // Independent Dev
    dev_label: "页面设计中  ·  Coming Soon",
    dev_back: "← 返回首页",

    // Contact page
    contact_title: "联系我",
    contact_email_label: "邮箱",
    contact_wechat_label: "微信",

    // Footer
    footer_email: "电子邮件",
    footer_resume: "个人简历",
    footer_links: "其他链接",
    footer_ui: "UIUX设计",
    footer_graphic: "平面设计",
    footer_dev: "独立开发",
    footer_photo: "摄影",
    footer_copy: "© 2026 ASH",
    project_prev: "← 上一个项目",
    project_next: "下一个项目 →",
    project_back_ui: "返回 UIUX 设计 ↗",
    project_back_graphic: "返回平面设计 ↗",
    project_back_dev: "返回独立开发 ↗",
  },
  en: {
    // Nav
    nav_available: "Open to Freelance",
    nav_ui: "UIUX Design",
    nav_graphic: "Graphic Design",
    nav_dev: "Independent Dev",
    nav_photo: "Photography",
    nav_contact: "Contact",

    // Index / UI Design
    ui_tag: "Selected Works",
    ui_title: "<span class=\"uiux-letters\">UIUX</span> Design",
    ui_subtitle: "Interface design, design systems, and interactive prototypes—pursuing the logic and restraint behind every pixel.",

    // Projects (index)
    member_meta: "2025 &nbsp;—&nbsp; UIUX · Ximalaya Membership",
    member_title: "Membership Level Redesign",
    member_desc: "A visual system upgrade for Ximalaya's membership levels—from outdated metal medals to a unified V1–V8 gemstone hierarchy that elevates progression and prestige.",
    member_link: "View Details →",

    wisdom_meta: "2025 &nbsp;—&nbsp; UIUX · Ximalaya Worry-Relief Shop",
    wisdom_title: "Wisdom Master",
    wisdom_desc: "An AI emotional-counselling product in Ximalaya's Worry-Relief Shop—pick a master, tell them what's bothering you, and get a report worth reading, keeping and sharing.",
    wisdom_link: "View Details →",

    skygo_meta: "2023 &nbsp;—&nbsp; UIUX · SKY GO Streaming",
    skygo_title: "SKY GO Short-Video Creation",
    skygo_desc: "A short-video creation flow for UK streaming platform Sky—turning viewers into creators and closing the loop between watching and making.",
    skygo_link: "View Details →",

    snapfit_meta: "02 / 2024 &nbsp;—&nbsp; UIUX · Mobile",
    snapfit_title: "SnapFIT Fitness",
    snapfit_desc: "An instant fitness social app for young users, making workouts fun and ceremonial through PK battles and character growth mechanics.",
    snapfit_link: "View Details →",

    lyft_meta: "03 / 2023 &nbsp;—&nbsp; UIUX · Mobile",
    lyft_title: "Lyft Street View",
    lyft_desc: "Iterative redesign of Lyft's ride-hailing app, solving the problem of passengers struggling to locate their driver and pickup point by introducing street view.",
    lyft_link: "View Details →",

    nexus_meta: "01 / 2024 &nbsp;—&nbsp; Design System",
    nexus_title: "Nexus UI",
    nexus_desc: "A comprehensive design system built for fintech teams, emphasizing strict grid layouts and data visualization-centric component standards, ensuring cross-platform consistency and scalability.",
    nexus_link: "View Details →",

    silent_meta: "02 / 2023 &nbsp;—&nbsp; Interaction Design",
    silent_title: "Silent Forms",
    silent_desc: "Zero-friction form interaction designed for SaaS products, using real-time feedback and progressive validation to guide users through complex data entry without perceived errors.",
    silent_link: "View Details →",

    grid_meta: "03 / 2023 &nbsp;—&nbsp; Data Visualization",
    grid_title: "Grid Atlas",
    grid_desc: "Open-source data grid component library providing high-performance, customizable table solutions for enterprise applications, supporting millisecond rendering of millions of data rows.",
    grid_link: "View Details →",

    mono_meta: "04 / 2022 &nbsp;—&nbsp; Dashboard Design",
    mono_title: "Mono Dash",
    mono_desc: "A minimalist dashboard framework for data analysts, condensing complex multi-dimensional information into key metrics and trend lines, emphasizing insight at a glance.",
    mono_link: "View Details →",

    // Dev page
    dev_tag: "Selected Works",
    dev_title: "Independent Dev",
    dev_subtitle: "Tools, games, and applications built from scratch—designed-driven, with experience as the endpoint.",
    graphic_tag: "Selected Works",
    graphic_title: "Graphic Design",
    graphic_subtitle: "Brand visuals, posters, and typography—building rhythm and order in static frames.",

    asm_meta: "01 / Brand Identity · Museum",
    asm_title: "Air / Space Museum",
    asm_desc: "A museum identity built from slash marks, heavy typography, and a four-color system, extended across tickets, wristbands, wayfinding pieces, and public communications.",
    asm_link: "View Details →",
    asm_kicker: "Brand Identity · Museum",
    asm_case_scope_label: "Scope",
    asm_case_outputs_label: "Outputs",
    asm_case_role_label: "Role",
    asm_case_role: "Brand & Graphic Designer",
    asm_case_intro: "A bold and flexible identity for an air and space museum. Flight-path slashes organize monochrome imagery, extra-heavy typography, and four high-recognition colors into one extensible system.",
    asm_case_scope: "Brand strategy and visual identity",
    asm_case_outputs: "Logo, tickets, visitor materials, posters",
    asm_color_title: "Color System",
    asm_color_orange: "Orange",
    asm_color_yellow: "Yellow",
    asm_color_teal: "Teal",
    asm_color_lavender: "Lavender",
    asm_color_intro: "Four colors distinguish different visitor experiences while keeping the technical subject open, energetic, and accessible.",
    asm_logo_title: "Logo System",
    asm_logo_intro: "The slash runs through the wordmark as both separator and visual shorthand for speed, direction, and flight paths.",
    asm_type_title: "Typography",
    asm_type_intro: "Helvetica Now Display Extra Black creates a direct, legible hierarchy that remains recognizable across print formats and scales.",
    asm_journey_title: "Visitor Journey",
    asm_touchpoint_intro: "The identity follows the visitor journey from first contact and admission through staff recognition, creating one continuous experience.",
    asm_exterior_title: "Exterior Applications",
    asm_exterior_billboard: "Building exterior · Billboard",
    asm_exterior_citylight: "Building exterior · Citylight",
    asm_stationery_caption: "Stationery · First contact",
    asm_wordmark_caption: "Wordmark · Core identity",
    asm_admission_title: "Admission System",
    asm_staff_title: "Staff Recognition",
    asm_campaign_title: "Campaign",
    asm_campaign_intro: "Foldouts, bookmarks, and retail packaging carry the four-color system into objects visitors can take with them.",
    asm_campaign_caption: "Campaign imagery · Takeaway",
    asm_packaging_caption: "Packaging · Retail extension",
    asm_poster_title: "Poster",
    asm_poster_intro: "The poster system expands from gallery walls to interior banners and outdoor media, pairing bold type with high-contrast imagery.",

    huihui_meta: "01 / 2024 &nbsp;—&nbsp; WeChat Mini Program",
    huihui_title: "HuiMai Mini Program",
    huihui_desc: "Users describe what they need in their own words. The product then matches them with more suitable electronics and translates technical specifications into clear, practical language, making the final choice easier.",
    huihui_link: "View Details →",

    void_meta: "01 / 2024 &nbsp;—&nbsp; Game Development",
    void_title: "Void Runner",
    void_desc: "A side-scrolling action platformer developed by a small indie team, focusing on high-contrast visual hierarchy and precise collision physics, building rich gameplay tension through minimalist aesthetics.",
    void_link: "View Details →",

    syntax_meta: "02 / 2023 &nbsp;—&nbsp; Developer Tool",
    syntax_title: "Syntax Theme",
    syntax_desc: "A high-contrast dark code theme designed for extended programming sessions, with carefully tuned color layers for comfortable immersion, supporting VS Code / Neovim / JetBrains.",
    syntax_link: "View Details →",

    orbit_meta: "03 / 2023 &nbsp;—&nbsp; Web Application",
    orbit_title: "Orbit CMS",
    orbit_desc: "A lightweight content management system designed for small creative teams, prioritizing editor experience and compressing the publishing workflow to minimal friction.",
    orbit_link: "View Details →",

    echo_meta: "04 / 2022 &nbsp;—&nbsp; CLI Tool",
    echo_title: "Echo CLI",
    echo_desc: "A command-line toolkit for designers, compressing repetitive file batch processing, asset export, and format conversion into single-line commands.",
    echo_link: "View Details →",

    // About
    about_tag: "About",
    about_title: "Hi, I'm",
    about_subtitle: "Hi! I'm a UIUX designer with a BFA in Graphic Design from the School of Visual Arts (SVA). After graduating I led membership design at Ximalaya, and interned on AIGC at ByteDance before that. These days I focus on AI product design + vibe coding — turning fun ideas into things people can actually use. This site is one of them.",

    // Photography
    photo_label: "Page in Design  ·  Coming Soon",
    photo_back: "← Back to Home",

    // Independent Dev
    dev_label: "Page in Design  ·  Coming Soon",
    dev_back: "← Back to Home",

    // Contact page
    contact_title: "Contact<br>Me.",
    contact_email_label: "Email",
    contact_wechat_label: "WeChat",

    // Footer
    footer_email: "Email",
    footer_resume: "Resume",
    footer_links: "Links",
    footer_ui: "UIUX Design",
    footer_graphic: "Graphic Design",
    footer_dev: "Independent Dev",
    footer_photo: "Photography",
    footer_copy: "© 2026 ASH",
    project_prev: "← Previous Project",
    project_next: "Next Project →",
    project_back_ui: "Back to UIUX Design ↗",
    project_back_graphic: "Back to Graphic Design ↗",
    project_back_dev: "Back to Independent Dev ↗",
  }
};

let currentLang = localStorage.getItem('lang') || 'zh';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyLanguage();
}

function applyLanguage() {
  // Update nav
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      if (key.includes('title') || key.includes('subtitle') || key.includes('desc') || key.includes('meta')) {
        el.innerHTML = translations[currentLang][key];
      } else {
        el.textContent = translations[currentLang][key];
      }
    }
  });

  // Update lang button text
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.textContent = 'EN/中';
  }

  // Update html lang attribute
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', applyLanguage);

// Expose for global use
window.setLanguage = setLanguage;
window.currentLang = currentLang;
