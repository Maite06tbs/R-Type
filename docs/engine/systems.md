# Systems Reference

Complete reference for all game systems in the R-Type engine.

## Logic Systems

### PlayerControlSystem

**Purpose**: Translates player input into entity movement

**Components Required**:
- `PlayerTag`
- `Controllable`
- `Velocity`

**Behavior**:
- Reads keyboard/gamepad input
- Updates velocity based on input direction
- Enforces screen boundaries
- Supports 8-directional movement

**Configuration**:
- Speed: 300 units/second (default)
- Acceleration: Instant (no smoothing)

---

### PlayerShootingSystem

**Purpose**: Manages player weapon firing and charge mechanics

**Components Required**:
- `PlayerTag`
- `Controllable`
- `Shooter`

**Features**:
- **Simple Shots**: Tap to fire
- **Charged Shots**: Hold for 0.5s+ then release
- Automatic weapon assignment (default_gun)
- Cooldown management (fire_rate)

**Input Mapping**:
- `Space`: Fire/Charge weapon
- `C`: Force toggle

**Code Flow**:
```cpp
// Tap: Simple shot
if (isKeyPressed(Space) && fire_timer <= 0) {
    fire_timer = -1.0f; // Signal to WeaponSystem
}

// Hold: Charge
if (isKeyDown(Space)) {
    is_charging = true;
    charge_timer += dt;
}

// Release: Charged shot
if (isKeyReleased(Space) && charge_timer > 0.5f) {
    fire_timer = -1.0f; // Fire charged
}
```

---

### AISystem

**Purpose**: Controls enemy movement patterns

**Components Required**:
- `AI`
- `Position`
- `Velocity`

**Patterns**:

| Pattern | Behavior |
|---------|----------|
| `STRAIGHT` | Moves in constant direction |
| `SINE` | Vertical sine wave motion |
| `ZIGZAG` | Angular zigzag pattern |
| `CIRCLE` | Circular orbit around spawn point |
| `KAMIKAZE` | Homes towards player |
| `BOSS_TRACK` | Boss tracking behavior |

**Example Configuration**:
```json
{
  "AI": {
    "type": "SINE",
    "amplitude": 100,
    "frequency": 2.0
  }
}
```

---

### EnemyShootingSystem

**Purpose**: Handles enemy weapon firing

**Components Required**:
- `EnemyTag`
- `Shooter`
- `Position`

**Features**:
- Time-based firing (fire_rate)
- Charged shot probability
- Aim towards player option
- Multiple weapon patterns

---

### WeaponSystem

**Purpose**: Spawns projectiles based on weapon configuration

**Components Required**:
- `Shooter`
- `Weapon`
- `Position`

**Fire Patterns**:

#### SIMPLE
Single projectile forward:
```cpp
Entity bullet = spawn_from_archetype(
    weapon.projectile_archetype, 
    shooter_pos
);
```

#### SPREAD
Multiple projectiles in arc:
```json
{
  "pattern": "SPREAD",
  "pattern_data": {
    "count": 5,
    "angle": 30
  }
}
```

#### LASER
Continuous beam:
```cpp
// Creates line of projectiles
for (int i = 0; i < 10; ++i) {
    spawn_at(shooter_pos.x + i * 20, shooter_pos.y);
}
```

---

### PowerUpSystem

**Purpose**: Handles power-up collection and effects

**Components Required**:
- `PowerUp`
- `Position`

**Power-Up Types**:

| Type | Effect |
|------|--------|
| `SPEED_UP` | +50 speed |
| `WEAPON_UPGRADE` | Unlock spread/laser |
| `SHIELD` | Temporary invincibility |
| `FORCE` | Spawn Force orb |
| `EXTRA_LIFE` | +1 life |

**Collection System**:
```cpp
// Proximity detection
if (distance(player, powerup) < 50) {
    apply_effect(player, powerup.type);
    destroy(powerup);
}
```

---

### ScriptSystem

**Purpose**: Executes Lua scripts attached to entities

**Components Required**:
- `Script`

**Callbacks**:
- `init(self)`: Called on entity spawn
- `on_update(self, dt)`: Called every frame
- `on_damage(self, damage, type)`: Called on hit
- `on_death(self)`: Called on entity death

**API Available to Scripts**:
```lua
-- Entity manipulation
self.entity:getPosition()
self.entity:setPosition(x, y)
self.entity:setVelocity(dx, dy)
self.entity:get_health()
self.entity:setShieldActive(bool)

-- Spawning
engine.spawn_from_archetype(archetype, x, y)

-- Queries
engine.get_player_position()
```

**Example Boss Script**:
```lua
function on_update(self, dt)
    local player_pos = engine.get_player_position()
    if player_pos then
        -- Track player
        local dx = player_pos.x - pos.x
        local dy = player_pos.y - pos.y
        self.entity:setVelocity(dx * 0.5, dy * 0.5)
    end
end

function on_damage(self, damage, projectile_type)
    if has_shield and projectile_type == "simple" then
        return true  -- Reflect projectile
    end
    return false
end
```

