# Changelog

Semua perubahan penting pada project ini akan didokumentasikan dalam file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan project ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-15

### Added
- 🎨 Design Token System menggunakan Style Dictionary
- 🎯 Multi-platform output: CSS, SCSS, JavaScript, JSON, TypeScript
- 🔄 Integrasi Figma dengan Token Studio
- 🚀 GitHub Actions untuk auto build
- 🎨 CSS utility classes generation
- 📱 Automatic px to rem conversion
- 🛠️ Build scripts dan sync tools
- 📝 Comprehensive documentation

### Features
- **Token Management**: JSON-based token definitions
- **Multi-format Output**: 
  - CSS variables dan utility classes
  - SCSS variables
  - JavaScript/TypeScript objects
  - JSON format
- **Figma Integration**: Sync dengan Token Studio for Figma
- **Auto Build**: GitHub Actions workflow untuk build otomatis
- **Demo Page**: HTML demo untuk preview tokens

### Token Categories
- **Colors**: Basic color tokens (primary, secondary, etc.)
- **Spacing**: Spacing scale untuk padding, margins, gaps
- **Figma Tokens**: Tokens yang disinkronisasi dari Figma

### Build Output
- `dist/css/` - CSS variables dan utility classes
- `dist/scss/` - SCSS variables
- `dist/js/` - JavaScript/TypeScript objects
- `dist/json/` - JSON format

### Scripts
- `npm run build` - Build semua tokens
- `npm run build:clean` - Clean dan build
- `npm run sync:from-figma` - Sync dari Figma
- `npm run sync:to-figma` - Sync ke Figma
- `npm run dev` - Development server

[1.0.0]: https://github.com/abagasw/Integrate-Style/releases/tag/v1.0.0