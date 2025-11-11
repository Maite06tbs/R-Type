# Migration Guide : Ancien système → Moteur Multi-Threadé

## Vue d'ensemble

Ce guide vous montre comment migrer vos scènes de l'ancien système synchrone vers le nouveau moteur multi-threadé.

## Changements Clés

| Ancien Système | Nouveau Système |
|---------------|-----------------|
| Appel manuel de `run_systems()` | Threads automatiques |
| Même fréquence pour tous | Fréquences indépendantes |
| Boucle de jeu dans la scène | Boucle de jeu dans Registry |
| Delta time variable | Delta time fixe par groupe |

## Exemple : TestGameScene

### Avant (Ancien système synchrone)

```cpp
void TestGameScene::update(float dt) {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // Appels manuels dans la boucle de jeu
    registry.run_systems("update", _engine, dt);
    registry.run_systems("physics", _engine, dt);
    registry.run_systems("render", _engine, dt);
}

void TestGameScene::onEnter() {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // Enregistrement des systèmes
    registry.add_system("update", MovementSystem());
    registry.add_system("physics", CollisionSystem());
    registry.add_system("render", RenderSystem());
}
```

### Après (Nouveau système multi-threadé)

```cpp
void TestGameScene::update(float dt) {
    // Plus besoin d'appeler run_systems() !
    // Les threads tournent automatiquement en arrière-plan
    
    // Vous pouvez garder cette méthode pour la logique spécifique à la scène
    // (gestion d'input, transitions, etc.)
}

void TestGameScene::onEnter() {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // Ajout des systèmes avec leurs fréquences
    // Groupe "physics" à 50 Hz (déterministe)
    registry.add_system("physics", MovementSystem(), 50.0f);
    registry.add_system("physics", CollisionSystem(), 50.0f);
    
    // Groupe "render" à 60 FPS (fluide)
    registry.add_system("render", SpriteRenderSystem(), 60.0f);
    registry.add_system("render", AnimationSystem(), 60.0f);
    
    // Groupe "logic" à 30 Hz (économique)
    registry.add_system("logic", AISystem(), 30.0f);
    registry.add_system("logic", WeaponSystem(), 30.0f);
    
    // Les threads démarrent automatiquement !
}

void TestGameScene::onExit() {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // Arrêter les threads quand on quitte la scène
    registry.stop_all_systems();
}
```

## Patterns de Migration

### Pattern 1 : Systèmes de Rendu

**Avant :**
```cpp
registry.add_system("render", SpriteRenderSystem());
registry.add_system("render", UIRenderSystem());
```

**Après :**
```cpp
// Groupe render à 60 FPS
registry.add_system("render", SpriteRenderSystem(), 60.0f);
registry.add_system("render", UIRenderSystem(), 60.0f);
// Animation aussi dans render pour la fluidité
registry.add_system("render", AnimationSystem(), 60.0f);
```

### Pattern 2 : Systèmes de Physique

**Avant :**
```cpp
registry.add_system("update", MovementSystem());
registry.add_system("update", CollisionSystem());
```

**Après :**
```cpp
// Groupe physics à 50 Hz pour stabilité
registry.add_system("physics", MovementSystem(), 50.0f);
registry.add_system("physics", CollisionSystem(), 50.0f);
registry.add_system("physics", GravitySystem(), 50.0f);
```

### Pattern 3 : Systèmes de Logique

**Avant :**
```cpp
registry.add_system("update", AISystem());
registry.add_system("update", WeaponSystem());
registry.add_system("update", ScriptSystem());
```

**Après :**
```cpp
// Groupe logic à 30 Hz (suffisant)
registry.add_system("logic", AISystem(), 30.0f);
registry.add_system("logic", WeaponSystem(), 30.0f);
registry.add_system("logic", ScriptSystem(), 30.0f);
registry.add_system("logic", PowerUpSystem(), 30.0f);
```

### Pattern 4 : Boucle de Jeu

**Avant :**
```cpp
void GameScene::run() {
    while (_running) {
        float dt = _clock.getDeltaTime();
        
        // Mise à jour manuelle
        registry.run_systems("update", _engine, dt);
        registry.run_systems("render", _engine, dt);
        
        _clock.restart();
    }
}
```

**Après :**
```cpp
void GameScene::onEnter() {
    // Configuration une seule fois
    registry.add_system("physics", MovementSystem(), 50.0f);
    registry.add_system("render", RenderSystem(), 60.0f);
    registry.add_system("logic", GameLogicSystem(), 30.0f);
    
    // Les threads tournent automatiquement !
    // Plus besoin de boucle while
}

void GameScene::onExit() {
    // Arrêt propre
    registry.stop_all_systems();
}
```

## Exemple Complet : OnlineClientGameScene

### Avant

```cpp
void OnlineClientGameScene::initialize() {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // Tous dans "update"
    registry.add_system("update", MovementSystem());
    registry.add_system("update", CollisionSystem());
    registry.add_system("update", NetworkSyncSystem());
    registry.add_system("update", AISystem());
    
    // Tous dans "render"
    registry.add_system("render", SpriteRenderSystem());
    registry.add_system("render", UIRenderSystem());
}

void OnlineClientGameScene::update(float dt) {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // Appels manuels
    registry.run_systems("update", _engine, dt);
    registry.run_systems("render", _engine, dt);
}
```

