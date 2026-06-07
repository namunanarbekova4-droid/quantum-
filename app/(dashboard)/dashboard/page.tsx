"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic2, Video, Layers, Target, Send, Search as SearchIcon,
  Compass, Lightbulb, UserPlus, FileText, Newspaper,
  Play, Mail, Heart, BookOpen, DollarSign, Calendar,
  Calculator, ArrowRight, ShieldAlert, Trophy, Bell,
  Flame, X, TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import Link from "next/link";

// ─── Translations ──────────────────────────────────────────────────────────────

const T = {
  en: {
    greeting_morning: "Good morning",
    greeting_afternoon: "Good afternoon",
    greeting_evening: "Good evening",
    tagline: "For founders before the world believes. What are we building today?",
    search_placeholder: "Search tools...",
    no_results: "No tools found for",
    pitch_arsenal: "Your Pitch Arsenal",
    pitch_arsenal_sub: "Everything you need to nail your pitch",
    hero1_title: "Pitch Coach Live",
    hero1_desc: "Speak your pitch out loud. Get brutal honest coaching in real time. Know exactly what to fix before you walk into any investor meeting.",
    hero1_s1: "Real-time feedback", hero1_s2: "Voice analysis",
    hero1_btn: "Start Session →",
    hero1_badge: "LIVE",
    hero2_title: "Pitch Deck Creator",
    hero2_desc: "Answer 10 questions in your own words. Get a complete professional pitch deck written in your exact voice. Ready to download and present.",
    hero2_s1: "12 slides", hero2_s2: "Your voice", hero2_s3: "PDF export",
    hero2_btn: "Create My Deck →",
    hero2_badge: "AI POWERED",
    hero3_title: "Pitch Mirror",
    hero3_desc: "Record yourself pitching. Watch it back with AI annotations. See exactly how investors see you and fix it before it costs you a deal.",
    hero3_s1: "Video feedback", hero3_s2: "AI annotations",
    hero3_btn: "Start Practicing →",
    hero3_badge: "PRACTICE",
    cat1_title: "🎯 Find & Grow",
    cat1_desc: "Tools that find real opportunities for you",
    cat2_title: "🧠 Build & Validate",
    cat2_desc: "Before you build, make sure it's right",
    cat3_title: "✍️ Create & Write",
    cat3_desc: "Professional content in your voice",
    cat4_title: "📈 Strategy & Plan",
    cat4_desc: "Plan your next moves with confidence",
    open: "Open →",
    founder_wall: "🏆 Founder Wall",
    see_leaderboard: "See Full Leaderboard →",
    latest_signals: "🔔 Latest Signals",
    manage_alerts: "Manage Alerts →",
    no_leaders: "Be the first on the leaderboard 🔥",
    no_alerts: "No alerts yet. Set up signal radar.",
    setup_alerts: "Set up alerts →",
    day_streak: "day streak",
    challenge_title: "Challenge Any Decision",
    challenge_desc: "Got a big decision to make? Let Quantum argue against it before you commit. Find the flaws before investors do.",
    challenge_btn: "Challenge a Decision →",
  },
  ru: {
    greeting_morning: "Доброе утро",
    greeting_afternoon: "Добрый день",
    greeting_evening: "Добрый вечер",
    tagline: "Для основателей до того, как мир поверит. Что строим сегодня?",
    search_placeholder: "Поиск инструментов...",
    no_results: "Инструменты не найдены для",
    pitch_arsenal: "Ваш Арсенал Питча",
    pitch_arsenal_sub: "Всё необходимое для идеального питча",
    hero1_title: "Живой Питч-Коуч",
    hero1_desc: "Произнесите питч вслух. Получите честный коучинг в реальном времени. Узнайте, что исправить до встречи с инвестором.",
    hero1_s1: "Обратная связь в реальном времени", hero1_s2: "Анализ голоса",
    hero1_btn: "Начать сессию →",
    hero1_badge: "LIVE",
    hero2_title: "Создатель Питч-Деков",
    hero2_desc: "Ответьте на 10 вопросов своими словами. Получите полный профессиональный питч-дек в вашем стиле.",
    hero2_s1: "12 слайдов", hero2_s2: "Ваш голос", hero2_s3: "PDF экспорт",
    hero2_btn: "Создать мой дек →",
    hero2_badge: "AI",
    hero3_title: "Зеркало Питча",
    hero3_desc: "Запишите себя. Просмотрите с AI-аннотациями. Увидьте себя глазами инвестора.",
    hero3_s1: "Видео обратная связь", hero3_s2: "AI аннотации",
    hero3_btn: "Начать практику →",
    hero3_badge: "ПРАКТИКА",
    cat1_title: "🎯 Найти и Вырасти",
    cat1_desc: "Инструменты для поиска реальных возможностей",
    cat2_title: "🧠 Построить и Проверить",
    cat2_desc: "Перед созданием убедитесь, что всё правильно",
    cat3_title: "✍️ Создать и Написать",
    cat3_desc: "Профессиональный контент в вашем стиле",
    cat4_title: "📈 Стратегия и План",
    cat4_desc: "Планируйте следующие шаги уверенно",
    open: "Открыть →",
    founder_wall: "🏆 Стена Основателей",
    see_leaderboard: "Полная таблица лидеров →",
    latest_signals: "🔔 Последние Сигналы",
    manage_alerts: "Управлять уведомлениями →",
    no_leaders: "Станьте первым в таблице 🔥",
    no_alerts: "Нет уведомлений. Настройте радар.",
    setup_alerts: "Настроить уведомления →",
    day_streak: "дней подряд",
    challenge_title: "Оспорьте Любое Решение",
    challenge_desc: "Есть важное решение? Позвольте Quantum аргументировать против него. Найдите слабые места до инвесторов.",
    challenge_btn: "Оспорить решение →",
  },
  es: {
    greeting_morning: "Buenos días",
    greeting_afternoon: "Buenas tardes",
    greeting_evening: "Buenas noches",
    tagline: "Para fundadores antes de que el mundo crea. ¿Qué construimos hoy?",
    search_placeholder: "Buscar herramientas...",
    no_results: "No se encontraron herramientas para",
    pitch_arsenal: "Tu Arsenal de Pitch",
    pitch_arsenal_sub: "Todo lo que necesitas para clavar tu pitch",
    hero1_title: "Coach de Pitch en Vivo",
    hero1_desc: "Di tu pitch en voz alta. Recibe coaching honesto en tiempo real. Sabe exactamente qué corregir antes de reunirte con inversores.",
    hero1_s1: "Feedback en tiempo real", hero1_s2: "Análisis de voz",
    hero1_btn: "Iniciar sesión →",
    hero1_badge: "EN VIVO",
    hero2_title: "Creador de Pitch Deck",
    hero2_desc: "Responde 10 preguntas con tus propias palabras. Obtén un pitch deck profesional completo en tu voz exacta.",
    hero2_s1: "12 diapositivas", hero2_s2: "Tu voz", hero2_s3: "Exportar PDF",
    hero2_btn: "Crear mi deck →",
    hero2_badge: "IA",
    hero3_title: "Espejo de Pitch",
    hero3_desc: "Grábate haciendo tu pitch. Míralo con anotaciones de IA. Ve exactamente cómo te ven los inversores.",
    hero3_s1: "Feedback en video", hero3_s2: "Anotaciones IA",
    hero3_btn: "Empezar a practicar →",
    hero3_badge: "PRÁCTICA",
    cat1_title: "🎯 Encontrar y Crecer",
    cat1_desc: "Herramientas que encuentran oportunidades reales",
    cat2_title: "🧠 Construir y Validar",
    cat2_desc: "Antes de construir, asegúrate de que es correcto",
    cat3_title: "✍️ Crear y Escribir",
    cat3_desc: "Contenido profesional en tu voz",
    cat4_title: "📈 Estrategia y Plan",
    cat4_desc: "Planifica tus próximos pasos con confianza",
    open: "Abrir →",
    founder_wall: "🏆 Muro de Fundadores",
    see_leaderboard: "Ver tabla completa →",
    latest_signals: "🔔 Últimas Señales",
    manage_alerts: "Gestionar alertas →",
    no_leaders: "Sé el primero en la tabla 🔥",
    no_alerts: "Sin alertas aún. Configura el radar.",
    setup_alerts: "Configurar alertas →",
    day_streak: "días seguidos",
    challenge_title: "Desafía Cualquier Decisión",
    challenge_desc: "¿Tienes una decisión importante? Deja que Quantum argumente en contra antes de comprometerte.",
    challenge_btn: "Desafiar una decisión →",
  },
  zh: {
    greeting_morning: "早上好",
    greeting_afternoon: "下午好",
    greeting_evening: "晚上好",
    tagline: "为世界还未相信时的创始人。今天我们构建什么？",
    search_placeholder: "搜索工具...",
    no_results: "未找到相关工具",
    pitch_arsenal: "你的演讲武器库",
    pitch_arsenal_sub: "一切你需要的，完美钉住你的演讲",
    hero1_title: "实时演讲教练",
    hero1_desc: "大声说出你的演讲。获得实时诚实的教练指导。在见投资人之前，确切知道需要修正什么。",
    hero1_s1: "实时反馈", hero1_s2: "语音分析",
    hero1_btn: "开始会话 →",
    hero1_badge: "直播",
    hero2_title: "演示文稿创建器",
    hero2_desc: "用你自己的话回答10个问题。获得完整的专业演示文稿，以你确切的声音写成。",
    hero2_s1: "12张幻灯片", hero2_s2: "你的声音", hero2_s3: "PDF导出",
    hero2_btn: "创建我的演示 →",
    hero2_badge: "AI 驱动",
    hero3_title: "演讲镜子",
    hero3_desc: "录制你自己的演讲。用AI注释回看。看到投资人如何看你，在损失交易前修正。",
    hero3_s1: "视频反馈", hero3_s2: "AI注释",
    hero3_btn: "开始练习 →",
    hero3_badge: "练习",
    cat1_title: "🎯 寻找与增长",
    cat1_desc: "为你寻找真实机会的工具",
    cat2_title: "🧠 构建与验证",
    cat2_desc: "在构建之前，确保方向正确",
    cat3_title: "✍️ 创建与写作",
    cat3_desc: "以你的声音创建专业内容",
    cat4_title: "📈 策略与计划",
    cat4_desc: "自信地规划你的下一步",
    open: "打开 →",
    founder_wall: "🏆 创始人墙",
    see_leaderboard: "查看完整排行榜 →",
    latest_signals: "🔔 最新信号",
    manage_alerts: "管理提醒 →",
    no_leaders: "成为排行榜第一 🔥",
    no_alerts: "暂无提醒。设置信号雷达。",
    setup_alerts: "设置提醒 →",
    day_streak: "天连续",
    challenge_title: "挑战任何决定",
    challenge_desc: "有重大决策？让Quantum在你承诺之前反驳它。在投资人发现之前找到缺陷。",
    challenge_btn: "挑战一个决策 →",
  },
} as const;

