# 🎨 Snippets de Boutons Retour

Copie-colle ces snippets dans tes pages HTML.

---

## 📌 Snippet 1: Bouton Simple (Icône seule)

```html
<button
  data-back-btn
  class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
>
  <i data-lucide="arrow-left" class="w-6 h-6"></i>
</button>
```

---

## 📌 Snippet 2: Bouton avec Texte

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Retour</span>
</button>
```

---

## 📌 Snippet 3: Bouton Primaire (Bleu)

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Retour</span>
</button>
```

---

## 📌 Snippet 4: Header Complet avec Retour

```html
<header class="bg-white border-b border-gray-200 p-4">
  <div class="max-w-7xl mx-auto flex items-center gap-4">
    <button
      data-back-btn
      class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
    >
      <i data-lucide="arrow-left" class="w-6 h-6"></i>
    </button>
    <h1 class="text-2xl font-bold text-gray-900">Titre de la Page</h1>
  </div>
</header>
```

---

## 📌 Snippet 5: Bouton Flottant (Fixe)

```html
<button
  data-back-btn
  class="fixed bottom-6 left-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
>
  <i data-lucide="arrow-left" class="w-6 h-6"></i>
</button>
```

---

## 📌 Snippet 6: Footer avec Boutons (Formulaire)

```html
<div class="flex justify-between items-center pt-6 border-t border-gray-200">
  <button
    data-back-btn
    class="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
  >
    Annuler
  </button>
  <button
    type="submit"
    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  >
    Enregistrer
  </button>
</div>
```

---

## 📌 Snippet 7: Bouton Minimal (Texte seul)

```html
<button data-back-btn class="text-blue-600 hover:text-blue-700 font-medium">
  ← Retour
</button>
```

---

## 📌 Snippet 8: Bouton Bordure

```html
<button
  data-back-btn
  class="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
>
  ← Retour
</button>
```

---

## 📌 Snippet 9: Bouton Sombre

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Retour</span>
</button>
```

---

## 📌 Snippet 10: Bouton dans Modal

```html
<div class="modal-header flex justify-between items-center p-6 border-b">
  <div class="flex items-center gap-3">
    <button data-back-btn class="p-2 hover:bg-gray-100 rounded-full">
      <i data-lucide="x" class="w-5 h-5"></i>
    </button>
    <h2 class="text-xl font-bold">Titre du Modal</h2>
  </div>
</div>
```

---

## 📌 Snippet 11: Bouton Rouge (Annuler/Danger)

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Retour</span>
</button>
```

**Variante bordure rouge :**

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Annuler</span>
</button>
```

**Variante rouge foncé :**

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all shadow-md hover:shadow-lg"
>
  <i data-lucide="x" class="w-4 h-4"></i>
  <span>Fermer</span>
</button>
```

---

## 🎯 Utilisation

1. **Copie** le snippet qui te convient
2. **Colle** dans ton HTML
3. **Modifie** le texte/style si nécessaire
4. **C'est tout !** Le bouton fonctionnera automatiquement

---

## ⚡ Note importante

N'oublie pas d'inclure `main.js` dans ta page :

```html
<script src="../../js/main.js"></script>
```

Et d'initialiser Lucide icons si tu utilises des icônes :

```html
<script>
  lucide.createIcons();
</script>
```

---

**Tous ces snippets sont prêts à l'emploi !** 🚀
