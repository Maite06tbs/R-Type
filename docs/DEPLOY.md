# 🚀 Déploiement de la Documentation sur GitHub Pages

Ce guide explique comment déployer la documentation VitePress sur GitHub Pages.

## ✅ Prérequis

- Repository GitHub public
- Accès aux paramètres du repository

## 📋 Étapes de Configuration

### 1. Activer GitHub Pages

1. Allez dans **Settings** → **Pages** de votre repository GitHub
2. Dans **Build and deployment**, sélectionnez :
   - **Source**: `GitHub Actions`
   - (Ne PAS choisir "Deploy from a branch")

### 2. Vérifier le fichier de configuration

Le fichier `.vitepress/config.ts` doit avoir le bon `base` :

```typescript
export default defineConfig({
  base: '/R-Type/',  // ⚠️ Doit correspondre au nom de votre repo
  // ...
})
```

**Important** : Le `base` doit être `/nom-du-repo/` (avec les slashes et la majuscule exacte).

### 3. Pousser sur GitHub

```bash
git add .
git commit -m "fix: update documentation links for GitHub Pages"
git push origin main
```

### 4. Vérifier le déploiement

1. Allez dans l'onglet **Actions** de votre repo
2. Attendez que le workflow "Deploy VitePress site to Pages" se termine (environ 1-2 min)
3. Une fois terminé, votre doc sera disponible à :
   ```
   https://<username>.github.io/R-Type/
   ```

## 🔧 Développement Local

Pour tester la doc localement avant de déployer :

```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev (avec hot-reload)
npm run dev

# Build pour production (teste les liens cassés)
npm run build

# Prévisualiser le build de production
npm run preview
```

## ✅ Checklist Finale

- [ ] GitHub Pages activé avec source "GitHub Actions"
- [ ] `base: '/R-Type/'` correctement configuré
- [ ] Tous les liens internes utilisent `.md` (ex: `/DEVELOPER.md`)
- [ ] `npm run build` fonctionne sans erreur
- [ ] Code pushé sur `main`
- [ ] Workflow GitHub Actions passé avec succès

## 🐛 Problèmes Courants

### Les liens ne fonctionnent pas (404)

**Cause** : `base` incorrect dans `config.ts`  
**Solution** : Vérifiez que `base: '/R-Type/'` correspond exactement au nom du repo

### Les pages ne s'affichent pas

**Cause** : GitHub Pages pas activé ou mal configuré  
**Solution** : Settings → Pages → Source → GitHub Actions

### Les fichiers .md ne sont pas trouvés

**Cause** : Liens sans extension `.md`  
**Solution** : Utilisez toujours `/path/to/file.md` dans les liens

### Le workflow échoue

**Cause** : Liens cassés détectés par VitePress  
**Solution** : Lancez `npm run build` localement pour voir les erreurs

## 📚 Ressources

- [Documentation VitePress](https://vitepress.dev/)
- [GitHub Pages avec Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)
