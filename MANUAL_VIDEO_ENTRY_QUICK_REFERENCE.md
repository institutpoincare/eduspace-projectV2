# 🎥 Manual Video Entry System - Quick Reference

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    INSTRUCTOR SIDE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Click "Ajouter une vidéo"                              │
│     ↓                                                       │
│  2. Modal Form Opens:                                       │
│     ┌──────────────────────────────┐                       │
│     │ Titre: [Séance 1: Intro]     │                       │
│     │ Lien:  [drive.google.com...] │                       │
│     │        [Ajouter]             │                       │
│     └──────────────────────────────┘                       │
│     ↓                                                       │
│  3. Saved to Class.recordings[]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                            ↓ DATA FLOW ↓

┌─────────────────────────────────────────────────────────────┐
│                     STUDENT SIDE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Grid View (3 columns):                                 │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│     │   ▶️    │  │   ▶️    │  │   ▶️    │                │
│     │ Séance 1│  │ Séance 2│  │ Séance 3│                │
│     └─────────┘  └─────────┘  └─────────┘                │
│                                                             │
│  2. Click → Inline Player Opens:                           │
│     ┌────────────────────────────────────────┐            │
│     │  [X]                                    │            │
│     │  ┌──────────────────────────────────┐  │            │
│     │  │                                  │  │            │
│     │  │      VIDEO PLAYS HERE            │  │            │
│     │  │      (Google Drive /preview)     │  │            │
│     │  │                                  │  │            │
│     │  └──────────────────────────────────┘  │            │
│     └────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Data Structure

```javascript
// Class Model
{
  "title": "Français A1",
  "recordings": [
    {
      "title": "Séance 1: Introduction",
      "url": "https://drive.google.com/file/d/ABC123/view",
      "addedAt": "2026-01-03T14:00:00Z"
    },
    {
      "title": "Séance 2: Grammaire",
      "url": "https://drive.google.com/file/d/XYZ789/view",
      "addedAt": "2026-01-03T15:00:00Z"
    }
  ]
}
```

---

## 🎨 UI Components

### Instructor Form

```html
<div class="modal">
  <input type="text" placeholder="Titre" />
  <input type="url" placeholder="Lien Drive" />
  <button>Ajouter</button>
</div>
```

### Student Grid Card

```html
<div class="video-card" onclick="playDriveVideo(url, title)">
  <div class="gradient-bg">
    <span class="play-icon">▶️</span>
    <h3 class="title">Séance 1: Introduction</h3>
  </div>
</div>
```

### Inline Player

```html
<div class="glass-modal">
  <iframe src="https://drive.google.com/file/d/ID/preview"></iframe>
</div>
```

---

## 🔄 URL Conversion

```javascript
// INPUT (Share Link)
"https://drive.google.com/file/d/ABC123/view";

// OUTPUT (Preview Link)
"https://drive.google.com/file/d/ABC123/preview";
```

**Why?** The `/preview` endpoint allows inline embedding, while `/view` forces a new tab.

---

## ✅ Key Features

| Feature           | Description                       |
| ----------------- | --------------------------------- |
| **Manual Entry**  | Instructors add videos one by one |
| **Grid Layout**   | 1/2/3 columns (responsive)        |
| **Inline Player** | Videos play inside the platform   |
| **Glass Modal**   | Modern dark backdrop with blur    |
| **No New Tabs**   | Meets client requirement ✅       |

---

## 🚀 Quick Start

### Add a Video (Instructor)

1. Go to Class Dashboard
2. Click **"Ajouter une vidéo"**
3. Fill in title and Drive link
4. Click **"Ajouter"**

### Watch a Video (Student)

1. Go to Class Dashboard
2. Click **"Enregistrements"** folder
3. Click any video card
4. Video plays inline!

---

## 🔧 Technical Stack

- **Backend**: MongoDB Schema with `recordings` array
- **Frontend**: Vanilla JavaScript + TailwindCSS
- **Player**: Google Drive iframe with `/preview`
- **Modal**: Dynamic HTML injection
- **Styling**: Glassmorphism + Dark gradients

---

## 📝 Code Locations

| Component          | File Path                                |
| ------------------ | ---------------------------------------- |
| **Class Model**    | `backend/models/Class.js`                |
| **Instructor Add** | `js/pages/instructor-class-dashboard.js` |
| **Student Grid**   | `js/pages/student-class-dashboard.js`    |
| **Inline Player**  | `window.playDriveVideo()` (global)       |

---

## 🎯 Result

✅ **Videos play INSIDE the platform**  
✅ **Clean, modern grid UI**  
✅ **Simple manual management**  
✅ **Glassmorphism design**  
✅ **Mobile responsive**

---

**Status**: ✅ **IMPLEMENTED & READY**
