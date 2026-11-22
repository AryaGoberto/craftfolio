# Panduan Setup Project: Next.js, Tailwind CSS, & Docker

Dokumen ini berisi panduan langkah demi langkah untuk menyiapkan project **FormaCV** menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Docker** (untuk *development* maupun *production*), selaras dengan spesifikasi di [PRD.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/PRD.md) dan [brand-guideline.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/brand-guideline.md).

---

## 1. Prasyarat

Pastikan perangkat sudah terpasang:
- **Node.js** v20 LTS atau v22 LTS
- **Package Manager:** `npm` atau `pnpm`
- **Docker** & **Docker Compose** (v2)

---

## 2. Inisialisasi Next.js & Tailwind CSS

### 2.1 Membuat Project Baru
Jalankan perintah berikut di direktori root project:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 2.2 Instalasi Dependensi Inti (MVP)
Pasang library utama sesuai arsitektur di [PRD.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/PRD.md):

```bash
# State, Form, Validasi & Drag-and-Drop
npm install zustand zundo react-hook-form @hookform/resolvers zod @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Ikon & PDF Engine (Client-Side MVP)
npm install lucide-react @react-pdf/renderer
```

### 2.3 Setup `shadcn/ui`
Inisialisasi `shadcn/ui` dengan gaya netral (base color **Zinc**) agar sesuai dengan palet di [brand-guideline.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/brand-guideline.md):

```bash
npx shadcn@latest init
```

Saat prompt muncul, pilih:
- **Style:** New York (atau Default)
- **Base Color:** `Zinc`
- **CSS Variables:** `Yes`

Tambahkan komponen UI dasar yang dibutuhkan editor:

```bash
npx shadcn@latest add button input label textarea card badge tabs accordion switch select tooltip separator
```

---

## 3. Konfigurasi Tailwind CSS & Tipografi

### 3.1 Font di `src/app/layout.tsx`
Muat font UI (`Inter`) dan preset font dokumen (`EB Garamond`, `Merriweather`) menggunakan `next/font/google`:

```tsx
import { Inter, EB_Garamond, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${ebGaramond.variable} ${merriweather.variable}`}
    >
      <body className="bg-[#F8F9FA] text-[#09090B] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

### 3.2 Token Warna Brand di `src/app/globals.css`
Pastikan token warna permukaan & status dari [brand-guideline.md](file:///Users/aryagunavarogoberto/projects/online-cv-ats-maker/brand-guideline.md) tersedia (contoh untuk Tailwind v4 `@theme` atau CSS variables):

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-serif-academic: var(--font-garamond), Georgia, serif;
  --font-serif-editorial: var(--font-merriweather), Georgia, serif;

  --color-surface-canvas: #F8F9FA;
  --color-surface-panel: #FAFAFA;
  --color-surface-card: #FFFFFF;
  --color-border-subtle: #E4E4E7;
  --color-border-divider: #F4F4F5;
}
```

---

## 4. Konfigurasi Next.js untuk Docker (`next.config.ts`)

Aktifkan `output: "standalone"` agar image Docker *production* berukuran kecil dan cepat dijalankan:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

---

## 5. Setup Docker

### 5.1 `.dockerignore`
Buat file `.dockerignore` di root agar `node_modules` dan folder build lokal tidak ikut tersalin ke image:

```dockerignore
node_modules
.next
out
.git
.gitignore
.env*.local
npm-debug.log*
README.md
```

### 5.2 `Dockerfile` (Production — Multi-Stage Build)
Buat file `Dockerfile` di root project:

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build Next.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 5.3 `Dockerfile.dev` (Development — Hot Reload)
Buat file `Dockerfile.dev` jika ingin menjalankan mode development di dalam container:

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
CMD ["npm", "run", "dev"]
```

### 5.4 `docker-compose.yml`
Buat file `docker-compose.yml` di root untuk memudahkan menjalankan container *dev* maupun *prod*:

```yaml
services:
  web-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - WATCHPACK_POLLING=true
    profiles:
      - dev

  web-prod:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    profiles:
      - prod
```

---

## 6. Cara Menjalankan

### A. Lokal (Tanpa Docker)
```bash
npm run dev
```
Buka `http://localhost:3000`.

### B. Docker Development (Dengan Hot Reload)
```bash
docker compose --profile dev up --build
```

### C. Docker Production
```bash
docker compose --profile prod up --build -d
```

Untuk menghentikan container:
```bash
docker compose --profile dev down
# atau
docker compose --profile prod down
```
