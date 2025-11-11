# Server Architecture

## Overview

The R-Type server is an **authoritative game server** built on UDP networking with a room-based multiplayer system.

## Design Philosophy

### Authoritative Server Model

The server holds the **single source of truth** for game state:

- **Server executes all game logic**: No client-side prediction
- **Clients send inputs only**: Movement, shooting, Force toggle
- **Server broadcasts snapshots**: Full game state to all players
- **Server validates all actions**: Anti-cheat built-in

###

 Benefits

| Benefit | Description |
|---------|-------------|
| **Security** | Prevents cheating (speed hacks, wall hacks) |
| **Consistency** | All players see the same game state |
| **Simplicity** | Clients are thin rendering layers |
| **Scalability** | Easy to add spectator mode, replays |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  ServerApplication                       │
│  - Manages Boost.Asio IO context                        │
│  - Owns UDPListener (network layer)                     │
│  - Owns RoomManager (game rooms)                        │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
  ┌──────▼────────┐      ┌──────▼────────┐
  │  UDPListener  │      │  RoomManager  │
  │               │      │               │
  │ - Receives    │      │ - Creates     │
  │   JOIN        │      │   rooms       │
  │ - Receives    │      │ - Assigns     │
  │   INPUT       │      │   players     │
  │ - Sends ACK   │      │ - Manages     │
  │ - Sends       │      │   lifecycle   │
  │   SNAPSHOT    │      └───────┬───────┘
  └───────────────┘              │
                         ┌───────▼────────┐
                         │     Room       │
                         │                │
                         │ ┌────────────┐ │
                         │ │GameEngine  │ │
                         │ │   (ECS)    │ │
                         │ ├────────────┤ │
                         │ │ Registry   │ │
                         │ │ Systems    │ │
                         │ │ LevelMgr   │ │
                         │ └────────────┘ │
                         │                │
                         │ Players: 1-4   │
                         └────────────────┘
```

---

## Core Components

### 1. ServerApplication

**Responsibility**: Main server entry point

```cpp
class ServerApplication {
    boost::asio::io_context io_context;
    std::unique_ptr<UDPListener> listener;
    std::unique_ptr<RoomManager> room_manager;
};
```

**Lifecycle**:
```cpp
int main() {
    ServerApplication server;
    server.start(4242);  // Listen on port 4242
    server.run();        // Event loop
}
```

**Configuration**:
- Port: 4242 (default)
- Max rooms: Unlimited
- Players per room: 4

---

### 2. UDPListener

**Responsibility**: Network packet handling

**Protocol**:
```cpp
enum class PacketType {
    JOIN = 0,      // Client requests to join
    ACK = 1,       // Server confirms join
    INPUT = 2,     // Client sends input
    SNAPSHOT = 3,  // Server sends state
    LEAVE = 4      // Client disconnects
};
```

**Packet Flow**:

```
Client                    Server
  │                         │
  ├─────── JOIN ────────────>
  │                         │ Create/assign room
  <──────── ACK ────────────┤ player_id=0
  │                         │
  ├─────── INPUT ──────────> Update player 0
  ├─────── INPUT ──────────> Update player 0
  │                         │
  <─────── SNAPSHOT ────────┤ Full game state
  <─────── SNAPSHOT ────────┤ Full game state
  │                         │
