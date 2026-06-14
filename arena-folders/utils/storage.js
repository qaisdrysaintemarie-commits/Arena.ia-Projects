/**
 * Utilitaires de stockage pour la gestion des dossiers et conversations
 */

const StorageUtils = {
  // Récupérer tous les dossiers
  async getFolders() {
    const result = await chrome.storage.local.get(['folders']);
    return result.folders || [];
  },

  // Sauvegarder les dossiers
  async saveFolders(folders) {
    await chrome.storage.local.set({ folders });
  },

  // Récupérer les associations conversation -> dossier
  async getConversationMappings() {
    const result = await chrome.storage.local.get(['conversationMappings']);
    return result.conversationMappings || {};
  },

  // Sauvegarder les associations
  async saveConversationMappings(mappings) {
    await chrome.storage.local.set({ conversationMappings: mappings });
  },

  // Créer un nouveau dossier
  async createFolder(name) {
    const folders = await this.getFolders();
    const newFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      expanded: true,
      created: Date.now()
    };
    folders.push(newFolder);
    await this.saveFolders(folders);
    return newFolder;
  },

  // Renommer un dossier
  async renameFolder(folderId, newName) {
    const folders = await this.getFolders();
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      folder.name = newName;
      await this.saveFolders(folders);
    }
  },

  // Supprimer un dossier
  async deleteFolder(folderId) {
    const folders = await this.getFolders();
    const filteredFolders = folders.filter(f => f.id !== folderId);
    await this.saveFolders(filteredFolders);

    // Retirer les conversations de ce dossier
    const mappings = await this.getConversationMappings();
    Object.keys(mappings).forEach(convId => {
      if (mappings[convId] === folderId) {
        delete mappings[convId];
      }
    });
    await this.saveConversationMappings(mappings);
  },

  // Basculer l'état replié/déplié
  async toggleFolderExpanded(folderId) {
    const folders = await this.getFolders();
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      folder.expanded = !folder.expanded;
      await this.saveFolders(folders);
    }
    return folder;
  },

  // Ajouter une conversation à un dossier
  async addConversationToFolder(conversationId, folderId) {
    const mappings = await this.getConversationMappings();
    if (folderId) {
      mappings[conversationId] = folderId;
    } else {
      delete mappings[conversationId];
    }
    await this.saveConversationMappings(mappings);
  },

  // Obtenir le dossier d'une conversation
  async getConversationFolder(conversationId) {
    const mappings = await this.getConversationMappings();
    return mappings[conversationId] || null;
  },

  // Obtenir toutes les conversations d'un dossier
  async getConversationsInFolder(folderId) {
    const mappings = await this.getConversationMappings();
    return Object.keys(mappings).filter(convId => mappings[convId] === folderId);
  }
};

// Rendre disponible globalement
if (typeof window !== 'undefined') {
  window.StorageUtils = StorageUtils;
}