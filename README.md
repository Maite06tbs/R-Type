# R-Type Documentation

This directory contains the complete documentation for the R-Type project using **VitePress**.

## 📚 Documentation Contents

### Game Engine
- **Overview**: ECS architecture, components, systems, archetypes
- **Systems Reference**: Complete guide to all 35+ systems

### Server Architecture
- **Server Overview**: Authoritative server, room management, UDP networking

### Client Architecture
- **Client Overview**: Offline/online modes, rendering, input handling

### Network Protocol
- **UDP Protocol**: Packet structures, communication flow, optimizations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ and npm

### Installation

```bash
cd docs/R-Type_Documentation
npm install
```

### Launch Documentation

```bash
# Development server with hot-reload
npm run dev
# or
npx vitepress dev docs

# Build static site
npm run build
# or
npx vitepress build docs

# Preview production build
npm run preview
# or
npx vitepress preview docs
```

### Access

Open your browser at: **http://localhost:5173**

---

## 📖 Navigation

The documentation is organized into the following sections:

1. **Getting Started**
   - Introduction
   - Developer Guide
   - Technology Analysis

2. **Game Engine**
   - ECS Architecture Overview
   - Complete Systems Reference (35+ systems)

3. **Server Architecture**
   - Authoritative Server Model
   - Room Management
   - UDP Networking
   - State Synchronization

4. **Client Architecture**
   - Offline Mode (Local Game Engine)
   - Online Mode (Network Client)
   - Scene Management
   - Rendering Pipeline

5. **Network Protocol**
   - Packet Structures (JOIN, ACK, INPUT, SNAPSHOT, LEAVE)
   - Client-Server Communication
   - Performance Optimizations

---

## 🔧 Development

### Adding New Pages

1. Create a Markdown file in `docs/` subdirectory
2. Add navigation link in `docs/.vitepress/config.ts`

Example:
```typescript
{
  text: 'My New Section',
  items: [
    { text: 'New Page', link: '/section/newpage' }
  ]
}
```

### Markdown Features

VitePress supports:
- ✅ Standard Markdown
- ✅ Code syntax highlighting
- ✅ Tables
- ✅ Diagrams (Mermaid)
- ✅ Math equations (KaTeX)
- ✅ Custom containers (tip, warning, danger)

---

## 📝 Contributing

When updating documentation:

1. Keep technical accuracy (verify with source code)
2. Include code examples
3. Add diagrams for complex concepts
4. Cross-reference related pages
5. Test changes with `npm run dev`

---

## 🛠️ Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
sudo lsof -i :5173
kill -9 <PID>
```

### Missing Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear cache
rm -rf docs/.vitepress/cache docs/.vitepress/dist
npm run build
```

---

## 📦 Project Structure

```
docs/R-Type_Documentation/
├── docs/                      # Markdown content
│   ├── .vitepress/
│   │   └── config.ts         # VitePress configuration
│   ├── engine/               # Game engine docs
│   │   ├── overview.md
│   │   └── systems.md
│   ├── server/               # Server docs
│   │   └── architecture.md
│   ├── client/               # Client docs
│   │   └── architecture.md
│   ├── network/              # Network protocol docs
│   │   └── protocol.md
│   ├── index.md             # Introduction
│   ├── DEVELOPER.md          # Developer guide
│   └── TECHNOLOGY_ANALYSIS.md
├── package.json              # Dependencies
└── README.md                 # This file
```

---

## 🌐 Deployment (Future)

### GitHub Pages

```bash
# Build static site
npm run build

# Deploy to gh-pages branch
npm run deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

---

## 📚 Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Mermaid Diagrams](https://mermaid.js.org/)

---

## 📄 License

Documentation is part of the R-Type project.

**Copyright © 2024 R-Type Team**
