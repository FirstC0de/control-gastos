---
name: frontend-design
description: Revisa y mejora componentes React/Tailwind. Usar cuando el usuario pide mejorar UI, UX, estilos, responsividad o accesibilidad de componentes.
argument-hint: "[componente o descripción del cambio]"
---

Al revisar o mejorar diseño frontend en este proyecto:

## Stack
- Next.js 15 App Router, React 19, Tailwind CSS 4.1
- Paleta: slate (neutros), indigo (primario), emerald (positivo), rose (negativo), amber (advertencia)
- Bordes: `rounded-xl` o `rounded-2xl`, sombra `border border-slate-200`
- Tipografía: `text-xs/sm/base`, `font-semibold` para labels, `font-bold` para números destacados

## Checklist de revisión

1. **Consistencia visual** — ¿usa la paleta del proyecto? ¿bordes, radios y espaciado coherentes?
2. **Jerarquía** — ¿el usuario entiende qué es lo más importante a primera vista?
3. **Estados vacíos** — ¿hay un estado vacío informativo cuando no hay datos?
4. **Responsividad** — ¿funciona en móvil? Usar `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
5. **Estados interactivos** — hover, focus, disabled con transiciones `transition-colors`
6. **Accesibilidad** — labels en inputs, contraste suficiente, `focus:ring-2 focus:ring-indigo-500`
7. **Números** — siempre `toLocaleString('es-AR', { minimumFractionDigits: 2 })`
8. **Loading/error** — ¿hay feedback visual mientras carga o si falla?

## Patrones del proyecto

```tsx
// Card contenedor
<div className="bg-white rounded-2xl border border-slate-200 p-6">

// Label de sección
<h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">

// Input estándar
className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"

// Botón primario
className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"

// Botón secundario
className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"

// Badge de categoría
className="text-xs px-1.5 py-0.5 rounded-full font-medium"
style={{ backgroundColor: color + '22', color }}

// Estado vacío
<p className="text-xs text-slate-400 text-center py-4">Sin datos</p>
```

Siempre mostrá el código completo del componente modificado, no solo el diff.