```

**Receive Loop**:
```cpp
void UDPListener::receive_loop() {
    while (running) {
        auto [data, remote] = receive_from();
        
        PacketType type = parse_header(data);
        
        switch (type) {
            case JOIN:
                handle_join(data, remote);
                break;
            case INPUT:
                handle_input(data, remote);
                break;
            case LEAVE:
                handle_leave(remote);
                break;
        }
    }
}
```

---

### 3. RoomManager

**Responsibility**: Multiplayer room lifecycle

**Features**:
- Dynamic room creation
- Player assignment
- Room cleanup when empty

**API**:
```cpp
class RoomManager {
    Room* find_available_room();
    Room* create_room();
    void assign_player(Room*, ClientEndpoint);
    void remove_player(ClientEndpoint);
};
```

**Room States**:
- **WAITING**: < 4 players, accepting joins
- **ACTIVE**: 1-4 players, game running
- **FINISHED**: Game ended, cleanup pending

---

### 4. Room

**Responsibility**: Independent game instance

```cpp
class Room {
    GameEngine game_engine;
    std::map<ClientEndpoint, uint8_t> players;  // endpoint -> player_id
    bool is_running;
};
```

**Game Loop** (60 Hz):
```cpp
void Room::update(float dt) {
    // 1. Update all systems
    game_engine.update_systems("logic", dt);
    game_engine.update_systems("physics", dt);
    
    // 2. Snapshot game state
    Snapshot state = serialize_state();
    
    // 3. Send to all players
    for (auto& [endpoint, player_id] : players) {
        send_snapshot(endpoint, state);
    }
}
```

---

## Game Engine (Server-Side)

### Systems Executed

**Logic Group (60 Hz)**:
- `PlayerControlSystem`: Apply player inputs
- `PlayerShootingSystem`: Handle weapon fire
- `AISystem`: Enemy behavior
- `EnemyShootingSystem`: Enemy weapons
- `WeaponSystem`: Projectile spawning
- `PowerUpSystem`: Collectibles
- `ScriptSystem`: Boss/enemy Lua scripts
- `LifespanSystem`: Timed entities
- `DeathSystem`: Entity cleanup

**Physics Group (60 Hz)**:
- `MovementSystem`: Position updates
- `CollisionSystem`: Collision detection
- `ForceSystem`: Force companion
- `ForceControlSystem`: Force toggle
- `ForceCollisionSystem`: Force collisions
- `OffScreenDeathSystem`: Boundary cleanup

**No Rendering**: Server runs headless (no graphics)

---

## Network Protocol

### Packet Structures

#### JOIN Packet
```cpp
struct JoinPacket {
    uint8_t type = 0;        // JOIN
    char player_name[32];    // Future use
};
```

#### ACK Packet
```cpp
struct AckPacket {
    uint8_t type = 1;        // ACK
    uint8_t player_id;       // 0-3
    uint16_t room_id;        // Room identifier
};
```

#### INPUT Packet
```cpp
struct InputPacket {
    uint8_t type = 2;        // INPUT
    uint8_t player_id;       // 0-3
    uint8_t keys;            // Bitfield:
                             // bit 0: UP
                             // bit 1: DOWN
                             // bit 2: LEFT
                             // bit 3: RIGHT
                             // bit 4: SHOOT
                             // bit 5: FORCE_TOGGLE
};
```

**Input Encoding**:
```cpp
uint8_t encode_input(bool up, bool down, bool left, 
                     bool right, bool shoot, bool force) {
    return (up << 0) | (down << 1) | (left << 2) | 
           (right << 3) | (shoot << 4) | (force << 5);
}
```

#### SNAPSHOT Packet
```cpp
struct SnapshotPacket {
    uint8_t type = 3;        // SNAPSHOT
    uint32_t frame_number;   // Sequence number
    uint16_t entity_count;   // Number of entities
    Entity entities[];       // Serialized entities
};

struct Entity {
    uint32_t id;
    float x, y;              // Position
    float dx, dy;            // Velocity (optional)
    uint8_t sprite_id;       // Visual representation
    uint8_t frame;           // Animation frame
    uint16_t health;         // HP (if applicable)
};
```

**Compression**:
- Position: 4 bytes (2x int16) instead of 8 bytes (2x float)
- Velocity: Omit if zero
- Only send visible entities (on-screen + margin)

---

## Input Processing

### Client Input Flow

```
Client Presses "UP"
       │
       ▼
Encode: keys = 0b000001
       │
       ▼
Send INPUT packet
       │
       ▼
Server receives
       │
       ▼
Lookup player_id → entity_id
       │
       ▼
PlayerControlSystem reads keys
       │
       ▼
Set velocity.dy = -300
       │
       ▼
MovementSystem updates position
       │
       ▼
SNAPSHOT sent to all clients
```

### Input Buffering

**Problem**: Packets arrive at variable times

**Solution**: Input queue per player
```cpp
struct PlayerInput {
    uint32_t frame;
    uint8_t keys;
};

