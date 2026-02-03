# Phantom Codebase Guide

> **For AI Agents:** This file explains what already exists. **DO NOT recreate or duplicate** any of these features.

---

## File Reference

### Root Files

| File | What It Does | Don't Redo This |
|------|--------------|-----------------|
| `config.js` | Central config: site name, version, changelog, Discord links, cloak presets, default settings | ❌ Don't create another config |
| `index.html` | **Main Entry Point**. Handles First Visit Cloak (white screen) and serves as App Container. Loads `index2.html`. | ❌ Don't create splash screens |
| `index2.html` | **Home Page Content**. Search bar, games grid, widgets. Loaded inside `index.html`. | ❌ Don't recreate home |
| `All.css` | **Empty/Legacy** - Don't use | - |

---

### `/scripts/` - JavaScript APIs

| File | What It Does | Global API | Don't Redo This |
|------|--------------|------------|-----------------|
| `settings.js` | Saves/loads user settings to localStorage | `window.Settings` | ❌ Don't create new settings systems |
| `notifications.js` | Toast popups (success, error, info, warning) | `window.Notify` | ❌ Don't make alert boxes |
| `cloaking.js` | Tab title/favicon disguise, panic key redirect | `window.Cloaking` | ❌ Don't remake tab cloaking |
| `games.js` | Loads game library, handles favorites, search | `window.Games` | ❌ Don't reload games manually |
| `movies.js` | TMDB movie/TV API, search, genre filtering | Direct functions | ❌ Don't call TMDB separately |

**Settings storage key:** `void_settings` (in localStorage)

---

### `/styles/` - CSS

| File | What It Does | Don't Redo This |
|------|--------------|-----------------|
<<<<<<< HEAD
| `main.css` | Core design system: CSS variables, buttons, cards, modals, grids, utilities | ❌ Don't define new colors/components |
| `background.css` | Background manager styles, glassmorphism effects | ❌ Don't add background styles elsewhere |
| `layout.css` | Shared page layout: header, controls, search-box, select-wrapper | ❌ Don't duplicate in page-specific CSS |
| `games.css` | Games page specific styles | - |
| `movies.css` | Movies page specific styles | - |
| `card.css` | Shared media card styles (movies, featured, etc.) | ❌ Don't duplicate card styles |
=======
| `main.css` | Full design system: CSS variables, buttons, cards, modals, grids, utilities | ❌ Don't define new colors/components |
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
| `topbar.css` | **Empty** - Real styles are in `components/topbar.css` | - |

---

### `/components/` - Reusable UI

| File | What It Does | Don't Redo This |
|------|--------------|-----------------|
| `footer.js` | Adds footer (settings, changelog, discord, terms links) + panic key handler | ❌ Don't add footer HTML manually |
| `topbar.js` | Adds navigation bar with icons | ❌ Don't add nav HTML manually |
<<<<<<< HEAD
=======
| `topbar.css` | Styles for navigation bar | ❌ Don't style nav separately |
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac

---

### `/pages/` - Content Pages

| File | What It Does |
|------|--------------|
| `games.html` | Game browser with search, filtering, favorites |
| `movies.html` | Movie/TV browser with categories, genres |
| `player.html` | Universal player for games and movies |
| `settings.html` | User preferences (themes, cloaking, etc.) |
| `music.html` | Music player (BETA) |
| `chatbot.html` | AI chat interface |
| `terms.html` | Terms of service |
| `disclaimer.html` | Legal disclaimer |

---

## How to Use Existing APIs

### Notifications (already exists - just use it)
```javascript
Notify.success('Title', 'Message');
Notify.error('Title', 'Message');
Notify.info('Title', 'Message');
Notify.warning('Title', 'Message');
```

### Settings (already exists - just use it)
```javascript
Settings.get('panicKey');          // Get a setting
Settings.set('key', 'value');      // Set a setting
Settings.apply();                   // Apply theme colors
```

### Cloaking (already exists - just use it)
```javascript
Cloaking.applyCloak('Title', 'favicon-url');
Cloaking.panic();                  // Redirect to safe URL
```

---

## When Adding New Pages

Include these scripts in order:
```html
<script src="../config.js"></script>
<script src="../scripts/settings.js"></script>
<script src="../scripts/notifications.js"></script>
<script src="../scripts/cloaking.js"></script>
<script src="../components/topbar.js"></script>
<!-- your page content -->
<script src="../components/footer.js"></script>
```

Use CSS from `main.css`:
```html
<link rel="stylesheet" href="../styles/main.css">
<link rel="stylesheet" href="../components/topbar.css">
```

Call `Settings.apply()` to load user's theme.

---

## Key Rules

1. **Use `void_settings`** for localStorage - don't create new storage keys
2. **Use CSS variables** (like `var(--surface)`) - don't hardcode colors
3. **Include footer.js and topbar.js** - don't write nav/footer HTML
4. **Use Notify for feedback** - don't create alert popups
5. **Use config.js** - site info is already there
6. **For styling put all styling in /styles** and remember to use main.css but do not put page specific styling in main.css, create more css files for that.
---

*BUILD LIGHTWEIGHT AND MAINTAINABLE CODE.*
*If a feature exists, use it. Don't rebuild it.*