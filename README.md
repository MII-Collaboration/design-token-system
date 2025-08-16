# 🎨 Design Token System

Sistem Design Token menggunakan Style Dictionary untuk mengelola dan mendistribusikan design tokens ke berbagai format.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-green)](package.json)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Instalasi](#-instalasi)
- [Cara Penggunaan](#-cara-penggunaan)
- [Struktur Project](#-struktur-project)
- [Format Output](#-format-output)
- [Integrasi Figma](#-integrasi-figma)
- [Workflow GitHub Actions](#-workflow-github-actions)

## ✨ Fitur Utama

- 🎯 **Multi-Platform Output**: CSS, SCSS, JavaScript, JSON, TypeScript
- 🔄 **Sinkronisasi Figma**: Integrasi dengan Token Studio for Figma
- 🚀 **Auto Build**: GitHub Actions untuk build otomatis
- 🎨 **Utility Classes**: Generate CSS utility classes otomatis
- 📱 **Responsive**: Konversi px ke rem otomatis

## 🚀 Instalasi

### Prerequisites
- Node.js (v14 atau lebih tinggi)
- npm atau yarn

### Setup Project

```bash
# Clone repository
git clone <repository-url>
cd design-token-system

# Install dependencies
npm install

# Build tokens pertama kali
npm run build
```

## 🎯 Cara Penggunaan

### 1. Mengelola Tokens

Tokens disimpan dalam folder `tokens/` dengan format JSON:

```json
{
  "global": {
    "primary": {
      "$type": "color",
      "$value": "#FF0025"
    },
    "spacing": {
      "md": {
        "$type": "spacing",
        "$value": "16"
      }
    }
  }
}
```

### 2. Build Tokens

```bash
# Build semua tokens
npm run build

# Build dan bersihkan output sebelumnya
npm run build:clean

# Preview hasil di browser
npm run dev
```

### 3. Menggunakan Output

#### CSS Variables
```css
/* Import CSS variables */
@import url('./dist/css/colors-basic/variables.css');

.my-component {
  background-color: var(--global-primary);
  padding: var(--global-spacing-md);
}
```

#### CSS Utility Classes
```html
<!-- Gunakan utility classes yang di-generate otomatis -->
<div class="bg-global-primary p-global-spacing-md">
  Content dengan design tokens
</div>
```

#### JavaScript/TypeScript
```javascript
// Import tokens sebagai JavaScript object
import tokens from './dist/js/colors-basic/tokens.js';

const primaryColor = tokens.global.primary;
```

#### SCSS Variables
```scss
// Import SCSS variables
@import './dist/scss/colors-basic/variables';

.component {
  background-color: $global-primary;
  padding: $global-spacing-md;
}
```

## 📁 Struktur Project

```
design-token-system/
├── tokens/                    # Source tokens (JSON)
│   ├── colors-basic.json
│   ├── spacing-basic.json
│   ├── figma-tokens.json
│   └── *-converted.json       # Converted tokens
├── dist/                      # Generated output
│   ├── css/                   # CSS variables & utilities
│   │   ├── colors-basic/
│   │   ├── spacing-basic/
│   │   └── figma-tokens/
│   ├── scss/                  # SCSS variables
│   ├── js/                    # JavaScript/TypeScript
│   └── json/                  # JSON format
├── .github/workflows/         # GitHub Actions
│   └── build-css.yml         # Auto build workflow
├── build.js                   # Build script
├── sync-tokens.js            # Figma sync script
├── config.json               # Style Dictionary config
└── demo.html                 # Demo page
```

## 🎨 Format Output

### CSS Variables
```css
:root {
  --global-primary: #FF0025;
  --global-spacing-md: 1rem;
}
```

### CSS Utility Classes
```css
/* Color utilities */
.bg-global-primary { background-color: var(--global-primary); }
.text-global-primary { color: var(--global-primary); }

/* Spacing utilities */
.p-global-spacing-md { padding: var(--global-spacing-md); }
.pt-global-spacing-md { padding-top: var(--global-spacing-md); }
```

### JavaScript/TypeScript
```javascript
export default {
  global: {
    primary: "#FF0025",
    spacing: {
      md: "1rem"
    }
  }
};
```

### SCSS Variables
```scss
$global-primary: #FF0025;
$global-spacing-md: 1rem;
```

## 🎭 Integrasi Figma

### Setup Token Studio

1. **Install Plugin**
   - Buka Figma
   - Install "Figma Tokens" plugin

2. **Connect Repository**
   - Pilih GitHub sebagai sync provider
   - Repository: `your-username/design-token-system`
   - Branch: `main`
   - File path: `figma-tokens.json`

3. **Sync Tokens**
   ```bash
   # Sync dari Figma ke Style Dictionary
   npm run sync:from-figma
   
   # Sync dari Style Dictionary ke Figma
   npm run sync:to-figma
   ```

### Workflow Figma

1. **Figma → Code**:
   - Edit tokens di Figma Token Studio
   - Push ke GitHub dari plugin
   - GitHub Actions otomatis build

2. **Code → Figma**:
   - Edit file JSON di `tokens/`
   - Run `npm run sync:to-figma`
   - Pull dari GitHub di Figma Token Studio

## 🚀 Workflow GitHub Actions

### Auto Build

Setiap push ke folder `tokens/` akan otomatis:
1. Build semua tokens ke format CSS, JS, SCSS, JSON
2. Simpan hasil di folder `dist/`
3. Commit dan push hasil build ke repository

### Manual Trigger

Anda juga bisa menjalankan workflow secara manual:
1. Buka tab "Actions" di GitHub repository
2. Pilih "Build CSS from Tokens"
3. Klik "Run workflow"

## 🛠️ Scripts

```bash
# Build tokens
npm run build

# Build dengan clean
npm run build:clean

# Sync dari Figma
npm run sync:from-figma

# Sync ke Figma
npm run sync:to-figma

# Development server
npm run dev
```

## 📝 License

ISC License - lihat file [LICENSE](LICENSE) untuk detail.

---

**Dibuat dengan ❤️ menggunakan Style Dictionary**
