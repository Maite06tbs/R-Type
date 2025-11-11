# Network Protocol

## Overview

R-Type uses a **custom UDP protocol** for low-latency multiplayer communication between clients and the authoritative server.

## Protocol Design

### Why UDP?

| Feature | UDP | TCP | Our Choice |
|---------|-----|-----|------------|
| **Latency** | Low (~5-20ms) | Higher (~20-50ms) | UDP |
| **Ordered Delivery** | No | Yes | Not needed (snapshots obsolete quickly) |
| **Reliability** | Fire-and-forget | Guaranteed | Not needed (next snapshot overwrites) |
| **Overhead** | Minimal | High (ACKs, retries) | UDP |
| **Real-time** | Excellent | Poor (head-of-line blocking) | UDP |

**Verdict**: UDP is ideal for real-time games where latest state > guaranteed delivery.

---

## Packet Structure

### Header Format

All packets start with a 1-byte type identifier:

```cpp
struct PacketHeader {
    uint8_t type;  // Packet type (0-4)
};
```

**Packet Types**:
```cpp
enum class PacketType : uint8_t {
    JOIN = 0,      // Client → Server: Request to join game
    ACK = 1,       // Server → Client: Confirm join with player_id
    INPUT = 2,     // Client → Server: Player input
    SNAPSHOT = 3,  // Server → Client: Full game state
    LEAVE = 4      // Client → Server: Disconnect notification
};
```

---

## Packet Specifications

### 1. JOIN Packet (Client → Server)

**Purpose**: Client requests to join a game room

**Structure**:
```cpp
struct JoinPacket {
    uint8_t type = 0;        // PacketType::JOIN
    char player_name[32];    // Player name (null-terminated, future use)
    uint8_t padding[31];     // Reserved for future use
};
// Total size: 64 bytes
```

**Example**:
```cpp
JoinPacket packet;
packet.type = 0;
strncpy(packet.player_name, "Player1", sizeof(packet.player_name));

socket.send_to(buffer(&packet, sizeof(packet)), server_endpoint);
```

**Server Response**: ACK packet with assigned `player_id`

---

### 2. ACK Packet (Server → Client)

**Purpose**: Confirm client has joined, provide player_id

**Structure**:
```cpp
struct AckPacket {
    uint8_t type = 1;        // PacketType::ACK
    uint8_t player_id;       // Assigned ID (0-3)
    uint16_t room_id;        // Room number
    uint32_t server_tick;    // Current server frame number
};
// Total size: 8 bytes
```

**Example**:
```cpp
AckPacket ack;
ack.type = 1;
ack.player_id = 0;  // You are player 0
ack.room_id = 42;   // You joined room #42
ack.server_tick = 12345;

socket.send_to(buffer(&ack, sizeof(ack)), client_endpoint);
```

**Client Action**: Store `player_id` for future INPUT packets

---

### 3. INPUT Packet (Client → Server)

**Purpose**: Send player input to server

**Structure**:
```cpp
struct InputPacket {
    uint8_t type = 2;        // PacketType::INPUT
    uint8_t player_id;       // Your player ID (from ACK)
    uint8_t keys;            // Input bitfield
    uint8_t padding;         // Reserved
    uint32_t sequence;       // Sequence number (optional, for client prediction)
};
// Total size: 8 bytes
```

**Keys Bitfield** (1 byte):
```cpp
// Bit mapping:
// 7 6 5 4 3 2 1 0
// | | | | | | | |
// | | | | | | | └─ UP (0x01)
// | | | | | | └─── DOWN (0x02)
// | | | | | └───── LEFT (0x04)
// | | | | └─────── RIGHT (0x08)
// | | | └───────── SHOOT (0x10)
// | | └─────────── FORCE_TOGGLE (0x20)
// | └───────────── Reserved
// └─────────────── Reserved
```

**Encoding Example**:
```cpp
uint8_t encode_input() {
    uint8_t keys = 0;
    
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))    keys |= 0x01;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))  keys |= 0x02;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))  keys |= 0x04;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right)) keys |= 0x08;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Space)) keys |= 0x10;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::F))     keys |= 0x20;
    
    return keys;
}
```

**Decoding Example** (Server-side):
```cpp
void apply_input(uint8_t keys, Entity player) {
    auto& vel = registry.get_component<Velocity>(player);
    
    vel.dx = 0;
    vel.dy = 0;
    
    if (keys & 0x01) vel.dy = -300;  // UP
    if (keys & 0x02) vel.dy = +300;  // DOWN
    if (keys & 0x04) vel.dx = -300;  // LEFT
    if (keys & 0x08) vel.dx = +300;  // RIGHT
    
    if (keys & 0x10) {  // SHOOT
        auto& shoot = registry.get_component<PlayerShootingComponent>(player);
        shoot.trigger_shoot = true;
    }
    
    if (keys & 0x20) {  // FORCE_TOGGLE
        auto& force = registry.get_component<ForceControlComponent>(player);
        force.toggle_force = true;
    }
}
```

