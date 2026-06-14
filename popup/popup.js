/**
 * Script de la popup pour gérer les dossiers
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadFolders();
  setupEventListeners();
});

/**
 * Charger et afficher les dossiers
 */
async function loadFolders() {
  const foldersList = document.getElementById('foldersList');
  const folders = await StorageUtils.getFolders();
  const mappings = await StorageUtils.getProjectMappings();

  // Compter les projets par dossier
  const folderCounts = {};
  Object.values(mappings).forEach(folderId => {
    folderCounts[folderId] = (folderCounts[folderId] || 0) + 1;
  });

  // Mettre à jour les statistiques
  document.getElementById('folderCount').textContent = folders.length;
  
  // Obtenir le nombre de projets depuis le content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url.includes('arena.ai')) {
      chrome.tabs.sendMessage(tab.id, { action: 'getProjectCount' }, (response) => {
        if (response) {
          document.getElementById('projectCount').textContent = response.count;
        }
      });
    }
  } catch (error) {
    console.error('Erreur récupération nombre de projets:', error);
  }

  // Afficher les dossiers
  if (folders.length === 0) {
    foldersList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-text">
          Aucun dossier créé.<br>
          Commencez par en créer un ci-dessus !
        </div>
      </div>
    `;
    return;
  }

  foldersList.innerHTML = folders.map(folder => {
    const count = folderCounts[folder.id] || 0;
    return `
      <div class="folder-item" data-folder-id="${folder.id}">
        <div class="folder-info">
          <div class="folder-name">📁 ${escapeHtml(folder.name)}</div>
          <div class="folder-meta">${count} projet${count > 1 ? 's' : ''}</div>
        </div>
        <div class="folder-actions">
          <button class="folder-action-btn rename" data-action="rename">✏️</button>
          <button class="folder-action-btn delete" data-action="delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  // Ajouter les événements sur les boutons d'action
  document.querySelectorAll('.folder-action-btn').forEach(btn => {
    btn.addEventListener('click', handleFolderAction);
  });
}

/**
 * Gérer les actions sur les dossiers
 */
async function handleFolderAction(e) {
  const action = e.target.dataset.action;
  const folderItem = e.target.closest('.folder-item');
  const folderId = folderItem.dataset.folderId;
  const folders = await StorageUtils.getFolders();
  const folder = folders.find(f => f.id === folderId);

  if (!folder) return;

  switch (action) {
    case 'rename':
      const newName = prompt('Nouveau nom du dossier:', folder.name);
      if (newName && newName.trim()) {
        await StorageUtils.renameFolder(folderId, newName.trim());
        await loadFolders();
        await refreshContentScript();
      }
      break;

    case 'delete':
      if (confirm(`Supprimer le dossier "${folder.name}" ?\n\nLes projets seront déplacés vers "Sans dossier".`)) {
        await StorageUtils.deleteFolder(folderId);
        await loadFolders();
        await refreshContentScript();
      }
      break;
  }
}

/**
 * Configurer les écouteurs d'événements
 */
function setupEventListeners() {
  // Création de dossier
  document.getElementById('createFolderBtn').addEventListener('click', async () => {
    const input = document.getElementById('folderNameInput');
    const name = input.value.trim();

    if (!name) {
      alert('Veuillez entrer un nom de dossier');
      return;
    }

    await StorageUtils.createFolder(name);
    input.value = '';
    await loadFolders();
    await refreshContentScript();
  });

  // Enter pour créer
  document.getElementById('folderNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('createFolderBtn').click();
    }
  });

  // Bouton refresh
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadFolders();
    await refreshContentScript();
  });

  // Bouton export
  document.getElementById('exportBtn').addEventListener('click', async () => {
    const folders = await StorageUtils.getFolders();
    const mappings = await StorageUtils.getProjectMappings();
    
    const data = {
      folders,
      mappings,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arena-folders-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/**
 * Rafraîchir le content script
 */
async function refreshContentScript() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url.includes('arena.ai')) {
      chrome.tabs.sendMessage(tab.id, { action: 'refresh' });
    }
  } catch (error) {
    console.error('Erreur refresh content script:', error);
  }
}

/**
 * Échapper le HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}