# Game Engine Overview

## Architecture

The R-Type game engine is built on a modern **Entity Component System (ECS)** architecture, providing high performance and flexibility for game object management.

## Core Principles

### 1. Entity Component System (ECS)

The engine separates data (Components) from behavior (Systems):

- **Entities**: Unique identifiers representing game objects
- **Components**: Pure data structures (Position, Velocity, Health, etc.)
- **Systems**: Logic that processes entities with specific component combinations

### 2. Data-Driven Design

Game content is defined through JSON archetypes, enabling:
- Rapid prototyping without recompilation
- Easy content creation and modification
- Hot-reloading capabilities (in development)

### 3. Separation of Concerns

```
┌────────────────────────────────────────────────────┐
│                  Game Engine                        │
├────────────────────────────────────────────────────┤
│  Core                │  Managers      │  Systems   │
│  ┌────────────┐     │ ┌────────────┐ │ ┌────────┐ │
│  │ Registry   │     │ │ Scene Mgr  │ │ │ Logic  │ │
│  │ Entity     │     │ │ Resource   │ │ │ Physic │ │
│  │ Component  │     │ │ Scripting  │ │ │ Render │ │
│  └────────────┘     │ └────────────┘ │ └────────┘ │
└────────────────────────────────────────────────────┘
```

## Key Features

### Multi-Registry Support

The engine supports multiple independent registries, enabling:
- Separate game worlds (menu, game, pause)
- Client-server state separation
- Testing and debugging isolation

### Component Types

#### Core Components
- **Position**: `{x, y}` - Entity location
- **Velocity**: `{dx, dy}` - Movement vector
- **Scale**: `{width, height}` - Size multiplier
- **Hitbox**: `{width, height}` - Collision boundaries

#### Graphics Components
- **Sprite**: Texture rendering with animation support
- **Animation**: Frame-based animation data
- **RectangleShape**: Primitive rectangle rendering
- **CircleShape**: Primitive circle rendering
- **Text**: Text rendering with font support

#### Gameplay Components
- **Health**: `{hp, max_hp}` - Health management
- **Damage**: `{amount}` - Damage dealing
- **Shooter**: Firing rate and charge mechanics
- **Weapon**: Projectile patterns and archetypes
- **PlayerTag**: Player identification
- **EnemyTag**: Enemy identification
- **MissileTag**: Projectile ownership
- **BossTag**: Boss entity marker
- **ShieldTag**: Shield state for bosses
- **ForceTag**: Force companion orb
- **PowerUp**: Power-up type and effects

#### Advanced Components
- **Script**: Lua scripting integration
- **AI**: Behavior patterns (STRAIGHT, SINE, ZIGZAG, etc.)
- **TimedLifespan**: Auto-destruction timer
- **ParallaxLayer**: Background scrolling
- **Controllable**: Input-responsive entities

### System Groups

Systems are organized into execution groups for optimal performance:

#### Logic Group (60 Hz)
- **PlayerControlSystem**: Processes player input
- **PlayerShootingSystem**: Handles player weapon firing
- **AISystem**: Controls enemy behavior patterns
- **EnemyShootingSystem**: Enemy weapon management
- **WeaponSystem**: Projectile spawning and patterns
- **PowerUpSystem**: Power-up collection and effects
- **ScriptSystem**: Lua script execution
- **LifespanSystem**: Timed entity destruction
- **DeathSystem**: Entity death handling and callbacks

#### Physics Group (60 Hz)
- **MovementSystem**: Applies velocity to position
- **CollisionSystem**: Detects and resolves collisions
- **ForceSystem**: Force companion behavior
- **ForceControlSystem**: Force movement and shooting
- **ForceCollisionSystem**: Force-specific collision
- **OffScreenDeathSystem**: Destroys off-screen entities

#### Render Group (Variable FPS)
- **RenderSystem**: Sprite, shape, and text rendering
- **AnimationSystem**: Frame animation updates
- **HealthBarSystem**: UI health bar rendering
- **ParallaxSystem**: Background layer scrolling

#### UI Group
- **ButtonSystem**: Button interaction
- **MenuButtonActionSystem**: Menu navigation
- **TextInputSystem**: Text field input
- **RoomsListSystem**: Multiplayer room display

## Scene Management

### Scene System

Scenes represent distinct game states:
- **menu_scene**: Main menu
- **game_scene**: Offline gameplay
- **online_client_game_scene**: Online multiplayer
- **pause_scene**: Pause menu
- **score_scene**: End-game results

### Scene Configuration

Scenes are defined in `Config/scenes.json`:

```json
{
  "menu_scene": {
    "registry_group": "menu",
    "archetypes": [
      {"type": "ui.menu_background", "pos": [0, 0]},
      {"type": "ui.title_text", "pos": [960, 200]}
    ]
  }
}
```

## Resource Management

### Texture Management

Textures are loaded through the Resource Factory:
- Automatic caching
- Shared resource access
- Memory-efficient reuse

### Audio System

Two-tier audio architecture:
- **SoundSystem**: Short sound effects
- **MusicSystem**: Background music with looping

## Archetype System

### JSON-Based Entity Templates

Archetypes define reusable entity templates:

```json
{
  "player_ship": {
    "components": {
      "Position": {},
      "Velocity": {},
      "Sprite": {
        "texture_path": "Assets/sprites/ship.png",
        "frame_width": 33,
        "frame_height": 21
      },
      "Health": {"hp": 100, "max_hp": 100},
      "PlayerTag": {"player_id": 0}
    }
  }
}
```

### Spawning System

```cpp
Entity player = engine.spawn_from_archetype("player.player_ship", "game");
```

## Performance Considerations

### Sparse Arrays

Components are stored in sparse arrays for:
- Cache-friendly iteration
- O(1) component access
- Minimal memory overhead

### System Scheduling

Systems execute in fixed time steps:
- Logic: 60 Hz (16.67ms)
- Physics: 60 Hz (16.67ms)
- Render: Variable (V-Sync or unlocked)

### Memory Management

- Component pools for efficient allocation
- Automatic entity cleanup on scene transitions
- Resource sharing across entities


<!-- ## Next Steps -->

<!-- - [Systems Reference](/engine/systems) - Detailed system documentation
- [Components Reference](/engine/components) - Complete component list
- [Lua Scripting](/engine/scripting) - Script integration guide
- [Archetype Guide](/engine/archetypes) - Creating custom entities -->
