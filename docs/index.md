# R-Type Project

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![C++](https://img.shields.io/badge/C%2B%2B-20-blue.svg)]()
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-lightgrey)]()
[![License](https://img.shields.io/badge/license-Educational-orange)]()

A modern C++20 implementation of the classic R-Type side-scrolling shoot'em up game featuring a robust client-server architecture, real-time multiplayer gameplay, and professional software engineering practices.

## Table of Contents

- [About](#-about)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Gameplay](#-gameplay)
- [Development](#-development)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## About

R-Type is a legendary side-scrolling shoot'em up game originally developed by Irem in 1987. This project is a modern recreation built with C++20, featuring:

- **Networked Multiplayer**: Up to 4 players can play together in real-time
- **Professional Architecture**: Clean separation between client, server, and game engine
- **Cross-Platform**: Runs on Linux, Windows, and macOS
- **Modern C++**: Leverages C++20 features and best practices

## Features

```
├── Server/             # Game server implementation
├── Client/             # Game client implementation  
├── GameEngine/         # Core game engine
├── All_src/           # Shared source files (SFML wrappers, scenes)
├── Include/           # Shared header files
├── Assets/            # Game assets (sprites, sounds, fonts)
├── Documentations/    # Project documentation
└── build/             # Build output directory
```

## Features

- **Client-Server Architecture**: Multiplayer support with dedicated server
- **Modern C++20**: Uses latest C++ features and standards
- **SFML Graphics**: Rich 2D graphics and audio support
- **Cross-Platform**: Works on Linux, macOS, and Windows
- **Autonomous Setup**: Automatic dependency management with Conan
- **CMake Build System**: Modern, flexible build configuration
- **Professional-Grade**: Follows software engineering best practices
- **Modular Design**: Clean separation between engine, client, and server

## Quick Start

### Autonomous Setup (Recommended)

**Linux/macOS:**
```bash
# One-command setup and build
./setup.sh --build
```

**Windows (PowerShell as Administrator):**
```powershell
# One-command setup and build
.\setup.ps1 -Build
```

### Manual Building

If dependencies are already installed:

```bash
# Build everything
make

# Or use the build script directly
./build.sh

# Build specific components
make server
make client

# Clean and rebuild everything
make rebuild
```

### Running

```bash
# Start the server
./build/Server/rtype_server

# Start the client
./build/Client/rtype_client
```

## Gameplay

### Core Features
- **Side-scrolling Action**: Classic horizontal scrolling gameplay
- **Multiplayer Support**: Up to 4 players simultaneously
- **Power-ups System**: Collect and upgrade your weapons
- **Enemy Waves**: Multiple enemy types with different AI behaviors
- **Boss Battles**: Challenging boss encounters

### Controls
- **Movement**: Arrow keys or WASD
- **Shoot**: Space bar or Left Click
- **Special**: Right Click (when power-up available)

## Development

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐
│     Client      │◄──►│     Server      │
│                 │    │                 │
│ • Rendering     │    │ • Game Logic    │
│ • Input         │    │ • Physics       │
│ • Audio         │    │ • Networking    │
│ • UI            │    │ • State Mgmt    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────┬───────────────┘
                 ▼
      ┌─────────────────┐
      │   GameEngine    │
      │                 │
      │ • ECS System    │
      │ • Components    │
      │ • Resources     │
      │ • Scene Mgmt    │
      └─────────────────┘
```

### Key Components
- **GameEngine**: Core ECS (Entity Component System) framework
- **Server**: Game logic, physics simulation, and network orchestration
- **Client**: Rendering engine, input handling, and user interface
- **Network Protocol**: Custom UDP-based protocol for real-time communication

## Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Developer Guide](docs/DEVELOPER.md)** - Architecture and development guidelines
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and components
- **[Network Protocol](docs/PROTOCOL.md)** - Client-server communication specification  
- **[Build Guide](BUILD.md)** - Detailed compilation instructions
- **[Technology Choices](docs/TECHNOLOGY_ANALYSIS.md)** - Technical decisions and comparisons
- **[Game Development Guide](docs/GAME_DEV.md)** - Adding entities, weapons, and features

## Contributing

We welcome contributions! Please read our contribution guidelines:

1. **Code Style**: Follow the existing C++20 style and conventions
2. **Testing**: Ensure your changes don't break existing functionality
3. **Documentation**: Update relevant documentation for your changes
4. **Commits**: Use clear, descriptive commit messages
5. **Pull Requests**: Provide detailed descriptions of your changes

### Development Setup
```bash
# Clone the repository
git clone https://github.com/EpitechPGE3-2025/G-CPP-500-COT-5-1-rtype-24.git
cd G-CPP-500-COT-5-1-rtype-24

# Automatic setup and build
./setup.sh --build
```

## Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Language | C++20 | Modern C++ features and performance |
| Graphics | SFML 2.6+ | Cross-platform multimedia framework |
| Networking | Boost.Asio | Asynchronous network programming |
| Build System | CMake 3.16+ | Cross-platform build automation |
| Package Manager | Conan | Dependency management |
| Architecture | ECS | Entity Component System pattern |
---