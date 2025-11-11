# Moteur Multi-Threadé

## Vue d'ensemble

Le moteur de jeu R-Type implémente un système multi-threadé où chaque groupe de systèmes (rendu, physique, logique) tourne dans son propre thread à une fréquence configurable.

## Architecture

### Groupes de Systèmes

Chaque groupe de systèmes possède :
- **Un thread dédié** : Boucle de mise à jour indépendante
- **Une fréquence configurable** : Nombre de mises à jour par seconde (Hz)
- **Des systèmes** : Liste de systèmes à exécuter dans ce thread
- **État pause** : Possibilité de mettre en pause le groupe

### Fonctionnement

```cpp
// Exemple : Ajouter un système de rendu à 60 FPS
registry.add_system("render", RenderSystem(), 60.0f);

// Ajouter un système de physique à 50 Hz
registry.add_system("physics", PhysicsSystem(), 50.0f);

// Ajouter un système de logique à 30 Hz
registry.add_system("logic", GameLogicSystem(), 30.0f);
```

Quand vous ajoutez le **premier système** d'un groupe :
1. Un thread est créé automatiquement
2. Le thread démarre sa boucle de mise à jour
3. Les systèmes s'exécutent à la fréquence spécifiée

Quand vous ajoutez un **système supplémentaire** au même groupe :
- Il est ajouté à la liste du groupe existant
- Il s'exécute dans le même thread
- Il partage la même fréquence

## API

### Ajouter un Système

```cpp
template <typename T>
void add_system(const std::string& systemGroupName, 
                T&& system, 
                float update_frequency_hz = 60.0f)
```

**Paramètres :**
- `systemGroupName` : Nom du groupe (ex: "render", "physics", "logic")
- `system` : Instance du système à ajouter
- `update_frequency_hz` : Fréquence de mise à jour en Hz (défaut: 60)

**Exemple :**
```cpp
auto& registry = engine.getRegistry();

// Système de rendu : vise 60 FPS
registry.add_system("render", 
    [](GameEngine& engine, float dt) {
        // Logique de rendu
    }, 
    60.0f
);

// Système de physique : 50 mises à jour par seconde
registry.add_system("physics",
    [](GameEngine& engine, float dt) {
        // Simulation physique
    },
    50.0f
);
```

### Contrôler les Groupes

#### Mettre en pause
```cpp
registry.pause_system_group("physics");
```

#### Reprendre
```cpp
registry.resume_system_group("physics");
```

#### Changer la fréquence
```cpp
registry.set_system_frequency("render", 120.0f); // Passer à 120 FPS
```

#### Arrêter tous les systèmes
```cpp
registry.stop_all_systems(); // Appelé automatiquement dans le destructeur
```

## Groupes Recommandés

### Rendu (render) - 60 Hz
Systèmes graphiques qui mettent à jour l'affichage :
- RenderSystem
- AnimationSystem
- ParticleRenderSystem
- UIRenderSystem

**Pourquoi 60 Hz ?** Standard de fluidité visuelle pour la plupart des écrans.

### Physique (physics) - 50 Hz
Systèmes de simulation physique :
- MovementSystem
- CollisionSystem
- GravitySystem

**Pourquoi 50 Hz ?** Fréquence fixe garantissant un comportement constant indépendamment de la vitesse d'affichage.

### Logique (logic) - 30 Hz
Systèmes de gameplay :
- AISystem
- ScriptSystem
- WeaponSystem
- PowerUpSystem

**Pourquoi 30 Hz ?** Suffisant pour la logique de jeu, économise des ressources CPU.

### Audio (audio) - 60 Hz
Systèmes sonores :
- MusicSystem
- SoundSystem

## Synchronisation

### Thread Safety

Le Registry utilise des `std::mutex` pour protéger :
- L'ajout de systèmes
- La modification des fréquences
- La pause/reprise des groupes

**Important :** Les composants ne sont PAS thread-safe par défaut. Si plusieurs groupes de systèmes accèdent aux mêmes composants, vous devez ajouter votre propre synchronisation.

### Pattern Recommandé

