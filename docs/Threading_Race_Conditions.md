# Race Conditions et Solutions Multi-Threading

## 🔴 Problème Identifié

### Symptômes
- Le jeu démarre normalement
- Après quelques secondes → lag intense
- Ralentissements progressifs
- Comportements erratiques

### Cause Racine : Race Conditions

Quand plusieurs threads modifient **les mêmes composants en mémoire** simultanément :

```
Thread "logic" (30 Hz)    : entity.Position.x = 100
Thread "physics" (50 Hz)  : entity.Position.x += velocity  
Thread "render" (60 Hz)   : draw(entity.Position.x)
Thread "force" (30 Hz)    : entity.Position.x = player.x + offset
```

**Résultat** : 
- Corruption de données
- Valeurs incohérentes
- Crash ou lag intense
- Comportements imprévisibles

## Pourquoi ça ne laggait pas avec une seule boucle ?

### Ancien système (boucle séquentielle)
```cpp
while (running) {
    MovementSystem();    // Position.x = 100
    CollisionSystem();   // Lit Position.x (toujours 100)
    RenderSystem();      // Affiche Position.x (toujours 100)
}
```
✅ **Séquentiel** = Pas de concurrence = Pas de problème

### Nouveau système (threads parallèles)
```cpp
Thread 1: MovementSystem()   // Position.x = 100
Thread 2: ForceSystem()      // Position.x = 200  (EN MÊME TEMPS !)
Thread 3: RenderSystem()     // Lit Position.x = ??? (corruption)
```
❌ **Parallèle** = Accès concurrent = Race condition = LAG

## Composants Partagés Problématiques

| Composant | Écrit par | Lu par | Problème |
|-----------|-----------|--------|----------|
| **Position** | Movement, Force, Collision | Render, AI, Collision | ⚠️ HAUTE |
| **Velocity** | Movement, Collision | Movement | ⚠️ HAUTE |
| **Health** | Collision, Weapon | HealthBar, Death | ⚠️ HAUTE |
| **Sprite** | Animation | Render | ⚠️ MOYENNE |
| **Animation** | AnimationSystem | Render | ⚠️ MOYENNE |

## Solutions

### Solution 1 : Un seul thread (ACTUELLE)

**Configuration actuelle dans TestGameScene.cpp :**
```cpp
// TOUT dans le groupe "update" (1 seul thread à 60 Hz)
registry.add_system("update", MovementSystem(group), 60.0f, true);
registry.add_system("update", CollisionSystem(group), 60.0f, true);
registry.add_system("update", ForceSystem(group), 60.0f, true);
// ... tous les autres systèmes

// Seulement le rendu dans le thread principal (OpenGL)
registry.add_system("render", RenderSystem(group), 60.0f, false);
```

**Avantages :**
- ✅ Pas de race conditions
- ✅ Fonctionne immédiatement
- ✅ Comportement prévisible

**Inconvénients :**
- ❌ Pas de parallélisation
- ❌ Un seul CPU utilisé
- ❌ Si un système est lent, tout ralentit

### Solution 2 : Mutex sur les composants (FUTURE)

Ajouter des mutex dans les composants :

```cpp
namespace Component::Core {
    struct Position {
        float x, y;
        mutable std::mutex mutex;
        
        void set(float new_x, float new_y) {
            std::lock_guard<std::mutex> lock(mutex);
            x = new_x;
            y = new_y;
        }
        
        std::pair<float, float> get() const {
            std::lock_guard<std::mutex> lock(mutex);
            return {x, y};
        }
    };
}
```

**Modifications nécessaires :**
```cpp
// Au lieu de :
entity.get_component<Position>().x = 100;

// Utiliser :
entity.get_component<Position>().set(100, entity.get_component<Position>().y);
```

**Avantages :**
- ✅ Parallélisation réelle
- ✅ Thread-safe
- ✅ Utilise plusieurs CPU

**Inconvénients :**
- ❌ Beaucoup de code à modifier
- ❌ Overhead de synchronisation
- ❌ Risque de deadlock si mal fait

### Solution 3 : Double Buffering (AVANCÉE)

Deux copies des composants : une pour lecture, une pour écriture

```cpp
struct DoubleBufferedPosition {
    Position read_buffer;   // Thread de rendu lit ici
    Position write_buffer;  // Threads de logique écrivent ici
    std::mutex swap_mutex;
    
    void swap() {  // Appelé entre les frames
        std::lock_guard<std::mutex> lock(swap_mutex);
        read_buffer = write_buffer;
    }
};
```

**Workflow :**
1. Logique écrit dans `write_buffer`
2. Rendu lit dans `read_buffer`
3. Entre les frames : `swap()`

**Avantages :**
- ✅ Pas de contention (lecture/écriture séparées)
- ✅ Très performant