### Après

```cpp
void OnlineClientGameScene::initialize() {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    // ========== GROUPE PHYSICS (50 Hz) ==========
    // Simulation déterministe, fréquence fixe
    registry.add_system("physics", MovementSystem(), 50.0f);
    registry.add_system("physics", CollisionSystem(), 50.0f);
    
    // ========== GROUPE NETWORK (20 Hz) ==========
    // Synchronisation réseau, pas besoin d'être rapide
    registry.add_system("network", NetworkSyncSystem(), 20.0f);
    registry.add_system("network", InputSendSystem(), 20.0f);
    
    // ========== GROUPE LOGIC (30 Hz) ==========
    // IA et logique de jeu
    registry.add_system("logic", AISystem(), 30.0f);
    registry.add_system("logic", WeaponSystem(), 30.0f);
    registry.add_system("logic", PowerUpSystem(), 30.0f);
    
    // ========== GROUPE RENDER (60 Hz) ==========
    // Affichage fluide
    registry.add_system("render", SpriteRenderSystem(), 60.0f);
    registry.add_system("render", AnimationSystem(), 60.0f);
    registry.add_system("render", UIRenderSystem(), 60.0f);
    registry.add_system("render", ParticleRenderSystem(), 60.0f);
    
    std::cout << "✅ All system threads started automatically!" << std::endl;
}

void OnlineClientGameScene::update(float dt) {
    // Cette fonction peut rester vide ou gérer la logique spécifique
    // aux transitions de scène, inputs, etc.
    
    // Les systèmes tournent automatiquement en parallèle !
}

void OnlineClientGameScene::cleanup() {
    auto& registry = _engine.getRegistry(_registryGroup);
    
    std::cout << "🛑 Stopping all system threads..." << std::endl;
    registry.stop_all_systems();
}
```

## Contrôle Dynamique

Vous pouvez maintenant contrôler les groupes pendant le jeu :

```cpp
// Mettre en pause la physique (ex: menu pause)
registry.pause_system_group("physics");
registry.pause_system_group("logic");
// Le rendu continue !

// Reprendre
registry.resume_system_group("physics");
registry.resume_system_group("logic");

// Passer en slow motion
registry.set_system_frequency("physics", 25.0f); // 50% plus lent

// Mode turbo
registry.set_system_frequency("logic", 60.0f); // 2x plus rapide
```

## Checklist de Migration

- [ ] Identifier tous les appels à `run_systems()`
- [ ] Grouper les systèmes par fréquence logique
- [ ] Remplacer `add_system()` par `add_system(..., frequency)`
- [ ] Supprimer les appels manuels à `run_systems()`
- [ ] Ajouter `stop_all_systems()` dans `onExit()` / destructeur
- [ ] Tester que les threads démarrent (vérifier les logs)
- [ ] Vérifier qu'il n'y a pas de race conditions
- [ ] Profiler les performances

## Pièges Courants

### ❌ Piège 1 : Oublier stop_all_systems()

```cpp
// MAUVAIS : Les threads continuent après destruction de la scène
void MyScene::onExit() {
    // Oubli de stop_all_systems()
}
```

```cpp
// BON : Arrêt propre
void MyScene::onExit() {
    auto& registry = _engine.getRegistry(_registryGroup);
    registry.stop_all_systems();
}
```

### ❌ Piège 2 : Fréquences incohérentes

```cpp
// MAUVAIS : Physique plus rapide que le rendu = gaspillage CPU
registry.add_system("physics", MovementSystem(), 120.0f);
registry.add_system("render", RenderSystem(), 60.0f);
```

```cpp
// BON : Physique <= Rendu
registry.add_system("physics", MovementSystem(), 50.0f);
registry.add_system("render", RenderSystem(), 60.0f);
```

### ❌ Piège 3 : Accès concurrent non protégé

```cpp
// MAUVAIS : Deux groupes modifiant Position en même temps
registry.add_system("physics", MovementSystem(), 50.0f);
registry.add_system("network", NetworkMoveSystem(), 20.0f);
// DANGER : Race condition sur Position !
```

```cpp
// BON : Un seul groupe modifie Position
registry.add_system("physics", MovementSystem(), 50.0f);
registry.add_system("network", NetworkReadOnlySystem(), 20.0f);
```

## Avantages de la Migration

✅ **Plus simple** : Plus besoin de gérer manuellement les boucles  
✅ **Plus performant** : Parallélisation automatique sur plusieurs cœurs  
✅ **Plus flexible** : Fréquences indépendantes par groupe  
✅ **Plus robuste** : Delta time constant = comportement prévisible  
✅ **Plus maintenable** : Code plus clair et organisé  

## Support

Si vous rencontrez des problèmes lors de la migration :
1. Vérifiez les logs de démarrage des threads
2. Consultez `docs/Multithreaded_Engine.md`
3. Testez groupe par groupe (commencez par "render" seul)
