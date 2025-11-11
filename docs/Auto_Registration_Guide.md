# 🚀 AUTO-REGISTRATION DES SYSTÈMES

## ✨ C'EST QUOI ?

L'auto-registration permet aux systèmes de **s'enregistrer eux-mêmes** automatiquement dans la `SystemFactory`, **SANS MODIFIER LE MOTEUR**.

## 🎯 PROBLÈME RÉSOLU

### ❌ AVANT (Mauvais)
```cpp
// Dans GameEngine/Core/RegisterSystems.cpp (DANS LE MOTEUR !)
void register_all_systems() {
    SystemFactory::register_system<MySystem>("MySystem");
    SystemFactory::register_system<NewSystem>("NewSystem");  // ← RECOMPILER LE MOTEUR !
}
```

**Problème** : Ajouter un système = recompiler le moteur = couplage fort

### ✅ MAINTENANT (Dingue)
```cpp
// Dans ton système (n'importe où dans ton projet)
class MyNewSystem : public ISystem {
public:
    MyNewSystem(std::string group) { ... }
    void run(GameEngine& e, float dt) override { ... }
    
    // ✨ UNE SEULE LIGNE MAGIQUE
    AUTO_REGISTER_SYSTEM(MyNewSystem, "MyNewSystem")
};
```

**Résultat** : Le système est automatiquement disponible dans `scenes.json` !

---

## 📖 COMMENT L'UTILISER

### **Étape 1 : Créer ton système**

```cpp
// Include/All/systems/TeleportSystem.hpp
#pragma once
#include "../interfaces/ISystem.hpp"
#include "../../GameEngine_Include/factories/SystemAutoRegister.hpp"

class TeleportSystem : public ISystem {
    std::string _registerGroup;
    
public:
    TeleportSystem(std::string registerGroup = "default") 
        : _registerGroup(registerGroup) {}
    
    void run(GameEngine& engine, float dt) override {
        // Ton code de téléportation ici
        auto& registry = engine.getRegistry(_registerGroup);
        // ...
    }
    
    // ✨ AUTO-REGISTRATION MAGIQUE ✨
    AUTO_REGISTER_SYSTEM(TeleportSystem, "TeleportSystem")
};
```

### **Étape 2 : L'utiliser dans scenes.json**

```json
{
  "scene_id": "test_scene",
  "system_groups": [
    {
      "name": "update",
      "systems": [
        "PlayerControlSystem",
        "TeleportSystem"  ← TON NOUVEAU SYSTÈME !
      ]
    }
  ]
}
```

### **Étape 3 : Compiler et BOOM ✨**

```bash
make
./rtype_client
```

**Ça marche directement !** Pas besoin de toucher au moteur !

---

## 🔍 COMMENT ÇA MARCHE (La magie expliquée)

```cpp
#define AUTO_REGISTER_SYSTEM(SystemClass, SystemName) \
    private: \
    static inline bool _auto_registered_##SystemClass = []() { \
        Engine::SystemFactory::register_system<SystemClass>(SystemName); \
        return true; \
    }();
```

### **Décortiquons** :

1. **`static inline bool _auto_registered_MySystem`** :
   - Variable statique dans la classe
   - S'initialise **AVANT main()** automatiquement
   
2. **`= []() { ... }()`** :
   - Lambda qui s'exécute immédiatement
   - S'exécute au chargement du programme
   
3. **`SystemFactory::register_system<SystemClass>(SystemName)`** :
   - Enregistre le système dans la factory
   - Le système devient disponible par son nom (string)
   
4. **`return true`** :
   - La lambda retourne true pour initialiser la variable
   - On s'en fiche de la valeur, c'est juste pour déclencher l'exécution

### **Résultat** :

```
Programme démarre
  ↓
Variables statiques s'initialisent
  ↓
Lambda AUTO_REGISTER_SYSTEM s'exécute
  ↓
Système enregistré dans SystemFactory
  ↓
main() commence
  ↓
Système disponible dans scenes.json !
```

---

## 🎮 WORKFLOW COMPLET

### **Créer un nouveau système** :

```bash
# 1. Créer le fichier
nano Include/All/systems/GravitySystem.hpp

# 2. Écrire le code
class GravitySystem : public ISystem {
    std::string _registerGroup;
public:
    GravitySystem(std::string group = "default") : _registerGroup(group) {}
    
    void run(GameEngine& engine, float dt) override {
        auto& registry = engine.getRegistry(_registerGroup);
        auto& velocities = registry.get_components<Component::Core::Velocity>();
        
        for (auto& vel : velocities) {
            if (vel) vel->dy += 9.8f * dt; // Gravité
        }
    }
    
    AUTO_REGISTER_SYSTEM(GravitySystem, "GravitySystem")  // ← LIGNE MAGIQUE
};

# 3. Ajouter dans scenes.json
{
  "systems": ["GravitySystem"]
}

# 4. Compiler et tester
make
./rtype_client
```

**C'EST TOUT !** Pas besoin de toucher au moteur, pas de RegisterSystems.cpp à modifier.

---

## ⚠️ RÈGLES IMPORTANTES

### **1. Nom du système doit correspondre**
```cpp
AUTO_REGISTER_SYSTEM(GravitySystem, "GravitySystem")
                     ↑               ↑
                     Même nom des deux côtés !
```

### **2. Include obligatoire**
```cpp
#include "../../GameEngine_Include/factories/SystemAutoRegister.hpp"
```

### **3. Constructeur avec `std::string group`**
```cpp
// ✅ BON
MySystem(std::string registerGroup = "default")

// ❌ MAUVAIS
MySystem()  // Pas de paramètre groupe !
```

### **4. La macro va dans la classe**
```cpp
class MySystem : public ISystem {
public:
    // Code...
    
    AUTO_REGISTER_SYSTEM(MySystem, "MySystem")  // ← DANS LA CLASSE
};

// ❌ PAS ICI !
```

---

## 🎉 AVANTAGES

| Avant (RegisterSystems.cpp) | Maintenant (Auto-Registration) |
|-----------------------------|---------------------------------|
| ❌ Modifier le moteur | ✅ Juste créer le système |
| ❌ Recompiler le moteur | ✅ Compiler ton projet |
| ❌ Couplage fort | ✅ Découplage total |
| ❌ Fichier central à maintenir | ✅ Chaque système autonome |
| ❌ Oublier d'enregistrer | ✅ Impossible d'oublier |

---

## 🐛 DEBUGGING

### **"System 'MySystem' not registered in factory!"**

**Solutions** :
1. Vérifier que tu as bien `AUTO_REGISTER_SYSTEM(MySystem, "MySystem")`
2. Vérifier que le .hpp est bien inclus quelque part (pas juste compilé)
3. Vérifier l'include `SystemAutoRegister.hpp`

### **Voir tous les systèmes enregistrés**

```cpp
// Dans GameEngine::initialize()
Engine::SystemFactory::print_registered_systems();
```

Affiche :
```
[SystemFactory] Registered systems (23):
  - PlayerControlSystem
  - RenderSystem
  - GravitySystem
  - ...
```

---

## 🔥 C'EST DINGUE PARCE QUE...

1. **Le moteur ne connaît pas les systèmes** → Découplage pur
2. **Ajouter un système = créer un fichier** → Workflow ultra-simple
3. **Impossible d'oublier d'enregistrer** → Sécurité
4. **Utilisable dans scenes.json immédiatement** → Data-driven parfait
5. **Pas de recompilation du moteur** → Rapidité

**Tu voulais un moteur data-driven ? VOILÀ ! 🚀**
