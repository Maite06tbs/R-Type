# Client Architecture

## Overview

The R-Type client is a **thin rendering layer** that supports both **offline (local)** and **online (multiplayer)** gameplay modes with a shared codebase.

## Architecture Philosophy

### Client Design Principles

- **Presentation Layer**: Client focuses on rendering and input
- **Minimal Game Logic**: Server/local engine handles gameplay
- **Mode Switching**: Seamless offline ↔ online transitions
- **Scene Management**: Clean state transitions (menu → game → score)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  ClientApplication                       │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │         SceneManager                       │         │
│  │  - MenuScene                               │         │
│  │  - OnlineClientGameScene (multiplayer)     │         │
│  │  - TestGameScene (offline)                 │         │
│  │  - PauseScene                              │         │
│  │  - ScoreScene / WinScene / LoseScene       │         │
│  └────────────────┬───────────────────────────┘         │
│                   │                                      │
│       ┌───────────┴──────────────┐                      │
│       │                          │                      │
│  ┌────▼──────────┐        ┌──────▼────────┐            │
│  │OfflineApp     │        │  OnlineApp    │            │
│  │               │        │               │            │
│  │ ┌───────────┐ │        │ ┌───────────┐ │            │
│  │ │GameEngine │ │        │ │NetworkClnt│ │            │
│  │ │  (local)  │ │        │ │           │ │            │
│  │ │           │ │        │ │ UDP       │ │            │
│  │ │ Registry  │ │        │ │ Client    │ │            │
│  │ │ Systems   │ │        │ └───────────┘ │            │
│  │ └───────────┘ │        │               │            │
│  └───────────────┘        └───────────────┘            │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │     Rendering Layer (SFML)               │           │
│  │  - RenderSystem                          │           │
│  │  - AnimationSystem                       │           │
│  │  - ParallaxSystem                        │           │
│  │  - HealthBarSystem                       │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │     Input Layer                          │           │
│  │  - SfmlInputManager                      │           │
│  │  - Keyboard / Mouse / Gamepad            │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. ClientApplication

**Responsibility**: Main entry point and window management

```cpp
class ClientApplication {
    sf::RenderWindow window;
    std::unique_ptr<SceneManager> scene_manager;
    std::unique_ptr<SfmlInputManager> input_manager;
    
public:
    ClientApplication(int width, int height);
    void run();
};
```

**Initialization**:
```cpp
int main() {
    ClientApplication app(1920, 1080);
    app.run();  // Event loop
}
```

**Main Loop** (Variable Framerate):
```cpp
void ClientApplication::run() {
    sf::Clock clock;
    
    while (window.isOpen()) {
        float dt = clock.restart().asSeconds();
        
        // 1. Process window events
        sf::Event event;
        while (window.pollEvent(event)) {
            input_manager->process_event(event);
        }
        
        // 2. Update current scene
        scene_manager->update(dt);
        
        // 3. Render
        window.clear();
        scene_manager->render(window);
        window.display();
    }
}
```

---

### 2. SceneManager

**Responsibility**: Scene lifecycle and transitions

**Available Scenes**:
- `MenuScene`: Main menu (offline/online selection)
- `TestGameScene`: Offline mode (local game engine)
- `OnlineClientGameScene`: Online mode (network client)
- `PauseScene`: Pause overlay
- `ScoreScene`: End-game statistics
- `WinScene` / `LoseScene`: Victory/defeat screens

**Scene API**:
```cpp
class IScene {
public:
    virtual void on_enter() = 0;       // Scene initialization
    virtual void update(float dt) = 0; // Game logic
    virtual void render(sf::RenderWindow&) = 0; // Drawing
    virtual void on_exit() = 0;        // Cleanup
};
```

**Transitions**:
```cpp
void SceneManager::change_scene(const std::string& scene_name) {
    if (current_scene) {
        current_scene->on_exit();
    }
    
    current_scene = scene_factory.create(scene_name);
    current_scene->on_enter();
}
```

**Example Flow**:
```
MenuScene
  │
  ├─ [Play Offline] → TestGameScene → ScoreScene → MenuScene
  │
  └─ [Play Online] → OnlineClientGameScene → WinScene → MenuScene
```

---

### 3. OfflineApplication

**Responsibility**: Local single-player mode

**Features**:
- Full game engine runs locally
- All systems execute client-side
- No network communication
- Testing and development mode

**Architecture**:
```cpp
class OfflineApplication {
    GameEngine game_engine;
    
public:
    void update(float dt) {
        // Execute all systems locally
        game_engine.update_systems("logic", dt);
        game_engine.update_systems("physics", dt);
        game_engine.update_systems("render", dt);
    }
};
```

