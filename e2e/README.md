# E2E Tests — Controlados $

## Estructura

```
e2e/
├── auth.setup.ts          # Login una sola vez → guarda sesión en .auth/user.json
├── fixtures/
│   └── index.ts           # Extiende `test` con Page Objects pre-instanciados
├── pages/
│   ├── DashboardPage.ts   # Selectores y acciones del Dashboard
│   ├── LoginPage.ts       # Selectores y acciones del Login
│   └── IncomesPage.ts     # Selectores y acciones de Ingresos
├── tests/
│   ├── auth.spec.ts        # Login, rutas protegidas, errores de auth
│   ├── dashboard.spec.ts   # Formulario de gastos, lista, SummaryCard
│   ├── ingresos.spec.ts    # Tabs, formulario de ingresos y presupuestos
│   └── navegacion.spec.ts  # Smoke tests + responsive
└── .auth/
    └── user.json           # Sesión guardada (en .gitignore)
```

## Setup inicial

1. Crear usuario de test en Firebase (proyecto separado recomendado)
2. Copiar `.env.test.example` → `.env.test.local` y completar variables
3. `npm install` ya instala `@playwright/test`
4. `npx playwright install chromium`

## Variables de entorno necesarias

```env
TEST_EMAIL=tu-usuario-test@gmail.com
TEST_PASSWORD=tu-password-test
BASE_URL=http://localhost:3000   # o URL de staging
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run test:e2e` | Ejecuta todos los tests (headless) |
| `npm run test:e2e:ui` | Abre Playwright UI (modo visual, ideal para desarrollo) |
| `npm run test:e2e:debug` | Modo debug paso a paso |
| `npm run test:e2e:report` | Abre el reporte HTML del último run |
| `npx playwright test auth` | Solo los tests de auth |
| `npx playwright test --grep "agrega un gasto"` | Un test específico por nombre |
| `npx playwright test --project=mobile-chrome` | Solo en mobile |

## Qué hacer con Firestore (datos de prueba)

**Opción A — Proyecto Firebase separado (recomendado):**
- Crear un proyecto `controlados-test` en Firebase
- Los tests escriben y leen datos reales pero en un proyecto aislado
- Ventaja: prueba el flujo completo end-to-end

**Opción B — Limpiar datos después de cada test:**
```ts
test.afterEach(async ({ page }) => {
  // Llamar a una API route de Next.js que borre los datos de test
  await page.request.delete('/api/test/cleanup');
});
```

**Opción C — Tests read-only:**
- Los tests de smoke y navegación no escriben datos
- Solo los tests de "agrega X" escriben, y se identifican con timestamp único

## CI/CD

El workflow `.github/workflows/playwright.yml` se ejecuta en:
- Cada push a `main` o ramas `feat/**`
- Cada Pull Request hacia `main`

Secrets necesarios en GitHub → Settings → Secrets:
- `TEST_EMAIL`, `TEST_PASSWORD`
- `TEST_BASE_URL` (URL de staging/preview de Vercel)
- Variables de Firebase del proyecto test

## Mejores prácticas aplicadas

- **Page Objects**: un archivo por página, selectores centralizados
- **Fixtures**: setup compartido sin repetir código
- **Selectores por rol/placeholder**: más estables que clases CSS
- **Timestamps únicos**: `Date.now()` en datos de prueba evita colisiones
- **`storageState`**: auth se hace una vez, no en cada test
- **`reuseExistingServer: true`**: no levanta Next.js si ya está corriendo
