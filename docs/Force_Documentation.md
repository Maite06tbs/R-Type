# 🔵 Documentation de la Force (R-Type)

## Qu'est-ce que la Force ?

La **Force** est la mécanique iconique de R-Type. C'est une **sphère orange indestructible** qui accompagne le vaisseau du joueur et offre protection et puissance de feu supplémentaire.

## 🎮 Utilisation en jeu

### Contrôles

- **F (Force)** : Activer/Désactiver la Force
  - Quand désactivée, la Force disparaît et ne tire pas
  - Quand activée, elle réapparaît dans son dernier état

- **T (Toggle)** : Cycle entre les états d'attachement
  - DETACHED → ATTACHED_FRONT → ATTACHED_BACK → DETACHED
  
- **L (Launch)** : Lancer la Force
  - Fonctionne uniquement quand attachée
  - La Force vole dans une direction pendant 2 secondes
  - Après le lancement, elle revient en mode DETACHED

### États de la Force

| État | Description | Comportement |
|------|-------------|--------------|
| **ATTACHED_FRONT** | Attachée à l'avant du vaisseau | Position fixe devant le joueur, tire automatiquement |
| **ATTACHED_BACK** | Attachée à l'arrière du vaisseau | Position fixe derrière le joueur, protège des attaques arrière |
| **DETACHED** | Flottante | Suit doucement le joueur, tire automatiquement |
| **LAUNCHED** | Lancée | Vole en ligne droite, inflige des dégâts massifs au contact |

### Capacités

1. **Protection** 🛡️
   - Absorbe TOUS les projectiles ennemis qui la touchent
   - Les projectiles sont détruits sans blesser le joueur
   - Indestructible

2. **Attaque de contact** ⚔️
   - Inflige 10 dégâts/frame aux ennemis au contact
   - Très efficace contre les petits ennemis

3. **Tir automatique** 🔫
   - Tire des lasers toutes les 0.15 secondes
   - 15 dégâts par laser
   - Fonctionne dans tous les états

## 🔧 Implémentation Technique

### Composants ajoutés

#### `Force` (Component.hpp)
```cpp
struct Force {
    size_t owner_entity;      // L'entité du joueur propriétaire
    ForceState state;         // État actuel (ATTACHED_FRONT, etc.)
    float offset_x, offset_y; // Position relative quand attachée
    float launch_speed;       // Vitesse de lancement
    float launch_duration;    // Temps restant en vol
    bool auto_fire;           // Tire automatiquement
    float fire_rate;          // Cadence de tir
    float fire_timer;         // Cooldown
};
```

#### `ForceTag` (Component.hpp)
Tag simple pour identifier une entité Force.

#### `ForceState` (Enum)
```cpp
enum class ForceState {
    ATTACHED_FRONT,   // Devant le vaisseau
    ATTACHED_BACK,    // Derrière le vaisseau
    DETACHED,         // Flottante
    LAUNCHED          // Lancée
};
```

### Systèmes créés

#### `ForceSystem.hpp`
**Responsabilité** : Gère la logique de la Force
- Met à jour la position selon l'état
- Gère le tir automatique
- Transition entre les états

#### `ForceControlSystem.hpp`
**Responsabilité** : Gère les inputs du joueur
- Tab : Changer d'état
- Left Shift : Lancer la Force

#### `ForceCollisionSystem.hpp`
**Responsabilité** : Gère les collisions
- Détruit les projectiles ennemis
- Inflige des dégâts aux ennemis au contact

### Archetypes créés

#### `force.player_force`
```json
{
  "Position": {},
  "Velocity": {},
  "CircleShape": { "radius": 16.0, "color": [255, 100, 0, 255] },
  "Hitbox": { "width": 32, "height": 32 },
  "Force": {
    "auto_fire": true,
    "fire_rate": 0.15,
    "launch_speed": 600.0
  },
  "ForceTag": {}
}
```

#### `force.force_laser`
Projectiles tirés par la Force
```json
{
  "Position": {},
  "Velocity": { "dx": 400, "dy": 0 },
  "CircleShape": { "radius": 4.0, "color": [255, 200, 0, 255] },
  "Hitbox": { "width": 8, "height": 8 },
  "Damage": { "amount": 15 },
  "MissileTag": { "owner": "PLAYER" }
}
```

## 📝 Intégration dans le jeu

### 1. Ajouter les systèmes dans TestGameScene.cpp

```cpp
#include "All/systems/ForceSystem.hpp"
#include "All/systems/ForceControlSystem.hpp"
#include "All/systems/ForceCollisionSystem.hpp"

// Dans initialize()
registry.add_system("update", ForceSystem(group));
registry.add_system("update", ForceControlSystem(group));
registry.add_system("update", ForceCollisionSystem(group));
```

### 2. Spawn la Force au démarrage

Dans `test_powerups.json` :
```json
{ "time": 0.0, "action": "SPAWN", "archetype": "force.player_force", "pos": [150, 300] }
```

### 3. Lier la Force au joueur

Après spawn du joueur, trouvez l'entité Force et assignez `owner_entity` :
```cpp
// Dans PlayerShootingSystem ou un système d'initialisation
if (forces[force_id] && player_tags[player_id]) {
    forces[force_id]->owner_entity = player_id;
}
```

## 🎨 Améliorations possibles

1. **Visuel** : Utiliser un sprite animé au lieu d'un CircleShape
2. **Power-ups** : Améliorer la Force avec des power-ups (tir plus rapide, plus de dégâts)
3. **Multiple Forces** : Permettre plusieurs Forces simultanément
4. **Chargement** : Charger la Force pour un tir surpuissant
5. **Formation** : La Force pourrait suivre des patterns complexes

## 🐛 Debug

### Vérifier si la Force existe
```bash
./YourExecutableName 2>&1 | grep "Force:"
```

### Logs attendus
```
Force: Attached to FRONT
Force: DETACHED
Force: LAUNCHED!
Force: Absorbed enemy projectile!
Force: Destroyed enemy by contact!
```

## 📚 Références

- [R-Type Wiki - Force](https://rtype.fandom.com/wiki/Force)
- Video: R-Type gameplay avec démonstration de la Force
