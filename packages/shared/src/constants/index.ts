import { CategoryType } from '../types';
import type { Category } from '../types';

export type DefaultCategory = {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  order: number;
  keywords: string[];
  description?: string;
  isPredefined: true;
  isActive: true;
};

// ── GASTOS ────────────────────────────────────────────────
export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Alimentación', icon: '🛒', color: '#22C55E', type: 'expense', order: 1,
    description: 'Supermercados, verdulería, almacén',
    keywords: ['supermercado', 'verdulería', 'carnicería', 'panadería', 'almacén', 'mercado',
      'coto', 'dia', 'jumbo', 'carrefour', 'walmart', 'disco', 'vea', 'maxi', 'maxi consumo',
      'chango más', 'changomas', 'fruta', 'verdura', 'kiosco'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Restaurantes', icon: '🍽️', color: '#F97316', type: 'expense', order: 2,
    description: 'Comida fuera del hogar y delivery',
    keywords: ['restaurant', 'resto', 'pizza', 'burger', 'mcdonalds', 'burger king', 'rappi',
      'pedidos ya', 'delivery', 'cafetería', 'café', 'bar', 'empanadas', 'sushi', 'lomitería'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Transporte', icon: '🚗', color: '#3B82F6', type: 'expense', order: 3,
    description: 'Combustible, transporte público, taxis',
    keywords: ['nafta', 'combustible', 'ypf', 'shell', 'axion', 'sube', 'colectivo', 'subte',
      'tren', 'taxi', 'uber', 'cabify', 'remis', 'peaje', 'estacionamiento', 'auto'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Vivienda', icon: '🏠', color: '#8B5CF6', type: 'expense', order: 4,
    description: 'Alquiler, expensas, servicios del hogar',
    keywords: ['alquiler', 'expensas', 'hipoteca', 'electricidad', 'agua', 'gas', 'edesur',
      'edenor', 'aysa', 'metrogas', 'lgr', 'arba', 'agip', 'luz'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Salud', icon: '🏥', color: '#EF4444', type: 'expense', order: 5,
    description: 'Médicos, farmacia, obra social',
    keywords: ['farmacia', 'médico', 'doctor', 'clínica', 'hospital', 'obra social', 'prepaga',
      'medicamento', 'osde', 'galeno', 'swiss medical', 'consulta', 'laboratorio', 'análisis'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Educación', icon: '📚', color: '#0EA5E9', type: 'expense', order: 6,
    description: 'Colegio, universidad, cursos',
    keywords: ['colegio', 'universidad', 'curso', 'libros', 'librería', 'inglés', 'clases',
      'capacitación', 'tutor', 'udemy', 'coursera', 'platzi', 'aula', 'escuela'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Entretenimiento', icon: '🎬', color: '#EC4899', type: 'expense', order: 7,
    description: 'Streaming, cine, ocio',
    keywords: ['cine', 'teatro', 'concierto', 'netflix', 'spotify', 'disney', 'amazon prime',
      'hbo', 'streaming', 'videojuego', 'steam', 'playstation', 'xbox', 'twitch'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Ropa', icon: '👕', color: '#F59E0B', type: 'expense', order: 8,
    description: 'Indumentaria y calzado',
    keywords: ['ropa', 'indumentaria', 'zapatillas', 'zara', 'h&m', 'falabella', 'calzado',
      'zapatos', 'jean', 'camisa', 'remera', 'vestido', 'sport', 'deportiva'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Tecnología', icon: '💻', color: '#6366F1', type: 'expense', order: 9,
    description: 'Electrónica, gadgets',
    keywords: ['celular', 'computadora', 'notebook', 'tablet', 'auriculares', 'smartphone',
      'apple', 'samsung', 'iphone', 'android', 'garbarino', 'fravega', 'musimundo', 'mexx'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Servicios', icon: '⚡', color: '#14B8A6', type: 'expense', order: 10,
    description: 'Internet, teléfono, servicios digitales',
    keywords: ['internet', 'telefono', 'claro', 'personal', 'movistar', 'telecentro',
      'fibertel', 'cablevision', 'directv', 'plan', 'factura'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Deporte', icon: '⚽', color: '#10B981', type: 'expense', order: 11,
    description: 'Gimnasio, actividades deportivas',
    keywords: ['gimnasio', 'deporte', 'fútbol', 'natación', 'yoga', 'pilates', 'running',
      'bicicleta', 'crossfit', 'tennis', 'padel', 'pádel', 'squash'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Mascotas', icon: '🐾', color: '#A78BFA', type: 'expense', order: 12,
    description: 'Veterinaria, comida para mascotas',
    keywords: ['veterinaria', 'veterinario', 'mascota', 'perro', 'gato', 'petshop',
      'pedigree', 'whiskas', 'purina', 'balanceado'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Viajes', icon: '✈️', color: '#06B6D4', type: 'expense', order: 13,
    description: 'Hotel, vuelos, turismo',
    keywords: ['hotel', 'vuelo', 'aerolínea', 'aeropuerto', 'booking', 'airbnb', 'hostel',
      'turismo', 'despegar', 'latam', 'aerolíneas', 'aeroparque', 'ezeiza'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Hogar', icon: '🛋️', color: '#D97706', type: 'expense', order: 14,
    description: 'Muebles, electrodomésticos, decoración',
    keywords: ['mueble', 'electrodoméstico', 'hogar', 'decoración', 'ikea', 'easy', 'sodimac',
      'lavarropas', 'heladera', 'cocina', 'microondas', 'aireacondicionado'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Regalos', icon: '🎁', color: '#F97316', type: 'expense', order: 15,
    description: 'Regalos y donaciones',
    keywords: ['regalo', 'cumpleaños', 'navidad', 'aniversario', 'donación'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Otros gastos', icon: '📦', color: '#6B7280', type: 'expense', order: 99,
    description: 'Gastos varios no categorizados',
    keywords: [],
    isPredefined: true, isActive: true,
  },
];

// ── INGRESOS ──────────────────────────────────────────────
export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Sueldo', icon: '💼', color: '#22C55E', type: 'income', order: 1,
    description: 'Salario mensual fijo',
    keywords: ['sueldo', 'salario', 'haberes', 'remuneración', 'quincena', 'nomina'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Freelance', icon: '🖥️', color: '#3B82F6', type: 'income', order: 2,
    description: 'Trabajos independientes y consultoría',
    keywords: ['freelance', 'consultoría', 'honorarios', 'proyecto', 'cliente', 'contrato'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Ventas', icon: '🛍️', color: '#F97316', type: 'income', order: 3,
    description: 'Ventas de productos o servicios',
    keywords: ['venta', 'mercadolibre', 'tiendanube', 'venta online', 'producto'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Alquiler', icon: '🏘️', color: '#8B5CF6', type: 'income', order: 4,
    description: 'Renta de propiedades',
    keywords: ['alquiler', 'renta', 'inquilino', 'arrendamiento'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Inversiones', icon: '📈', color: '#10B981', type: 'income', order: 5,
    description: 'Dividendos, intereses, rendimientos',
    keywords: ['dividendo', 'renta', 'interés', 'plazo fijo', 'bono', 'inversión', 'rendimiento'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Bono / Extra', icon: '🎯', color: '#F59E0B', type: 'income', order: 6,
    description: 'Bonos, aguinaldo, pagos extras',
    keywords: ['bono', 'aguinaldo', 'plus', 'extra', 'gratificación', 'sac'],
    isPredefined: true, isActive: true,
  },
  {
    name: 'Otros ingresos', icon: '💰', color: '#6B7280', type: 'income', order: 99,
    description: 'Ingresos varios',
    keywords: [],
    isPredefined: true, isActive: true,
  },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

// ── AUTO-CATEGORIZACIÓN ────────────────────────────────────
export function suggestCategory(
  description: string,
  type: CategoryType,
  categories: Category[],
): string | null {
  if (!description || description.length < 2) return null;
  const desc = description.toLowerCase().trim();

  const pool = categories.filter(c =>
    c.isActive !== false && (c.type === type || c.type === 'both')
  );

  let bestId: string | null = null;
  let bestScore = 0;

  for (const cat of pool) {
    if (!cat.keywords?.length) continue;
    let score = 0;
    for (const kw of cat.keywords) {
      if (desc.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = cat.id;
    }
  }

  return bestScore > 0 ? bestId : null;
}
