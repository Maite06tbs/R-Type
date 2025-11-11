# Lua Scripting API

## Overview

The R-Type engine integrates **Lua scripting** to enable flexible, data-driven gameplay logic without recompilation. Scripts are attached to entities via the `Script` component and executed by the `ScriptSystem`.

## Architecture

### Script Component

```cpp
struct Script {
    std::string script_path;           // Path to .lua file
    sol::state lua_state;              // Lua VM instance
    sol::table entity_table;           // Entity reference in Lua
    bool initialized = false;
};
```

### ScriptSystem Integration

The `ScriptSystem` manages script lifecycle:

1. **Initialization**: Load script and call `init()`
2. **Update Loop**: Call `on_update(dt)` every frame
3. **Event Callbacks**: Call `on_damage()`, `on_death()` when triggered

---

## Lifecycle Callbacks

### init(self)

**Purpose**: Initialize entity state when spawned

**Called**: Once, when entity is created

**Example**:
```lua
function init(self)
    self.phase = 1
    self.pattern_timer = 0
    self.shoot_timer = 0
    
    print("Boss initialized at phase " .. self.phase)
end
```

**Use Cases**:
- Set initial internal state
- Configure behavior parameters
- Spawn helper entities

---

### on_update(self, dt)

**Purpose**: Execute per-frame logic

**Called**: Every frame (60 Hz in logic group)

**Parameters**:
- `self`: Entity table with API methods
- `dt`: Delta time since last frame (seconds)

**Example - Boss Phase System**:
```lua
function on_update(self, dt)
    local pos = self.entity:getPosition()
    local hp = self.entity:get_health()
    
    -- Phase transitions
    if hp < 66 and self.phase == 1 then
        self.phase = 2
        self.entity:setShieldActive(true)
        print("Phase 2: Shield activated!")
    elseif hp < 33 and self.phase == 2 then
        self.phase = 3
        print("Phase 3: Berserker mode!")
    end
    
    -- Movement pattern
    if self.phase == 1 then
        pattern_sine_wave(self, dt)
    elseif self.phase == 2 then
        pattern_circle(self, dt)
    else
        pattern_aggressive(self, dt)
    end
    
    -- Shooting logic
    self.shoot_timer = self.shoot_timer + dt
    if self.shoot_timer > 2.0 then
        shoot_spread(self)
        self.shoot_timer = 0
    end
end
```

**Common Patterns**:
- State machine (phases, modes)
- Timers and counters
- Movement algorithms
- Shooting patterns

---

### on_damage(self, damage, projectile_type)

**Purpose**: Handle damage events

**Called**: When entity takes damage from collision

**Parameters**:
- `damage`: Amount of damage dealt
- `projectile_type`: String ("simple", "spread", "laser", "charged")

**Return Value**:
- `true`: Reflect projectile (if shield active)
- `false`: Take damage normally

**Example - Shield Reflection**:
```lua
function on_damage(self, damage, projectile_type)
    local has_shield = self.entity:getShieldActive()
    
    if has_shield and projectile_type == "simple" then
        -- Reflect simple projectiles
        print("Shield reflected " .. projectile_type .. " projectile!")
        return true
    end
    
    if has_shield and projectile_type == "charged" then
        -- Charged shots penetrate shield
        self.entity:setShieldActive(false)
        print("Shield broken by charged shot!")
    end
    
    -- Take damage normally
    return false
end
```

**Use Cases**:
- Shield mechanics
- Damage reduction
- Counter-attacks
- Phase triggers

---

### on_death(self)

**Purpose**: Execute cleanup/final actions when entity dies

**Called**: Once, when HP reaches 0 (before DeathSystem cleanup)

**Example - Boss Meteorite Rain**:
```lua
function on_death(self)
    local pos = self.entity:getPosition()
    
    print("Boss defeated! Spawning meteorite rain...")
    
    -- Spawn 25 meteorites in circle pattern
    for i = 1, 25 do
        local angle = (i / 25) * 2 * math.pi
        local spawn_x = pos.x + math.cos(angle) * 800
        local spawn_y = -100  -- Above screen
        
        engine.spawn_from_archetype(
            "effects.meteorite",
            spawn_x,
            spawn_y
        )
    end
    
    -- Spawn explosion effect
    engine.spawn_from_archetype(
        "effects.boss_explosion",
        pos.x,
        pos.y
    )
end
```