---

### LifespanSystem

**Purpose**: Auto-destroys entities after time limit

**Components Required**:
- `TimedLifespan`

**Usage**:
```json
{
  "TimedLifespan": {"time": 5.0}
}
```

**Behavior**:
- Decrements timer each frame
- Marks entity as Dead when timer expires
- Used for: explosions, temporary projectiles, particles

---

### DeathSystem

**Purpose**: Handles entity death and cleanup

**Components Required**:
- `Dead`

**Responsibilities**:
1. Call Lua `on_death()` if Script present
2. Spawn death effects (explosions, particles)
3. Update player scores
4. Remove entity from registry

**Boss Death Example**:
```lua
function on_death(self)
    -- Spawn 25 meteorites
    for i = 1, 25 do
        local angle = (i / 25) * 2 * math.pi
        local x = pos.x + math.cos(angle) * 800
        local y = -100
        engine.spawn_from_archetype("meteorite", x, y)
    end
end
```

---

## Physics Systems

### MovementSystem

**Purpose**: Applies velocity to position

**Formula**:
```cpp
position.x += velocity.dx * dt;
position.y += velocity.dy * dt;
```

**Frame-rate Independence**:
- Delta time (dt) scaling ensures consistent speed
- Works at any FPS (30, 60, 144, etc.)

---

### CollisionSystem

**Purpose**: Detects and resolves collisions

**Collision Groups**:

#### 1. Player Projectiles → Enemies
```cpp
for (missile in player_missiles) {
    for (enemy in enemies) {
        if (AABB_collision(missile, enemy)) {
            enemy.hp -= missile.damage;
            destroy(missile);
        }
    }
}
```

#### 2. Enemy Projectiles → Player
```cpp
for (missile in enemy_missiles) {
    for (player in players) {
        if (AABB_collision(missile, player)) {
            player.hp -= missile.damage;
            destroy(missile);
        }
    }
}
```

#### 3. Player → Enemies (Kamikaze)
```cpp
if (collision(player, enemy)) {
    player.hp -= enemy.damage;
    if (!is_boss(enemy)) {
        destroy(enemy);
    }
}
```

**Shield Reflection**:
```cpp
if (has_shield && projectile_type == SIMPLE) {
    velocity.dx *= -1;
    velocity.dy *= -1;
    owner = ENEMY;  // Reflect back
}
```

---

### ForceSystem

**Purpose**: Manages Force companion orb behavior

**Components Required**:
- `ForceTag`
- `Position`
- `Velocity`

**States**:
- **Attached**: Orbits player at fixed distance
- **Detached**: Shoots independently
- **Inactive**: Not spawned

**Behavior**:
```cpp
if (attached) {
    // Orbit player
    angle += rotation_speed * dt;
    pos.x = player.x + cos(angle) * orbit_radius;
    pos.y = player.y + sin(angle) * orbit_radius;
} else {
    // Fixed position shooting
    fire_projectile_towards(cursor);
}
```

---

### ForceControlSystem

**Purpose**: Handles Force attachment/detachment

**Input**:
- `G` key: Toggle Force state

**Logic**:
```cpp
if (key_pressed(G)) {
    if (force.attached) {
        detach_force(force);
        lock_position(force, current_pos);
    } else {
        attach_force(force, player);
    }
}
```

---

### ForceCollisionSystem

**Purpose**: Separate collision detection for Force

**Why Separate?**:
- Different damage values
- Special projectile behavior
- Independent health tracking

---

### OffScreenDeathSystem

**Purpose**: Destroys entities that leave screen bounds

**Bounds**:
```cpp
const float MARGIN = 200.0f;
if (pos.x < -MARGIN || 
    pos.x > SCREEN_WIDTH + MARGIN ||
    pos.y < -MARGIN || 
    pos.y > SCREEN_HEIGHT + MARGIN) {
    mark_dead(entity);
}
```

**Exceptions**:
- Player (protected)
- Boss (custom boundaries)
- Force (protected)
- ParallaxLayers (wrap-around)

---

## Render Systems

### RenderSystem

**Purpose**: Renders all visual entities

**Render Types**:

| Component | Rendering |
|-----------|-----------|
| `Sprite` | Texture + Animation |
| `RectangleShape` | Filled rectangle |
| `CircleShape` | Filled circle |
| `Text` | Font-based text |

**Rendering Order**:
1. Sort by z_index (low to high)
2. Draw backgrounds (z_index: 1-10)
3. Draw game objects (z_index: 10-50)
4. Draw UI (z_index: 100+)

**Sprite Rendering**:
```cpp
// With animation
sprite.setTextureRect(
    frame_x + (current_frame * frame_width),
    frame_y,
    frame_width,
    frame_height
);

// With scale
sprite.setScale(scale.width, scale.height);

// Render
window.draw(sprite);
```

