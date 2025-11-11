# 🎮 Guide de Test Complet - Tous les PowerUps

## 🚀 Lancement du test

```bash
./kev_test.sh
# Puis dans TestApplication, changer le niveau vers "test_all_powerups"
```

---

## 📋 Liste des PowerUps à tester

| Type | Nom | Sprite | Effet attendu |
|------|-----|--------|---------------|
| **HEAL** | `heal_pickup_small` | r-typesheet30.gif (vert) | +25 HP |
| **ADD_SCORE** | `score_pickup_bronze` | r-typesheet31.gif (jaune) | +500 points |
| **CHANGE_WEAPON** | `spreadshot_pickup` | r-typesheet33.gif (orange) | Arme Spread (3 balles) |
| **CHANGE_WEAPON** | `laser_pickup` | r-typesheet32.gif (bleu) | Arme Laser |

---

## 🎯 Timeline du Test (45 secondes)

### **PHASE 1: HEAL (0-10s)** ❤️
| Temps | Événement | Test |
|-------|-----------|------|
| **2s** | Heal pickup haut (y=200) | ✅ Vérifier +25 HP dans la console |
| **3s** | Ennemi basique (y=250) | Se faire toucher pour perdre HP |
| **4s** | Heal pickup milieu (y=300) | ✅ Vérifier que HP augmente |
| **5s** | Ennemi basique (y=350) | Perdre encore du HP |
| **6s** | Heal pickup bas (y=400) | ✅ Vérifier guérison |

**✅ Checklist HEAL:**
- [ ] Le sprite vert apparaît
- [ ] HP augmente de +25 au contact
- [ ] Message console: "Player healed by 25 HP"
- [ ] HP ne dépasse pas max_hp (100)
- [ ] Collision détectée correctement

---

### **PHASE 2: SCORE (10-20s)** ⭐
| Temps | Événement | Test |
|-------|-----------|------|
| **11s** | Score bronze (y=150) | ✅ +500 points |
| **13s** | Score bronze (y=250) | ✅ +500 points (total: 1000) |
| **15s** | Score bronze (y=350) | ✅ +500 points (total: 1500) |
| **17s** | Score bronze (y=450) | ✅ +500 points (total: 2000) |
| **19s** | Score bronze (y=300) | ✅ +500 points (total: 2500) |

**✅ Checklist SCORE:**
- [ ] Le sprite jaune/bronze apparaît
- [ ] Score augmente de +500 au contact
- [ ] Message console: "Score increased by 500"
- [ ] Score s'affiche correctement à l'écran
- [ ] 5 pickups = 2500 points au total

---

### **PHASE 3: SPREAD GUN (20-30s)** 🔫
| Temps | Événement | Test |
|-------|-----------|------|
| **21s** | Spread Gun pickup (y=300) | ✅ Changement d'arme |
| **23-24s** | 3 ennemis basiques | Tester l'éventail de tir |
| **25-26s** | 2 ennemis sinusoïdaux | Tester contre cibles mobiles |

**✅ Checklist SPREAD GUN:**
- [ ] Le sprite orange apparaît
- [ ] Au contact: changement d'arme instantané
- [ ] Message console: "Weapon changed to spread_gun"
- [ ] Chaque tir tire **3 projectiles** en éventail
- [ ] Angle d'éventail: ~15° entre chaque balle
- [ ] Peut toucher plusieurs ennemis simultanément
- [ ] Fire rate: 0.3s entre chaque salve

---

### **PHASE 4: LASER GUN (30-40s)** ⚡
| Temps | Événement | Test |
|-------|-----------|------|
| **31s** | Laser pickup (y=300) | ✅ Changement d'arme |
| **33-34.5s** | 4 ennemis basiques | Tester le laser |
| **35-36s** | 2 ennemis sinusoïdaux | Tester dégâts continus |

**✅ Checklist LASER GUN:**
- [ ] Le sprite bleu/cyan apparaît
- [ ] Au contact: changement d'arme
- [ ] Message console: "Weapon changed to laser_gun"
- [ ] Tir laser continu (pas de projectiles séparés)
- [ ] Forme: ligne/rectangle (width: 100+, height: 5-10)
- [ ] Peut toucher plusieurs ennemis alignés
- [ ] Dégâts continus sur toute la longueur

---