**Use Cases**:
- Death animations
- Loot drops
- Spawn follow-up enemies
- Trigger level events

---

## Entity API

### Position & Movement

#### getPosition()

**Returns**: `{x: number, y: number}`

```lua
local pos = self.entity:getPosition()
print("Entity at (" .. pos.x .. ", " .. pos.y .. ")")
```

#### setPosition(x, y)

**Parameters**: `x: number, y: number`

```lua
self.entity:setPosition(960, 540)  -- Center screen
```

#### getVelocity()

**Returns**: `{dx: number, dy: number}`

```lua
local vel = self.entity:getVelocity()
if vel.dx < 0 then
    print("Moving left")
end
```

#### setVelocity(dx, dy)

**Parameters**: `dx: number, dy: number`

```lua
-- Move right at 200 units/sec
self.entity:setVelocity(200, 0)
```

**Example - Sine Wave Pattern**:
```lua
function pattern_sine_wave(self, dt)
    self.pattern_timer = self.pattern_timer + dt
    
    local base_speed = -150
    local amplitude = 100
    local frequency = 2.0
    
    local dy = amplitude * math.sin(self.pattern_timer * frequency)
    self.entity:setVelocity(base_speed, dy)
end
```

---

### Health & Shield

#### get_health()

**Returns**: `number` (current HP)

```lua
local hp = self.entity:get_health()
if hp < 50 then
    print("Low health!")
end
```

#### getShieldActive()

**Returns**: `boolean`

```lua
if self.entity:getShieldActive() then
    print("Shield is active")
end
```

#### setShieldActive(active)

**Parameters**: `active: boolean`

```lua
-- Activate shield
self.entity:setShieldActive(true)

-- Deactivate after 5 seconds
self.shield_timer = 5.0
```

**Example - Timed Shield**:
```lua
function on_update(self, dt)
    if self.entity:getShieldActive() then
        self.shield_timer = self.shield_timer - dt
        
        if self.shield_timer <= 0 then
            self.entity:setShieldActive(false)
            print("Shield depleted")
        end
    end
end
```

---

## Engine API

### Spawning

#### engine.spawn_from_archetype(archetype, x, y)

**Purpose**: Create entity from JSON archetype

**Parameters**:
- `archetype`: String path (e.g., "enemies.basic_enemy")
- `x`, `y`: Spawn position

**Returns**: Entity ID (number)

```lua
-- Spawn enemy at position
local enemy_id = engine.spawn_from_archetype(
    "enemies.sine_enemy",
    1920,  -- Right edge
    500    -- Middle height
)
```

**Archetype Paths**:
- `enemies.basic_enemy`
- `enemies.sine_enemy`
- `enemies.kamikaze`
- `bosses.fury_ship`
- `projectiles.simple_missile`
- `effects.explosion`
- `effects.meteorite`
- `powerups.speed_boost`

---

### Queries

#### engine.get_player_position()

**Returns**: `{x: number, y: number}` or `nil`

```lua
local player_pos = engine.get_player_position()
if player_pos then
    -- Calculate direction to player
    local pos = self.entity:getPosition()
    local dx = player_pos.x - pos.x
    local dy = player_pos.y - pos.y
    
    -- Normalize and apply speed
    local length = math.sqrt(dx*dx + dy*dy)
    local speed = 150
    
    self.entity:setVelocity(
        (dx / length) * speed,
        (dy / length) * speed
    )
end
```

**Use Case**: Homing/tracking behavior

---

## Complete Examples

### Example 1: Simple Enemy

```lua
-- Assets/scripts/basic_enemy.lua

function init(self)
    self.entity:setVelocity(-200, 0)  -- Move left
end

function on_update(self, dt)
    -- No special behavior, just move left
end

function on_damage(self, damage, projectile_type)
    return false  -- Take damage normally
end

function on_death(self)
    local pos = self.entity:getPosition()
    
    -- 20% chance to drop power-up
    if math.random() < 0.2 then
        engine.spawn_from_archetype(
            "powerups.speed_boost",
            pos.x,
            pos.y
        )
    end
end
```

