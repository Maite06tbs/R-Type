# 📦 Système d'Archetypes avec Références Externes

## 🎯 Objectif

Améliorer l'organisation du fichier `archetypes.json` en permettant d'externaliser certaines sections dans des fichiers séparés.

## 🔧 Comment ça marche ?

### Avant (tout dans un seul fichier)

```json
{
  "projectiles": {
    "bullet_1": { "components": {...} },
    "bullet_2": { "components": {...} },
    ...
    // 200 autres projectiles
  },
  "enemies": {
    "enemy_1": { "components": {...} },
    ...
  }
}
```

### Après (avec références externes)

**Config/archetypes.json** :
```json
{
  "projectiles": "Config/archetypes/projectiles.json",
  "enemies": "Config/archetypes/enemies.json",
  "player": {
    "player_ship": { "components": {...} }
  }
}
```

**Config/archetypes/projectiles.json** :
```json
{
  "bullet_1": { "components": {...} },
  "bullet_2": { "components": {...} },
  ...
}
```

## 🚀 Utilisation

### Chargement automatique

Le `GameEngine` détecte automatiquement les références et charge les fichiers externes :

```cpp
gameEngine.load_archetypes("Config/archetypes.json");

// Le fichier projectiles.json est chargé automatiquement
// On peut l'utiliser comme avant :
gameEngine.spawn_from_archetype("projectiles.default_bullet");
```

### Résolution récursive

Les fichiers externes peuvent eux-mêmes contenir des références :

**Config/archetypes/projectiles.json** :
```json
{
  "player_projectiles": "Config/archetypes/projectiles/player.json",
  "enemy_projectiles": "Config/archetypes/projectiles/enemy.json"
}
```

Le système résout toutes les références récursivement.

## ✅ Avantages

1. **Organisation** : Séparer les archetypes par catégorie logique
2. **Maintenance** : Plus facile de trouver et modifier un archetype spécifique
3. **Collaboration** : Plusieurs personnes peuvent travailler sur différents fichiers sans conflit Git
4. **Performance** : Chargement paresseux possible (future amélioration)
5. **Modularité** : Réutiliser des archetypes entre projets

## 📁 Structure recommandée

```
Config/
├── archetypes.json                 # Fichier principal avec références
└── archetypes/
    ├── player.json                 # Archetypes du joueur
    ├── enemies.json                # Tous les ennemis
    ├── bosses.json                 # Boss spéciaux
    ├── projectiles/
    │   ├── player.json             # Projectiles du joueur
    │   └── enemy.json              # Projectiles ennemis
    ├── powerups.json               # Power-ups
    ├── scenery.json                # Décors et parallax
    └── audio.json                  # Musiques et sons
```

## 🔍 Exemple complet

**Config/archetypes.json** :
```json
{
  "player": "Config/archetypes/player.json",
  "enemies": "Config/archetypes/enemies.json",
  "projectiles": "Config/archetypes/projectiles.json",
  "powerups": "Config/archetypes/powerups.json"
}
```

**Config/archetypes/projectiles.json** :
```json
{
  "default_bullet": {
    "components": {
      "Position": {},
      "Velocity": { "dx": 300, "dy": 0 },
      "CircleShape": {
        "radius": 5.0,
        "color": [0, 200, 255, 255]
      },
      "Hitbox": { "width": 10, "height": 10 },
      "Damage": { "amount": 20 },
      "MissileTag": { "owner": "PLAYER" }
    }
  }
}
```

**Utilisation dans le code** :
```cpp
// Chargement (automatique)
gameEngine.load_archetypes("Config/archetypes.json");

// Spawn (identique qu'avant)
Entity bullet = gameEngine.spawn_from_archetype("projectiles.default_bullet");
```

## 🛠️ Implémentation

La fonction `resolve_archetype_references()` dans `GameEngine.hpp` :

1. Parcourt le JSON chargé
2. Détecte les valeurs de type `string` (chemins de fichiers)
3. Charge le fichier externe
4. Résout récursivement les références dans ce fichier
5. Remplace la référence par le contenu chargé
6. Retourne le JSON complètement résolu

## ⚠️ Notes importantes

- Les chemins sont relatifs au répertoire d'exécution
- Les fichiers doivent être au format JSON valide
- Les références circulaires causeront une boucle infinie (à améliorer)
- Le fichier final est reconstruit en mémoire (pas de fichier temporaire)
