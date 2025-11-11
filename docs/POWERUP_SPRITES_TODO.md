# 🎁 Guide de Remplacement des Sprites de PowerUps

## 📋 Liste des PowerUps et Sprites à Créer/Trouver

### ✅ PowerUps Fonctionnels

#### 1. **Spreadshot Pickup** (Arme Multi-tir)
- **Fichier à créer**: `Assets/sprites/powerup_spreadshot.png`
- **Dimensions**: 32x32 pixels par frame
- **Animation**: 4 frames (spritesheet horizontal 128x32)
- **Hitbox**: 28x28
- **Effet**: Change l'arme en spread gun (tir en éventail)
- **Couleur suggérée**: Orange/Rouge (représente le tir multiple)

#### 2. **Heal Pickup Small** (Petit Soin)
- **Fichier à créer**: `Assets/sprites/powerup_health.png`
- **Dimensions**: 24x24 pixels par frame
- **Animation**: 6 frames (spritesheet horizontal 144x24)
- **Hitbox**: 20x20
- **Effet**: +25 HP
- **Couleur suggérée**: Vert/Croix rouge (symbole médical)

#### 3. **Heal Pickup Large** (Gros Soin)
- **Fichier à créer**: `Assets/sprites/powerup_health_large.png`
- **Dimensions**: 32x32 pixels par frame
- **Animation**: 6 frames (spritesheet horizontal 192x32)
- **Hitbox**: 28x28
- **Effet**: +50 HP
- **Couleur suggérée**: Vert brillant (plus grand que le small)

#### 4. **Score Pickup Bronze** (Points Bronze)
- **Fichier à créer**: `Assets/sprites/powerup_score_bronze.png`
- **Dimensions**: 16x16 pixels par frame
- **Animation**: 8 frames (spritesheet horizontal 128x16)
- **Hitbox**: 14x14
- **Effet**: +500 points
- **Couleur suggérée**: Bronze/Marron/Cuivre (petite gemme)

#### 5. **Score Pickup Silver** (Points Argent)
- **Fichier à créer**: `Assets/sprites/powerup_score_silver.png`
- **Dimensions**: 20x20 pixels par frame
- **Animation**: 8 frames (spritesheet horizontal 160x20)
- **Hitbox**: 18x18
- **Effet**: +1000 points
- **Couleur suggérée**: Argent/Gris brillant (gemme moyenne)

#### 6. **Score Pickup Gold** (Points Or)
- **Fichier à créer**: `Assets/sprites/powerup_score_gold.png`
- **Dimensions**: 24x24 pixels par frame
- **Animation**: 8 frames (spritesheet horizontal 192x24)
- **Hitbox**: 22x22
- **Effet**: +2500 points
- **Couleur suggérée**: Or/Jaune brillant (grosse gemme)

#### 7. **Laser Pickup** (Arme Laser)
- **Fichier à créer**: `Assets/sprites/powerup_laser.png`
- **Dimensions**: 32x16 pixels par frame
- **Animation**: 4 frames (spritesheet horizontal 128x16)
- **Hitbox**: 28x14
- **Effet**: Change l'arme en laser gun
- **Couleur suggérée**: Bleu/Cyan (représente le laser)

#### 8. **Shield Pickup** (Bouclier/Full Heal)
- **Fichier à créer**: `Assets/sprites/powerup_shield.png`
- **Dimensions**: 28x28 pixels par frame
- **Animation**: 6 frames (spritesheet horizontal 168x28)
- **Hitbox**: 24x24
- **Effet**: +100 HP (full heal)
- **Couleur suggérée**: Bleu/Violet (bouclier protecteur)

#### 9. **Speed Boost Pickup** (Bonus Vitesse)
- **Fichier à créer**: `Assets/sprites/powerup_speed.png`
- **Dimensions**: 20x20 pixels par frame
- **Animation**: 4 frames (spritesheet horizontal 80x20)
- **Hitbox**: 18x18
- **Effet**: +300 points (temporaire, pas encore implémenté la vitesse)
- **Couleur suggérée**: Jaune/Éclair (représente la vitesse)