std::queue<PlayerInput> player_inputs[4];
```

**Processing**:
```cpp
void process_inputs() {
    for (int i = 0; i < 4; ++i) {
        if (!player_inputs[i].empty()) {
            auto input = player_inputs[i].front();
            apply_input(i, input.keys);
            player_inputs[i].pop();
        }
    }
}
```

---

## State Synchronization

### Snapshot Generation

```cpp
Snapshot Room::generate_snapshot() {
    Snapshot snap;
    snap.frame = current_frame++;
    
    auto& positions = registry.get_components<Position>();
    auto& sprites = registry.get_components<Sprite>();
    auto& healths = registry.get_components<Health>();
    
    for (size_t i = 0; i < positions.size(); ++i) {
        if (!positions[i]) continue;
        
        EntitySnapshot e;
        e.id = i;
        e.x = positions[i]->x;
        e.y = positions[i]->y;
        
        if (sprites[i]) {
            e.sprite_id = sprites[i]->texture_id;
            e.frame = sprites[i]->current_frame;
        }
        
        if (healths[i]) {
            e.health = healths[i]->hp;
        }
        
        snap.entities.push_back(e);
    }
    
    return snap;
}
```

### Snapshot Frequency

- **Full Snapshot**: Every 16ms (60 Hz)
- **Delta Snapshot**: Only changed entities (future)
- **Reliability**: UDP (fire-and-forget)

**Why No TCP?**:
- Lower latency
- Out-of-order packets acceptable
- Old snapshots can be discarded

---

## Level Management

### Level Loading

Levels defined in `Config/levels/level_1.json`:

```json
{
  "events": [
    {"time": 0.0, "action": "SPAWN", "archetype": "enemies.basic_enemy", "pos": [1920, 300]},
    {"time": 2.0, "action": "SPAWN", "archetype": "enemies.sine_enemy", "pos": [1920, 500]},
    {"time": 15.0, "action": "SPAWN", "archetype": "bosses.fury_ship", "pos": [1300, 300]}
  ]
}
```

**LevelManager** executes events based on game time:
```cpp
void LevelManager::update(float dt) {
    current_time += dt;
    
    while (!events.empty() && events.front().time <= current_time) {
        execute_event(events.front());
        events.pop();
    }
}
```

---

## Performance Optimization

### Server-Side Optimizations

1. **Headless Mode**: No rendering = 10x CPU savings
2. **Fixed Timestep**: Deterministic 60 Hz updates
3. **Sparse Arrays**: Cache-friendly component access
4. **Lazy Serialization**: Only serialize visible entities

### Scalability

**Current**: Single-threaded, ~10 rooms/server

**Future**:
- Thread pool for rooms (1 thread per room)
- Distributed servers (room sharding)
- Redis for state persistence

---

## Error Handling

### Disconnection Handling

```cpp
void Room::handle_player_disconnect(uint8_t player_id) {
    // 1. Mark player entity as AI-controlled
    set_ai_control(player_id);
    
    // 2. Remove from player list
    players.erase(player_id);
    
    // 3. If empty, mark room for cleanup
    if (players.empty()) {
        room_manager.schedule_cleanup(this);
    }
}
```

### Packet Loss

**Strategy**: Accept loss, send next snapshot

- Old snapshots are obsolete anyway
- Client interpolates missing frames
- No retry mechanism needed

---

## Configuration

### Server Settings

**Environment Variables**:
```bash
export RTYPE_SERVER_PORT=4242
export RTYPE_MAX_ROOMS=100
export RTYPE_LOG_LEVEL=INFO
```

**Runtime Config** (`server_config.json`):
```json
{
  "port": 4242,
  "tick_rate": 60,
  "max_players_per_room": 4,
  "timeout_seconds": 30,
  "enable_logging": true
}
```

---

## Deployment

### Running the Server

```bash
# Build
make -C Server

# Run
./Server/rtype_server --port 4242 --log-level INFO

# Docker
docker run -p 4242:4242/udp rtype-server
```

### Monitoring

**Metrics**:
- Active rooms
- Players connected
- Packets/second
- Average tick time

**Logging**:
```
[INFO] Server started on port 4242
[INFO] Room #1 created
[INFO] Player 127.0.0.1:5000 joined room #1 as player 0
[DEBUG] Room #1 tick: 15.3ms
[INFO] Player 127.0.0.1:5000 disconnected
```

---

## Security Considerations

### Rate Limiting

```cpp
struct RateLimiter {
    std::map<ClientEndpoint, int> packet_counts;
    
    bool allow(ClientEndpoint endpoint) {
        if (++packet_counts[endpoint] > 100) {  // 100 packets/sec max
            return false;
        }
        return true;
    }
};
```

### Input Validation

```cpp
void validate_input(InputPacket& packet) {
    // Ensure player_id is valid
    if (packet.player_id > 3) {
        throw std::invalid_argument("Invalid player ID");
    }
    
    // Sanitize keys bitfield
    packet.keys &= 0b00111111;  // Only 6 bits used
}
```

---

## Future Enhancements

### Planned Features

- [ ] **Client-side Prediction**: Reduce input lag
- [ ] **Delta Compression**: Smaller snapshots
- [ ] **Replay System**: Record full games
- [ ] **Spectator Mode**: Watch ongoing games
- [ ] **Matchmaking**: Automatic player pairing
- [ ] **Persistent Leaderboards**: High score tracking

---

## Troubleshooting

### Common Issues

**"Port already in use"**:
```bash
sudo lsof -i :4242
kill -9 <PID>
```

**"No rooms available"**:
- Check max_rooms setting
- Verify room cleanup is working

**High CPU usage**:
- Profile with `perf` or `gprof`
- Check for infinite loops in scripts
- Reduce tick_rate if needed

---
<!-- 
## Next Steps

- [Client Architecture](/client/overview) - How clients connect
- [Network Protocol](/network/protocol) - Detailed packet specs
- [Game Engine](/engine/overview) - Shared ECS architecture -->