**Use Cases**:
- Single-player gameplay
- Boss testing (`test_force_toggle.md`)
- Level design iteration
- AI development

---

### 4. OnlineApplication

**Responsibility**: Multiplayer client mode

**Features**:
- Connects to authoritative server
- Sends player inputs only
- Receives game state snapshots
- Renders server state

**Architecture**:
```cpp
class OnlineApplication {
    NetworkClient network;
    Registry render_registry;  // For rendering only
    
public:
    void update(float dt) {
        // 1. Send inputs to server
        uint8_t keys = encode_player_input();
        network.send_input(keys);
        
        // 2. Receive snapshot from server
        if (auto snapshot = network.receive_snapshot()) {
            apply_snapshot(*snapshot);
        }
        
        // 3. Render local representation
        render_systems(dt);
    }
};
```

**No Local Simulation**: Server state is authoritative

---

### 5. NetworkClient

**Responsibility**: Server communication

**Protocol**: UDP (see [Network Protocol](/network/protocol))

**API**:
```cpp
class NetworkClient {
public:
    void connect(const std::string& ip, uint16_t port);
    void send_input(uint8_t keys);
    std::optional<Snapshot> receive_snapshot();
    void disconnect();
};
```

**Connection Flow**:
```cpp
void OnlineClientGameScene::on_enter() {
    network.connect("127.0.0.1", 4242);
    
    // Wait for ACK with player_id
    auto ack = network.wait_for_ack();
    player_id = ack.player_id;
}
```

**Input Sending** (every frame):
```cpp
void send_player_input() {
    uint8_t keys = 0;
    keys |= sf::Keyboard::isKeyPressed(sf::Keyboard::Up) << 0;
    keys |= sf::Keyboard::isKeyPressed(sf::Keyboard::Down) << 1;
    keys |= sf::Keyboard::isKeyPressed(sf::Keyboard::Left) << 2;
    keys |= sf::Keyboard::isKeyPressed(sf::Keyboard::Right) << 3;
    keys |= sf::Keyboard::isKeyPressed(sf::Keyboard::Space) << 4;
    keys |= sf::Keyboard::isKeyPressed(sf::Keyboard::F) << 5;
    
    network.send_input(keys);
}
```

**Snapshot Handling**:
```cpp
void apply_snapshot(const Snapshot& snap) {
    // Clear render registry
    render_registry.clear();
    
    // Recreate entities from snapshot
    for (const auto& entity_data : snap.entities) {
        Entity e = render_registry.create_entity();
        
        render_registry.add_component<Position>(e, entity_data.x, entity_data.y);
        render_registry.add_component<Sprite>(e, textures[entity_data.sprite_id]);
        
        if (entity_data.health > 0) {
            render_registry.add_component<Health>(e, entity_data.health);
        }
    }
}
```

---

## Rendering Pipeline

### Render Systems (Client-Side Only)

These systems only run on the client:

1. **RenderSystem**: Draw sprites, rectangles, circles, text
2. **AnimationSystem**: Update sprite frames
3. **HealthBarSystem**: Draw HP bars
4. **ParallaxSystem**: Scrolling background layers

**Execution**:
```cpp
void render_frame(sf::RenderWindow& window) {
    // 1. Update animations
    animation_system.update(dt);
    
    // 2. Sort by z-index
    render_system.sort_by_depth();
    
    // 3. Draw all entities
    render_system.render(window);
    
    // 4. Draw UI overlays
    healthbar_system.render(window);
}
```

### Textures and Assets

**Resource Loading**:
```cpp
class ResourceManager {
    std::map<std::string, sf::Texture> textures;
    std::map<std::string, sf::Font> fonts;
    std::map<std::string, sf::SoundBuffer> sounds;
    
public:
    void load_from_directory(const std::string& path);
    sf::Texture& get_texture(const std::string& name);
};
```

**Asset Locations**:
- Sprites: `Assets/sprites/`
- Fonts: `Assets/fonts/`
- Sounds: `Assets/sounds/`
- Music: `Assets/sounds/`

**Loading on Startup**:
```cpp
void ClientApplication::init() {
    resource_manager.load_from_directory("Assets/sprites");
    resource_manager.load_from_directory("Assets/fonts");
    resource_manager.load_from_directory("Assets/sounds");
}
```

---

## Input Management

### SfmlInputManager

**Responsibility**: Keyboard, mouse, gamepad input

**API**:
```cpp
class SfmlInputManager : public IInputManager {
public:
    void process_event(const sf::Event& event) override;
    bool is_key_pressed(int keycode) override;
    Vector2f get_mouse_position() override;
};
```