---

## 🎨 Recommandations Artistiques

### Format des Sprites
- **Format**: PNG avec transparence
- **Layout**: Spritesheet horizontal (toutes les frames côte à côte)
- **Exemple**: Pour 4 frames de 32x32 → Image finale: 128x32 pixels

### Style Visuel
1. **Lisible**: Doit être visible sur fond spatial sombre
2. **Animé**: Rotation, pulsation, ou scintillement pour attirer l'œil
3. **Distinct**: Chaque type doit être facilement reconnaissable
4. **Cohérent**: Style uniforme avec le reste du jeu

### Animations Suggérées
- **Rotation**: Pour les armes (spreadshot, laser)
- **Pulsation**: Pour les soins (scale up/down)
- **Scintillement**: Pour les scores (opacity variation)
- **Glow**: Pour les items rares (shield, speed)

---

## 🔧 Comment Modifier les Valeurs

### Fichier: `Config/archetypes.json`

Pour chaque powerup, tu peux modifier:

```json
"Sprite": { 
  "texture_path": "Assets/sprites/TON_FICHIER.png",  // ← Chemin de ton sprite
  "frame_width": 32,                                  // ← Largeur d'une frame
  "frame_height": 32,                                 // ← Hauteur d'une frame
  "z_index": 20                                       // ← Profondeur (20 = au dessus du reste)
},
"Animation": { 
  "start_frame": 0,                                   // ← Frame de départ (généralement 0)
  "num_frames": 4,                                    // ← Nombre de frames dans ton spritesheet
  "duration": 0.15,                                   // ← Durée de chaque frame (secondes)
  "loops": true                                       // ← L'animation boucle infiniment
},
"Hitbox": { 
  "width": 28,                                        // ← Largeur de la zone de collision
  "height": 28                                        // ← Hauteur de la zone de collision
}
```

---

## 🧪 Comment Tester

1. Place ton sprite dans `Assets/sprites/`
2. Modifie `Config/archetypes.json` avec les bonnes valeurs
3. Lance `./kev_test.sh`
4. Les powerups apparaissent automatiquement dans le niveau de test

### Niveau de Test Actuel
`Config/levels/test_powerups.json` spawn automatiquement:
- **T=3s**: spreadshot_pickup
- **T=6s**: heal_pickup_small  
- **T=9s**: score_pickup_bronze
- **T=12s**: laser_pickup

---

## 📝 Notes Importantes

### Sprites Actuels (Temporaires)
Les fichiers avec `r-typesheet*.gif` sont des placeholders. Remplace-les par de vraies textures!

### Si Tu N'as Pas de Sprite
Tu peux temporairement:
1. Utiliser un RectangleShape ou CircleShape au lieu de Sprite
2. Copier un sprite existant pour tester
3. Créer un placeholder simple avec GIMP/Photoshop

### Exemple Sans Sprite (Utiliser une Shape)
```json
"heal_pickup_test": {
  "components": {
    "Position": {},
    "Velocity": { "dx": -50 },
    "CircleShape": { "radius": 12, "color": [0, 255, 0, 255] },  // Cercle vert
    "Hitbox": { "width": 24, "height": 24 },
    "PowerUp": {
      "type": "HEAL",
      "data": { "amount": 25 }
    }
  }
}
```

---

## ✅ Checklist de Validation

- [ ] Le sprite est au bon format (PNG transparent)
- [ ] Les dimensions correspondent (frame_width x frame_height)
- [ ] L'animation a le bon nombre de frames
- [ ] La hitbox est légèrement plus petite que le sprite (pour tolérance)
- [ ] Le powerup est visible en jeu
- [ ] La collision fonctionne (le joueur peut le ramasser)
- [ ] L'effet s'applique correctement (heal/weapon/score)

---

**Bon courage! 🚀**
