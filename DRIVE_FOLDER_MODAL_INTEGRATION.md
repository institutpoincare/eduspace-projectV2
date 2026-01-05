# Drive Folder Modal Integration

## Overview

Replaced the default "Open in New Tab" behavior for Google Drive folders with an internal "Glass Modal" that displays the folder contents in a Grid View using an iframe.

## Changes

1. **`js/pages/student-class-dashboard.js`**:
   - **Updated `renderResourcesSection`**: Modified the `onclick` handler for folder items.
     - Old: `window.open(..., '_blank')`
     - New: `window.openRecordingsModal(...)`
   - **Added `window.openRecordingsModal`**: A new function that:
     - Extracts the Folder ID from the Drive URL.
     - Constructs an `embeddedfolderview` URL with `#grid`.
     - Injects a full-screen, glassmorphism-styled modal into the DOM.

## Technical Details

- **Modal ID**: `#folder-modal`
- **Url Format**: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`
- **Styling**: Uses Tailwind classes (`bg-slate-900/80`, `backdrop-blur-md`) to match the platform's aesthetic.