```cpp
// ❌ ÉVITER : Deux groupes modifiant les mêmes composants
registry.add_system("physics", MovementSystem(), 50.0f);
registry.add_system("render", MovementSystem(), 60.0f); // DANGER !

// ✅ RECOMMANDÉ : Séparer lecture et écriture
registry.add_system("physics", MovementSystem(), 50.0f);     // Écrit Position
registry.add_system("render", PositionReadSystem(), 60.0f);  // Lit Position
```

## Delta Time

Chaque groupe calcule son propre delta time basé sur sa fréquence :
```cpp
float dt = 1.0f / frequency;
```

Par exemple :
- Rendu à 60 Hz → dt = 0.0167s (16.7ms)
- Physique à 50 Hz → dt = 0.02s (20ms)

Le delta time est **constant** et **prévisible**, garantissant un comportement reproductible.

## Migration depuis l'ancien système

### Avant (synchrone)
```cpp
// Dans la boucle de jeu
while (running) {
    float dt = clock.getDeltaTime();
    registry.run_systems("update", engine, dt);
    registry.run_systems("render", engine, dt);
}
```

### Après (asynchrone)
```cpp
// À l'initialisation
registry.add_system("update", UpdateSystem(), 50.0f);
registry.add_system("render", RenderSystem(), 60.0f);

// Plus besoin de boucle ! Les threads tournent automatiquement
// Le jeu tourne jusqu'à ce qu'on appelle stop_all_systems()
```

## Exemple Complet

```cpp
class MyGame {
public:
    void init() {
        auto& registry = engine.getRegistry("default");
        
        // Systèmes de rendu - 60 FPS
        registry.add_system("render", SpriteRenderSystem(), 60.0f);
        registry.add_system("render", AnimationSystem(), 60.0f);
        registry.add_system("render", UIRenderSystem(), 60.0f);
        
        // Systèmes de physique - 50 Hz (déterministe)
        registry.add_system("physics", MovementSystem(), 50.0f);
        registry.add_system("physics", CollisionSystem(), 50.0f);
        
        // Systèmes de logique - 30 Hz
        registry.add_system("logic", AISystem(), 30.0f);
        registry.add_system("logic", WeaponSystem(), 30.0f);
        registry.add_system("logic", ScriptSystem(), 30.0f);
        
        // Les threads démarrent automatiquement !
    }
    
    void shutdown() {
        auto& registry = engine.getRegistry("default");
        registry.stop_all_systems(); // Arrête proprement tous les threads
    }
};
```

## Performances

### Avantages

✅ **Parallélisation** : Utilise plusieurs cœurs CPU simultanément  
✅ **Fréquences indépendantes** : Rendu fluide même si la physique est lente  
✅ **Déterminisme** : Delta time constant pour la physique  
✅ **Simplicité** : Plus besoin de gérer manuellement les boucles de jeu  

### Points d'attention

⚠️ **Thread Safety** : Attention aux accès concurrents aux composants  
⚠️ **Surcharge** : Trop de groupes = trop de threads = overhead  
⚠️ **Ordre d'exécution** : Les systèmes dans différents threads n'ont pas d'ordre garanti  

## Bonnes Pratiques

1. **Grouper par fréquence** : Mettez les systèmes de même fréquence dans le même groupe
2. **Limiter le nombre de groupes** : 3-4 groupes suffisent généralement
3. **Séparer lecture/écriture** : Évitez que plusieurs groupes modifient les mêmes composants
4. **Tester les fréquences** : Ajustez selon le profil de performance
5. **Logger les performances** : Surveillez si les threads tiennent leur fréquence cible

## Debugging

### Vérifier qu'un thread tourne
Les logs montrent le démarrage/arrêt :
```
[Registry] Starting thread for system group 'render' at 60 Hz
[Registry] Thread for 'render' started.
```

### Profiler les performances
Ajoutez des logs dans vos systèmes :
```cpp
registry.add_system("physics", [](GameEngine& e, float dt) {
    auto start = std::chrono::high_resolution_clock::now();
    
    // Votre logique ici
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    
    if (duration.count() > 20000) { // Plus de 20ms
        std::cout << "⚠️ Physics system took " << duration.count() << "µs" << std::endl;
    }
}, 50.0f);
```
