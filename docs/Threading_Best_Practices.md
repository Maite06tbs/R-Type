# Best Practices : Threading et OpenGL/SFML

## ⚠️ RÈGLE CRITIQUE : OpenGL et les Threads

**OpenGL/SFML NE PEUT PAS être utilisé depuis plusieurs threads !**

Le contexte OpenGL doit rester dans le **thread principal**. Tout appel à SFML draw/render depuis un autre thread causera :
```
X Error: BadAccess (attempt to access private resource denied)
GLX error: X_GLXMakeCurrent
```

## Architecture Correcte

### Groupes THREADED (dans des threads séparés)

✅ **Physique (physics)** - Thread séparé à 50 Hz
```cpp
registry.add_system("physics", MovementSystem(), 50.0f, true);
registry.add_system("physics", CollisionSystem(), 50.0f, true);
```

✅ **Logique (logic)** - Thread séparé à 30 Hz
```cpp
registry.add_system("logic", AISystem(), 30.0f, true);
registry.add_system("logic", WeaponSystem(), 30.0f, true);
registry.add_system("logic", ScriptSystem(), 30.0f, true);
```

✅ **Réseau (network)** - Thread séparé à 20 Hz
```cpp
registry.add_system("network", NetworkSyncSystem(), 20.0f, true);
```

### Groupes MAIN THREAD (thread principal uniquement)

❗ **Rendu (render)** - DOIT être dans le thread principal
```cpp
// Le 4ème paramètre 'false' = pas de thread séparé
registry.add_system("render", SpriteRenderSystem(), 60.0f, false);
registry.add_system("render", UIRenderSystem(), 60.0f, false);
registry.add_system("render", ParticleRenderSystem(), 60.0f, false);
```

Puis dans votre boucle de jeu :
```cpp
while (window.isOpen()) {
    float dt = clock.restart().asSeconds();
    
    // Exécuter les systèmes du thread principal (rendu)
    registry.run_main_thread_systems(engine, dt);
    
    // Les autres systèmes tournent automatiquement dans leurs threads !
}
```

## Exemple Complet : GameScene

```cpp
void GameScene::initialize() {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // ========== SYSTÈMES THREADÉS ==========
    // Ces systèmes tournent en parallèle dans leurs propres threads
    
    // Physique - 50 Hz - Thread séparé
    registry.add_system("physics", MovementSystem(), 50.0f, true);
    registry.add_system("physics", CollisionSystem(), 50.0f, true);
    registry.add_system("physics", GravitySystem(), 50.0f, true);
    
    // Logique - 30 Hz - Thread séparé
    registry.add_system("logic", AISystem(), 30.0f, true);
    registry.add_system("logic", WeaponSystem(), 30.0f, true);
    registry.add_system("logic", PowerUpSystem(), 30.0f, true);
    registry.add_system("logic", ScriptSystem(), 30.0f, true);
    
    // Audio - 60 Hz - Thread séparé (safe car pas de contexte OpenGL)
    registry.add_system("audio", MusicSystem(), 60.0f, true);
    registry.add_system("audio", SoundSystem(), 60.0f, true);
    
    // ========== SYSTÈMES THREAD PRINCIPAL ==========
    // Ces systèmes s'exécutent dans le thread principal via run_main_thread_systems()
    
    // Rendu - 60 Hz - THREAD PRINCIPAL (OpenGL)
    registry.add_system("render", SpriteRenderSystem(), 60.0f, false);
    registry.add_system("render", AnimationSystem(), 60.0f, false);
    registry.add_system("render", UIRenderSystem(), 60.0f, false);
    registry.add_system("render", ParticleRenderSystem(), 60.0f, false);
    
    std::cout << "✅ Systems configured (threaded + main thread)" << std::endl;
}

void GameScene::update(float dt) {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // Exécuter les systèmes du thread principal (rendu)
    registry.run_main_thread_systems(_engine, dt);
    
    // Les systèmes threadés (physics, logic, audio) tournent automatiquement !
}

void GameScene::cleanup() {
    auto& registry = _engine.getRegistry(_registryGroup);
    registry.stop_all_systems(); // Arrête tous les threads
}
```

## API add_system()

```cpp
template <typename T>
void add_system(
    const std::string& systemGroupName,  // Nom du groupe
    T&& system,                          // Système à ajouter
    float update_frequency_hz = 60.0f,   // Fréquence en Hz
    bool threaded = true                 // Thread séparé ou thread principal ?
)
```

### Paramètre `threaded`

- **`true` (défaut)** : Le groupe tourne dans son propre thread
  - ✅ Utiliser pour : physics, logic, network, audio
  - ❌ Ne PAS utiliser pour : render (OpenGL), input (window events)

- **`false`** : Le groupe tourne dans le thread principal
  - ✅ Utiliser pour : render, input, window management
  - ⚠️ Vous devez appeler `registry.run_main_thread_systems()` manuellement

## Systèmes Thread-Safe vs Non Thread-Safe

### ✅ Thread-Safe (peuvent être threadés)