**Input Binding**:
```cpp
// Keyboard
if (input.is_key_pressed(sf::Keyboard::Space)) {
    player_shoot();
}

// Mouse (menu buttons)
if (input.is_mouse_button_pressed(sf::Mouse::Left)) {
    auto pos = input.get_mouse_position();
    button_system.check_click(pos);
}

// Gamepad (future)
if (input.is_joystick_button_pressed(0, 0)) {
    player_shoot();
}
```

**Configurable Controls** (future):
```json
{
  "controls": {
    "up": "Z",
    "down": "S",
    "left": "Q",
    "right": "D",
    "shoot": "Space",
    "force_toggle": "F"
  }
}
```

---

## Scene Details

### MenuScene

**Components**:
- Background sprite
- Title text ("R-TYPE")
- Buttons: "Play Offline", "Play Online", "Settings", "Quit"

**Systems Used**:
- `ButtonSystem`: Hover/click detection
- `MenuButtonActionSystem`: Button callbacks
- `RenderSystem`: Draw UI

**Example**:
```cpp
void MenuScene::on_enter() {
    // Create background
    auto bg = registry.create_entity();
    registry.add_component<Sprite>(bg, "menu_background.png");
    
    // Create "Play Offline" button
    auto btn = registry.create_entity();
    registry.add_component<Position>(btn, 800, 400);
    registry.add_component<Button>(btn, "Play Offline", []() {
        scene_manager->change_scene("TestGameScene");
    });
}
```

---

### TestGameScene (Offline Mode)

**Components**:
- Full `GameEngine` instance
- Local `Registry`
- All systems (logic + physics + render)

**Update Loop**:
```cpp
void TestGameScene::update(float dt) {
    // Process local input
    if (input.is_key_pressed(sf::Keyboard::Space)) {
        auto shoot = registry.get_components<PlayerShootingComponent>();
        shoot[player_entity]->trigger_shoot = true;
    }
    
    // Execute all systems
    game_engine.update_systems("logic", dt);
    game_engine.update_systems("physics", dt);
    game_engine.update_systems("render", dt);
}
```

**Level Loading**:
```cpp
void TestGameScene::on_enter() {
    // Spawn player
    auto player = archetype_manager.spawn("player", {100, 500});
    
    // Load level
    level_manager.load_level("Config/levels/level_1.json");
}
```

---

### OnlineClientGameScene (Multiplayer)

**Components**:
- `NetworkClient` connection
- Render-only `Registry`
- No game logic systems

**Update Loop**:
```cpp
void OnlineClientGameScene::update(float dt) {
    // 1. Send inputs to server
    uint8_t keys = encode_input();
    network.send_input(keys);
    
    // 2. Receive snapshot
    if (auto snap = network.receive_snapshot()) {
        apply_snapshot(*snap);
    }
    
    // 3. Render (animations, parallax)
    animation_system.update(dt);
    parallax_system.update(dt);
}

void OnlineClientGameScene::render(sf::RenderWindow& window) {
    render_system.render(window);
    healthbar_system.render(window);
}
```

**No Prediction**: Client is "dumb" terminal

---

## Performance Optimization

### Client-Side Optimizations

**1. Texture Atlases**:
```cpp
// Combine small sprites into single texture
sf::Texture atlas;
atlas.loadFromFile("sprites_atlas.png");

// Use texture rectangles
sprite.setTexture(atlas);
sprite.setTextureRect(sf::IntRect(0, 0, 32, 32));  // Enemy
sprite.setTextureRect(sf::IntRect(32, 0, 32, 32)); // Player
```

**2. Sprite Batching**:
```cpp
// Group by texture, reduce draw calls
for (auto& [texture, sprites] : grouped_sprites) {
    for (auto& sprite : sprites) {
        window.draw(sprite);
    }
}
```

**3. VSync / Frame Limiting**:
```cpp
window.setVerticalSyncEnabled(true);  // Lock to 60 FPS
// OR
window.setFramerateLimit(60);
```

**4. Culling**:
```cpp
bool is_on_screen(const Position& pos) {
    return pos.x > -100 && pos.x < 2020 &&
           pos.y > -100 && pos.y < 1180;
}

// Only render visible entities
for (size_t i = 0; i < positions.size(); ++i) {
    if (positions[i] && is_on_screen(*positions[i])) {
        render_entity(i);
    }
}
```

---

## Audio System

### SfmlSound & SfmlMusic

**Sound Effects**:
```cpp
class SfmlSound {
    sf::Sound sound;
    sf::SoundBuffer buffer;
    
public:
    void play(const std::string& file);
    void stop();
    void set_volume(float volume);  // 0-100
};
```

**Music (Looping)**:
```cpp
class SfmlMusic {
    sf::Music music;
    
public:
    void play(const std::string& file, bool loop = true);
    void pause();
    void set_volume(float volume);
};
```