**Sending Frequency**: Every frame (~60 Hz)

---

### 4. SNAPSHOT Packet (Server → Client)

**Purpose**: Send full game state to all clients

**Structure**:
```cpp
struct SnapshotPacket {
    uint8_t type = 3;            // PacketType::SNAPSHOT
    uint8_t padding;
    uint16_t entity_count;       // Number of entities in this snapshot
    uint32_t frame_number;       // Server tick number
    EntitySnapshot entities[];   // Variable-length array
};
```

**EntitySnapshot**:
```cpp
struct EntitySnapshot {
    uint32_t entity_id;          // Entity identifier
    float x, y;                  // Position
    uint8_t sprite_id;           // Visual representation
    uint8_t animation_frame;     // Current frame (0-255)
    uint16_t health;             // HP (0 = no health component)
    uint8_t entity_type;         // 0=player, 1=enemy, 2=projectile, 3=powerup
    uint8_t padding;
};
// Size: 20 bytes per entity
```

**Full Packet Size**:
```
Header: 8 bytes
Entities: 20 bytes × entity_count

Example (50 entities): 8 + (20 × 50) = 1008 bytes
```

**Serialization Example**:
```cpp
SnapshotPacket create_snapshot(Registry& registry) {
    SnapshotPacket packet;
    packet.type = 3;
    packet.frame_number = current_frame++;
    packet.entity_count = 0;
    
    auto& positions = registry.get_components<Position>();
    auto& sprites = registry.get_components<Sprite>();
    auto& healths = registry.get_components<Health>();
    
    for (size_t id = 0; id < positions.size(); ++id) {
        if (!positions[id]) continue;
        
        EntitySnapshot& e = packet.entities[packet.entity_count++];
        e.entity_id = id;
        e.x = positions[id]->x;
        e.y = positions[id]->y;
        
        if (sprites[id]) {
            e.sprite_id = sprites[id]->texture_id;
            e.animation_frame = sprites[id]->current_frame;
        }
        
        if (healths[id]) {
            e.health = healths[id]->hp;
        } else {
            e.health = 0;
        }
    }
    
    return packet;
}
```

**Deserialization Example** (Client):
```cpp
void apply_snapshot(const SnapshotPacket& packet) {
    // Clear render registry
    render_registry.clear();
    
    // Recreate entities
    for (uint16_t i = 0; i < packet.entity_count; ++i) {
        const EntitySnapshot& data = packet.entities[i];
        
        Entity e = render_registry.create_entity();
        
        render_registry.add_component<Position>(e, data.x, data.y);
        render_registry.add_component<Sprite>(e, textures[data.sprite_id]);
        
        if (data.animation_frame > 0) {
            auto& sprite = render_registry.get_component<Sprite>(e);
            sprite.current_frame = data.animation_frame;
        }
        
        if (data.health > 0) {
            render_registry.add_component<Health>(e, data.health);
        }
    }
}
```

**Sending Frequency**: Every server tick (~60 Hz)

---

### 5. LEAVE Packet (Client → Server)

**Purpose**: Notify server of graceful disconnect

**Structure**:
```cpp
struct LeavePacket {
    uint8_t type = 4;        // PacketType::LEAVE
    uint8_t player_id;       // Your player ID
    uint16_t padding;
};
// Total size: 4 bytes
```

**Example**:
```cpp
LeavePacket packet;
packet.type = 4;
packet.player_id = my_player_id;

socket.send_to(buffer(&packet, sizeof(packet)), server_endpoint);
```

**Server Action**: Remove player from room, potentially end game if last player

---

## Communication Flow

### Initial Connection

```
Client                                Server
  │                                      │
  ├─────────── JOIN ───────────────────>│
  │            (name="Player1")          │
  │                                      │ 1. Find/create room
  │                                      │ 2. Assign player_id=0
  │                                      │
  <─────────── ACK ─────────────────────┤
  │            (player_id=0, room=42)    │
  │                                      │
  └─── Connection established ───────────┘
```

---

### Gameplay Loop

```
Client                                Server
  │                                      │
  ├─────────── INPUT ──────────────────>│
  │            (keys=0b00010001)         │ 1. Apply to player 0
  │                                      │ 2. Update physics
  ├─────────── INPUT ──────────────────>│ 3. Check collisions
  │            (keys=0b00010000)         │ 4. Execute systems
  │                                      │ 5. Generate snapshot
  │                                      │
  <─────────── SNAPSHOT ────────────────┤
  │            (50 entities, frame=123)  │ 1. Deserialize
  │                                      │ 2. Render
  <─────────── SNAPSHOT ────────────────┤
  │            (52 entities, frame=124)  │
  │                                      │
```

