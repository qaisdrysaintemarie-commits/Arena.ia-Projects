/**
 * Service Worker pour l'extension Arena.ai Folder Organizer
 */

// Écouter l'installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Arena.ai Folder Organizer installé avec succès !');
    
    // Ouvrir une page de bienvenue (optionnel)
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('Arena.ai Folder Organizer mis à jour vers', chrome.runtime.getManifest().version);
  }
});

// Écouter les messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Vous pouvez ajouter ici des fonctionnalités supplémentaires
  // comme la synchronisation avec le cloud, etc.
  return true;
});