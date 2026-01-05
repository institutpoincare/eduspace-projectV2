# Manual Video Entry Architecture

## Overview

This document describes the **Manual Video Entry System** implemented to allow videos to play **inline** within the platform using Google Drive's `/preview` endpoint.

## The Problem

The previous "Google Drive Folder Embed" approach forced users to open videos in a new tab, which violated the client's requirement that videos must play **inside the platform**.

## The Solution

We implemented a **Manual Entry System** with:

- Individual video entries (title + URL)
- Grid UI for displaying videos
- Inline player using Google Drive `/preview` links

---

## 1. Data Structure

### Class Model (`backend/models/Class.js`)

```javascript
recordings: [
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
];
```

**Example Data:**

```json
{
  "recordings": [
    {
      "title": "Séance 1: Introduction",
      "url": "https://drive.google.com/file/d/YOUR_ID/view..."
    },
    {
      "title": "Séance 2: Grammaire",
      "url": "https://drive.google.com/file/d/YOUR_ID/view..."
    }
  ]
}
```

---

## 2. Instructor Dashboard (Add Video)

### Location

`js/pages/instructor-class-dashboard.js`

### Features

- **Modal Form** with two inputs:
  - **Titre** (Title)
  - **Lien Drive** (Google Drive URL)
- **Add Button** saves to the `recordings` array

### Code Flow

1. Instructor clicks "Ajouter une vidéo"
2. Modal appears with form inputs
3. On submit, `window.confirmAddVideo()` is called
4. Video object is pushed to `course.recordings[]`
5. Course is saved and UI re-renders

---

## 3. Student Dashboard (Grid View)

### Location

`js/pages/student-class-dashboard.js`

### Rendering Function

```javascript
const renderRecordingsGrid = (recordings) => {
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
      ${recordings
        .map(
          (video) => `
        <div onclick="playDriveVideo('${video.url}', '${video.title}')" 
             class="group relative aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform">
             
             <div class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 group-hover:bg-slate-800/80 transition-colors">
                <span class="text-4xl mb-2">▶️</span>
                <h3 class="text-white font-bold text-center px-2">${video.title}</h3>
             </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
};
```

### Features

- **Large Cards** in a responsive grid (1/2/3 columns)
- **Play Icon** and title centered
- **Hover Effect** scales card slightly
- **Click Handler** calls `playDriveVideo()`

---

## 4. Inline Player (Glass Modal)

### Global Function

```javascript
window.playDriveVideo = (url, title = "Lecture Vidéo") => {
  // Convert 'view' link to 'preview' link for inline playback
  const previewUrl = url
    .replace("/view", "/preview")
    .replace("/edit", "/preview");

  // Inject Glass Modal
  const modalHTML = `
    <div id="video-modal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onclick="this.remove(); document.body.style.overflow = 'auto';">
        <div class="w-full max-w-5xl aspect-video bg-black rounded-xl shadow-2xl overflow-hidden border border-gray-700" onclick="event.stopPropagation();">
            <iframe src="${previewUrl}" class="w-full h-full" allow="autoplay; fullscreen"></iframe>
        </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  document.body.style.overflow = "hidden";
};
```

### Features

- **URL Conversion**: Replaces `/view` with `/preview` to enable inline playback
- **Glass Modal**: Dark backdrop with blur effect
- **Click-to-Close**: Clicking outside the video closes the modal
- **Responsive**: Adapts to screen size with `max-w-5xl`

---

## 5. Key Benefits

✅ **Videos play INSIDE the platform** (no new tabs)  
✅ **Clean Grid UI** similar to modern video platforms  
✅ **Manual Control** - instructors add videos one by one  
✅ **Inline Playback** using Google Drive `/preview` endpoint  
✅ **Modern Design** with glassmorphism and smooth animations

---

## 6. Migration Notes

### Old Structure (Deprecated)

```javascript
recordingsFolderUrl: "https://drive.google.com/folders/...";
```

### New Structure

```javascript
recordings: [
  { title: "...", url: "..." },
  { title: "...", url: "..." },
];
```

### Backward Compatibility

The student dashboard includes a fallback:

```javascript
const videoUrl = video.url || video.link || "";
```

This ensures old data with `link` field still works.

---

## 7. Usage Instructions

### For Instructors

1. Navigate to the class dashboard
2. Scroll to "Gestion des Vidéos (Cards)"
3. Click **"Ajouter une vidéo"**
4. Enter:
   - **Titre**: e.g., "Séance 1: Introduction"
   - **Lien Drive**: Paste the Google Drive share link
5. Click **"Ajouter"**

### For Students

1. Open the class dashboard
2. Click on **"Enregistrements"** folder
3. See all videos in a grid layout
4. Click any video card to play it inline

---

## 8. Technical Details

### Google Drive URL Formats Supported

- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/file/d/FILE_ID/edit`
- `https://drive.google.com/open?id=FILE_ID`

### Preview Conversion

All formats are converted to:

```
https://drive.google.com/file/d/FILE_ID/preview
```

### Modal Z-Index

The video modal uses `z-[9999]` to ensure it appears above all other elements.

---

## Conclusion

This architecture provides a **clean, manual, and inline video playback system** that meets the client's strict requirement of keeping users on the platform while maintaining a modern, grid-based UI.
