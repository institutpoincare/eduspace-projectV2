# 🔙 Guide d'utilisation du Bouton Retour Global

## ✅ Fonctionnalité ajoutée !

J'ai créé une fonction **globale** `goBack()` qui permet de revenir en arrière sur toutes les pages.

---

## 🎯 Comment l'utiliser

### Méthode 1 : Avec `data-back-btn` (Automatique)

Ajoute simplement l'attribut `data-back-btn` à n'importe quel bouton :

```html
<button data-back-btn class="p-2 hover:bg-gray-100 rounded-lg">
  <i data-lucide="arrow-left" class="w-6 h-6"></i>
</button>
```

Le système détectera automatiquement ce bouton et lui ajoutera la fonctionnalité de retour.

---

### Méthode 2 : Avec `onclick` (Manuel)

Tu peux aussi appeler directement la fonction :

```html
<button onclick="goBack()" class="btn-retour">← Retour</button>
```

---

## 🔧 Comment ça fonctionne ?

La fonction `goBack()` est intelligente :

1. **Si il y a un historique** → Utilise `window.history.back()`
2. **Si pas d'historique** → Redirige vers le dashboard selon le rôle :
   - Formateur → `/pages/formateur/dashboard.html`
   - Étudiant → `/pages/etudiant/dashboard.html`
   - Parent → `/pages/parent/dashboard.html`
   - Autre → `/index.html`

---

## 📝 Exemples d'utilisation

### Dans un header de page :

```html
<header class="flex items-center gap-4 p-4">
  <button data-back-btn class="p-2 hover:bg-gray-100 rounded-full">
    <i data-lucide="arrow-left"></i>
  </button>
  <h1>Ma Page</h1>
</header>
```

### Dans un modal :

```html
<div class="modal-header">
  <button data-back-btn>Annuler</button>
  <h2>Titre du Modal</h2>
</div>
```

### Bouton stylisé :

```html
<button data-back-btn class="px-4 py-2 bg-blue-600 text-white rounded-lg">
  <i data-lucide="arrow-left" class="w-4 h-4 inline"></i>
  Retour
</button>
```

---

## 🎨 Styles recommandés

```css
/* Bouton retour simple */
.btn-back {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
}

/* Bouton retour avec icône */
.btn-back-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

## 🚀 Pages où l'ajouter

Ajoute le bouton retour sur :

1. **Pages de création/édition** :

   - `enregistre.html` (création de cours)
   - `profile.html` (profil)
   - `class-dashboard.html` (gestion de classe)

2. **Pages de détails** :

   - `course-view.html` (vue du cours)
   - Toutes les pages de visualisation

3. **Modals et formulaires** :
   - Formulaires d'inscription
   - Modals de configuration

---

## ⚡ Activation immédiate

Le script est déjà chargé dans `main.js`, donc **il fonctionne déjà** !

Il suffit d'ajouter `data-back-btn` à tes boutons existants.

---

## 🔍 Exemple complet

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Ma Page</title>
    <script src="/js/main.js"></script>
  </head>
  <body>
    <header>
      <!-- Bouton retour automatique -->
      <button data-back-btn class="btn-back">← Retour</button>
      <h1>Titre de la page</h1>
    </header>

    <main>
      <!-- Contenu de la page -->
    </main>
  </body>
</html>
```

---

## ✅ Avantages

- ✨ **Automatique** : Détection auto des boutons
- 🎯 **Intelligent** : Fallback vers le dashboard
- 🔄 **Réutilisable** : Un seul code pour toutes les pages
- 🚀 **Simple** : Juste un attribut à ajouter

---

**C'est prêt ! Tu peux maintenant ajouter `data-back-btn` sur n'importe quel bouton.** 🎉
