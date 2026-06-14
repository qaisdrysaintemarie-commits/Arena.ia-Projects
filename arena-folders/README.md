# 📁 Arena.ai Projects

Extension Chrome/Brave pour organiser vos conversations Arena.ai avec des projets **directement intégrés dans l'interface native**.

## ✨ Fonctionnalités

- ✅ **Création de projets** directement dans la sidebar d'Arena.ai
- ✅ **Déplacement par glisser-déposer** des conversations
- ✅ **Menu contextuel** sur chaque conversation pour déplacer/créer des projets
- ✅ **Replier/déplier** les projets avec compteur
- ✅ **Renommer et supprimer** des projets
- ✅ **Section "Sans projet"** pour les conversations non classées
- ✅ **Interface native** inspirée de Claude.ai qui s'intègre parfaitement à Arena
- ✅ **Support mode sombre** automatique
- ✅ **Persistance** entre les sessions

## 🎨 Personnalisation

Vous pouvez très facilement modifier l'apparence de l'extension pour qu'elle corresponde exactement à vos goûts :

### Changer les Textes et Icônes
Ouvrez le fichier `content/content.js`. Tout en haut, vous trouverez un objet `UI_CONFIG` :
- Modifiez les valeurs comme `titleNew: "Nouveau Projet"` pour changer les textes.
- Remplacez le code SVG dans `iconProject`, `iconPlus`, etc., pour utiliser vos propres icônes ou des emojis (ex: `'📁'`).

### Changer les Couleurs
Ouvrez le fichier `content/content.css`. Tout en haut, vous trouverez les variables CSS dans `:root` :
- `var(--arena-folder-bg-hover)` : gère la couleur de fond des projets.
- `var(--arena-project-icon-color)` : gère la couleur de l'icône du projet (par défaut un vert émeraude comme Claude).
- Vous pouvez ajuster les couleurs pour le mode clair et le mode sombre (`@media (prefers-color-scheme: dark)`).

## 🚀 Installation

### 1. Télécharger l'extension

```bash
git clone https://github.com/votre-repo/arena-folders.git
# ou téléchargez le ZIP