**Inconvénients :**
- ❌ Double mémoire
- ❌ Complexité élevée
- ❌ Latence d'une frame

### Solution 4 : Séparation Read/Write (RECOMMANDÉE pour plus tard)

Organiser les systèmes par type d'accès :

```cpp
// GROUPE WRITE (50 Hz) - Modifie les composants
registry.add_system("write", MovementSystem(group), 50.0f, true);
registry.add_system("write", CollisionSystem(group), 50.0f, true);
registry.add_system("write", WeaponSystem(group), 50.0f, true);
// Tous dans le même thread = pas de conflit

// GROUPE READ (60 Hz) - Lit uniquement
registry.add_system("read", RenderSystem(group), 60.0f, false);
registry.add_system("read", SoundSystem(group), 60.0f, true);
// Peuvent être parallèles car lecture seule
```

**Règle :**
- ✅ Plusieurs threads peuvent **lire** en parallèle
- ❌ Un seul thread peut **écrire** à la fois

## Diagnostic : Comment détecter les race conditions ?

### 1. Valgrind avec Helgrind
```bash
valgrind --tool=helgrind ./rtype_client
```

Détecte :
- Accès concurrents à la même mémoire
- Ordre d'exécution incohérent

### 2. Thread Sanitizer (TSan)
```bash
g++ -fsanitize=thread -g -O1 ...
```

Détecte automatiquement les data races.

### 3. Logs de debugging

Ajouter dans les systèmes :
```cpp
void MovementSystem::run(GameEngine& e, float dt) {
    std::cout << "[MovementSystem] Thread ID: " << std::this_thread::get_id() 
              << " @ " << std::chrono::system_clock::now() << std::endl;
    
    for (auto& entity : entities) {
        auto& pos = entity.get_component<Position>();
        std::cout << "  Entity " << entity << " Position before: " << pos.x << std::endl;
        
        pos.x += velocity.dx * dt;
        
        std::cout << "  Entity " << entity << " Position after: " << pos.x << std::endl;
    }
}
```

Si vous voyez :
```
[MovementSystem] Entity 5 Position before: 100
[ForceSystem] Entity 5 Position before: 100  ← EN MÊME TEMPS !
[MovementSystem] Entity 5 Position after: 150
[ForceSystem] Entity 5 Position after: 200   ← ÉCRASE la valeur !
```

→ **RACE CONDITION DÉTECTÉE**

## État Actuel du Projet

### Configuration Actuelle (Safe)
```
Thread "update"  (60 Hz) → TOUS les systèmes de logique
Thread "main"    (60 Hz) → Systèmes de rendu uniquement
```

**Résultat attendu :**
- ✅ Pas de lag
- ✅ Comportement stable
- ❌ Pas de parallélisation (un seul thread logique)

### Performance Attendue
- CPU utilisé : ~2 cœurs (1 update + 1 render)
- FPS : 60 stable
- Pas de corruption de mémoire

## Plan d'Amélioration Future

### Étape 1 : Profiler (maintenant)
```bash
perf record -g ./rtype_client
perf report
```

Identifier les systèmes les plus lents.

### Étape 2 : Isoler les systèmes indépendants
Exemples de systèmes qui NE partagent PAS de composants :
- `MusicSystem` (Audio::Music)
- `SoundSystem` (Audio::SoundEffect)
- `AnimationSystem` (Graphics::Animation)

Ces systèmes peuvent être threadés séparément.

### Étape 3 : Ajouter des mutex progressivement
Commencer par les composants les plus accédés :
1. Position
2. Velocity
3. Health

### Étape 4 : Tests de stress
```cpp
// Créer 1000 entités pour tester les race conditions
for (int i = 0; i < 1000; i++) {
    auto e = registry.spawn_entity();
    e.add_component<Position>(rand(), rand());
    e.add_component<Velocity>(rand(), rand());
}
```

Si ça lag → race condition encore présente.

## Commandes de Test

### Vérifier la configuration actuelle
```bash
./rtype_client 2>&1 | grep "Systems configured"
```

Devrait afficher :
```
✅ Systems configured: 1 update thread (60Hz) + render in main thread
```

### Monitorer l'utilisation CPU
```bash
htop  # Pendant que le jeu tourne
```

Attendu :
- 1 thread à ~100% (update)
- 1 thread à ~60-80% (render + main loop)

## Conclusion

**Votre diagnostic était correct** : Les threads partagent la même mémoire → race conditions → lag.

**Solution actuelle** : Tout dans un seul thread = stable mais pas optimisé.

**Prochaines étapes** :
1. ✅ Tester la stabilité actuelle
2. Profiler pour identifier les bottlenecks
3. Isoler les systèmes thread-safe
4. Ajouter des mutex progressivement
5. Re-paralléliser intelligemment
