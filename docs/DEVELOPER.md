# Developer Guide

## Overview

Welcome to the R-Type developer guide! This document provides comprehensive information for developers who want to understand, modify, or extend the R-Type project.

## Table of Contents

- [Project Architecture](#-project-architecture)
- [Development Environment](#-development-environment)
- [Code Organization](#-code-organization)
- [Core Systems](#-core-systems)
- [Development Workflow](#-development-workflow)
- [Debugging](#-debugging)
<!-- - [Performance Guidelines](#-performance-guidelines)
- [Testing Strategy](#-testing-strategy) -->

## Project Architecture

### High-Level Overview

The R-Type project follows a **client-server architecture** with a shared **Entity Component System (ECS)** game engine:

```
┌─────────────────────────────────────────────────────────────────┐
│                        R-Type Project                           │
├─────────────────────────────────────────────────────────────────┤
│  Client              │  Server              │  GameEngine       │
│  ┌─────────────────┐ │ ┌─────────────────┐  │ ┌───────────────┐ │
│  │ Rendering       │ │ │ Game Logic      │  │ │ ECS Core      │ │
│  │ Input Handling  │ │ │                 │  │ │ Components    │ │
│  │ Audio           │ │ │ Network Manager │  │ │ Systems       │ │
│  │ UI/UX           │ │ │                 │  │ │ Resources     │ │
│  │ Scene Manager   │ │ │ Room Manager    │  │ │ Scene Manager │ │
│  └─────────────────┘ │ └─────────────────┘  │ └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │                        │                    │
            └────────────┬───────────┘                    │
                         │                                │
                    ┌────▼────┐                           │
                    │ Network │◄──────────────────────────┘
                    │Protocol │
                    └─────────┘
```

### Key Principles

1. **Separation of Concerns**: Client handles presentation, server handles logic
2. **ECS Pattern**: Entity Component System for flexible game object management
3. **Network Transparency**: Seamless multiplayer experience
4. **Modularity**: Clean interfaces between components
5. **Cross-Platform**: Consistent behavior across operating systems

## Development Environment

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| CMake | 3.16+ | Build system |
| Conan | 2.0+ | Package management |
| C++ Compiler | C++20 | GCC 10+, Clang 10+, MSVC 2019+ |
| Git | Latest | Version control |

### IDE Recommendations

- **Visual Studio Code** with C++ extensions
- **CLion** (JetBrains)
- **Visual Studio** (Windows)
- **Qt Creator**

### Setup Commands

```bash
# # Initial setup
# ./setup.sh --build

# Development build
make rebuild-server  # Server only
make rebuild-client  # Client only
make rebuild         # Both
```

## Code Organization

### Directory Structure

```
R-Type/
├── Client/                 # Client-side code
│   ├── include/           # Client headers
│   ├── src/               # Client implementation
│   └── CMakeLists.txt     # Client build config
├── Server/                # Server-side code
│   ├── include/           # Server headers
│   ├── src/               # Server implementation
│   └── CMakeLists.txt     # Server build config
├── GameEngine/            # Shared game engine
│   ├── Core/              # ECS core implementation
│   └── managers/          # Engine managers
├── All_src/               # Shared source files
│   ├── scenes/            # Game scenes
│   ├── sfml/              # SFML wrappers
│   └── managers/          # Scene managers
├── Include/               # Shared headers
│   ├── All/               # Common interfaces
│   ├── Client_include/    # Client-specific
│   ├── GameEngine_Include/# Engine interfaces
│   └── Server/            # Server-specific
├── Assets/                # Game resources
│   ├── sprites/           # Graphics
│   ├── sounds/            # Audio files
│   └── fonts/             # Font files
├── docs/                  # Documentation
└── build/                 # Build output
```

### Naming Conventions

- **Classes**: PascalCase (`GameEngine`, `NetworkManager`)
- **Methods**: camelCase (`updatePosition`, `sendMessage`)
- **Variables**: snake_case (`player_count`, `enemy_list`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PLAYERS`, `DEFAULT_PORT`)
- **Files**: PascalCase for classes, snake_case for others

## Core Systems

### 1. Entity Component System (ECS)

The heart of our architecture is the ECS pattern:

**Entities**: Unique identifiers for game objects
```cpp
Entity player = registry.spawn_entity();
Entity enemy = registry.spawn_entity();
```

**Components**: Data containers
```cpp
struct Position {
    float x, y;
};

struct Velocity {
    float dx, dy;
};

struct Health {
    int current, maximum;
};
```

**Systems**: Logic processors
```cpp
void MovementSystem(Registry& registry, float deltaTime) {
    auto& positions = registry.get_components<Position>();
    auto& velocities = registry.get_components<Velocity>();
    
    for (size_t i = 0; i < positions.size(); ++i) {
        positions[i].x += velocities[i].dx * deltaTime;
        positions[i].y += velocities[i].dy * deltaTime;
    }
}
```

### 2. Network Architecture

The networking uses a **UDP-based protocol** for real-time communication:

**Protocol Stack**:
```
Application Layer    │ Game Logic (Snapshots, Inputs)
Transport Layer      │ Custom Protocol (Reliability, Sequencing)  
Network Layer        │ UDP (User Datagram Protocol)
<!-- Physical Layer       │ Ethernet/WiFi -->
```

**Message Flow**:
```
Client                Server
  │                     │
  │──── Join Request ──►│
  │◄───── Room ID ──────│
  │                     │
  │──── Input Data ────►│
  │◄── Game Snapshot ───│
  │                     │
```

### 3. Resource Management

**Texture Loading**:
```cpp
class ResourceManager {
    std::unordered_map<size_t, std::unique_ptr<ITexture>> textures_;
    
public:
    size_t loadTexture(const std::string& path);
    ITexture& getTexture(size_t id);
};
```

**Memory Management**:
- RAII principles
- Smart pointers (`std::unique_ptr`, `std::shared_ptr`)
- Automatic cleanup on scope exit

## Development Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-enemy-type

# 2. Implement changes
# ... code changes ...

# 3. Build and test
make rebuild
./build/Server/rtype_server &  # Start server
./build/Client/rtype_client    # Test client

# 4. Commit and push
git add .
git commit -m "feat: add new enemy type with circular movement pattern"
git push origin feature/new-enemy-type
```

### 2. Code Review Checklist

- [ ] **Functionality**: Does the code work as intended?
- [ ] **Performance**: Are there any performance bottlenecks?
- [ ] **Memory**: Are resources properly managed?
- [ ] **Thread Safety**: Is concurrent access handled correctly?
- [ ] **Documentation**: Are changes documented?
- [ ] **Tests**: Are there appropriate tests?

## Debugging

### Debug Builds

```bash
# Build with debug symbols
cmake -DCMAKE_BUILD_TYPE=Debug ..
make

# Run with debugger
gdb ./build/Server/rtype_server
gdb ./build/Client/rtype_client
```

<!-- ### Network Debugging

```bash
# Monitor network traffic
wireshark -i lo -f "port 4242"

# Server logs
./rtype_server --log-level=debug

# Client logs  
./rtype_client --verbose
``` -->

### Common Issues

1. **Port Already in Use**: Change server port or kill existing process
2. **Asset Loading Fails**: Check file paths and permissions
3. **Network Timeout**: Verify firewall settings
4. **Segmentation Fault**: Check pointer dereferencing and bounds

<!-- ## ⚡ Performance Guidelines

### General Rules

1. **Avoid Premature Optimization**: Profile first, optimize second
2. **Memory Locality**: Keep related data together
3. **Minimize Allocations**: Reuse objects when possible
4. **Cache-Friendly Code**: Sequential access patterns

### ECS Performance

```cpp
// Good: Cache-friendly iteration
for (size_t i = 0; i < entities.size(); ++i) {
    process(positions[i], velocities[i]);
}

// Avoid: Pointer chasing
for (auto& entity : entities) {
    process(*entity.getPosition(), *entity.getVelocity());
}
``` -->

<!-- ### Network Optimization

- **Batch Updates**: Send multiple changes in one packet
- **Delta Compression**: Only send what changed
- **Prioritization**: Important data first
- **Interpolation**: Smooth movement between updates -->

<!-- ## 🧪 Testing Strategy

### Unit Tests

```cpp
TEST(MovementSystem, UpdatesPositionCorrectly) {
    Registry registry;
    auto entity = registry.spawn_entity();
    registry.add_component(entity, Position{0.0f, 0.0f});
    registry.add_component(entity, Velocity{1.0f, 0.0f});
    
    MovementSystem(registry, 1.0f);
    
    auto& pos = registry.get_component<Position>(entity);
    EXPECT_FLOAT_EQ(pos.x, 1.0f);
    EXPECT_FLOAT_EQ(pos.y, 0.0f);
}
```

### Integration Tests

- Client-server communication
- Asset loading and rendering
- Input handling accuracy
- Network protocol reliability

### Performance Tests

- Frame rate consistency
- Network latency measurements
- Memory usage profiling
- Load testing with multiple clients -->

---