type Lang = keyof typeof T;
type Txt = (typeof T)[Lang];

function getGreeting(locale: string, txt: Txt): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return txt.greeting_morning;
  if (hour >= 12 && hour < 18) return txt.greeting_afternoon;
  return txt.greeting_evening;
}

// ─── Tool data ─────────────────────────────────────────────────────────────────

interface SmallTool {
  nameEn: string;
  descEn: string;
  href: string;
  icon: React.ElementType;
}

type Category = {
  titleKey: keyof Txt;
  descKey: keyof Txt;
  tools: SmallTool[];
};

const CATEGORIES: Category[] = [
  {
    titleKey: "cat1_title",
    descKey: "cat1_desc",
    tools: [
      { nameEn: "Find First Customer", descEn: "We find real people who need you today.", href: "/dashboard/first-customer", icon: Target },
      { nameEn: "Cold Email Writer", descEn: "10 personalized emails ready to send.", href: "/dashboard/cold-emails", icon: Send },
      { nameEn: "Investor Finder", descEn: "Find investors and track your outreach.", href: "/dashboard/investor-finder", icon: SearchIcon },
      { nameEn: "Investor Q&A Trainer", descEn: "Prepare for every tough investor question.", href: "/dashboard/investor-qa", icon: TrendingUp },
    ],
  },
  {
    titleKey: "cat2_title",
    descKey: "cat2_desc",
    tools: [
      { nameEn: "Quantum Compass", descEn: "For when you feel lost or stuck.", href: "/dashboard/compass", icon: Compass },
      { nameEn: "Idea Validator", descEn: "Brutal honest feedback on your idea.", href: "/dashboard/idea-validator", icon: Lightbulb },
      { nameEn: "Co-founder Match", descEn: "Find your perfect co-founder.", href: "/dashboard/cofounder", icon: UserPlus },
      { nameEn: "Pricing Intelligence", descEn: "Find the perfect price for your product.", href: "/dashboard/pricing-intelligence", icon: DollarSign },
    ],
  },
  {
    titleKey: "cat3_title",
    descKey: "cat3_desc",
    tools: [
      { nameEn: "One Pager Generator", descEn: "Professional investor one-pager.", href: "/dashboard/one-pager", icon: FileText },
      { nameEn: "Press Release AI", descEn: "Launch announcements that get noticed.", href: "/dashboard/press-release", icon: Newspaper },
      { nameEn: "Demo Script Writer", descEn: "Exactly what to say during your demo.", href: "/dashboard/demo-script", icon: Play },
      { nameEn: "Investor Email Writer", descEn: "Emails investors actually reply to.", href: "/dashboard/investor-email", icon: Mail },
      { nameEn: "Founder Story Builder", descEn: "Your story told the way it deserves.", href: "/dashboard/founder-story", icon: Heart },
      { nameEn: "Manifesto Builder", descEn: "Define what your company stands for.", href: "/dashboard/manifesto", icon: BookOpen },
    ],
  },
  {
    titleKey: "cat4_title",
    descKey: "cat4_desc",
    tools: [
      { nameEn: "Content Plan (30 days)", descEn: "30 days of content in your voice.", href: "/dashboard/content-plan", icon: Calendar },
      { nameEn: "Runway Calculator", descEn: "Know exactly how long your money lasts.", href: "/dashboard/founder/runway-calculator", icon: Calculator },
      { nameEn: "Landing Page Generator", descEn: "Generate a converting landing page.", href: "/dashboard/landing-page", icon: Layers },
    ],
  },
];

