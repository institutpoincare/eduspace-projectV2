# 🔴 Boutons Retour ROUGES

Snippets de boutons retour en rouge pour les actions d'annulation ou de danger.

---

## 🔴 Style 1: Rouge Plein (Recommandé)

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Retour</span>
</button>
```

**Aperçu :** Bouton rouge vif avec ombre, parfait pour "Annuler" ou "Retour"

---

## 🔴 Style 2: Rouge Bordure

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Annuler</span>
</button>
```

**Aperçu :** Bouton avec bordure rouge, plus subtil

---

## 🔴 Style 3: Rouge Foncé

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all shadow-md hover:shadow-lg"
>
  <i data-lucide="x" class="w-4 h-4"></i>
  <span>Fermer</span>
</button>
```

**Aperçu :** Rouge foncé pour actions critiques

---

## 🔴 Style 4: Rouge Minimal (Icône seule)

```html
<button
  data-back-btn
  class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
>
  <i data-lucide="arrow-left" class="w-5 h-5"></i>
</button>
```

**Aperçu :** Petit bouton rouge avec icône uniquement

---

## 🔴 Style 5: Rouge Arrondi (Pill)

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Retour</span>
</button>
```

**Aperçu :** Bouton rouge avec coins complètement arrondis

---

## 🔴 Style 6: Rouge Flottant (Fixe)

```html
<button
  data-back-btn
  class="fixed bottom-6 right-6 p-4 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-700 transition-all hover:scale-110"
>
  <i data-lucide="x" class="w-6 h-6"></i>
</button>
```

**Aperçu :** Bouton flottant rouge en bas à droite

---

## 🔴 Style 7: Rouge Dégradé

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Annuler</span>
</button>
```

**Aperçu :** Dégradé rouge moderne

---

## 🔴 Style 8: Rouge avec Icône X (Fermer)

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
>
  <i data-lucide="x" class="w-4 h-4"></i>
  <span>Fermer</span>
</button>
```

**Aperçu :** Avec icône X au lieu de flèche

---

## 🔴 Style 9: Rouge Transparent

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-red-600/10 text-red-600 rounded-lg hover:bg-red-600/20 transition-colors border border-red-600/30"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Retour</span>
</button>
```

**Aperçu :** Fond rouge transparent, très moderne

---

## 🔴 Style 10: Rouge avec Ombre Colorée

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  <span>Retour</span>
</button>
```

**Aperçu :** Ombre rouge pour un effet premium

---

## 📋 Quand utiliser le rouge ?

✅ **Utilise le rouge pour :**

- Boutons "Annuler" dans les formulaires
- Boutons "Fermer" dans les modals critiques
- Actions de suppression ou danger
- Retour depuis une page d'erreur

❌ **Évite le rouge pour :**

- Navigation normale
- Retour simple entre pages
- Actions positives

---

## 🎯 Copie-Colle Rapide

**Le plus utilisé (Rouge plein) :**

```html
<button
  data-back-btn
  class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
>
  ← Retour
</button>
```

**Version avec icône :**

```html
<button
  data-back-btn
  class="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
>
  <i data-lucide="arrow-left" class="w-4 h-4"></i>
  Annuler
</button>
```

---

**Tous ces boutons fonctionnent automatiquement avec `data-back-btn` !** 🚀