---

### AnimationSystem

**Purpose**: Updates sprite animation frames

**Components Required**:
- `Animation`
- `Sprite`

**Logic**:
```cpp
timer += dt;
if (timer >= frame_duration) {
    current_frame = (current_frame + 1) % num_frames;
    if (!loops && current_frame == 0) {
        mark_dead(entity);  // One-shot animation
    }
    timer = 0;
}
```

---

### HealthBarSystem

**Purpose**: Renders player health UI

**Display**:
```
HP: (100/100)
```

**Position**: Top-left corner (10, 10)

---

### ParallaxSystem

**Purpose**: Scrolls background layers

**Components Required**:
- `ParallaxLayer`
- `Position`
- `Velocity`

**Behavior**:
```cpp
position.x += velocity.dx * dt;

// Wrap-around when off-screen
if (position.x < -width) {
    position.x += width * 2;
}
```

**Layer Example**:
```json
{
  "ParallaxLayer": {
    "speed_multiplier": 0.5,
    "layer_depth": 1
  },
  "Velocity": {"dx": -50, "dy": 0}
}
```

---

## UI Systems

### ButtonSystem

**Purpose**: Handles button interactions

**States**:
- `NORMAL`: Default state
- `HOVER`: Mouse over
- `PRESSED`: Mouse down
- `DISABLED`: Non-interactive

**Components Required**:
- `Button`
- `Position`
- `Hitbox`

---

### MenuButtonActionSystem

**Purpose**: Executes menu button actions

**Actions**:
- `START_GAME`: Launch offline mode
- `JOIN_ONLINE`: Connect to server
- `CREATE_ROOM`: Host multiplayer
- `QUIT`: Exit application

---

### TextInputSystem

**Purpose**: Handles text field input

**Features**:
- Character input
- Backspace support
- Cursor rendering
- Max length limits

**Example**:
```json
{
  "TextInput": {
    "placeholder": "Enter IP...",
    "max_length": 15
  }
}
```

---

## System Execution Order

### Frame Pipeline

```
┌─────────────────────────────────────┐
│ Input Phase                          │
│ - Read keyboard/mouse/network       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Logic Phase (60 Hz)                 │
│ 1. PlayerControlSystem              │
│ 2. PlayerShootingSystem             │
│ 3. AISystem                         │
│ 4. EnemyShootingSystem              │
│ 5. WeaponSystem                     │
│ 6. PowerUpSystem                    │
│ 7. ScriptSystem                     │
│ 8. LifespanSystem                   │
│ 9. DeathSystem                      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Physics Phase (60 Hz)               │
│ 1. MovementSystem                   │
│ 2. CollisionSystem                  │
│ 3. ForceSystem                      │
│ 4. ForceControlSystem               │
│ 5. ForceCollisionSystem             │
│ 6. OffScreenDeathSystem             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Render Phase (Variable FPS)         │
│ 1. AnimationSystem                  │
│ 2. ParallaxSystem                   │
│ 3. RenderSystem                     │
│ 4. HealthBarSystem                  │
│ 5. ButtonSystem (UI)                │
└─────────────────────────────────────┘
```

---

## Performance Tips

### System Optimization

1. **Early Exit**: Check component existence first
```cpp
if (!positions[i] || !velocities[i]) continue;
```

2. **Cache Locality**: Access components sequentially
```cpp
for (size_t i = 0; i < positions.size(); ++i) {
    auto& pos = *positions[i];
    auto& vel = *velocities[i];
    // Process...
}
```

3. **Avoid Allocations**: Reuse entities when possible
```cpp
// Bad: Spawn new bullets every frame
// Good: Use object pool for projectiles
```

### System Ordering

- Place cheap checks first (PlayerControl before WeaponSystem)
- Group related systems (all shooting systems together)
- Separate read-only from write systems when possible

---

## Adding Custom Systems

### Step 1: Create System Class

```cpp
class MyCustomSystem : public ISystem {
    std::string _registerGroup;
public:
    MyCustomSystem(std::string group = "default") 
        : _registerGroup(group) {}
    
    void run(GameEngine& engine, float dt) override {
        auto& registry = engine.getRegistry(_registerGroup);
        auto& custom = registry.get_components<MyComponent>();
        
        for (size_t i = 0; i < custom.size(); ++i) {
            if (!custom[i]) continue;
            // Process...
        }
    }
};
```

### Step 2: Register System

```cpp
registry.add_system("logic", MyCustomSystem(group));
```

### Step 3: Set Execution Frequency

```cpp
// Run at 30 Hz
registry.add_system("logic", MyCustomSystem(group), 30.0f);
```

---

## Next Steps

<!-- - [Components Reference](/engine/components) - All component types -->
- [Lua Scripting API](/engine/scripting) - Script integration
<!-- - [Creating Custom Systems](/engine/custom-systems) - Advanced guide -->
