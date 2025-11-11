# 🎮 Guide de Test des Armes et Power-ups

## 🚀 Lancement du Test

```bash
./test_weapons.sh
```

Ce script va :
1. ✅ Compiler le projet
2. 💾 Sauvegarder le niveau actuel
3. 🎮 Charger le niveau de test
4. 🚀 Lancer le jeu
5. 🔄 Restaurer le niveau original

---

## 🎯 Timeline du Niveau de Test

### ⏱️ **0-2s** : Préparation
- Le joueur spawn
- La musique démarre
- Les parallax s'activent

### ⏱️ **3-8s** : Test SPREAD GUN
**À faire :**
1. Récupérer le power-up orange qui arrive de la droite
2. Appuyer sur **ESPACE** pour tirer
3. **Vérifier** : 3 projectiles orange en éventail (angle 15°)

**Résultat attendu :**
```
   ╱  ←  Projectile gauche
  ─── ←  Projectile centre  
   ╲  ←  Projectile droite
```

---

### ⏱️ **8-13s** : Test LASER GUN
**À faire :**
1. Récupérer le power-up laser
2. Appuyer sur **ESPACE** pour tirer
3. **Vérifier** : Un rayon rouge horizontal (800px de long)

**Résultat attendu :**
```
━━━━━━━━━━━━━━━━━ ← Rayon laser rouge
```

**Note** : Le laser a une durée de vie de 0.1s (disparaît rapidement)

---

### ⏱️ **14-18s** : Test sur CIBLES
**À faire :**
1. 5 ennemis `bydos_slave` apparaissent en ligne
2. Tester le laser sur eux
3. Observer les dégâts

**Positions des ennemis :**
```
Y=150  👾
Y=250  👾
Y=350  👾
Y=450  👾
Y=550  👾
```

**Dégâts attendus :**
- Laser : 5 dégâts/frame
- Spread : 15 dégâts/projectile
- Simple : 20 dégâts/projectile

---

### ⏱️ **19-24s** : Test HEAL
**À faire :**
1. Récupérer le premier heal (+25 HP)
2. Vérifier la barre de vie
3. Récupérer le second heal

**Résultat attendu :**
- HP avant : ex. 50/100
- Après 1er heal : 75/100
- Après 2e heal : 100/100 (cap au max)

---

### ⏱️ **25-30s** : Test SCORE
**À faire :**
1. Récupérer le premier score (+500)
2. Observer le score en haut
3. Récupérer le second score

**Résultat attendu :**
- Score initial : 0
- Après 1er : 500
- Après 2e : 1000

---

### ⏱️ **31-36s** : Test TIR CHARGÉ
**À faire :**
1. **MAINTENIR** la touche **ESPACE** pendant 1.5 secondes
2. Relâcher
3. Un gros projectile bleu doit apparaître

**Résultat attendu :**
```
Maintenir ESPACE...
  ⚡ Charge en cours...
  ⚡⚡ Charge en cours...
  ⚡⚡⚡ CHARGÉ !
  
Relâcher:
  ━━━━ ← Gros projectile bleu (40x20px, 50 dégâts)
```

**Ennemis de test :**
- 2 `bydos_shooter` à Y=200 et Y=400
- Le tir chargé doit les détruire en 1 coup

---

### ⏱️ **37-45s** : Test COMBO
**À faire :**
1. 3 power-ups apparaissent simultanément :
   - Spread Gun (Y=200)
   - Heal (Y=350)
   - Score (Y=500)
2. Les récupérer tous

**Résultat attendu :**
- Arme change en Spread
- Vie augmente de +25
- Score augmente de +500

**Puis :**
- 6 ennemis apparaissent en vague (40-41s)
- Tester le Spread Gun sur eux

---

### ⏱️ **46-50s** : Test LASER FINAL
**À faire :**
1. Récupérer le laser une dernière fois
2. Tester contre les derniers ennemis
3. Message "Tests terminés !"

---

## 🎮 Contrôles

| Touche | Action |
|--------|--------|
| **Flèches** | Déplacer le vaisseau |
| **ESPACE** | Tir normal |
| **ESPACE (maintenu)** | Charger le tir |
| **ESC** | Quitter |

---

## ✅ Checklist de Test

### Armes
- [ ] **Default Gun** : Tir simple fonctionne
- [ ] **Spread Gun** : 3 projectiles en éventail
- [ ] **Laser Gun** : Rayon horizontal rouge
- [ ] **Tir chargé** : Gros projectile bleu après 1.5s

### Power-ups
- [ ] **CHANGE_WEAPON (Spread)** : Change l'arme en Spread
- [ ] **CHANGE_WEAPON (Laser)** : Change l'arme en Laser
- [ ] **HEAL** : Augmente la vie de +25
- [ ] **ADD_SCORE** : Augmente le score de +500

### Interactions
- [ ] Les projectiles détruisent les ennemis
- [ ] La collision avec les power-ups les consomme
- [ ] Le changement d'arme est instantané
- [ ] La musique joue en boucle

### Visuel
- [ ] Parallax fonctionne (2 couches)
- [ ] Animations des ennemis
- [ ] Formes des projectiles correctes
- [ ] Barre de vie s'affiche et se met à jour

---

## 🐛 Problèmes Potentiels

| Problème | Cause Possible | Solution |
|----------|----------------|----------|
| Pas de projectiles | `WeaponSystem` pas enregistré | Vérifier `TestGameScene.cpp` |
| Pas de power-ups | Collision désactivée | Vérifier `PowerUpSystem` |
| Pas de musique | Fichier manquant | Vérifier `Assets/sounds/` |
| Crash au spawn | Archétype invalide | Vérifier `archetypes.json` |

---

## 📊 Résultats Attendus

À la fin du test (60s), vous devriez avoir :

- ✅ Testé **3 armes** différentes
- ✅ Testé le **tir chargé**
- ✅ Récupéré **2 heals**
- ✅ Récupéré **2 scores**
- ✅ Changé d'arme **3 fois**
- ✅ Détruit **~15 ennemis**
- ✅ Score final : **1000+** (ennemis + power-ups)

---

## 🎯 Validation

Le système est **validé** si :
1. ✅ Tous les power-ups sont récupérables
2. ✅ Toutes les armes fonctionnent visuellement
3. ✅ Les dégâts sont appliqués
4. ✅ Aucun crash durant les 60 secondes
5. ✅ La musique joue sans interruption

---

**Bon test ! 🚀🎮**