**Usage**:
```cpp
// Background music
music.play("Assets/sounds/level_1_theme.ogg", true);

// Shooting sound
void PlayerShootingSystem::update(float dt) {
    if (trigger_shoot) {
        sound.play("Assets/sounds/laser.wav");
    }
}
```

---

## Configuration

### Client Settings

**Window Configuration**:
```json
{
  "window": {
    "width": 1920,
    "height": 1080,
    "fullscreen": false,
    "vsync": true,
    "framerate_limit": 60
  }
}
```

**Graphics Settings**:
```json
{
  "graphics": {
    "particle_quality": "high",
    "enable_shaders": true,
    "antialiasing": 8
  }
}
```

**Audio Settings**:
```json
{
  "audio": {
    "master_volume": 80,
    "music_volume": 60,
    "sfx_volume": 100
  }
}
```

**Network Settings**:
```json
{
  "network": {
    "server_ip": "127.0.0.1",
    "server_port": 4242,
    "timeout_ms": 5000
  }
}
```

---

## Error Handling

### Connection Errors

**Timeout**:
```cpp
try {
    network.connect("127.0.0.1", 4242);
} catch (const NetworkTimeoutException& e) {
    show_error_dialog("Server not responding. Please try again.");
    scene_manager->change_scene("MenuScene");
}
```

**Disconnection During Game**:
```cpp
void OnlineClientGameScene::update(float dt) {
    if (network.is_disconnected()) {
        show_notification("Connection lost. Returning to menu.");
        scene_manager->change_scene("MenuScene");
    }
}
```

### Missing Assets

```cpp
sf::Texture& ResourceManager::get_texture(const std::string& name) {
    if (textures.find(name) == textures.end()) {
        std::cerr << "Missing texture: " << name << std::endl;
        return placeholder_texture;  // Magenta square
    }
    return textures[name];
}
```

---

## Building the Client

### Dependencies

- **SFML 2.5+**: Graphics, audio, input
- **Boost.Asio**: Networking (UDP)
- **nlohmann/json**: Configuration parsing

### Compilation

```bash
# Linux
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --target rtype_client

# Windows
cmake -B build -G "Visual Studio 17 2022"
cmake --build build --config Release

# Run
./build/Client/rtype_client
```

---

## Debugging

### Client-Side Debug Tools

**FPS Counter**:
```cpp
sf::Text fps_text;
fps_text.setString("FPS: " + std::to_string(1.0f / dt));
window.draw(fps_text);
```

**Entity Count**:
```cpp
size_t count = registry.get_alive_entities().size();
std::cout << "Entities: " << count << std::endl;
```

**Bounding Box Visualization**:
```cpp
void RenderSystem::debug_draw_colliders(sf::RenderWindow& window) {
    auto& positions = registry.get_components<Position>();
    auto& hitboxes = registry.get_components<Hitbox>();
    
    for (size_t i = 0; i < positions.size(); ++i) {
        if (positions[i] && hitboxes[i]) {
            sf::RectangleShape rect({hitboxes[i]->width, hitboxes[i]->height});
            rect.setPosition(positions[i]->x, positions[i]->y);
            rect.setFillColor(sf::Color::Transparent);
            rect.setOutlineColor(sf::Color::Green);
            rect.setOutlineThickness(2);
            window.draw(rect);
        }
    }
}
```

---

## Future Enhancements

### Planned Features

- [ ] **Client-Side Prediction**: Reduce input lag in online mode
- [ ] **Entity Interpolation**: Smooth movement between snapshots
- [ ] **Sound Spatialization**: 3D audio positioning
- [ ] **Particle Systems**: Explosions, trails, effects
- [ ] **Shaders**: Post-processing effects (bloom, CRT filter)
- [ ] **Controller Support**: Full gamepad mapping
- [ ] **Settings Menu**: Rebindable controls, graphics options
- [ ] **Localization**: Multi-language support

---

## Troubleshooting

### Common Issues

**"Cannot connect to server"**:
- Check server is running: `ps aux | grep rtype_server`
- Verify firewall allows UDP 4242
- Test with `nc -u 127.0.0.1 4242`

**Low FPS**:
- Enable VSync: `window.setVerticalSyncEnabled(true)`
- Reduce particle quality
- Check GPU drivers

**No sound**:
- Verify audio files exist in `Assets/sounds/`
- Check system volume
- Test with: `aplay Assets/sounds/laser.wav`

**Sprite not appearing**:
- Check texture path is correct
- Verify `Position` component is set
- Ensure `RenderType` is SPRITE
- Check z-index (use higher value)

---


## Next Steps

- [Server Architecture](/server/architecture.md) - How the server works
- [Network Protocol](/network/protocol.md) - Packet structures
- [Game Engine](/engine/overview.md) - Shared ECS system

