# 🎮 Guide de Test - Système d'Armement et Power-Ups

## 🚀 Lancement du test

```bash
./kev_test.sh && ./YourExecutableName
```

---

## 🎯 Scénario de test

### **Timeline du niveau `test_weapons.json`**

| Temps | Événement | Description |
|-------|-----------|-------------|
| **0s** | Début | Le joueur spawn avec l'arme par défaut (SIMPLE) |
| **3s** | 🔫 Spread Shot | Power-up orange (r-typesheet33.gif) |
| **6s** | ⚡ Laser | Power-up bleu (r-typesheet32.gif) |
| **9s** | ❤️ Heal | Power-up vert (r-typesheet30.gif) |
| **12s** | ⭐ Score | Power-up jaune (r-typesheet31.gif) |
| **15s** | 🎁 Tous les power-ups | 4 power-ups simultanés à différentes hauteurs |
| **20-22s** | 👾 Ennemis | Test des armes contre des cibles |
| **25-26s** | 🔫 Armes finales | Derniers power-ups pour tester |
| **30s** | 🏆 Victoire | Fin du niveau |

---

## 🕹️ Contrôles

- **Flèches directionnelles** : Déplacer le vaisseau
- **Espace (maintenir)** : Charger un tir
- **Espace (relâcher)** : Tir chargé (si arme compatible)
- **Espace (tap)** : Tir normal

---

## ✅ Tests à effectuer

### **1. Arme par défaut (SIMPLE)**
- [ ] Au démarrage, le joueur tire des balles simples rouges
- [ ] **Tir normal** : Petites balles rouges (CircleShape, radius 5)
- [ ] **Tir chargé** : Maintenir Espace > 0.5s puis relâcher
  - Doit tirer un faisceau bleu (RectangleShape 40x20)
  - Dégâts : 50 (vs 20 pour tir normal)

### **2. Spread Gun (SPREAD)**
- [ ] Ramasser le power-up orange à 3s
- [ ] Le tir change automatiquement
- [ ] Chaque tir crée **3 balles** en éventail (15° d'angle)
- [ ] Les balles sont oranges (CircleShape, radius 4)
- [ ] Dégâts : 15 par balle

### **3. Laser Gun (LASER)**
- [ ] Ramasser le power-up bleu/rouge à 6s
- [ ] Le tir change pour un laser
- [ ] Chaque tir crée un **rayon continu** rouge (RectangleShape 800x10)
- [ ] Le laser a une **durée de vie courte** (0.1s - TimedLifespan)
- [ ] Dégâts continus : 5 par frame

### **4. Power-Up HEAL**
- [ ] Ramasser le power-up vert à 9s
- [ ] **Pré-requis** : Se faire toucher par un ennemi pour perdre des HP
- [ ] Vérifier que la barre de vie se remplit de **25 HP**
- [ ] Ne doit PAS dépasser max_hp (100)

### **5. Power-Up SCORE**
- [ ] Ramasser le power-up jaune à 12s
- [ ] Le score augmente de **500 points**
- [ ] Visible dans le composant Score du joueur

### **6. Test de changement d'arme rapide**
À 15s, 4 power-ups apparaissent :
- [ ] Ramasser Spread → Tir en éventail
- [ ] Ramasser Laser → Changement de tir
- [ ] Ramasser à nouveau Spread → Retour au spread
- [ ] L'**ancienne arme est détruite** à chaque changement

### **7. Test contre ennemis (20-22s)**
- [ ] Tester chaque type d'arme contre les ennemis
- [ ] Vérifier que les dégâts sont appliqués
- [ ] Vérifier que les ennemis meurent
- [ ] Vérifier que le score augmente

---

## 🐛 Points de vigilance

### **Vérifications visuelles**
- ✅ Les power-ups sont **visibles** (sprites GIF)
- ✅ Les power-ups **se déplacent vers la gauche** (-50 dx)
- ✅ Les projectiles ont la **bonne couleur et forme**
- ✅ Les collisions fonctionnent correctement

### **Vérifications techniques**
- ✅ Pas de crash lors du changement d'arme
- ✅ Le `MusicSystem` joue la musique de fond
- ✅ Le `WeaponSystem` exécute les patterns correctement
- ✅ Le `PowerUpSystem` détruit le power-up après ramassage
- ✅ Le `LifespanSystem` détruit le laser après 0.1s

### **Console logs attendus**
```
PlayerShootingSystem: Player has no weapon. Forging default gun...
WeaponSystem: Firing 'projectiles.player_bullet_simple' with pattern 0
WeaponSystem: Firing CHARGED SHOT (projectiles.player_charged_beam)
POWERUP: Changing weapon to weapons.spread_gun
WeaponSystem: Firing 'projectiles.player_spread_shot' with pattern 1
```

---

## 📊 Tableau de résultats

| Test | Résultat | Notes |
|------|----------|-------|
| Arme SIMPLE (normal) | ⬜ | |
| Arme SIMPLE (chargé) | ⬜ | |
| Arme SPREAD | ⬜ | |
| Arme LASER | ⬜ | |
| Power-Up HEAL | ⬜ | |
| Power-Up SCORE | ⬜ | |
| Changement d'arme | ⬜ | |
| Combat contre ennemis | ⬜ | |
| Musique de fond | ⬜ | |

---

## 🔄 Retour au niveau normal

Pour revenir au niveau principal après les tests :

```cpp
// Dans All_src/scenes/TestGameScene.cpp ligne 48
levelManager.load("Config/levels/level_1.json");
```

---

## 🎓 Résultats attendus

Si tout fonctionne :
- ✅ **3 patterns d'arme** distincts et fonctionnels
- ✅ **Tir chargé** opérationnel (arme par défaut)
- ✅ **3 types de power-ups** (CHANGE_WEAPON, HEAL, ADD_SCORE)
- ✅ Système **100% data-driven** (tout dans le JSON)
- ✅ Aucun crash, aucune erreur

---

**Date de création** : 30 octobre 2025  
**Niveau de test** : `Config/levels/test_weapons.json`  
**Durée du test** : ~30 secondes
