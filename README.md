# Arena.ai Projects Extension

## What it does / Description

**English** 🇬🇧
Arena.ai Projects, created by me (Qaïs), adds real project management to **chat.arena.ai**. You can drag‑and‑drop conversations into custom *Projects*, enjoy a clean premium UI and ultra‑smooth animations. The extension runs entirely locally, is secure, open‑source, and works on any Chromium‑based browser (Chrome, Edge, Brave, Opera, Vivaldi).

**Français** 🇫🇷
Arena.ai Projects, développé par moi (Qaïs), ajoute une vraie gestion de projets à **chat.arena.ai**. Vous pouvez glisser‑déposer les conversations dans des *Projets* personnalisés, profiter d’une interface épurée et d’animations ultra‑fluides. L’extension fonctionne 100 % en local, est sécurisée, open‑source et compatible avec tous les navigateurs Chromium (Chrome, Edge, Brave, Opera, Vivaldi).

**Deutsch** 🇩🇪
Arena.ai Projects, von mir (Qaïs) gebaut, verleiht Ihnen die Möglichkeit, Chats auf **chat.arena.ai** in eigene *Projekte* zu sortieren. Ziehen Sie Unterhaltungen per Drag‑and‑Drop, genießen Sie ein minimalistisches UI und superflüssige Animationen. Die Erweiterung ist komplett lokal, sicher, open‑source und läuft auf allen Chromium‑Browsern (Chrome, Edge, Brave, Opera, Vivaldi).

**Español** 🇪🇸
Arena.ai Projects, creado por mí (Qaïs), le permite organizar sus conversaciones en **chat.arena.ai** en *Proyectos* personalizados. Arrastre y suelte los chats, disfrute de una interfaz limpia y animaciones muy fluidas. La extensión es 100 % local, segura, de código abierto y funciona en cualquier navegador Chromium (Chrome, Edge, Brave, Opera, Vivaldi).

---

## Installation

1. **Download** the ZIP file from the repository or the Chrome Web Store.
2. Open `chrome://extensions/` (or `edge://extensions/` for Edge).
3. Enable **Developer mode** (toggle in the top‑right corner).
4. Click **Load unpacked** and select the folder `arena-folders` containing `manifest.json`.
5. The extension icon will appear next to the address bar. Click it while on **chat.arena.ai** to see the new UI.

*If you install from the Chrome Web Store, the steps are the same – just click **Add to Chrome** and the extension will be ready.*

---

## Customising Texts & Icons

All user‑visible strings and SVG icons live in the `UI_CONFIG` object inside `content/content.js`. Open that file and you will see entries such as:
```js
const UI_CONFIG = {
  titleNew: "New Project",
  titleRename: "Rename Project",
  btnCreate: "Create",
  btnCancel: "Cancel",
  iconProject: "📁",
  iconEdit: "✏️",
  iconDelete: "🗑️",
  // …
};
```
Edit the values to whatever you like (e.g., translate to another language or replace the emojis with custom SVG paths). Save the file and refresh the page – the changes take effect immediately.

### Adding your own SVG icons
1. Create an SVG file (e.g., `my-icon.svg`).
2. Open it, copy the `<svg …>` markup.
3. Replace the corresponding `icon*` string with that markup, wrapped in backticks:
```js
iconProject: `<svg viewBox="0 0 24 24"><path d="…"/></svg>`,
```
4. Adjust the CSS rule `.arena-folder-header .folder-icon` if needed (size, colour).

---

## Changing Colours

The colour palette is defined in `content/content.css` under `:root`. Example:
```css
:root {
  --arena-folder-bg: #ffffff;
  --arena-folder-bg-hover: #f5f5f5;
  --arena-folder-text: #171717;
  --arena-primary-btn: #2563eb;
  /* … */
}
```
Edit any variable to your preferred colour (use HEX, HSL or CSS colour names). The variables are also re‑declared inside the `@media (prefers-color-scheme: dark)` block for dark‑mode support – adjust those as well if you want a custom dark theme.

After saving the CSS file, reload **chat.arena.ai**; the new colours appear instantly.

---

## Contributing & Issues

Since the extension is open‑source, feel free to fork the repo, open pull requests, or report bugs on the GitHub Issues page. All contributions are welcome!

---

*Built with ❤️ by Qaïs*
