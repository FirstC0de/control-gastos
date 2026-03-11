'use client';

import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ──────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">$</span>
              </div>
              <span className={`font-bold text-lg tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                Controlados <span className={scrolled ? 'text-blue-600' : 'text-blue-200'}>$</span>
              </span>
            </Link>

            {/* Links desktop */}
            <div className="hidden md:flex items-center gap-6">
              {[
                { label: 'Características', href: '#caracteristicas' },
                { label: 'Cómo funciona', href: '#como-funciona' },
                { label: 'Bancos', href: '#bancos' },
              ].map(({ label, href }) => (
                <a key={href} href={href}
                  className={`text-sm font-medium transition-colors hover:text-blue-400 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                  {label}
                </a>
              ))}
            </div>

            {/* CTAs desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login"
                className={`text-sm font-medium transition-all px-4 py-2 rounded-lg ${
                  scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}>
                Iniciar sesión
              </Link>
              <Link href="/registro"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-sm hover:shadow-md">
                Empezar gratis →
              </Link>
            </div>

            {/* Hamburger mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1 animate-slide-down shadow-lg">
            {[
              { label: 'Características', href: '#caracteristicas' },
              { label: 'Cómo funciona', href: '#como-funciona' },
              { label: 'Bancos', href: '#bancos' },
            ].map(({ label, href }) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                {label}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-100 space-y-2 mt-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/registro" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 text-center transition-colors">
                Empezar gratis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 pt-32 pb-20 px-4">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        {/* Glow blobs */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-sky-300 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto mb-14 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white/90 text-xs font-medium mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              100% gratis · Sin tarjeta de crédito · Datos seguros
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
              Controlá tus finanzas
              <span className="block text-blue-200">con claridad total</span>
            </h1>

            <p className="text-xl text-blue-100/90 max-w-2xl mx-auto leading-relaxed mb-10">
              Importá extractos bancarios PDF, categorizá tus gastos automáticamente y visualizá tu balance en tiempo real. Sin hojas de cálculo, sin complicaciones.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/registro"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200">
                Crear cuenta gratis →
              </Link>
              <Link href="/login"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white border border-white/30 hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm">
                Ya tengo una cuenta
              </Link>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative max-w-4xl mx-auto animate-fade-in">
            <div className="absolute -inset-4 bg-blue-600/30 rounded-3xl blur-2xl" />
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-2.5 shadow-2xl">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-3 py-2 mb-2 border-b border-white/10">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                <div className="flex-1 mx-4">
                  <div className="bg-white/10 rounded-md h-4 w-48 mx-auto" />
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-4">
                {/* App header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs font-bold">$</span>
                    </div>
                    <span className="text-white text-xs font-bold">Controlados $</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-600" />
                    <div className="w-16 h-4 bg-slate-700 rounded" />
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Ingresos', amount: '$285.000', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '↑' },
                    { label: 'Gastos', amount: '$142.500', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: '↓' },
                    { label: 'Balance', amount: '$142.500', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: '=' },
                  ].map(card => (
                    <div key={card.label} className={`rounded-xl border p-3 ${card.bg}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-500">{card.label}</p>
                        <span className={`text-xs font-bold ${card.color}`}>{card.icon}</span>
                      </div>
                      <p className={`text-base font-bold font-mono ${card.color}`}>{card.amount}</p>
                    </div>
                  ))}
                </div>

                {/* Expense list */}
                <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Últimos movimientos</p>
                  {[
                    { desc: 'Supermercado Día', cat: 'Alimentación', amount: '-$8.500', color: 'bg-orange-400' },
                    { desc: 'Netflix', cat: 'Entretenimiento', amount: '-$2.990', color: 'bg-red-400' },
                    { desc: 'Freelance — Diseño UI', cat: 'Ingreso', amount: '+$85.000', color: 'bg-emerald-400' },
                    { desc: 'YPF — Combustible', cat: 'Transporte', amount: '-$15.200', color: 'bg-blue-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <div className={`w-1.5 h-7 rounded-full ${item.color} opacity-80 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 font-medium truncate">{item.desc}</p>
                        <p className="text-xs text-slate-600">{item.cat}</p>
                      </div>
                      <p className={`text-xs font-mono font-semibold flex-shrink-0 ${item.amount.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section id="caracteristicas" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Funcionalidades</p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Todo lo que necesitás para controlar tu dinero</h2>
            <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">Sin hojas de cálculo, sin apps de pago. Solo vos y tus finanzas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '📊',
                title: 'Dashboard inteligente',
                desc: 'Visualizá ingresos, gastos y balance de un vistazo. Vista combinada ARS + USD con dólar blue actualizado en tiempo real.',
                gradient: 'from-blue-50 to-indigo-50',
                border: 'border-blue-100',
                tag: 'Dashboard',
              },
              {
                icon: '📄',
                title: 'Importación PDF automática',
                desc: 'Subí el extracto de tu banco y listo. Detecta montos, fechas, cuotas y categorías automáticamente. Soporta Galicia y Santander.',
                gradient: 'from-emerald-50 to-teal-50',
                border: 'border-emerald-100',
                tag: 'Automatización',
              },
              {
                icon: '🏷️',
                title: 'Categorías y presupuestos',
                desc: 'Creá categorías con colores personalizados. Asigná presupuestos mensuales y recibí alertas cuando te estés pasando.',
                gradient: 'from-violet-50 to-purple-50',
                border: 'border-violet-100',
                tag: 'Organización',
              },
              {
                icon: '💱',
                title: 'Soporte ARS y USD',
                desc: 'Registrá gastos en pesos y dólares. Conversión automática usando el tipo de cambio blue actualizado.',
                gradient: 'from-amber-50 to-orange-50',
                border: 'border-amber-100',
                tag: 'Multi-moneda',
              },
              {
                icon: '💳',
                title: 'Gestión de tarjetas',
                desc: 'Asociá gastos a tus tarjetas de crédito y débito. Seguí el gasto por tarjeta y evitá sorpresas a fin de mes.',
                gradient: 'from-rose-50 to-pink-50',
                border: 'border-rose-100',
                tag: 'Tarjetas',
              },
              {
                icon: '🔒',
                title: 'Datos seguros',
                desc: 'Tu información financiera cifrada y segura. Accedé desde cualquier dispositivo con tu cuenta personal.',
                gradient: 'from-slate-50 to-gray-50',
                border: 'border-slate-100',
                tag: 'Seguridad',
              },
            ].map(feature => (
              <div key={feature.title}
                className={`rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.gradient} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{feature.icon}</div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-white/70 text-slate-500`}>
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Cómo funciona</p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Empezá en 3 pasos</h2>
            <p className="text-lg text-slate-500 mt-4">Sin configuraciones complicadas. En minutos ya tenés el control.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Creá tu cuenta',
                desc: 'Registrate gratis con tu email o cuenta de Google. Sin datos bancarios, sin tarjeta de crédito.',
                color: 'bg-blue-600 shadow-blue-200',
              },
              {
                step: '02',
                title: 'Importá tu extracto',
                desc: 'Subí el PDF de tu resumen bancario. El sistema detecta automáticamente los gastos, montos y fechas.',
                color: 'bg-emerald-600 shadow-emerald-200',
              },
              {
                step: '03',
                title: 'Controlá tu dinero',
                desc: 'Visualizá tu balance, asigná categorías, configurá presupuestos y tomá decisiones con datos reales.',
                color: 'bg-violet-600 shadow-violet-200',
              },
            ].map((step, i) => (
              <div key={step.step} className="text-center group">
                <div className={`w-16 h-16 rounded-2xl ${step.color} shadow-lg text-white text-2xl font-bold flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {step.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute mt-8 w-full" />
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BANKS ──────────────────────────────────────── */}
      <section id="bancos" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Bancos soportados</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Compatible con los bancos más usados de Argentina</h2>
          <p className="text-slate-500 mb-12 text-sm">Más bancos próximamente. ¿Usás otro banco? Escribinos.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {[
              { name: 'Banco Galicia', letter: 'G', desc: 'Resúmenes de tarjeta' },
              { name: 'Santander', letter: 'S', desc: 'Resúmenes de tarjeta' },
            ].map(bank => (
              <div key={bank.name}
                className="flex items-center gap-4 px-8 py-5 rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 transition-colors flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-600 group-hover:text-blue-700 transition-colors">{bank.letter}</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 group-hover:text-blue-800 transition-colors">{bank.name}</p>
                  <p className="text-xs text-slate-400">{bank.desc}</p>
                </div>
                <div className="ml-2 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white/90 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Gratis · Sin límites · Sin sorpresas
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Empezá hoy, es gratis
          </h2>
          <p className="text-xl text-blue-100/90 mb-10 leading-relaxed">
            Tomá el control de tu dinero. Sin excusas, sin costos, sin complicaciones.
          </p>
          <Link href="/registro"
            className="inline-flex items-center gap-2 px-10 py-4 text-lg font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200">
            Crear cuenta gratis →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <span className="text-white font-bold text-sm">$</span>
                </div>
                <span className="text-white font-bold text-lg">
                  Controlados <span className="text-blue-400">$</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs">
                Gestión de finanzas personales simple y efectiva. Diseñado para el mercado argentino.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Producto</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Características', href: '#caracteristicas' },
                  { label: 'Cómo funciona', href: '#como-funciona' },
                  { label: 'Bancos soportados', href: '#bancos' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-sm hover:text-white transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account links */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Cuenta</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Iniciar sesión', href: '/login' },
                  { label: 'Crear cuenta', href: '/registro' },
                  { label: 'Mi dashboard', href: '/dashboard' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">© 2025 Controlados $. Todos los derechos reservados.</p>
            <p className="text-xs">Hecho con ❤️ en Argentina</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