| Système | Raison |
|---------|--------|
| MovementSystem | Modifie Position/Velocity (données pures) |
| CollisionSystem | Lit Position/Hitbox (pas d'I/O) |
| AISystem | Calculs logiques purs |
| WeaponSystem | Logique de gameplay |
| ScriptSystem | Exécution Lua (si isolé) |
| NetworkSyncSystem | I/O réseau (safe si bien conçu) |
| MusicSystem | SFML Music (thread-safe) |

### ❌ Non Thread-Safe (DOIVENT être main thread)

| Système | Raison |
|---------|--------|
| SpriteRenderSystem | Appelle window.draw() (OpenGL) |
| UIRenderSystem | Appelle window.draw() (OpenGL) |
| AnimationSystem | Si modifie des sprites SFML |
| InputSystem | Lit sf::Event (doit être dans la boucle principale) |
| WindowManagementSystem | Appelle window.pollEvent() |

## Race Conditions et Synchronisation

### Problème : Plusieurs threads modifient les mêmes composants

```cpp
// ❌ DANGER : Race condition !
registry.add_system("physics", MovementSystem(), 50.0f, true);  // Modifie Position
registry.add_system("network", NetworkMoveSystem(), 20.0f, true); // Modifie Position aussi
// Les deux threads écrivent Position en même temps = crash !
```

### Solution 1 : Un seul thread modifie un composant

```cpp
// ✅ BON : Un seul thread modifie Position
registry.add_system("physics", MovementSystem(), 50.0f, true);     // Écrit Position
registry.add_system("network", NetworkReadSystem(), 20.0f, true);  // Lit Position (pas de modif)
```

### Solution 2 : Mutex dans les composants

```cpp
struct Position {
    float x, y;
    mutable std::mutex mutex;
    
    void set(float new_x, float new_y) {
        std::lock_guard<std::mutex> lock(mutex);
        x = new_x;
        y = new_y;
    }
};
```

### Solution 3 : Systèmes dans le même groupe

```cpp
// ✅ BON : Même thread = pas de race condition
registry.add_system("physics", MovementSystem(), 50.0f, true);
registry.add_system("physics", GravitySystem(), 50.0f, true);
// Les deux s'exécutent séquentiellement dans le même thread
```

## Performance et Profiling

### Vérifier que les threads tiennent leur fréquence

```cpp
registry.add_system("physics", 
    [](GameEngine& e, float dt) {
        auto start = std::chrono::high_resolution_clock::now();
        
        // Votre logique physique ici
        MovementSystem::update(e, dt);
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // À 50 Hz, on a 20ms par frame (20000µs)
        if (duration.count() > 20000) {
            std::cerr << "⚠️ Physics too slow: " << duration.count() << "µs (target: 20000µs)" << std::endl;
        }
    }, 
    50.0f, true
);
```

### Limiter le nombre de threads

```cpp
// ❌ MAUVAIS : Trop de threads = overhead
registry.add_system("movement", MovementSystem(), 50.0f, true);
registry.add_system("gravity", GravitySystem(), 50.0f, true);
registry.add_system("collision", CollisionSystem(), 50.0f, true);
// 3 threads pour des tâches similaires = gaspillage

// ✅ BON : Grouper les systèmes similaires
registry.add_system("physics", MovementSystem(), 50.0f, true);
registry.add_system("physics", GravitySystem(), 50.0f, true);
registry.add_system("physics", CollisionSystem(), 50.0f, true);
// 1 seul thread pour toute la physique
```

## Debugging

### Logs de démarrage

Vérifiez que vos systèmes démarrent correctement :
```
[Registry] Starting thread for system group 'physics' at 50 Hz
[Registry] Thread for 'physics' started.
[Registry] System group 'render' will run in MAIN THREAD at 60 Hz
```

### En cas d'erreur GLX

Si vous voyez :
```
X Error: BadAccess
GLX error: X_GLXMakeCurrent
```

**C'est que vous avez mis un système de rendu en mode threadé !**

Solution :
```cpp
// Changez le 4ème paramètre de true à false
registry.add_system("render", SpriteRenderSystem(), 60.0f, false);
//                                                            ^^^^^ false = main thread
```

## Checklist de Configuration

- [ ] Systèmes de physique → `threaded = true` (50 Hz recommandé)
- [ ] Systèmes de logique → `threaded = true` (30 Hz recommandé)
- [ ] Systèmes de réseau → `threaded = true` (20 Hz recommandé)
- [ ] Systèmes audio → `threaded = true` (60 Hz OK)
- [ ] Systèmes de rendu → `threaded = false` (OBLIGATOIRE)
- [ ] Systèmes d'input → `threaded = false` (OBLIGATOIRE)
- [ ] Appel à `run_main_thread_systems()` dans la boucle principale
- [ ] Appel à `stop_all_systems()` dans cleanup/destructeur

## Résumé

| Type de Système | Threaded | Fréquence | Appel |
|----------------|----------|-----------|-------|
| Physique | ✅ true | 50 Hz | Automatique (thread séparé) |
| Logique | ✅ true | 30 Hz | Automatique (thread séparé) |
| Réseau | ✅ true | 20 Hz | Automatique (thread séparé) |
| Audio | ✅ true | 60 Hz | Automatique (thread séparé) |
| **Rendu** | ❌ **false** | 60 Hz | **Manuel** (run_main_thread_systems) |
| **Input** | ❌ **false** | 60 Hz | **Manuel** (run_main_thread_systems) |