**Rate**: ~60 packets/sec (both directions)

---

### Disconnection

```
Client                                Server
  │                                      │
  ├─────────── LEAVE ──────────────────>│
  │            (player_id=0)             │ 1. Remove player 0
  │                                      │ 2. If room empty, destroy
  │                                      │ 3. Otherwise, continue game
  │                                      │
  └─── Connection closed ────────────────┘
```

**Alternative**: Timeout (30s no INPUT → auto-kick)

---

## Optimizations

### 1. Snapshot Delta Compression (Future)

**Problem**: Sending full state every frame is wasteful

**Solution**: Only send changed entities

```cpp
struct DeltaSnapshot {
    uint8_t type = 3;
    uint32_t frame_number;
    uint16_t changed_count;        // Only entities that changed
    EntityDelta changes[];
};

struct EntityDelta {
    uint32_t entity_id;
    uint8_t changed_fields;        // Bitfield: 0x01=pos, 0x02=sprite, 0x04=health
    float x, y;                    // Only if changed_fields & 0x01
    uint8_t sprite_id;             // Only if changed_fields & 0x02
    uint16_t health;               // Only if changed_fields & 0x04
};
```

**Benefits**: Reduce bandwidth by 80-90%

---

### 2. Position Quantization

**Problem**: Floats use 4 bytes, excessive precision

**Solution**: Use 16-bit integers (range 0-65535)

```cpp
uint16_t quantize_x(float x) {
    return static_cast<uint16_t>((x / 1920.0f) * 65535.0f);
}

float dequantize_x(uint16_t qx) {
    return (qx / 65535.0f) * 1920.0f;
}
```

**Savings**: 8 bytes → 4 bytes per entity position

---

### 3. Culling Off-Screen Entities

**Problem**: Sending entities outside view is wasteful

**Solution**: Only snapshot visible entities

```cpp
bool is_visible(const Position& pos) {
    const float MARGIN = 200.0f;
    return pos.x > -MARGIN && pos.x < 1920 + MARGIN &&
           pos.y > -MARGIN && pos.y < 1080 + MARGIN;
}

void create_snapshot() {
    for (auto& pos : positions) {
        if (is_visible(pos)) {
            add_to_snapshot(pos);
        }
    }
}
```

**Savings**: Typical 100 entities → 20-30 visible

---

### 4. Input Aggregation

**Problem**: Sending 60 INPUT packets/sec is redundant

**Solution**: Send only when input changes

```cpp
uint8_t last_keys = 0;

void send_input_if_changed() {
    uint8_t current_keys = encode_input();
    
    if (current_keys != last_keys) {
        send_input_packet(current_keys);
        last_keys = current_keys;
    }
}
```

**Savings**: 60 packets/sec → 5-10 packets/sec

---

## Reliability Strategies

### Handling Packet Loss

**Assumption**: 1-5% packet loss is acceptable

**Strategies**:

1. **Snapshots**: If lost, next one overwrites anyway
2. **Inputs**: Server uses last known state if missed
3. **JOIN/LEAVE**: Retry with exponential backoff

**Example (JOIN retry)**:
```cpp
void send_join_with_retry() {
    const int MAX_RETRIES = 5;
    int delay_ms = 100;
    
    for (int i = 0; i < MAX_RETRIES; ++i) {
        send_join_packet();
        
        if (wait_for_ack(delay_ms)) {
            return;  // Success
        }
        
        delay_ms *= 2;  // Exponential backoff
    }
    
    throw ConnectionTimeoutException();
}
```

---

### Out-of-Order Packets

**Problem**: UDP doesn't guarantee order

**Solution**: Use frame numbers

```cpp
uint32_t last_received_frame = 0;

void handle_snapshot(const SnapshotPacket& packet) {
    if (packet.frame_number <= last_received_frame) {
        return;  // Discard old snapshot
    }
    
    apply_snapshot(packet);
    last_received_frame = packet.frame_number;
}
```

---

## Security Considerations

### Rate Limiting

**Problem**: Malicious client spams packets

**Solution**: Server-side rate limiter

```cpp
struct RateLimiter {
    std::map<ClientEndpoint, int> packet_counts;
    std::chrono::steady_clock::time_point last_reset;
    
    bool allow(ClientEndpoint endpoint) {
        auto now = std::chrono::steady_clock::now();
        
        // Reset every second
        if (now - last_reset > std::chrono::seconds(1)) {
            packet_counts.clear();
            last_reset = now;
        }
        
        if (++packet_counts[endpoint] > 100) {
            // Ban client (log IP, drop packets)
            return false;
        }
        
        return true;
    }
};
```

---

### Input Validation

**Problem**: Malicious client sends invalid data

