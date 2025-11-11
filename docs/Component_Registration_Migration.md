# 🔧 Migration de l'enregistrement des composants

## Contexte

Les composants ECS sont maintenant enregistrés **automatiquement** dans le **constructeur du Registry** au lieu d'être enregistrés manuellement dans chaque scène.

## ✅ Ce qui a été fait

### 1. **Registry.hpp** - Enregistrement automatique
Tous les composants sont maintenant enregistrés dans le constructeur du `Registry` :

```cpp
Registry() {
    // Core Components
    this->register_component<Component::Core::Position>();
    this->register_component<Component::Core::Velocity>();
    this->register_component<Component::Core::Scale>();
    this->register_component<Component::Core::Rotation>();
    this->register_component<Component::Core::Hitbox>();

    // Gameplay Components
    this->register_component<Component::Gameplay::PlayerTag>();
    this->register_component<Component::Gameplay::Damage>();
    this->register_component<Component::Gameplay::Controllable>();
    this->register_component<Component::Gameplay::EnemyTag>();
    this->register_component<Component::Gameplay::MissileTag>();
    this->register_component<Component::Gameplay::ParallaxLayer>();
    this->register_component<Component::Gameplay::AI>();
    this->register_component<Component::Gameplay::Health>();
    this->register_component<Component::Gameplay::Score>();
    this->register_component<Component::Gameplay::Dead>();
    this->register_component<Component::Gameplay::Shooter>();
    this->register_component<Component::Gameplay::Weapon>();
    this->register_component<Component::Gameplay::PowerUp>();
    this->register_component<Component::Gameplay::TimedLifespan>();
    
    // Graphics Components
    this->register_component<Component::Graphics::Sprite>();
    this->register_component<Component::Graphics::Animation>();
    this->register_component<Component::Graphics::RectangleShape>();
    this->register_component<Component::Graphics::CircleShape>();

    // UI Components
    this->register_component<Component::UI::HealthBar>();
    
    // Audio Components
    this->register_component<Component::Audio::SoundEffect>();
    this->register_component<Component::Audio::Music>();
}
```

### 2. **Scènes nettoyées**
- ✅ `TestGameScene.cpp` - Enregistrements supprimés
- ✅ `OnlineClientGameScene.cpp` - Enregistrements supprimés

## ⚠️ Scènes à nettoyer (optionnel)

Les scènes suivantes contiennent encore des enregistrements redondants qui peuvent être supprimés :

- `All_src/scenes/WinScene.cpp`
- `All_src/scenes/ScoreScene.cpp`
- `All_src/scenes/LoseScene.cpp`
- `All_src/scenes/Online_GameScene_server.cpp`
- `All_src/scenes/CreateRoomScene.cpp`
- `All_src/scenes/OnlineModeScene.cpp`
- `All_src/scenes/MenuScene.cpp`

**Note** : Ces enregistrements ne posent pas de problème (appeler `register_component` deux fois est sans effet), mais peuvent être supprimés pour un code plus propre.

## 📝 Pour nettoyer une scène

Remplacer :
```cpp
// Enregistrer tous les composants
registry.register_component<Component::Core::Position>();
registry.register_component<Component::Core::Velocity>();
// ... (toutes les autres lignes)
```

Par :
```cpp
// Les composants sont maintenant enregistrés automatiquement dans le constructeur du Registry
```

## 🎯 Avantages de cette approche

1. **DRY (Don't Repeat Yourself)** - Un seul endroit pour l'enregistrement
2. **Moins d'oublis** - Impossible d'oublier un composant
3. **Code plus propre** - Les scènes sont plus lisibles
4. **Maintenance facile** - Ajouter un nouveau composant se fait en un seul endroit

## ⚡ Ajouter un nouveau composant

Maintenant, pour ajouter un nouveau composant global :

1. Définir le composant dans `Component.hpp`
2. L'ajouter au constructeur du `Registry` dans `Registry.hpp`
3. C'est tout ! Pas besoin de modifier les scènes.

---

**Date** : 30 octobre 2025  
**Statut** : ✅ Migration fonctionnelle, nettoyage optionnel en cours
