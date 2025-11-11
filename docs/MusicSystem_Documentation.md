# 🎵 Système de Musique - Documentation Complète

## 📋 Vue d'ensemble

Le système de musique de R-Type permet de gérer la lecture de musiques de fond de manière **data-driven**, complètement intégré au moteur ECS et au système d'archétypes JSON.

---

## 🏗️ Architecture

### 1. **Composant `Component::Audio::Music`**
**Fichier**: `Include/All/Component.hpp`

```cpp
struct Music {
    size_t music_id;           // ID de la musique dans le ResourceManager
    float volume = 50.0f;      // Volume de 0 à 100
    bool loop = true;          // La musique boucle-t-elle ?
    bool is_playing = false;   // État actuel de lecture
    bool should_play = false;  // Commande : démarrer la lecture
    bool should_stop = false;  // Commande : arrêter la lecture
};
```

**Usage**: Attacher ce composant à une entité pour qu'elle contrôle une musique.

---

### 2. **Interface `IMusic`**
**Fichier**: `Include/All/interfaces/IMusic.hpp`

Contrat abstrait pour toute implémentation de musique :
- `openFromFile(path)` - Ouvre un fichier audio en streaming
- `play()` / `pause()` / `stop()` - Contrôle de lecture
- `setLoop(bool)` - Active/désactive la boucle
- `setVolume(float)` - Définit le volume (0-100)
- `getVolume()` / `isPlaying()` - Getters d'état

---

### 3. **Implémentation SFML `SfmlMusic`**
**Fichiers**: 
- `Include/All/sfml/SfmlMusic.hpp`
- `All_src/sfml/SfmlMusic.cpp`

Wrapper autour de `sf::Music` qui implémente `IMusic`.

---

### 4. **ResourceManager**
**Déjà intégré** ✅

Le `ResourceManager` gère automatiquement :
- Le chargement des fichiers musicaux
- Le cache (une musique n'est chargée qu'une fois)
- L'accès thread-safe via ID

**API**:
```cpp
size_t music_id = resourceManager.load_music("Assets/music/boss.ogg");
IMusic& music = resourceManager.get_music(music_id);
```

---

### 5. **Système `MusicSystem`**
**Fichier**: `Include/All/systems/MusicSystem.hpp`

**Responsabilités**:
- Parcourt toutes les entités avec un composant `Music`
- Exécute les commandes (`should_play`, `should_stop`)
- Synchronise l'état (`is_playing`, `volume`)
- Gère les erreurs de manière sécurisée

**Ordre d'exécution**: Après `SoundSystem`, avant `DeathSystem`

---

### 6. **Factory dans GameEngine**
**Fichier**: `Include/GameEngine_Include/core/GameEngine.hpp`

La factory `Music` permet de créer des entités musicales depuis JSON :

```cpp
_component_factories["Music"] = [this](Registry& registry, Entity e, const json& j) {
    std::string music_path = j.value("music_path", "");
    size_t music_id = _resource_module.load_music(music_path);
    
    e.add_component<Component::Audio::Music>(
        Component::Audio::Music(
            music_id,
            j.value("volume", 50.0f),
            j.value("loop", true)
        )
    );
    
    auto& music_component = e.get_component<Component::Audio::Music>();
    music_component.should_play = j.value("auto_play", false);
};
```

---

## 🎮 Utilisation

### A. Créer un archétype de musique

Dans `Config/archetypes.json` :

```json
"audio": {
  "background_music_level1": {
    "components": {
      "Music": {
        "music_path": "Assets/sounds/r-type_sound.wav",
        "volume": 30.0,
        "loop": true,
        "auto_play": true
      }
    }
  },
  "boss_music": {
    "components": {
      "Music": {
        "music_path": "Assets/sounds/boss_theme.wav",
        "volume": 50.0,
        "loop": true,
        "auto_play": false
      }
    }
  }
}
```

**Paramètres** :
- `music_path` (string, **obligatoire**) : Chemin du fichier audio
- `volume` (float, défaut: 50.0) : Volume initial (0-100)
- `loop` (bool, défaut: true) : La musique boucle-t-elle ?
- `auto_play` (bool, défaut: false) : Démarrer automatiquement ?

---

### B. Spawner une musique dans un niveau

Dans `Config/levels/level_1.json` :

```json
{
  "events": [
    { 
      "time": 0.0, 
      "action": "SPAWN", 
      "archetype": "audio.background_music_level1", 
      "pos": [0, 0] 
    },
    { 
      "time": 30.0, 
      "action": "SPAWN", 
      "archetype": "audio.boss_music", 
      "pos": [0, 0] 
    }
  ]
}
```

**Note**: La position n'a pas d'importance pour les entités musicales.

---