---

### Example 2: Boss with Phases

```lua
-- Assets/scripts/fury_ship.lua

function init(self)
    self.phase = 1
    self.pattern_timer = 0
    self.shoot_timer = 0
    self.charge_timer = 0
    
    -- Phase 1: Center position
    self.center_x = 1300
    self.center_y = 540
    self.entity:setPosition(self.center_x, self.center_y)
end

function on_update(self, dt)
    local hp = self.entity:get_health()
    local pos = self.entity:getPosition()
    
    -- === PHASE TRANSITIONS === --
    if hp < 200 and self.phase == 1 then
        self.phase = 2
        self.entity:setShieldActive(true)
        print("[FURY_SHIP] Phase 2: Shield active, reflecting simple shots")
    elseif hp < 100 and self.phase == 2 then
        self.phase = 3
        self.entity:setShieldActive(false)
        print("[FURY_SHIP] Phase 3: Berserker mode!")
    end
    
    -- === MOVEMENT PATTERNS === --
    self.pattern_timer = self.pattern_timer + dt
    
    if self.phase == 1 then
        -- Vertical sine wave
        local amplitude = 200
        local frequency = 1.0
        local target_y = self.center_y + amplitude * math.sin(self.pattern_timer * frequency)
        
        local dy = (target_y - pos.y) * 2.0
        self.entity:setVelocity(0, dy)
        
    elseif self.phase == 2 then
        -- Circular motion
        local radius = 150
        local speed = 1.5
        local angle = self.pattern_timer * speed
        
        local target_x = self.center_x + math.cos(angle) * radius
        local target_y = self.center_y + math.sin(angle) * radius
        
        local dx = (target_x - pos.x) * 3.0
        local dy = (target_y - pos.y) * 3.0
        self.entity:setVelocity(dx, dy)
        
    else -- Phase 3
        -- Track player aggressively
        local player_pos = engine.get_player_position()
        if player_pos then
            local dx = player_pos.x - pos.x
            local dy = player_pos.y - pos.y
            self.entity:setVelocity(dx * 0.8, dy * 0.8)
        end
    end
    
    -- === SHOOTING PATTERNS === --
    self.shoot_timer = self.shoot_timer + dt
    
    if self.phase == 1 and self.shoot_timer > 2.0 then
        -- Simple shots
        shoot_simple(self)
        self.shoot_timer = 0
        
    elseif self.phase == 2 and self.shoot_timer > 1.5 then
        -- Spread pattern
        shoot_spread(self)
        self.shoot_timer = 0
        
    elseif self.phase == 3 then
        -- Rapid fire + charged shots
        if self.shoot_timer > 0.5 then
            shoot_simple(self)
            self.shoot_timer = 0
        end
        
        self.charge_timer = self.charge_timer + dt
        if self.charge_timer > 3.0 then
            shoot_charged(self)
            self.charge_timer = 0
        end
    end
end

function on_damage(self, damage, projectile_type)
    -- Phase 2/3: Reflect simple projectiles
    if self.phase >= 2 and self.entity:getShieldActive() and projectile_type == "simple" then
        print("[FURY_SHIP] Shield reflected simple projectile")
        return true
    end
    
    -- Charged shots break shield
    if projectile_type == "charged" and self.entity:getShieldActive() then
        self.entity:setShieldActive(false)
        print("[FURY_SHIP] Shield destroyed by charged shot!")
    end
    
    return false
end

function on_death(self)
    local pos = self.entity:getPosition()
    
    print("[FURY_SHIP] Boss defeated! Meteorite rain incoming...")
    
    -- Spawn 25 meteorites in circle
    for i = 1, 25 do
        local angle = (i / 25) * 2 * math.pi
        local spawn_x = pos.x + math.cos(angle) * 800
        local spawn_y = -100
        
        engine.spawn_from_archetype("effects.meteorite", spawn_x, spawn_y)
    end
    
    -- Explosion effect
    engine.spawn_from_archetype("effects.boss_explosion", pos.x, pos.y)
end

-- === HELPER FUNCTIONS === --

function shoot_simple(self)
    local pos = self.entity:getPosition()
    engine.spawn_from_archetype("projectiles.enemy_simple", pos.x - 50, pos.y)
end

function shoot_spread(self)
    local pos = self.entity:getPosition()
    for i = -2, 2 do
        local offset_y = i * 30
        engine.spawn_from_archetype("projectiles.enemy_simple", pos.x - 50, pos.y + offset_y)
    end
end

function shoot_charged(self)
    local pos = self.entity:getPosition()
    local player_pos = engine.get_player_position()
    
    if player_pos then
        -- Aim at player
        local dx = player_pos.x - pos.x
        local dy = player_pos.y - pos.y
        
        -- Spawn charged shot (implement in archetype)
        engine.spawn_from_archetype("projectiles.boss_charged", pos.x - 50, pos.y)
    end
end
```

