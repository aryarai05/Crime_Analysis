import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Shield, LayoutDashboard, TrendingUp, PieChart, BarChart3, MapPin, FileText,
  Database, Brain, Target, Layers, Activity, ArrowRight, CheckCircle,
  Map as MapIcon, Flame, AlertTriangle, Clock, Eye,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const trendData = [
  { v: 42 }, { v: 48 }, { v: 55 }, { v: 51 }, { v: 63 }, { v: 58 }, { v: 71 }, { v: 68 }, { v: 75 }, { v: 82 },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value]);
  return (
    <span ref={ref} className="text-4xl font-bold text-white">
      {display.toLocaleString()}{suffix}
    </span>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = ['Overview', 'Capabilities', 'Analytics', 'Technology', 'About'];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-2 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-cyan-500/10' : 'py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-cyan-400" />
          <span className="text-lg font-bold text-white tracking-wider">CRIMEWATCH</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
              {l}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/dashboard" className="btn-primary text-xs">
            Launch Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full h-full min-h-[400px] grid-bg rounded-xl border border-cyan-500/10 overflow-hidden bg-[#0f1420]/60">
      <div className="scan-line" />

      {/* Glowing hotspots */}
      {[
        { top: '20%', left: '30%', color: '#ef4444', delay: 0 },
        { top: '45%', left: '55%', color: '#fbbf24', delay: 0.5 },
        { top: '65%', left: '25%', color: '#22d3ee', delay: 1 },
        { top: '30%', left: '70%', color: '#fb923c', delay: 1.5 },
        { top: '55%', left: '80%', color: '#ef4444', delay: 2 },
      ].map((h, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            top: h.top, left: h.left, backgroundColor: h.color,
            boxShadow: `0 0 20px ${h.color}, 0 0 40px ${h.color}50`,
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: h.delay }}
        />
      ))}

      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22d3ee" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating KPI cards */}
      <motion.div
        className="absolute top-4 left-4 glass-card p-3 w-40"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <p className="text-[10px] text-slate-500 uppercase">Total Incidents</p>
        <p className="text-xl font-bold text-cyan-400">10,000</p>
      </motion.div>

      <motion.div
        className="absolute bottom-4 right-4 glass-card p-3 w-40"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      >
        <p className="text-[10px] text-slate-500 uppercase">Risk Index</p>
        <p className="text-xl font-bold text-amber-400">68 / 100</p>
        <div className="h-1 bg-slate-700 rounded-full mt-1">
          <div className="h-1 bg-amber-400 rounded-full" style={{ width: '68%' }} />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-1/2 right-8 glass-card p-3 w-36"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
      >
        <p className="text-[10px] text-slate-500 uppercase">Active Hotspots</p>
        <p className="text-xl font-bold text-red-400">8</p>
      </motion.div>

      {/* Mini trend chart */}
      <div className="absolute bottom-4 left-4 glass-card p-2 w-44">
        <p className="text-[10px] text-slate-500 uppercase mb-1">Trend</p>
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={trendData}>
            <Line type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 50]);

  return (
    <section className="relative min-h-screen flex items-center pt-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0e1a]/50 to-[#0a0e1a]" />
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-12 bg-cyan-400" />
            <span className="text-xs uppercase tracking-[0.3em] text-cyan-400">Intelligence Platform</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
            Understand Crime.
            <br />
            <span className="gradient-text">Predict Risk.</span>
            <br />
            Build Safer Cities.
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-lg">
            Turn complex crime data into actionable intelligence through advanced analytics,
            interactive maps, and predictive risk insights.
          </p>
          <div className="flex gap-4">
            <Link to="/dashboard" className="btn-primary flex items-center gap-2">
              EXPLORE DASHBOARD <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#analytics" className="btn-secondary flex items-center gap-2">
              VIEW INTELLIGENCE
            </a>
          </div>
        </motion.div>
        <motion.div style={{ y }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}>
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function LiveIntelligence() {
  const stats = [
    { label: 'Total Incidents', value: 10000, icon: Activity, color: 'text-cyan-400' },
    { label: 'Active Hotspots', value: 8, icon: Flame, color: 'text-red-400' },
    { label: 'High-Risk Areas', value: 3, icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Current Risk Index', value: 68, suffix: ' / 100', icon: Shield, color: 'text-orange-400' },
  ];
  return (
    <section id="overview" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Live Intelligence</h2>
          <p className="text-sm text-slate-500">Real-time statistics from the demo database</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <s.icon className={`w-8 h-8 ${s.color} mx-auto mb-3`} />
              <AnimatedNumber value={s.value} suffix={s.suffix} />
              <p className="text-xs text-slate-500 uppercase tracking-wider mt-2">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MapPreview() {
  return (
    <section id="analytics" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Interactive Map Intelligence</h2>
          <p className="text-sm text-slate-500">Explore crime incidents, hotspots, and risk zones geographically</p>
        </div>
        <div className="glass-card p-2 h-[500px] relative overflow-hidden grid-bg">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
              <p className="text-sm text-slate-500">Full interactive map with Leaflet + OpenStreetMap</p>
              <p className="text-xs text-slate-600 mt-2">Crime markers, heatmap, hotspot zones, risk overlays</p>
              <Link to="/dashboard/crime-map" className="btn-primary mt-4 inline-flex items-center gap-2">
                Open Full Map <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          {/* Simulated markers */}
          {[
            { top: '30%', left: '40%', color: '#ef4444' },
            { top: '50%', left: '60%', color: '#fbbf24' },
            { top: '70%', left: '35%', color: '#22d3ee' },
            { top: '25%', left: '65%', color: '#fb923c' },
            { top: '60%', left: '50%', color: '#ef4444' },
          ].map((m, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full pulse-marker"
              style={{ top: m.top, left: m.left, backgroundColor: m.color, color: m.color }}
              animate={{ scale: [1, 1.8, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyticsPreview() {
  const catData = [
    { name: 'Theft', value: 2200 },
    { name: 'Assault', value: 1600 },
    { name: 'Burglary', value: 1200 },
    { name: 'Robbery', value: 1200 },
    { name: 'Fraud', value: 1000 },
    { name: 'Other', value: 2800 },
  ];
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Analytics Preview</h2>
          <p className="text-sm text-slate-500">Data-driven insights from the intelligence platform</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white uppercase mb-4">Crime Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="index" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white uppercase mb-4">Crime Categories</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={catData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white uppercase mb-4">Crime By Day</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { d: 'Mon', v: 1450 }, { d: 'Tue', v: 1380 }, { d: 'Wed', v: 1520 },
                { d: 'Thu', v: 1610 }, { d: 'Fri', v: 1820 }, { d: 'Sat', v: 1750 }, { d: 'Sun', v: 1470 },
              ]}>
                <XAxis dataKey="d" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="#fb923c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link to="/dashboard/analytics" className="btn-primary inline-flex items-center gap-2">
            Explore Full Analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { num: '01', icon: MapPin, title: 'Crime Mapping', desc: 'Visualize crime incidents and geographic patterns.' },
    { num: '02', icon: Flame, title: 'Hotspot Detection', desc: 'Identify areas with concentrated criminal activity.' },
    { num: '03', icon: TrendingUp, title: 'Trend Analysis', desc: 'Discover temporal patterns and emerging trends.' },
    { num: '04', icon: Shield, title: 'Risk Intelligence', desc: 'Convert historical patterns into understandable risk indicators.' },
    { num: '05', icon: Brain, title: 'Predictive Analytics', desc: 'Estimate aggregate location/time risk using historical data.' },
    { num: '06', icon: FileText, title: 'Advanced Reporting', desc: 'Generate detailed crime intelligence reports.' },
  ];
  return (
    <section id="capabilities" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Capabilities</h2>
          <p className="text-sm text-slate-500">Six core intelligence modules</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 group hover:glow-cyan transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <f.icon className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-3xl font-bold text-slate-700 group-hover:text-cyan-500/20 transition-colors">{f.num}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'COLLECT', desc: 'Gather structured crime data.' },
    { num: '02', title: 'CLEAN', desc: 'Validate and prepare the dataset.' },
    { num: '03', title: 'ANALYZE', desc: 'Discover patterns and relationships.' },
    { num: '04', title: 'VISUALIZE', desc: 'Transform data into interactive intelligence.' },
    { num: '05', title: 'PREDICT', desc: 'Estimate aggregate risk patterns.' },
    { num: '06', title: 'ACT', desc: 'Use insights to support informed decisions.' },
  ];
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-sm text-slate-500">From raw data to actionable intelligence</p>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="glass-card p-5 text-center">
                <div className="text-2xl font-bold gradient-text mb-2">{s.num}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-cyan-500/20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Technology() {
  const techs = ['React', 'TypeScript', 'Supabase', 'PostgreSQL', 'Python', 'FastAPI', 'Scikit-learn', 'Pandas', 'Leaflet', 'Recharts'];
  const icons: Record<string, typeof Shield> = {
    React: Layers, TypeScript: FileText, Supabase: Database, PostgreSQL: Database,
    Python: Brain, FastAPI: Activity, 'Scikit-learn': Target, Pandas: BarChart3,
    Leaflet: MapPin, Recharts: PieChart,
  };
  return (
    <section id="technology" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Technology Stack</h2>
          <p className="text-sm text-slate-500">Built with modern, production-grade tools</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {techs.map((t, i) => {
            const Icon = icons[t] || Shield;
            return (
              <motion.div
                key={t}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 text-center group hover:border-cyan-500/30"
              >
                <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs text-slate-300">{t}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="about" className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold text-white mb-4">Turn Crime Data Into Intelligence.</h2>
          <p className="text-lg text-slate-400 mb-8">
            Explore patterns. Understand risk. Discover what the data is telling you.
          </p>
          <Link to="/dashboard" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
            LAUNCH CRIMEWATCH <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />
      <Hero />
      <LiveIntelligence />
      <MapPreview />
      <AnalyticsPreview />
      <Features />
      <HowItWorks />
      <Technology />
      <FinalCTA />
      <footer className="py-8 px-6 border-t border-cyan-500/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-white tracking-wider">CRIMEWATCH</span>
          </div>
          <p className="text-xs text-slate-500">
            Understand Crime. Predict Risk. Build Safer Cities.
          </p>
          <p className="text-xs text-slate-600">Synthetic Demo Dataset — Not real-world statistics</p>
        </div>
      </footer>
    </div>
  );
}
