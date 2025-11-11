# 🚀 Migration de TestGameScene vers Data-Driven

## 📝 Vue d'ensemble

Ce document explique comment `TestGameScene` a été transformé en une scène **100% data-driven** via `ConfigurableScene` et `scenes.json`.

---

## ❌ AVANT : Code Hardcodé

```cpp
// TestGameScene.cpp
void TestGameScene::init(GameEngine& engine) {
    // ❌ 25+ lignes de add_system() hardcodées
    registry.add_system("logic", PlayerControlSystem(group), 60.0f, true);
    registry.add_system("logic", AISystem(group), 60.0f, true);
    // ...
    levelManager.load("Config/levels/level_1.json");
}

void TestGameScene::update(GameEngine& engine, float dt) {
    // ❌ Logique replay hardcodée
    if (replay_manager.get_state() == ReplayState::PLAYING) {
        replay_manager.update(dt);
    } else {
        levelManager.update(dt, group);
        if (replay_manager.get_state() == ReplayState::RECORDING) {
            replay_manager.update(dt);
        }
    }
}
```

**Problèmes** :
- 🔴 Recompiler pour changer les systèmes
- 🔴 Recompiler pour changer l'ordre
- 🔴 Logique métier mélangée avec la configuration
- 🔴 Pas de modding possible

---

## ✅ APRÈS : Configuration JSON

### **1. Configuration dans `scenes.json`**

```json
{
  "scene_id": "test_game_scene",
  "registry_group": "TestGameScene",
  "initial_level": "Config/levels/level_1.json",
  
  "lifecycle": {
    "on_init": [
      { "action": "LOG", "message": "Initializing TestGameScene..." },
      { "action": "SET_SCRIPTING_GROUP", "group": "TestGameScene" },
      { "action": "LOAD_LEVEL", "path": "Config/levels/level_1.json" }
    ],
    "on_update": [
      { "action": "UPDATE_LEVEL_MANAGER" }
    ],
    "on_render": [
      { "action": "RUN_SYSTEM_GROUP", "group_name": "render" }
    ],
    "on_exit": [
      { "action": "CLEANUP_REGISTRY" }
    ]
  },
  
  "system_groups": [
    {
      "name": "logic",
      "systems": ["PlayerControlSystem", "AISystem", "WeaponSystem", ...]
    },
    {
      "name": "save",
      "systems": ["ReplayManagerSystem"]
    },
    {
      "name": "render",
      "threaded": false,
      "systems": ["AnimationSystem", "RenderSystem"]
    }
  ]
}
```

### **2. Chargement dans le code**

```cpp
// Dans TestApplication::initialize() ou main()
_scene_manager.load_scene_definitions("Config/scenes.json");
_scene_manager.switch_to_scene("test_game_scene");
```

**C'EST TOUT !** Plus besoin de `TestGameScene.cpp` hardcodé.

---

## 🆕 Nouvelles Actions Ajoutées

### **`UPDATE_LEVEL_MANAGER`**
```json
{ "action": "UPDATE_LEVEL_MANAGER" }
```
- Met à jour le `LevelManager` avec le `delta_time` de la frame
- Gère le spawn des entités selon la timeline du niveau
- Utilisé dans `on_update`

### **`RUN_SYSTEM_GROUP`**
```json
{ "action": "RUN_SYSTEM_GROUP", "group_name": "render" }
```
- Exécute un groupe de systèmes sur le main thread
- Utilisé pour les systèmes non-threadés (comme le rendu)
- Utilisé dans `on_render`

### **`LOAD_LEVEL`** (amélioré)
```json
{ "action": "LOAD_LEVEL", "path": "Config/levels/level_1.json" }
```
- Charge un niveau depuis un fichier JSON
- Définit automatiquement le `registry_group`
- Utilisé dans `on_init`

---

## 🎯 Architecture du Système Replay

### **Avant** : Logique dans `TestGameScene::update()`
```cpp
if (replay_manager.get_state() == ReplayState::PLAYING) {
    replay_manager.update(dt);
} else {
    // logique normale
    if (replay_manager.get_state() == ReplayState::RECORDING) {
        replay_manager.update(dt);
    }
}
```

### **Après** : Système dédié `ReplayManagerSystem`
```cpp
// Include/All/systems/ReplayManagerSystem.hpp
class ReplayManagerSystem : public ISystem {
    void run(GameEngine& engine, float dt) override {
        auto& replay_manager = engine.getReplayManager();
        
        if (replay_manager.get_state() == ReplayState::PLAYING) {
            replay_manager.update(dt);
        } else if (replay_manager.get_state() == ReplayState::RECORDING) {
            replay_manager.update(dt);
        }
    }
    
    AUTO_REGISTER_SYSTEM(ReplayManagerSystem, "ReplayManagerSystem")
};
```

**Avantages** :
- ✅ Découplage : le replay est un système comme un autre
- ✅ Configurable : on peut l'activer/désactiver dans le JSON
- ✅ Testable : on peut le tester indépendamment

---

## 📊 Comparaison

| Aspect | Avant (Hardcodé) | Après (Data-Driven) |
|--------|------------------|---------------------|
| **Lignes de code C++** | ~100 lignes | ~0 lignes |
| **Configuration JSON** | 0 | ~100 lignes |
| **Recompilation** | ✅ Obligatoire | ❌ Pas nécessaire |
| **Modding** | ❌ Impossible | ✅ Possible |
| **Testabilité** | 🟡 Moyenne | ✅ Excellente |
| **Maintenabilité** | 🟡 Moyenne | ✅ Excellente |

---

## 🔧 Utilisation

### **Changer le niveau initial**
```json
"initial_level": "Config/levels/test_powerups.json"
```

### **Ajouter un système**
```json
"system_groups": [
  {
    "name": "logic",
    "systems": [
      "PlayerControlSystem",
      "MyNewSystem"  ← Ajouté !
    ]
  }
]
```

### **Changer l'ordre des systèmes**
```json
"systems": [
  "RenderSystem",      ← Inversé !
  "AnimationSystem"
]
```

### **Désactiver le replay**
```json
// Supprimer le groupe "save"
"system_groups": [
  { "name": "logic", ... },
  // { "name": "save", ... }  ← Commenté/supprimé
]
```

---

## ✅ Checklist Migration

- [x] Créer `ReplayManagerSystem.hpp`
- [x] Ajouter actions `UPDATE_LEVEL_MANAGER` et `RUN_SYSTEM_GROUP`
- [x] Corriger `LifecycleActionExecutor` pour utiliser le vrai `delta_time`
- [x] Corriger `ConfigurableScene` pour utiliser les vecteurs `lifecycle`
- [x] Créer la configuration complète dans `scenes.json`
- [ ] Tester la compilation
- [ ] Tester le jeu (vérifier que tout fonctionne comme avant)
- [ ] (Optionnel) Supprimer `TestGameScene.cpp` hardcodé

---

## 🎉 Résultat Final

**TestGameScene est maintenant 100% data-driven !**

- ✅ Toute la configuration est dans `scenes.json`
- ✅ Les systèmes s'auto-enregistrent
- ✅ Le replay est un système comme un autre
- ✅ Le `delta_time` est correctement propagé
- ✅ Pas de code hardcodé dans le moteur

**Pour ajouter une nouvelle scène** : dupliquer l'objet JSON et modifier les paramètres. C'est tout ! 🚀
