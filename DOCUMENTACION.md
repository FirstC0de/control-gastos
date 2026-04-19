# Documentación Funcional — Controlados $

**Versión:** 0.1.0
**Última actualización:** 2026-03-29
**Stack:** Next.js 15 · React 19 · TypeScript · Firebase · Tailwind CSS

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Proyecto](#2-arquitectura-del-proyecto)
3. [Modelos de Datos](#3-modelos-de-datos)
4. [Módulos Funcionales](#4-módulos-funcionales)
   - 4.1 [Autenticación](#41-autenticación)
   - 4.2 [Dashboard — Gastos](#42-dashboard--gastos)
   - 4.3 [Ingresos, Presupuestos y Reglas de Ahorro Automático](#43-ingresos-presupuestos-y-reglas-de-ahorro-automático)
   - 4.4 [Ahorros](#44-ahorros)
   - 4.5 [Inversiones](#45-inversiones)
   - 4.6 [Métricas](#46-métricas)
   - 4.7 [Tarjetas de Crédito](#47-tarjetas-de-crédito)
   - 4.8 [Importación de Resúmenes PDF](#48-importación-de-resúmenes-pdf)
   - 4.9 [Tipo de Cambio en Tiempo Real](#49-tipo-de-cambio-en-tiempo-real)
   - 4.10 [Notificaciones](#410-notificaciones)
   - 4.11 [Exportación de Datos](#411-exportación-de-datos)
5. [Flujos de Datos y Estado Global](#5-flujos-de-datos-y-estado-global)
6. [Configuración del Entorno](#6-configuración-del-entorno)
7. [Guía para Correr la Aplicación](#7-guía-para-correr-la-aplicación)
8. [Guía de Testing Completo](#8-guía-de-testing-completo)
9. [Casos de Uso de Punta a Punta](#9-casos-de-uso-de-punta-a-punta)

---

## 1. Descripción General

**Controlados $** es una aplicación web de gestión de finanzas personales orientada al mercado argentino. Permite al usuario llevar un registro detallado de sus gastos, ingresos, presupuestos, ahorros, inversiones y resúmenes de tarjetas de crédito, con soporte completo para operaciones en ARS y USD.

### Características principales

| Característica | Descripción |
|---|---|
| Multi-moneda | Soporte nativo ARS / USD con tipo de cambio blue en tiempo real |
| Importación de PDFs | Parseo automático de resúmenes de tarjetas de 5 bancos argentinos |
| Cuotas | Seguimiento de gastos en cuotas con distribución mensual automática |
| Gastos recurrentes | Registro de débitos automáticos y suscripciones con repetición mensual |
| Presupuestos | Por categoría con alertas configurables |
| Ahorro automático | Reglas de ahorro proporcional al cobro de ingresos |
| Inversiones | Plazo fijo con interés acumulado diario + cartera de acciones/cripto/bonos |
| Proyección de flujo | Proyección de 8 meses de cash flow con desglose cuotas vs. contado |
| Notificaciones | Alertas de presupuesto, vencimientos de tarjeta y plazos fijos |
| E2E Testing | Suite Playwright con Page Objects y fixtures |

---

## 2. Arquitectura del Proyecto

```
control-gastos/
├── apps/
│   ├── web/                          # Aplicación web principal (Next.js 15)
│   │   ├── src/app/
│   │   │   ├── (auth)/               # Rutas públicas de autenticación
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── registro/page.tsx
│   │   │   ├── dashboard/page.tsx    # Panel principal de gastos
│   │   │   ├── ingresos/page.tsx     # Ingresos, presupuestos, ahorro automático
│   │   │   ├── ahorros/page.tsx      # Cuentas de ahorro y metas
│   │   │   ├── inversiones/page.tsx  # Plazos fijos y cartera
│   │   │   ├── metricas/page.tsx     # Gráficos y análisis
│   │   │   ├── components/           # 42 componentes React
│   │   │   ├── context/              # 4 contextos globales (Auth, Finance, ExchangeRate, Notification)
│   │   │   ├── lib/                  # API Firebase, parsers PDF, exportación
│   │   │   └── api/                  # API Routes de Next.js (auth session, parse-statement)
│   │   └── e2e/                      # Tests end-to-end con Playwright
│   └── mobile/                       # App mobile (Next.js independiente)
└── packages/
    └── shared/                       # Tipos TypeScript y constantes compartidas
        └── src/types/index.ts
```

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 con App Router y Turbopack |
| UI | React 19 + Tailwind CSS 4 |
| Lenguaje | TypeScript 5 |
| Base de datos | Firebase Firestore (NoSQL en la nube) |
| Autenticación | Firebase Auth (email/password, Google, GitHub) |
| Gráficos | Recharts 3 |
| PDF (lectura) | pdfjs-dist 5 |
| PDF (generación) | jsPDF + jspdf-autotable |
| Toasts | Sonner 2 |
| Tests E2E | Playwright 1.58 |
| Deploy | Vercel |

---

## 3. Modelos de Datos

Todos los tipos se definen en `packages/shared/src/types/index.ts` y se persisten en Firebase Firestore bajo la ruta `/users/{uid}/{colección}`.

### Gasto (`Expense`)

```typescript
{
  id: string
  description: string
  amount: number                          // Monto por cuota (o total si es contado)
  date: string                            // YYYY-MM-DD
  categoryId: string
  cardId?: string                         // Si se pagó con tarjeta
  installments?: number                   // Cantidad total de cuotas
  currentInstallment?: number             // Cuota actual al momento del registro
  installmentAmount?: number              // Monto real de cada cuota
  currency: 'ARS' | 'USD'
  comprobante?: string                    // Número de comprobante/factura
  recurring: boolean
  recurringDay?: number                   // Día del mes para repetición
  monthYear: string                       // "YYYY-MM" del mes de registro
}
```

**Nota sobre cuotas:** El sistema calcula automáticamente en qué meses aparece cada cuota usando `firstAbsMonth = baseMonth - (currentInstallment - 1)` y distribuye el gasto hacia adelante.

### Ingreso (`Income`)

```typescript
{
  id: string
  amount: number
  name: string
  type: 'monthly' | 'sales' | 'other'
  date: string
  categoryId: string
  currency: 'ARS' | 'USD'
  recurring: boolean
  recurringDay?: number
  monthYear: string
}
```

### Presupuesto (`Budget`)

```typescript
{
  id: string
  name: string
  categoryId: string
  amount: number
  period: 'monthly' | 'weekly' | 'custom'
  monthYear: string
  recurring: boolean
  alertThreshold: number                  // Porcentaje (default 80)
}
```

### Categoría (`Category`)

```typescript
{
  id: string
  name: string
  color: string                           // Color hex
  type: 'expense' | 'income' | 'both'
  icon: string                            // Emoji
  isPredefined: boolean
  isActive: boolean
  keywords: string[]                      // Para auto-categorización
  order: number
}
```

**Categorías predefinidas de gastos:** Alimentación, Restaurantes, Transporte, Vivienda, Salud, Entretenimiento, Ropa, Tecnología, Educación, Servicios, Mascotas, Viajes, Deporte, Ahorro, Inversiones, Otros.

**Categorías predefinidas de ingresos:** Sueldo, Freelance, Ventas, Alquiler, Dividendos, Bono, Otros.

### Tarjeta (`Card`)

```typescript
{
  id: string
  name: string
  lastFour: string                        // Últimos 4 dígitos
  color: string
  closingDay: number                      // Día de cierre del resumen
  dueDay: number                          // Día de vencimiento del pago
  closingHistory: Array<{
    month: string                         // "YYYY-MM"
    closingDate: string
    dueDate: string
  }>
}
```

### Ahorro (`Saving`)

```typescript
{
  id: string
  name: string
  type: 'account' | 'cash' | 'wallet' | 'goal'
  institution?: string
  currency: 'ARS' | 'USD'
  balance: number
  color: string
  goalAmount?: number
  goalDate?: string
  monthlyContribution?: number
}
```

### Transacción de Ahorro (`SavingTransaction`)

```typescript
{
  id: string
  savingId: string
  type: 'deposit' | 'withdrawal' | 'adjustment'
  amount: number
  date: string
  notes?: string
  sourceIncomeId?: string                 // Vinculado a ingreso (ahorro automático)
}
```

### Plazo Fijo (`FixedTerm`)

```typescript
{
  id: string
  institution: string
  principal: number
  currency: 'ARS' | 'USD'
  startDate: string
  endDate: string
  rate: number                            // TNA en porcentaje (ej: 40 = 40%)
  renewOnExpiry: boolean
  notes?: string
}
```

**Cálculo de interés acumulado:** `principal × (TNA / 365) × diasTranscurridos`

### Inversión (`Investment`)

```typescript
{
  id: string
  name: string
  ticker?: string
  type: 'stock' | 'bond' | 'cedear' | 'crypto' | 'other'
  currency: 'ARS' | 'USD'
  quantity: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
}
```

### Regla de Ahorro Automático (`AutoSavingRule`)

```typescript
{
  id: string
  categoryId: string                      // Categoría de ingreso que dispara la regla
  percentage: number                      // 1–100%
  targetSavingId: string                  // Cuenta de destino
  isActive: boolean
  askEveryTime: boolean                   // Pedir confirmación o aplicar automáticamente
  lastApplied?: string
  totalSaved: number
}
```

---

## 4. Módulos Funcionales

### 4.1 Autenticación

**Ruta:** `/login` y `/registro`
**Componentes:** `AuthFormContainer.tsx`
**Contexto:** `AuthContext`

#### Métodos de autenticación disponibles

| Método | Descripción |
|---|---|
| Email / Contraseña | Registro e inicio de sesión con credenciales propias |
| Google OAuth | Login con cuenta de Google |
| GitHub OAuth | Login con cuenta de GitHub |

#### Flujo de sesión

1. El usuario se autentica en Firebase Auth (cliente).
2. Se obtiene el ID Token de Firebase.
3. Se hace `POST /api/auth/session` con el token → el servidor crea una cookie HTTP-only segura.
4. En logout se llama `DELETE /api/auth/session` → la cookie es eliminada.
5. Todas las rutas protegidas verifican `user !== null` en `AuthContext`; si no hay sesión, redirigen a `/login`.

---

### 4.2 Dashboard — Gastos

**Ruta:** `/dashboard`
**Componentes principales:** `Dashboard.tsx`, `ExpenseForm.tsx`, `ExpenseList.tsx`, `SummaryCard.tsx`

#### Resumen financiero mensual

La cabecera del dashboard muestra cuatro métricas calculadas para el mes seleccionado:

| Métrica | Cálculo |
|---|---|
| Total Ingresos | Suma de ingresos del mes (ARS + USD convertido) |
| Total Gastos | Suma de gastos del mes (ARS + USD convertido) |
| Balance | Ingresos − Gastos |
| Cuotas del Mes | Suma de cuotas que caen en el mes actual |

El resumen tiene un **modo combinado** (muestra totales en ARS) y un **modo separado** (muestra ARS y USD en columnas independientes).

#### Formulario de gasto (`ExpenseForm`)

Campos disponibles:

| Campo | Tipo | Descripción |
|---|---|---|
| Descripción | Texto | Nombre del gasto |
| Monto | Numérico | Importe |
| Moneda | ARS / USD | Moneda del gasto |
| Fecha | Date | Fecha del gasto |
| Categoría | Selector | Auto-sugerida por keywords |
| Tarjeta | Selector | Opcional, vincula al resumen de la tarjeta |
| Cuotas | Numérico | Si > 1, activa modo cuotas |
| Cuota actual | Numérico | Para carga retroactiva de cuotas ya iniciadas |
| Comprobante | Texto | Número de factura/comprobante |
| Recurrente | Toggle | Repite el gasto mensualmente |
| Día recurrente | Numérico | Día del mes para la recurrencia |

**Auto-sugerencia de categoría:** Al escribir la descripción, el sistema busca coincidencias con las `keywords` de las categorías y sugiere la más relevante automáticamente.

#### Lista de gastos (`ExpenseList`)

- Muestra todos los gastos del mes seleccionado (incluye cuotas e importados por PDF).
- Permite **edición inline** de cada gasto.
- Permite **eliminación individual** con modal de confirmación.
- Soporta **selección múltiple** con barra de acciones bulk (eliminar varios a la vez).
- Gastos importados desde PDF se marcan visualmente.

#### Navegación por mes

El componente `MonthNavigator` permite navegar mes a mes. Al cambiar el mes, el contexto recalcula todos los valores filtrados: gastos, ingresos, cuotas activas y presupuestos del período.

---

### 4.3 Ingresos, Presupuestos y Reglas de Ahorro Automático

**Ruta:** `/ingresos`
**Componentes:** `BudgetManager.tsx`, `AutoSavingRuleModal.tsx`
**Diseño:** 3 tabs independientes

#### Tab 1 — Ingresos

- Registro de ingresos con nombre, monto, moneda, categoría, fecha.
- Soporte de ingresos recurrentes (mensuales).
- Al registrar un ingreso, el sistema verifica si hay reglas de ahorro automático activas para su categoría y muestra un toast sugiriendo transferir el porcentaje configurado.

#### Tab 2 — Presupuestos

- Creación de presupuesto por categoría con monto máximo mensual.
- Umbral de alerta configurable (default: 80%).
- Estado visual de cada presupuesto: `ok` (verde) / `warning` (amarillo) / `exceeded` (rojo).
- Posibilidad de **copiar presupuestos del mes anterior**.
- Los presupuestos recurrentes se replican automáticamente cada mes.
- El banner `BudgetAlertBanner` en el dashboard muestra las categorías que superaron el umbral.

#### Tab 3 — Ahorro Automático

- Creación de reglas: "Cuando cobre un ingreso de categoría X, destinar Y% a la cuenta de ahorro Z".
- Modo `askEveryTime`: muestra un toast de confirmación cada vez que se detecta el ingreso.
- Modo automático: aplica la regla sin intervención.
- Historial de aplicaciones con monto ahorrado acumulado.
- Componente `AutoSavingSuggestionToast` presenta la acción y permite aceptar/rechazar.

---

### 4.4 Ahorros

**Ruta:** `/ahorros`
**Componentes:** `SavingsOverview.tsx`, `SavingModal.tsx`, `TransactionModal.tsx`, `SavingsGoals.tsx`, `SavingsCharts.tsx`

#### Cuentas de ahorro

Se pueden crear múltiples cuentas con los tipos:

| Tipo | Descripción |
|---|---|
| `account` | Cuenta bancaria de ahorro |
| `cash` | Dinero en efectivo |
| `wallet` | Billetera digital (Mercado Pago, etc.) |
| `goal` | Meta de ahorro con objetivo y fecha |

Cada cuenta tiene: nombre, institución, moneda (ARS/USD), saldo actual y color.

#### Movimientos

Desde el modal `TransactionModal` se registran:
- **Depósito:** suma al saldo.
- **Retiro:** resta al saldo.
- **Ajuste:** corrección manual del saldo.

Cada movimiento puede tener notas y queda registrado en el historial de transacciones.

#### Metas de ahorro

Las cuentas de tipo `goal` muestran:
- Progreso visual (barra) hacia el monto objetivo.
- Fecha estimada de cumplimiento basada en la contribución mensual configurada.
- Porcentaje alcanzado.

#### Resumen

El panel superior muestra:
- Total ahorrado en ARS.
- Total ahorrado en USD.
- Total consolidado en ARS (usando tipo de cambio blue).

El widget `SavingsDashboardWidget` en el dashboard principal replica este resumen de forma compacta.

---

### 4.5 Inversiones

**Ruta:** `/inversiones`
**Componentes:** `InversionesOverview.tsx`, `FixedTermModal.tsx`, `FixedTermList.tsx`, `InvestmentModal.tsx`, `InvestmentList.tsx`, `RendimientosTab.tsx`

#### Plazos Fijos

- Registro con: institución, capital, moneda, fecha inicio/fin, TNA (%), renovación automática.
- El sistema calcula diariamente el interés acumulado: `capital × (TNA / 365) × días_transcurridos`.
- Estados visuales:
  - **Activo:** en curso.
  - **Por vencer:** faltan ≤ 7 días.
  - **Vencido:** fecha de fin superada.
- Notificación automática cuando faltan 3 días para el vencimiento.

#### Cartera de Inversiones

Tipos de activo soportados:

| Tipo | Descripción |
|---|---|
| `stock` | Acciones |
| `bond` | Bonos |
| `cedear` | CEDEARs |
| `crypto` | Criptomonedas |
| `other` | Otros |

Cada posición registra: nombre, ticker, tipo, moneda, cantidad, precio de compra, precio actual, fecha de compra.

El sistema calcula P&L:
- **Ganancia/Pérdida absoluta:** `(precioActual − precioCompra) × cantidad`
- **Ganancia/Pérdida porcentual:** `((precioActual − precioCompra) / precioCompra) × 100`

#### Resumen de Portfolio

`getPortfolioSummary()` consolida:
- Valor total de plazos fijos (capital + interés acumulado).
- Valor de mercado de la cartera.
- P&L total.
- Desglose por moneda.

---

### 4.6 Métricas

**Ruta:** `/metricas`
**Librería:** Recharts 3

Visualizaciones disponibles:

| Gráfico | Tipo | Descripción |
|---|---|---|
| Gastos por categoría | Pie Chart | Distribución porcentual del mes |
| Evolución mensual | Line/Bar Chart | Tendencia de gastos vs. ingresos |
| Comparación | Bar Chart | Mes actual vs. mes anterior |
| Proyección de flujo | Line Chart | 8 meses (1 anterior + actual + 6 futuros) con desglose contado/cuotas |

#### Proyección de flujo de caja (`getMonthlyProjection`)

Calcula para cada uno de los 8 meses:
- Ingresos esperados (recurrentes proyectados).
- Gastos de contado.
- Cuotas que caen en ese mes.
- Balance neto proyectado.

---

### 4.7 Tarjetas de Crédito

**Componente:** `cards/CardManager.tsx`
**Accesible desde:** Dashboard (menú lateral)

Gestión de tarjetas con:
- Nombre y últimos 4 dígitos.
- Color identificador.
- Día de cierre del resumen.
- Día de vencimiento del pago.
- Historial de cierres por mes.

Las **notificaciones** de tarjeta alertan:
- Cuando se acerca el **día de cierre** (configurable).
- Cuando se acerca el **día de vencimiento** del pago.

---

### 4.8 Importación de Resúmenes PDF

**Componente:** `cards/PDFImporter.tsx`
**API Route:** `POST /api/parse-statement`
**Parsers:** `lib/parsers/`

#### Bancos soportados

| Banco | Tarjetas |
|---|---|
| Galicia | Visa, Mastercard |
| Santander | Visa, AMEX |
| BBVA | Visa |
| ICBC | Visa |
| Provincia | Visa |

#### Flujo de importación

1. **Selección de archivo:** el usuario sube el PDF del resumen.
2. **Extracción de texto:** `pdfjs-dist` convierte el PDF a texto plano.
3. **Detección automática del banco:** el parser analiza patrones en el texto para identificar el banco emisor.
4. **Parseo de transacciones:** regex bancario extrae por cada transacción:
   - Fecha
   - Descripción del comercio
   - Monto
   - Número de cuota (ej: "3/12") → detecta cuota actual y total
   - Número de comprobante (si disponible)
   - Moneda (ARS/USD)
5. **Detección de fecha de cierre y vencimiento** del resumen desde el encabezado.
6. **Vista previa:** el usuario ve todas las transacciones detectadas con posibilidad de:
   - Seleccionar/deseleccionar individualmente.
   - Ver alertas de duplicados (transacciones que ya existen en el mes).
7. **Confirmación:** las transacciones seleccionadas se crean como gastos vinculados a la tarjeta correspondiente.
8. **Actualización del historial de cierres** de la tarjeta.

---

### 4.9 Tipo de Cambio en Tiempo Real

**Contexto:** `ExchangeRateContext`
**Fuente:** `api.bluelytics.com.ar`
**Componente visual:** `ui/ExchangeRateBadge.tsx`

- Obtiene el dólar blue y oficial al iniciar la sesión.
- Se actualiza automáticamente cada **30 minutos**.
- Se usa en toda la aplicación para:
  - Convertir ingresos y gastos en USD a ARS en los totales.
  - Mostrar el resumen de ahorros consolidado.
  - Calcular el portfolio de inversiones.

---

### 4.10 Notificaciones

**Contexto:** `NotificationContext`
**Componente:** `ui/NotificationPanel.tsx`

#### Tipos de notificación

| Tipo | Descripción |
|---|---|
| `budget_exceeded` | Presupuesto de categoría superado (100%) |
| `budget_warning` | Presupuesto próximo al umbral configurado (default 80%) |
| `card_due` | Vencimiento de pago de tarjeta próximo |
| `card_closing` | Cierre de resumen de tarjeta próximo |
| `no_income` | No se registraron ingresos en el mes actual |
| `fixed_term_expiring` | Plazo fijo vence en ≤ 3 días |
| `fixed_term_expired` | Plazo fijo vencido sin renovación |

#### Persistencia

Los estados de lectura (`read`), descarte (`dismissed`) y desactivación (`disabled`) se persisten en **localStorage**, de modo que al recargar la app el usuario no vuelve a ver notificaciones ya gestionadas.

---

### 4.11 Exportación de Datos

**Componente:** `ExportModal.tsx`
**Utilidad:** `lib/exportUtils.ts`

- `generateCardPDF()`: genera un PDF del resumen de la tarjeta con desglose de:
  - Gastos de contado del mes.
  - Cuotas activas del mes.
  - Total a pagar.
- Usa `jsPDF` + `jspdf-autotable` para la generación del documento.

---

## 5. Flujos de Datos y Estado Global

### Contextos disponibles

| Contexto | Responsabilidad | Hook |
|---|---|---|
| `AuthContext` | Sesión del usuario, métodos de login/logout | `useAuth()` |
| `FinanceContext` | Todos los datos financieros + CRUD + cálculos | `useFinance()` |
| `ExchangeRateContext` | Tipo de cambio ARS/USD en tiempo real | `useExchangeRate()` |
| `NotificationContext` | Estado y gestión de notificaciones | `useNotifications()` |

### Flujo de datos típico

```
Acción del usuario (ej: agregar gasto)
        ↓
Componente React llama a useFinance().addExpense(data)
        ↓
FinanceContext llama a apiCreateExpense(uid, data) → lib/api.ts
        ↓
Firebase Firestore: /users/{uid}/expenses/{docId}
        ↓
FinanceContext actualiza el estado local: setExpenses([...])
        ↓
Todos los componentes suscritos re-renderizan con el nuevo estado
```

### Colecciones Firestore por usuario

```
/users/{uid}/
├── expenses/
├── incomes/
├── budgets/
├── categories/
├── cards/
├── savings/
├── savingTransactions/
├── fixedTerms/
├── investments/
├── autoSavingRules/
└── autoSavingLogs/
```

---

## 6. Configuración del Entorno

### Variables de entorno requeridas

Crear el archivo `apps/web/.env.local` con las siguientes variables:

```bash
# Firebase (cliente) — se obtienen en Firebase Console → Configuración del proyecto
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-side) — se obtienen en Firebase Console → Cuentas de servicio
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=""
```

### Configuración de Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com).
2. Crear un proyecto nuevo (o usar uno existente).
3. Habilitar **Authentication**:
   - Ir a Authentication → Sign-in method.
   - Activar: Email/Contraseña, Google, GitHub (este último requiere OAuth App en GitHub).
4. Habilitar **Firestore**:
   - Ir a Firestore Database → Crear base de datos.
   - Elegir modo producción o test según necesidad.
   - Región recomendada: `us-east1` o `southamerica-east1`.
5. Obtener credenciales del **cliente** (SDK config) en Configuración del proyecto → General → Tus apps.
6. Obtener credenciales del **Admin SDK** en Configuración del proyecto → Cuentas de servicio → Generar clave privada.

### Reglas de Firestore recomendadas (desarrollo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 7. Guía para Correr la Aplicación

### Requisitos previos

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Cuenta en Firebase con proyecto configurado (ver sección 6)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd control-gastos

# 2. Instalar dependencias (instala todos los workspaces)
npm install

# 3. Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local
# Editar apps/web/.env.local con las credenciales de Firebase

# 4. Levantar la aplicación en modo desarrollo
cd apps/web
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Comandos disponibles

Ejecutar desde `apps/web/`:

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con Turbopack (hot reload) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción (requiere build previo) |
| `npm run lint` | Análisis estático con ESLint |

---

## 8. Guía de Testing Completo

### 8.1 Configuración para Tests E2E

Los tests end-to-end usan **Playwright** y requieren configuración adicional.

#### Paso 1 — Instalar Playwright

```bash
cd apps/web
npx playwright install chromium
```

#### Paso 2 — Crear usuario de test en Firebase

Se recomienda un **proyecto Firebase separado** para tests o al menos un usuario dedicado:

1. Ir a Firebase Console → Authentication → Usuarios → Agregar usuario.
2. Crear con email y contraseña de prueba.

#### Paso 3 — Configurar variables de test

Crear `apps/web/.env.test.local`:

```bash
TEST_EMAIL=tu-usuario-test@gmail.com
TEST_PASSWORD=tu-password-test
BASE_URL=http://localhost:3000
```

#### Paso 4 — Levantar la app antes de correr tests

En una terminal separada:
```bash
cd apps/web && npm run dev
```

### 8.2 Comandos de Testing

Ejecutar desde `apps/web/`:

| Comando | Descripción |
|---|---|
| `npm run test:e2e` | Ejecuta todos los tests en modo headless |
| `npm run test:e2e:ui` | Abre Playwright UI (modo visual, ideal para desarrollo) |
| `npm run test:e2e:debug` | Modo debug paso a paso con inspector |
| `npm run test:e2e:report` | Abre el reporte HTML del último run |
| `npx playwright test auth` | Solo tests de autenticación |
| `npx playwright test dashboard` | Solo tests del dashboard |
| `npx playwright test ingresos` | Solo tests de ingresos |
| `npx playwright test navegacion` | Solo smoke tests de navegación |
| `npx playwright test --grep "agrega un gasto"` | Test específico por nombre |
| `npx playwright test --project=mobile-chrome` | Solo en viewport mobile |

### 8.3 Estructura de Tests

```
e2e/
├── auth.setup.ts          # Login una sola vez → guarda sesión en .auth/user.json
├── fixtures/index.ts      # Extiende `test` con Page Objects pre-instanciados
├── pages/
│   ├── LoginPage.ts       # Selectores: formulario de login
│   ├── DashboardPage.ts   # Selectores: formulario de gastos, lista, summary
│   └── IncomesPage.ts     # Selectores: tabs, formulario de ingresos/presupuestos
└── tests/
    ├── auth.spec.ts        # Login exitoso, rutas protegidas, errores de credenciales
    ├── dashboard.spec.ts   # CRUD de gastos, SummaryCard, navegación por mes
    ├── ingresos.spec.ts    # CRUD ingresos, CRUD presupuestos, tabs
    └── navegacion.spec.ts  # Smoke tests de todas las rutas + responsive
```

### 8.4 Estrategia de datos de prueba

Los tests usan **timestamps únicos** (`Date.now()`) en los datos para evitar colisiones entre ejecuciones. No se requiere limpieza previa salvo en tests de lectura específica.

---

## 9. Casos de Uso de Punta a Punta

A continuación se detallan los flujos completos para probar cada funcionalidad manualmente.

---

### CU-01: Registro y primer ingreso

1. Abrir `http://localhost:3000`.
2. Hacer clic en **Crear cuenta**.
3. Completar email y contraseña → **Registrarse**.
4. Ser redirigido al **Dashboard**.
5. El sistema inicializa automáticamente las **16 categorías predefinidas** en Firestore.

---

### CU-02: Registrar un gasto de contado

1. Desde el **Dashboard**, completar el formulario de gasto:
   - Descripción: "Supermercado Coto"
   - Monto: 15000
   - Moneda: ARS
   - Categoría: Alimentación (auto-sugerida por keyword)
   - Fecha: hoy
2. Clic en **Agregar**.
3. Verificar que aparece en la lista de gastos.
4. Verificar que el **Total Gastos** en el resumen aumentó.

---

### CU-03: Registrar un gasto en cuotas

1. En el formulario de gasto, activar el campo **Cuotas**.
2. Ingresar:
   - Descripción: "Notebook"
   - Monto total: 600000
   - Cuotas: 12
   - Cuota actual: 1
   - Tarjeta: (seleccionar una tarjeta existente o crear una primero)
3. Clic en **Agregar**.
4. Navegar al mes siguiente con `MonthNavigator` → el gasto debe aparecer con cuota 2/12.
5. Volver al mes actual → aparece con cuota 1/12.

---

### CU-04: Importar resumen de tarjeta PDF

1. Ir al **Dashboard** → abrir **Importar PDF** (menú de tarjeta).
2. Cargar el PDF del resumen de la tarjeta.
3. Esperar el procesamiento (extracción + parseo).
4. Revisar las transacciones detectadas.
5. Deseleccionar duplicados si los hubiera.
6. Clic en **Importar seleccionadas**.
7. Verificar en la lista de gastos que las transacciones aparecen vinculadas a la tarjeta.

---

### CU-05: Configurar y verificar un presupuesto

1. Ir a **Ingresos** → tab **Presupuestos**.
2. Crear presupuesto:
   - Categoría: Alimentación
   - Monto: 20000
   - Umbral de alerta: 80%
3. Volver al **Dashboard** y agregar gastos en Alimentación hasta superar $16.000.
4. Verificar que aparece el banner de alerta amarilla (warning).
5. Agregar más gastos hasta superar $20.000.
6. Verificar que el banner cambia a rojo (exceeded) y aparece una notificación.

---

### CU-06: Registrar un ingreso y aplicar ahorro automático

1. Ir a **Ingresos** → tab **Ahorro Automático** → crear regla:
   - Categoría de ingreso: Sueldo
   - Porcentaje: 10%
   - Cuenta destino: (crear una cuenta de ahorro primero en `/ahorros`)
   - Modo: Preguntar cada vez
2. Ir a **Ingresos** → tab **Ingresos** → registrar:
   - Nombre: "Sueldo Mayo"
   - Monto: 500000
   - Categoría: Sueldo
3. Verificar que aparece el toast de ahorro automático sugiriendo transferir $50.000.
4. Aceptar → ir a **Ahorros** y verificar que el saldo aumentó en $50.000.

---

### CU-07: Registrar un plazo fijo

1. Ir a **Inversiones** → tab **Plazos Fijos**.
2. Clic en **Agregar plazo fijo**:
   - Institución: Banco Galicia
   - Capital: 1.000.000 ARS
   - TNA: 40%
   - Fecha inicio: hace 30 días
   - Fecha fin: en 60 días
3. Verificar que el sistema muestra el **interés acumulado** en 30 días: `1.000.000 × (0.40 / 365) × 30 ≈ $32.877`.
4. Verificar el estado "Activo" y los días restantes.

---

### CU-08: Registrar posición en cartera

1. Ir a **Inversiones** → tab **Cartera**.
2. Clic en **Agregar inversión**:
   - Nombre: "Apple Inc."
   - Ticker: AAPL
   - Tipo: CEDEAR
   - Cantidad: 10
   - Precio de compra: 5000 ARS
   - Precio actual: 5800 ARS
3. Verificar P&L: `(5800 − 5000) × 10 = $8.000 (+16%)`.

---

### CU-09: Verificar métricas y proyección

1. Ir a **Métricas**.
2. Verificar el pie chart de distribución por categoría del mes actual.
3. Navegar a la proyección de flujo → observar los 8 meses con contado vs. cuotas.
4. Verificar que los meses con cuotas activas muestran el monto correcto.

---

### CU-10: Crear meta de ahorro

1. Ir a **Ahorros** → **Nueva cuenta**.
2. Tipo: Meta, Nombre: "Vacaciones", Moneda: USD, Meta: 2000 USD, Fecha: 2026-12-01.
3. Registrar un depósito de $500 USD.
4. Verificar la barra de progreso: 25%.
5. Verificar la proyección de fecha de cumplimiento basada en contribución mensual.

---

*Documentación generada el 2026-03-29 para la versión 0.1.0 de Controlados $.*