const ALL_TOOLS_FLAT = CATEGORIES.flatMap((c) => c.tools);

// ─── Aurora background ─────────────────────────────────────────────────────────

function AuroraBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <style>{`
        @keyframes auroraFloat {
          0%   { transform: translate(0px,   0px)  }
          25%  { transform: translate(30px, -30px) }
          50%  { transform: translate(-20px, 20px) }
          75%  { transform: translate(20px,  30px) }
          100% { transform: translate(0px,   0px)  }
        }
      `}</style>
      <div style={{
        position: "absolute", top: "-100px", right: "-100px",
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(124,58,237,0.3), transparent 70%)",
        borderRadius: "50%",
        animation: "auroraFloat 15s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", left: "-100px",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(201,168,76,0.2), transparent 70%)",
        borderRadius: "50%",
        animation: "auroraFloat 20s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", top: "30%", left: "-150px",
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(76,29,149,0.4), transparent 70%)",
        borderRadius: "50%",
        animation: "auroraFloat 18s ease-in-out infinite",
      }} />
    </div>
  );
}

// ─── Gold particles ────────────────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: 8 + Math.random() * 12,
  dx: (Math.random() - 0.5) * 60,
  dy: (Math.random() - 0.5) * 60,
  opacity: 0.3 + Math.random() * 0.3,
  delay: Math.random() * 5,
}));

function GoldParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 3, height: 3,
            borderRadius: "50%",
            backgroundColor: "#C9A84C",
            opacity: p.opacity,
          }}
          animate={{
            x: [0, p.dx, -p.dx * 0.5, 0],
            y: [0, p.dy, -p.dy * 0.5, 0],
            opacity: [p.opacity, p.opacity * 0.5, p.opacity, p.opacity * 0.7, p.opacity],
          }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}
    </div>
  );
}

// ─── Hero badge ────────────────────────────────────────────────────────────────

function HeroBadge({ type, label }: { type: "live" | "ai" | "practice"; label: string }) {
  if (type === "live") return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <span className="text-[11px] font-bold text-red-400 tracking-wide">{label}</span>
    </div>
  );
  if (type === "ai") return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/50 text-[#8B7CF8] tracking-wide">{label}</span>
  );
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 tracking-wide">{label}</span>
  );
}

// ─── Hero card ─────────────────────────────────────────────────────────────────

function HeroCard({
  icon, iconBg, badge, title, desc, stats, btnLabel, href, delay,
}: {
  icon: string; iconBg: "gold" | "purple"; badge: React.ReactNode;
  title: string; desc: string; stats: string[]; btnLabel: string; href: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <Link href={href}>
        <div
          className="group flex flex-col h-full p-8 rounded-2xl cursor-pointer transition-all duration-300"
          style={{
            background: "rgba(15,10,31,0.9)",
            border: "1px solid rgba(124,58,237,0.5)",
            backdropFilter: "blur(10px)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "#C9A84C";
            el.style.boxShadow = "0 0 40px rgba(201,168,76,0.2)";
            el.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "rgba(124,58,237,0.5)";
            el.style.boxShadow = "none";
            el.style.transform = "translateY(0)";
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-5 flex-shrink-0"
            style={{
              background: iconBg === "gold"
                ? "radial-gradient(circle, rgba(201,168,76,0.25), rgba(201,168,76,0.05))"
                : "radial-gradient(circle, rgba(124,58,237,0.3), rgba(124,58,237,0.05))",
              border: iconBg === "gold" ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(124,58,237,0.4)",
            }}
          >
            {icon}
          </div>
          <div className="mb-3">{badge}</div>
          <h3 className="text-[22px] font-bold text-white mb-3 leading-tight">{title}</h3>
          <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "#8B7CF8" }}>{desc}</p>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {stats.map((s, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-[#C9A84C]" />}
                <span className="text-xs text-[#8B7CF8]/70">{s}</span>
              </span>
            ))}
          </div>
          <div
            className="w-full text-center py-3 rounded-xl font-bold text-sm"
            style={{ background: "#C9A84C", color: "#06040F" }}
          >
            {btnLabel}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Small tool card ───────────────────────────────────────────────────────────

function SmallToolCard({ tool, delay }: { tool: SmallTool; delay: number }) {
  const Icon = tool.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
      <Link href={tool.href}>
        <div
          className="flex flex-col p-5 rounded-xl cursor-pointer h-full transition-all duration-200"
          style={{
            background: "rgba(15,10,31,0.8)",
            border: "1px solid #1A1040",
            backdropFilter: "blur(10px)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "#7C3AED";
            el.style.boxShadow = "0 0 20px rgba(124,58,237,0.15)";
            el.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "#1A1040";
            el.style.boxShadow = "none";
            el.style.transform = "translateY(0)";
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 flex-shrink-0"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <Icon className="w-4 h-4 text-[#C9A84C]" />
          </div>
          <h3 className="text-[15px] font-bold text-white mb-1 leading-tight flex-1">{tool.nameEn}</h3>
          <p className="text-[12px] leading-relaxed mb-3" style={{ color: "#8B7CF8" }}>{tool.descEn}</p>
          <span className="text-xs font-semibold text-[#C9A84C] mt-auto">Open →</span>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Leaderboard preview ───────────────────────────────────────────────────────

interface LeaderUser { id: string; name: string | null; founderScore: number; streakDays: number; }

function LeaderboardPreview({ txt }: { txt: Txt }) {
  const [top3, setTop3] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.ok ? r.json() : { top: [] })
      .then((d) => setTop3((d.top ?? []).slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(15,10,31,0.8)", border: "1px solid #1A1040", backdropFilter: "blur(10px)" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-white">{txt.founder_wall}</span>
        <Link href="/dashboard/leaderboard" className="text-xs text-[#C9A84C] hover:underline">{txt.see_leaderboard}</Link>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-[#1A1040]" />)}</div>
      ) : top3.length === 0 ? (
        <p className="text-xs text-[#555] text-center py-4">{txt.no_leaders}</p>
      ) : (
        <div className="space-y-2">
          {top3.map((user, i) => (
            <div key={user.id} className="flex items-center gap-3 px-3 py-2 bg-[#06040F] rounded-lg">
              <span className="text-base">{medals[i]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name ?? "Founder"}</p>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] text-[#8B7CF8]">{user.streakDays} {txt.day_streak}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#C9A84C] font-mono">{user.founderScore}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Alerts preview ────────────────────────────────────────────────────────────

interface AlertHistoryItem { id: string; headline: string; source: string; triggeredAt: string; }

function AlertsPreview({ txt }: { txt: Txt }) {
  const [recent, setRecent] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setRecent((d?.history ?? []).slice(0, 2)))
      .finally(() => setLoading(false));
  }, []);
  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return `${Math.floor(diff / 60_000)}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(15,10,31,0.8)", border: "1px solid #1A1040", backdropFilter: "blur(10px)" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-white">{txt.latest_signals}</span>
        <Link href="/dashboard/alerts" className="text-xs text-[#C9A84C] hover:underline">{txt.manage_alerts}</Link>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-[#1A1040]" />)}</div>
      ) : recent.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <Bell className="w-6 h-6 text-[#333] mx-auto" />
          <p className="text-xs text-[#555]">{txt.no_alerts}</p>
          <Link href="/dashboard/alerts" className="text-xs text-[#C9A84C] hover:underline">{txt.setup_alerts}</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((item) => (
            <div key={item.id} className="px-3 py-2.5 bg-[#06040F] border-l-2 border-[#7C3AED]/50 rounded-r-lg">
              <p className="text-xs font-medium text-white line-clamp-1">{item.headline}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-[#8B7CF8]">{item.source}</span>
                <span className="text-[10px] text-[#444]">{timeAgo(item.triggeredAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Search bar ────────────────────────────────────────────────────────────────

function SearchBar({ query, onChange, placeholder }: { query: string; onChange: (q: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563] pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[52px] pl-11 pr-10 rounded-xl text-sm text-white placeholder-[#4B5563] outline-none transition-all duration-200"
        style={{ background: "rgba(15,10,31,0.8)", border: "1px solid #1A1040", backdropFilter: "blur(10px)" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#7C3AED"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.2)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#1A1040"; e.currentTarget.style.boxShadow = "none"; }}
      />
      <AnimatePresence>
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1A1040] flex items-center justify-center hover:bg-[#2A2060] transition-colors"
          >
            <X className="w-3 h-3 text-[#8B7CF8]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const { locale } = useLanguage();
  const [query, setQuery] = useState("");

  const lang = (["en", "ru", "es", "zh"].includes(locale ?? "") ? locale : "en") as Lang;
  const txt = T[lang];
  const userName = session?.user?.name?.split(" ")[0] ?? "Founder";
  const greeting = getGreeting(lang, txt);

  const filteredTools = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return ALL_TOOLS_FLAT.filter((t) =>
      t.nameEn.toLowerCase().includes(q) || t.descEn.toLowerCase().includes(q)
    );
  }, [query]);

  let cardDelay = 0.35;
  function nd() { cardDelay += 0.035; return cardDelay; }

  return (
    <>
      <AuroraBackground />
      <GoldParticles />

      <div className="relative p-5 lg:p-8 max-w-7xl mx-auto space-y-10 pb-16" style={{ zIndex: 2 }}>

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">{greeting}, {userName}. 👋</h1>
          <p className="text-[#8B7CF8] mt-1 text-sm">{txt.tagline}</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <SearchBar query={query} onChange={setQuery} placeholder={txt.search_placeholder} />
        </motion.div>

        {/* Search results */}
        <AnimatePresence>
          {filteredTools !== null && (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              {filteredTools.length === 0 ? (
                <p className="text-sm text-[#8B7CF8]/60 py-4">
                  {txt.no_results} &ldquo;{query}&rdquo;
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredTools.map((tool, i) => (
                    <SmallToolCard key={tool.href} tool={tool} delay={i * 0.04} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content — hidden while searching */}
        {!query && (
          <>
            {/* Pitch Arsenal hero */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
              <h2 className="text-xl font-bold text-white mb-1">{txt.pitch_arsenal}</h2>
              <p className="text-sm text-[#8B7CF8] mb-6">{txt.pitch_arsenal_sub}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <HeroCard
                  icon="🎤" iconBg="gold"
                  badge={<HeroBadge type="live" label={txt.hero1_badge} />}
                  title={txt.hero1_title} desc={txt.hero1_desc}
                  stats={[txt.hero1_s1, txt.hero1_s2]}
                  btnLabel={txt.hero1_btn} href="/dashboard/pitch-coach-live" delay={0.2}
                />
                <HeroCard
                  icon="🎬" iconBg="purple"
                  badge={<HeroBadge type="ai" label={txt.hero2_badge} />}
                  title={txt.hero2_title} desc={txt.hero2_desc}
                  stats={[txt.hero2_s1, txt.hero2_s2, txt.hero2_s3]}
                  btnLabel={txt.hero2_btn} href="/dashboard/pitch-deck" delay={0.25}
                />
                <HeroCard
                  icon="🎙️" iconBg="gold"
                  badge={<HeroBadge type="practice" label={txt.hero3_badge} />}
                  title={txt.hero3_title} desc={txt.hero3_desc}
                  stats={[txt.hero3_s1, txt.hero3_s2]}
                  btnLabel={txt.hero3_btn} href="/dashboard/pitch-mirror" delay={0.3}
                />
              </div>
            </motion.div>

            {/* Tool categories */}
            <div className="space-y-10">
              {CATEGORIES.map((cat) => {
                const catTitle = txt[cat.titleKey] as string;
                const catDesc = txt[cat.descKey] as string;
                const d = nd();
                return (
                  <motion.div key={String(cat.titleKey)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: d }}>
                    <h2 className="text-lg font-bold text-[#C9A84C] mb-1">{catTitle}</h2>
                    <p className="text-[13px] text-[#8B7CF8]/70 mb-4">{catDesc}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {cat.tools.map((tool, ti) => (
                        <SmallToolCard key={tool.href} tool={tool} delay={d + ti * 0.03} />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Founder Wall + Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: nd() }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <LeaderboardPreview txt={txt} />
              <AlertsPreview txt={txt} />
            </motion.div>

            {/* Challenge a Decision */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: nd() }}>
              <Link href="/dashboard/enemy-mode">
                <div
                  className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 rounded-2xl cursor-pointer transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(201,168,76,0.1))",
                    border: "1px solid rgba(124,58,237,0.4)",
                    backdropFilter: "blur(10px)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(201,168,76,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
                  >
                    <ShieldAlert className="w-7 h-7 text-[#C9A84C]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{txt.challenge_title}</h3>
                    <p className="text-sm text-[#8B7CF8] leading-relaxed">{txt.challenge_desc}</p>
                  </div>
                  <div
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm flex-shrink-0 transition-all duration-200"
                    style={{ background: "#C9A84C", color: "#06040F" }}
                  >
                    {txt.challenge_btn} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