**Solution**: Sanitize all inputs

```cpp
void validate_input(const InputPacket& packet) {
    // Check player_id is in valid range
    if (packet.player_id > 3) {
        throw std::invalid_argument("Invalid player_id");
    }
    
    // Ensure only defined bits are set
    if (packet.keys & 0b11000000) {
        throw std::invalid_argument("Invalid key bits");
    }
}
```

---

### Anti-Cheat

**Server Authority**: All logic runs server-side

**Impossible Cheats**:
- Speed hacks (server controls movement)
- Wall hacks (server validates collisions)
- Teleportation (server owns position)
- Infinite HP (server manages health)

**Possible Exploits**:
- Input injection (send fake inputs)
- Packet flooding (DDoS)

**Mitigations**:
- Rate limiting (100 packets/sec max)
- Input validation (sanitize bitfields)
- IP banning (repeat offenders)

---

## Performance Metrics

### Bandwidth Usage

**Per Client**:
- **Outgoing** (INPUT): 8 bytes × 60 Hz = 480 bytes/sec (~4 Kbps)
- **Incoming** (SNAPSHOT): ~1000 bytes × 60 Hz = 60 KB/sec (~480 Kbps)

**Per Server** (4 players):
- **Incoming**: 4 × 480 bytes/sec = 1.9 KB/sec (~15 Kbps)
- **Outgoing**: 4 × 60 KB/sec = 240 KB/sec (~1.9 Mbps)

**Conclusion**: Modest bandwidth requirements (< 2 Mbps)

---

### Latency Analysis

**Round-Trip Time (RTT)**:
```
Client Input → Server → Snapshot → Client Render
    5ms         10ms       5ms          16ms (60 FPS)
Total: ~36ms perceived latency
```

**Factors**:
- **Network ping**: 5-20ms (LAN), 50-100ms (Internet)
- **Server tick**: 16ms (60 Hz)
- **Render delay**: 16ms (60 FPS)

**Target**: < 100ms total latency

---

## Testing Tools

### Packet Inspector

```bash
# Capture UDP traffic
sudo tcpdump -i any -n udp port 4242 -X

# Example output:
# 0x0000:  4500 003c 1c46 4000 4011 b1e6 7f00 0001
# 0x0010:  7f00 0001 c350 1092 0028 fe3b 0200 0011  # Type=2 (INPUT)
# 0x0020:  0000 007b 0000 0000 0000 0000 0000 0000
```

---

### Network Simulator

**Simulate packet loss**:
```bash
# Linux: Add 5% packet loss
sudo tc qdisc add dev lo root netem loss 5%

# Test client under packet loss
./rtype_client --server 127.0.0.1:4242

# Remove simulation
sudo tc qdisc del dev lo root
```

**Simulate latency**:
```bash
# Add 50ms delay
sudo tc qdisc add dev lo root netem delay 50ms

# Test high-latency scenario
./rtype_client --server 127.0.0.1:4242
```

---

## Debugging

### Packet Logging

**Client-side**:
```cpp
void log_packet(const char* direction, const void* data, size_t size) {
    std::cout << direction << " packet (" << size << " bytes): ";
    
    const uint8_t* bytes = static_cast<const uint8_t*>(data);
    for (size_t i = 0; i < std::min(size, 16); ++i) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') 
                  << static_cast<int>(bytes[i]) << " ";
    }
    std::cout << std::dec << std::endl;
}

// Usage
socket.send(data, size);
log_packet("SENT", data, size);
```

**Output**:
```
SENT packet (8 bytes): 02 00 11 00 00 00 7b 00
                       ^^type=INPUT, player_id=0, keys=0x11
```

---

## Future Enhancements

### Planned Improvements

- [ ] **Delta Compression**: Reduce snapshot size by 80%
- [ ] **Client Prediction**: Reduce perceived input lag
- [ ] **Lag Compensation**: Server-side rollback for fairness
- [ ] **Encryption**: TLS/DTLS for secure communication
- [ ] **IPv6 Support**: Dual-stack networking
- [ ] **WebRTC**: Browser-based clients

---

## Troubleshooting

### Common Issues

**"Snapshots arriving out of order"**:
- Check frame numbers in logs
- Verify `last_received_frame` logic
- Acceptable for UDP, discard old frames

**"High packet loss (> 10%)"**:
- Check network quality: `ping -c 100 server_ip`
- Verify no firewall drops
- Consider TCP fallback (future)

**"Client desyncs from server"**:
- Ensure client doesn't run game logic
- Verify snapshot application is correct
- Check for race conditions in rendering

---

<!-- ## Next Steps

- [Server Architecture](/server/architecture) - Server implementation
- [Client Architecture](/client/architecture) - Client networking
- [Game Engine](/engine/overview) - Shared ECS systems -->