---

## Archetype Integration

### Attaching Scripts

**JSON Configuration**:
```json
{
  "name": "fury_ship",
  "components": {
    "Position": {"x": 1300, "y": 540},
    "Velocity": {"dx": 0, "dy": 0},
    "Health": {"max_hp": 300, "hp": 300},
    "Sprite": {
      "texture": "fury_ship.png",
      "rect": {"x": 0, "y": 0, "width": 128, "height": 128}
    },
    "Script": {
      "script_path": "Assets/scripts/fury_ship.lua"
    },
    "BossTag": {},
    "EnemyTag": {}
  }
}
```

**Script Loading**:
1. Engine reads `script_path` from archetype
2. ScriptSystem loads `.lua` file into `sol::state`
3. Calls `init(self)` on first frame
4. Subsequent frames call `on_update(self, dt)`

---

## Best Practices

### State Management

Use `self` table for persistent state:
```lua
function init(self)
    self.state = "IDLE"
    self.timers = {
        shoot = 0,
        pattern = 0,
        ability = 0
    }
end

function on_update(self, dt)
    -- Update all timers
    for name, value in pairs(self.timers) do
        self.timers[name] = value + dt
    end
    
    -- State machine
    if self.state == "IDLE" then
        update_idle(self, dt)
    elseif self.state == "ATTACKING" then
        update_attacking(self, dt)
    end
end
```

### Debugging

```lua
function on_update(self, dt)
    -- Debug position
    if DEBUG then
        local pos = self.entity:getPosition()
        print("[DEBUG] Position: " .. pos.x .. ", " .. pos.y)
    end
    
    -- Validate state
    assert(self.phase >= 1 and self.phase <= 3, "Invalid phase: " .. self.phase)
end
```

---

## Limitations

### Current Restrictions

- No direct registry access
- Cannot create components from Lua
- Cannot destroy other entities
- No file I/O from scripts
- No network access

### Workarounds

**Creating entities**: Use `engine.spawn_from_archetype()`

**Destroying entities**: Set HP to 0 (triggers DeathSystem)

**Inter-entity communication**: Use global state (limited)

---

## Troubleshooting

### Script Not Running

**Check**:
1. `script_path` is correct in archetype JSON
2. `.lua` file exists in `Assets/scripts/`
3. No syntax errors (check console)
4. Entity has `Script` component

### API Function Undefined

**Error**: `attempt to call nil value 'getPosition'`

**Solution**: Ensure entity has required components
```lua
function on_update(self, dt)
    -- Check if position exists
    local pos = self.entity:getPosition()
    if not pos then
        print("ERROR: Entity has no Position component!")
        return
    end
end
```

### Performance Issues

**Symptom**: Low FPS, stuttering

**Solutions**:
1. Reduce `on_update()` frequency with timers
2. Cache expensive calculations
3. Avoid spawning too many entities per frame

---

## Next Steps

- [Systems Reference](/engine/systems) - How ScriptSystem works
- [Game Engine Overview](/engine/overview) - ECS architecture
- [Server Architecture](/server/architecture) - Scripts in multiplayer
- [Client Architecture](/client/architecture) - Script execution flow