### **PHASE 5: MIX - TOUS EN MÊME TEMPS (40-45s)** 🎁
| Temps | Événement | Test |
|-------|-----------|------|
| **41s** | **4 powerups simultanés** | Test de priorité |
| | - Heal (y=150) | ✅ Heal d'abord |
| | - Score (y=250) | ✅ Score ensuite |
| | - Spread Gun (y=350) | ✅ Change arme |
| | - Laser (y=450) | ✅ Re-change arme |
| **43-44s** | Vague finale d'ennemis | Tester arme finale |

**✅ Checklist MIX:**
- [ ] Les 4 pickups apparaissent en colonne
- [ ] Possibilité de les ramasser tous rapidement
- [ ] Heal fonctionne même avec autre powerup
- [ ] Score s'additionne correctement
- [ ] Dernier weapon pickup gagne (Laser écrase Spread)
- [ ] Aucun crash ou comportement étrange

---

## 🔍 Points de vérification détaillés

### **1. Collision & Pickup**
```bash
# Messages console attendus:
"PowerUp collected: HEAL"
"Player healed by 25 HP"
"PowerUp collected: ADD_SCORE"
"Score increased by 500"
"PowerUp collected: CHANGE_WEAPON"
"Weapon changed to spread_gun"
```

### **2. Système de santé (HEAL)**
- [ ] HP actuel affiché (ex: 75/100)
- [ ] Heal ne dépasse jamais max_hp
- [ ] Si HP = 100, heal fonctionne quand même (pickup disparaît)
- [ ] Barre de vie verte se met à jour visuellement

### **3. Système de score (ADD_SCORE)**
- [ ] Score affiché en haut à droite (ou position définie)
- [ ] Incrémentation instantanée au pickup
- [ ] Format: "Score: 2500" ou similaire
- [ ] Pas de limite de score

### **4. Système d'armes (CHANGE_WEAPON)**
- [ ] Indicateur d'arme actuelle (texte ou icône)
- [ ] Changement instantané au pickup
- [ ] Ancienne arme remplacée (pas de stack)
- [ ] Pattern de tir change immédiatement
- [ ] Fire rate respecté pour nouvelle arme

---

## 🐛 Bugs potentiels à surveiller

| Symptôme | Cause possible | Fix |
|----------|----------------|-----|
| PowerUp ne disparaît pas | Collision non détectée | Vérifier Hitbox overlap |
| HP dépasse 100 | Pas de clamp | Ajouter `std::min(hp, max_hp)` |
| Score ne s'affiche pas | UIText non mis à jour | Update dans ScoreSystem |
| Arme ne change pas | Component non appliqué | Vérifier PowerUpSystem |
| Crash au pickup | Composant manquant | Vérifier has_component() |
| Multiple pickups = crash | Race condition | Ordre de destruction |

---

## 📊 Résultats attendus après 45s

| Métrique | Valeur attendue |
|----------|-----------------|
| **HP** | ~75-100 (selon dégâts pris) |
| **Score** | 2500 minimum (5 score pickups) |
| **Arme finale** | Laser Gun (dernier pickup) |
| **Ennemis tués** | ~10-15 |
| **Powerups ramassés** | 12 au total |

---

## 🎮 Commandes de debug (optionnel)

Si vous voulez ajouter des commandes de test:

```cpp
// Dans TestGameScene.cpp
if (input.isKeyPressed(Key::F1)) {
    spawn_from_archetype("powerups.heal_pickup_small", group, {100, 300});
}
if (input.isKeyPressed(Key::F2)) {
    spawn_from_archetype("powerups.score_pickup_bronze", group, {100, 300});
}
if (input.isKeyPressed(Key::F3)) {
    spawn_from_archetype("powerups.spreadshot_pickup", group, {100, 300});
}
if (input.isKeyPressed(Key::F4)) {
    spawn_from_archetype("powerups.laser_pickup", group, {100, 300});
}
```

---

## 📝 Rapport de test

Après avoir testé, remplissez:

### ✅ PowerUps fonctionnels
- [ ] HEAL
- [ ] ADD_SCORE  
- [ ] CHANGE_WEAPON (Spread)
- [ ] CHANGE_WEAPON (Laser)

### ❌ Bugs trouvés
1. ...
2. ...

### 💡 Améliorations suggérées
1. ...
2. ...

---

## 🔄 Itération suivante

Après validation de tous les powerups:
1. Ajouter des effets visuels (particules au pickup)
2. Ajouter des sons (SoundEffect au contact)
3. Créer de nouveaux types de powerups
4. Ajouter des powerups temporaires (timer)
5. Système de combo (plusieurs pickups rapides)

**Bon test! 🚀**