### C. Contrôler la musique en C++

```cpp
// Récupérer l'entité musicale
auto& musics = registry.get_components<Component::Audio::Music>();

// Démarrer la lecture
musics[entity_id]->should_play = true;

// Arrêter la musique
musics[entity_id]->should_stop = true;

// Changer le volume
musics[entity_id]->volume = 75.0f;

// Vérifier si ça joue
if (musics[entity_id]->is_playing) {
    // La musique est en cours de lecture
}
```

---

## 🔧 Intégration dans les scènes

**Fichier**: `All_src/scenes/TestGameScene.cpp`

```cpp
#include "../systems/MusicSystem.hpp"

void TestGameScene::init(GameEngine& gameEngine) {
    // ...
    registry.add_system("update", MusicSystem(group));
    // ...
}
```

**Ordre recommandé** :
1. `SoundSystem` (sons courts)
2. `MusicSystem` (musiques longues)
3. `DeathSystem` (nettoyage)

---

## 🎯 Cas d'usage typiques

### 1. Musique de fond de niveau
```json
"level_theme": {
  "components": {
    "Music": {
      "music_path": "Assets/music/level1.ogg",
      "volume": 40.0,
      "loop": true,
      "auto_play": true
    }
  }
}
```
Spawn à `time: 0.0` dans le level JSON.

---

### 2. Musique de boss (déclenchée par event)
```json
"boss_theme": {
  "components": {
    "Music": {
      "music_path": "Assets/music/boss.ogg",
      "volume": 60.0,
      "loop": true,
      "auto_play": true
    }
  }
}
```
Spawn quand le boss apparaît. Optionnellement, arrêter la musique de niveau avant.

---

### 3. Musique de victoire (one-shot)
```json
"victory_jingle": {
  "components": {
    "Music": {
      "music_path": "Assets/music/victory.ogg",
      "volume": 70.0,
      "loop": false,
      "auto_play": true
    }
  }
}
```

---

## 📊 Différences Music vs Sound

| Aspect | `Music` | `SoundEffect` |
|--------|---------|---------------|
| **Chargement** | Streaming (pas en RAM) | Chargé en mémoire |
| **Fichiers** | Longs (> 30s) | Courts (< 5s) |
| **Simultanéité** | 1 par instance | Plusieurs en parallèle |
| **Usage** | Ambiance, thèmes | Tirs, explosions |
| **Formats** | .ogg, .wav, .flac | .wav, .ogg |

---

## ⚠️ Bonnes pratiques

1. **Utilisez des fichiers OGG** : Compression sans perte de qualité
2. **Limitez le volume** : 30-50% pour les musiques de fond
3. **Arrêtez les anciennes musiques** : Évitez les superpositions
4. **Ne spawner qu'UNE musique de fond** par niveau
5. **Utilisez `auto_play: true`** pour les musiques d'ambiance
6. **Utilisez `loop: false`** pour les jingles courts

---

## 🐛 Dépannage

### La musique ne joue pas
- ✅ Vérifier que le fichier existe dans `Assets/sounds/`
- ✅ Vérifier que `auto_play` est `true` ou que `should_play` est appelé
- ✅ Vérifier que `MusicSystem` est enregistré dans la scène
- ✅ Regarder la console pour les erreurs du `ResourceManager`

### Plusieurs musiques se chevauchent
- 🔧 Arrêter l'ancienne musique avant d'en démarrer une nouvelle
- 🔧 Utiliser une entité unique pour la musique de fond

### Le volume ne change pas
- 🔧 Le changement est appliqué à la prochaine frame du `MusicSystem`
- 🔧 Vérifier que la valeur est entre 0 et 100

---

## 📝 Exemple complet

**Archétype** (`archetypes.json`):
```json
"audio": {
  "menu_music": {
    "components": {
      "Music": {
        "music_path": "Assets/music/menu.ogg",
        "volume": 35.0,
        "loop": true,
        "auto_play": true
      }
    }
  }
}
```

**Niveau** (`level_1.json`):
```json
{
  "events": [
    { "time": 0.0, "action": "SPAWN", "archetype": "audio.menu_music", "pos": [0, 0] }
  ]
}
```

**Scène** (`TestGameScene.cpp`):
```cpp
registry.add_system("update", MusicSystem(group));
```

Et voilà ! La musique jouera automatiquement au démarrage du niveau. 🎵

---

## 🎓 Conclusion

Le système de musique est maintenant **100% data-driven**, parfaitement intégré à l'architecture ECS, et prêt à gérer tous les besoins audio de R-Type. 

**Next steps** :
- Ajouter des transitions fade in/fade out
- Implémenter un système de playlists
- Ajouter un mixer global pour gérer plusieurs pistes
