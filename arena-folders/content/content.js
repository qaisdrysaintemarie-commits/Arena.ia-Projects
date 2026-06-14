/**
 * Content script pour Arena.ai Conversation Folders
 * Intègre les dossiers directement dans l'interface native d'Arena.ai
 */

(function () {
  'use strict';

  // Configuration des sélecteurs (à adapter selon Arena.ai)
  const SELECTORS = {
    // Sidebar où se trouvent les conversations
    sidebar: 'aside, [role="navigation"], nav, .sidebar, div[class*="sidebar" i], div:has(a[href*="/chat/"]), div:has(a[href*="/c/"])',
    // Liste des conversations
    conversationsList: '[data-testid="conversations-list"], .conversations-list, nav ul, aside ul, ul:has(a[href*="/chat/"]), ul:has(a[href*="/c/"]), div:has(> a[href*="/chat/"]), div:has(> div > a[href*="/chat/"])',
    // Item de conversation individuel
    conversationItem: '[data-testid="conversation-item"], .conversation-item, nav li, aside li, a[href*="/chat/"], a[href*="/c/"]',
    // Bouton "Nouvelle conversation"
    newConversationBtn: '[data-testid="new-conversation"], button[aria-label*="New"], a[href="/"], a[href="/chat/"]',
  };

  // Configuration de l'interface (textes et icônes) - Facile à modifier !
  const UI_CONFIG = {
    // Textes
    titleNew: "Nouveau Projet",
    titleUnfiled: "Sans projet",
    titleMove: "Déplacer vers...",
    titleRename: "Renommer le projet",
    promptDelete: 'Supprimer le projet "{name}" ?\n\nLes conversations seront déplacées vers "Sans projet".',
    placeholderNew: "Nouveau projet...",
    placeholderName: "Nom du projet...",
    btnCancel: "Annuler",
    btnCreate: "Créer",
    btnSave: "Enregistrer",
    btnDelete: "Supprimer",
    tooltipMove: "Déplacer vers un projet",

    // Icônes (SVG ou Emojis)
    iconPlus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    iconProject: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="project-icon-svg"><rect x="4" y="12" width="16" height="9" rx="2"></rect><path d="M6 8h12"></path><path d="M8 4h8"></path></svg>',
    iconMove: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    iconUnfiled: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    iconEdit: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    iconDelete: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    iconChevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>'
  };

  let observer = null;
  let currentMenu = null;
  let draggedConversation = null;
  let foldersContainer = null;

  /**
   * Initialisation
   */
  function init() {
    console.log('🗂️ Arena.ai Conversation Folders: Initialisation...');

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  /**
   * Configuration principale
   */
  async function setup() {
    try {
      // Attendre que la sidebar soit présente
      await waitForElement(SELECTORS.sidebar, 15000);

      console.log('🗂️ Sidebar détectée, injection des dossiers...');

      // Injecter l'interface des dossiers
      await injectFolderInterface();

      // Observer les changements (SPA)
      setupMutationObserver();

      console.log('✅ Arena.ai Conversation Folders activé !');
    } catch (error) {
      console.error('🗂️ Arena.ai Conversation Folders: Erreur lors de l\'initialisation (timeout). Tentative de fallback...', error);
      // Fallback: wait indefinitely via MutationObserver for conversation items
      setupFallbackObserver();
    }
  }

  function setupFallbackObserver() {
    const observer = new MutationObserver((mutations) => {
      const items = findConversations();
      if (items.length > 0) {
        observer.disconnect();
        console.log('🗂️ Fallback: Conversations trouvées, injection...');
        injectFolderInterface().then(() => {
          setupMutationObserver();
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Attendre qu'un élément existe dans le DOM
   */
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const selectors = selector.split(',').map(s => s.trim());

      // Vérifier immédiatement
      for (const sel of selectors) {
        try {
          const element = document.querySelector(sel);
          if (element) {
            resolve(element);
            return;
          }
        } catch (e) {
          // Ignorer les sélecteurs invalides
        }
      }

      // Observer
      const observer = new MutationObserver(() => {
        for (const sel of selectors) {
          try {
            const element = document.querySelector(sel);
            if (element) {
              observer.disconnect();
              resolve(element);
              return;
            }
          } catch (e) { }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Element not found: ' + selector));
      }, timeout);
    });
  }

  /**
   * Trouver la sidebar
   */
  function findSidebar() {
    const selectors = SELECTORS.sidebar.split(',');
    for (const selector of selectors) {
      const element = document.querySelector(selector.trim());
      if (element) return element;
    }
    return null;
  }

  /**
   * Trouver la liste des conversations
   */
  function findConversationsList() {
    const selectors = SELECTORS.conversationsList.split(',');
    for (const selector of selectors) {
      const element = document.querySelector(selector.trim());
      if (element) return element;
    }
    return null;
  }

  /**
   * Trouver toutes les conversations
   */
  function findConversations() {
    const selectors = SELECTORS.conversationItem.split(',');
    const conversations = [];

    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector.trim());
        if (elements.length > 0) {
          conversations.push(...Array.from(elements));
          break;
        }
      } catch (e) { }
    }

    return conversations;
  }

  /**
   * Extraire l'ID d'une conversation
   */
  function getConversationId(conversationElement) {
    // Chercher dans les attributs data
    if (conversationElement.dataset.conversationId) {
      return conversationElement.dataset.conversationId;
    }
    if (conversationElement.dataset.id) {
      return conversationElement.dataset.id;
    }

    // Chercher dans l'URL du lien
    const link = conversationElement.querySelector('a[href*="/chat/"], a[href*="/c/"]');
    if (link) {
      const match = link.href.match(/\/(chat|c)\/([^\/\?#]+)/);
      if (match) return match[2];
    }

    // Utiliser l'attribut href direct
    if (conversationElement.href) {
      const match = conversationElement.href.match(/\/(chat|c)\/([^\/\?#]+)/);
      if (match) return match[2];
    }

    // Fallback: générer un ID depuis le contenu
    const title = conversationElement.textContent.trim();
    return `conv_${hashString(title)}`;
  }

  /**
   * Hash simple
   */
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Injecter l'interface des dossiers
   */
  async function injectFolderInterface() {
    const conversationsList = findConversationsList();
    if (!conversationsList) {
      console.warn('⚠️ Liste des conversations non trouvée');
      return;
    }

    // Retirer l'ancien conteneur s'il existe
    const existing = document.querySelector('.arena-folders-container');
    if (existing) existing.remove();

    // Récupérer les données
    const folders = await StorageUtils.getFolders();
    const mappings = await StorageUtils.getConversationMappings();
    const conversations = findConversations();

    if (conversations.length === 0) {
      console.log('ℹ️ Aucune conversation trouvée');
    }

    // Créer le conteneur des dossiers
    const fragment = document.createDocumentFragment();
    foldersContainer = document.createElement('div');
    foldersContainer.className = 'arena-folders-container';

    // Bouton "Nouveau dossier"
    const newFolderBtn = createNewFolderButton();
    foldersContainer.appendChild(newFolderBtn);

    // Grouper les conversations par dossier
    const conversationData = conversations.map(conv => ({
      element: conv,
      id: getConversationId(conv),
      folderId: mappings[getConversationId(conv)] || null
    }));

    // Créer les sections de dossiers
    for (const folder of folders) {
      const convInFolder = conversationData.filter(c => c.folderId === folder.id);
      const folderSection = createFolderSection(folder, convInFolder);
      foldersContainer.appendChild(folderSection);
    }

    // Section "Sans dossier"
    const unfiledConvs = conversationData.filter(c => !c.folderId);
    if (unfiledConvs.length > 0) {
      const unfiledSection = createUnfiledSection(unfiledConvs);
      foldersContainer.appendChild(unfiledSection);
    }

    fragment.appendChild(foldersContainer);

    // Insérer dans la sidebar (optimisé avec fragment)
    if (conversationsList.parentElement) {
      conversationsList.parentElement.insertBefore(fragment, conversationsList);
    } else {
      conversationsList.before(fragment);
    }

    // Masquer la liste originale
    conversationsList.style.display = 'none';

    // Configurer le drag & drop
    setupDragAndDrop();
  }

  /**
   * Créer le bouton "Nouveau dossier"
   */
  function createNewFolderButton() {
    const button = document.createElement('button');
    button.className = 'arena-new-folder-btn';
    button.innerHTML = `
      <span class="icon">${UI_CONFIG.iconPlus}</span>
      <span>${UI_CONFIG.titleNew}</span>
    `;
    button.onclick = () => showCreateFolderModal();
    return button;
  }

  /**
   * Créer une section de dossier
   */
  function createFolderSection(folder, conversations) {
    const section = document.createElement('div');
    section.className = 'arena-folder-section';
    section.dataset.folderId = folder.id;

    // En-tête du dossier
    const header = document.createElement('div');
    header.className = `arena-folder-header ${folder.expanded ? '' : 'collapsed'}`;

    header.innerHTML = `
      <span class="expand-icon">${UI_CONFIG.iconChevronDown}</span>
      <span class="folder-icon">${UI_CONFIG.iconProject}</span>
      <span class="folder-name">${escapeHtml(folder.name)}</span>
      <span class="folder-count">${conversations.length}</span>
      <div class="folder-actions">
        <button class="folder-action-btn rename-btn" title="${UI_CONFIG.titleRename}">${UI_CONFIG.iconEdit}</button>
        <button class="folder-action-btn delete-btn" title="Supprimer">${UI_CONFIG.iconDelete}</button>
      </div>
    `;

    // Toggle expand/collapse
    header.addEventListener('click', async (e) => {
      if (e.target.closest('.folder-actions')) return;

      const updatedFolder = await StorageUtils.toggleFolderExpanded(folder.id);
      await injectFolderInterface();
    });

    // Renommer
    header.querySelector('.rename-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      showRenameFolderModal(folder);
    });

    // Supprimer
    header.querySelector('.delete-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      showDeleteFolderModal(folder);
    });

    section.appendChild(header);

    // Contenu (conversations)
    const content = document.createElement('div');
    content.className = `arena-folder-conversations ${folder.expanded ? '' : 'collapsed'}`;

    if (folder.expanded) {
      content.style.maxHeight = 'none';
      conversations.forEach(({ element, id }) => {
        const wrapper = wrapConversation(element, id);
        content.appendChild(wrapper);
      });
    } else {
      content.style.maxHeight = '0';
    }

    section.appendChild(content);

    return section;
  }

  /**
   * Créer la section "Sans dossier"
   */
  function createUnfiledSection(conversations) {
    const section = document.createElement('div');
    section.className = 'arena-unfiled-section';

    const header = document.createElement('div');
    header.className = 'arena-unfiled-header';
    header.textContent = `${UI_CONFIG.titleUnfiled} (${conversations.length})`;
    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'arena-folder-conversations';

    conversations.forEach(({ element, id }) => {
      const wrapper = wrapConversation(element, id);
      content.appendChild(wrapper);
    });

    section.appendChild(content);

    return section;
  }

  /**
   * Wrapper pour une conversation avec bouton "Déplacer"
   */
  function wrapConversation(conversationElement, conversationId) {
    const wrapper = document.createElement('div');
    wrapper.className = 'arena-conversation-item';
    wrapper.dataset.conversationId = conversationId;
    wrapper.draggable = true;

    // Cloner la conversation
    const clone = conversationElement.cloneNode(true);
    clone.style.display = '';
    wrapper.appendChild(clone);

    // Bouton "Déplacer vers"
    const moveBtn = document.createElement('button');
    moveBtn.className = 'move-to-folder-btn';
    moveBtn.innerHTML = UI_CONFIG.iconMove;
    moveBtn.title = UI_CONFIG.tooltipMove;
    moveBtn.onclick = (e) => {
      e.stopPropagation();
      showMoveMenu(moveBtn, conversationId);
    };
    wrapper.appendChild(moveBtn);

    return wrapper;
  }

  /**
   * Afficher le menu de déplacement
   */
  async function showMoveMenu(button, conversationId) {
    // Fermer le menu précédent
    if (currentMenu) {
      currentMenu.remove();
      currentMenu = null;
    }

    const folders = await StorageUtils.getFolders();
    const currentFolderId = await StorageUtils.getConversationFolder(conversationId);

    const menu = document.createElement('div');
    menu.className = 'arena-move-menu';

    // En-tête
    const menuHeader = document.createElement('div');
    menuHeader.className = 'arena-move-menu-header';
    menuHeader.textContent = UI_CONFIG.titleMove;
    menu.appendChild(menuHeader);

    // Option "Sans dossier"
    const noneItem = document.createElement('div');
    noneItem.className = `arena-move-menu-item ${!currentFolderId ? 'active' : ''}`;
    noneItem.innerHTML = `<span class="item-icon">${UI_CONFIG.iconUnfiled}</span><span>${UI_CONFIG.titleUnfiled}</span>`;
    noneItem.onclick = async () => {
      await StorageUtils.addConversationToFolder(conversationId, null);
      menu.remove();
      currentMenu = null;
      await injectFolderInterface();
    };
    menu.appendChild(noneItem);

    // Séparateur
    const divider = document.createElement('div');
    divider.className = 'arena-move-menu-divider';
    menu.appendChild(divider);

    // Options pour chaque dossier
    folders.forEach(folder => {
      const item = document.createElement('div');
      item.className = `arena-move-menu-item ${currentFolderId === folder.id ? 'active' : ''}`;
      item.innerHTML = `<span class="item-icon">${UI_CONFIG.iconProject}</span><span>${escapeHtml(folder.name)}</span>`;
      item.onclick = async () => {
        await StorageUtils.addConversationToFolder(conversationId, folder.id);
        menu.remove();
        currentMenu = null;
        await injectFolderInterface();
      };
      menu.appendChild(item);
    });

    // Footer: créer un nouveau dossier
    const footer = document.createElement('div');
    footer.className = 'arena-move-menu-footer';

    const createInline = document.createElement('div');
    createInline.className = 'arena-create-folder-inline';
    createInline.innerHTML = `
      <input type="text" placeholder="${UI_CONFIG.placeholderNew}" maxlength="50" />
      <button class="create-btn">✓</button>
      <button class="cancel-btn">✕</button>
    `;

    const input = createInline.querySelector('input');
    const createBtn = createInline.querySelector('.create-btn');
    const cancelBtn = createInline.querySelector('.cancel-btn');

    createBtn.onclick = async () => {
      const name = input.value.trim();
      if (name) {
        const newFolder = await StorageUtils.createFolder(name);
        await StorageUtils.addConversationToFolder(conversationId, newFolder.id);
        menu.remove();
        currentMenu = null;
        await injectFolderInterface();
      }
    };

    cancelBtn.onclick = () => {
      menu.remove();
      currentMenu = null;
    };

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') createBtn.click();
      if (e.key === 'Escape') cancelBtn.click();
    });

    footer.appendChild(createInline);
    menu.appendChild(footer);

    // Positionner le menu avec position fixed pour éviter d'être coupé
    document.body.appendChild(menu);
    currentMenu = menu;

    // Calcul de la position
    const rect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    let left = rect.right + 10; // Par défaut à droite du bouton
    if (left + menuRect.width > window.innerWidth) {
      // Si ça dépasse l'écran à droite, on le met à gauche
      left = rect.left - menuRect.width - 10;
    }

    let top = rect.top;
    if (top + menuRect.height > window.innerHeight) {
      // Si ça dépasse en bas, on remonte
      top = window.innerHeight - menuRect.height - 10;
    }

    menu.style.position = 'fixed';
    menu.style.top = `${Math.max(10, top)}px`;
    menu.style.left = `${Math.max(10, left)}px`;

    // Fermer si clic extérieur
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== button) {
          menu.remove();
          currentMenu = null;
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);

    // Focus sur l'input
    input.focus();
  }

  /**
   * Modal de création de dossier
   */
  function showCreateFolderModal() {
    const overlay = document.createElement('div');
    overlay.className = 'arena-folder-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'arena-folder-modal';
    modal.innerHTML = `
      <h3>${UI_CONFIG.iconProject} ${UI_CONFIG.titleNew}</h3>
      <div class="arena-modal-content">
        <input type="text" placeholder="${UI_CONFIG.placeholderName}" maxlength="50" autofocus />
      </div>
      <div class="arena-folder-modal-actions">
        <button class="secondary cancel-btn">${UI_CONFIG.btnCancel}</button>
        <button class="primary create-btn">${UI_CONFIG.btnCreate}</button>
      </div>
    `;

    const input = modal.querySelector('input');
    const createBtn = modal.querySelector('.create-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    const closeModal = () => {
      modal.style.animation = 'modalSlideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      overlay.style.animation = 'fadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      setTimeout(() => overlay.remove(), 200);
    };

    createBtn.onclick = async () => {
      const name = input.value.trim();
      if (name) {
        closeModal();
        setTimeout(async () => {
          await StorageUtils.createFolder(name);
          await injectFolderInterface();
        }, 200);
      }
    };

    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') createBtn.click();
      if (e.key === 'Escape') closeModal();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    input.focus();
  }

  /**
   * Modal de renommage de dossier
   */
  function showRenameFolderModal(folder) {
    const overlay = document.createElement('div');
    overlay.className = 'arena-folder-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'arena-folder-modal';
    modal.innerHTML = `
      <h3>${UI_CONFIG.iconEdit} ${UI_CONFIG.titleRename}</h3>
      <div class="arena-modal-content">
        <input type="text" value="${escapeHtml(folder.name)}" maxlength="50" autofocus />
      </div>
      <div class="arena-folder-modal-actions">
        <button class="secondary cancel-btn">${UI_CONFIG.btnCancel}</button>
        <button class="primary save-btn">${UI_CONFIG.btnSave}</button>
      </div>
    `;

    const input = modal.querySelector('input');
    const saveBtn = modal.querySelector('.save-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    const closeModal = () => {
      modal.style.animation = 'modalSlideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      overlay.style.animation = 'fadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      setTimeout(() => overlay.remove(), 200);
    };

    saveBtn.onclick = async () => {
      const name = input.value.trim();
      if (name) {
        closeModal();
        setTimeout(async () => {
          await StorageUtils.renameFolder(folder.id, name);
          await injectFolderInterface();
        }, 200);
      }
    };

    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveBtn.click();
      if (e.key === 'Escape') closeModal();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    input.select();
  }

  /**
   * Modal de suppression de dossier
   */
  function showDeleteFolderModal(folder) {
    const overlay = document.createElement('div');
    overlay.className = 'arena-folder-modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'arena-folder-modal delete-modal';
    modal.innerHTML = `
      <h3>${UI_CONFIG.iconDelete} Supprimer le projet</h3>
      <div class="arena-modal-content">
        <p class="arena-modal-text">Voulez-vous vraiment supprimer le projet <strong>${escapeHtml(folder.name)}</strong> ?</p>
        <p class="arena-modal-subtext">Les conversations seront déplacées vers "Sans projet".</p>
      </div>
      <div class="arena-folder-modal-actions">
        <button class="secondary cancel-btn">${UI_CONFIG.btnCancel}</button>
        <button class="danger delete-btn">${UI_CONFIG.btnDelete}</button>
      </div>
    `;
    
    const deleteBtn = modal.querySelector('.delete-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    const closeModal = () => {
      modal.style.animation = 'modalSlideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      overlay.style.animation = 'fadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      setTimeout(() => overlay.remove(), 200);
    };

    deleteBtn.onclick = async () => {
      closeModal();
      setTimeout(async () => {
        await StorageUtils.deleteFolder(folder.id);
        await injectFolderInterface();
      }, 200);
    };

    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
    
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onKey);
      } else if (e.key === 'Enter') {
        deleteBtn.click();
        document.removeEventListener('keydown', onKey);
      }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /**
   * Drag & Drop
   */
  function setupDragAndDrop() {
    const conversationItems = document.querySelectorAll('.arena-conversation-item');

    conversationItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedConversation = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        if (draggedConversation) {
          draggedConversation.classList.remove('dragging');
          draggedConversation = null;
        }
      });
    });

    // Drop sur les en-têtes de dossier
    const folderHeaders = document.querySelectorAll('.arena-folder-header');
    folderHeaders.forEach(header => {
      header.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        header.classList.add('drag-over');
      });

      header.addEventListener('dragleave', () => {
        header.classList.remove('drag-over');
      });

      header.addEventListener('drop', async (e) => {
        e.preventDefault();
        header.classList.remove('drag-over');

        if (draggedConversation) {
          const conversationId = draggedConversation.dataset.conversationId;
          const folderId = header.parentElement.dataset.folderId;

          await StorageUtils.addConversationToFolder(conversationId, folderId);
          header.classList.add('just-updated');
          setTimeout(() => header.classList.remove('just-updated'), 300);
          await injectFolderInterface();
        }
      });
    });
  }

  /**
   * Observer les mutations (pour les SPA)
   */
  function setupMutationObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(async (mutations) => {
      let hasRelevantMutation = false;

      for (const mutation of mutations) {
        // Ignorer les mutations de notre propre interface
        if (mutation.target.classList?.contains('arena-folders-container') ||
          mutation.target.closest?.('.arena-folders-container') ||
          mutation.target.classList?.contains('arena-move-menu') ||
          mutation.target.closest?.('.arena-move-menu')) {
          continue;
        }

        let hasAddedOrRemoved = false;

        if (mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType !== 1) continue;
            const cls = typeof node.className === 'string' ? node.className : '';
            if (cls.includes('arena-folders-container') || 
                cls.includes('arena-move-menu') || 
                cls.includes('arena-folder-modal') ||
                cls.includes('move-to-folder') ||
                cls.includes('arena-conversation-wrapper')) {
              continue;
            }
            hasAddedOrRemoved = true;
          }
        }

        if (mutation.removedNodes.length > 0) {
          for (let i = 0; i < mutation.removedNodes.length; i++) {
            const node = mutation.removedNodes[i];
            if (node.nodeType !== 1) continue;
            const cls = typeof node.className === 'string' ? node.className : '';
            if (cls.includes('arena-folders-container') || 
                cls.includes('arena-move-menu') || 
                cls.includes('arena-folder-modal') ||
                cls.includes('move-to-folder') ||
                cls.includes('arena-conversation-wrapper')) {
              continue;
            }
            hasAddedOrRemoved = true;
          }
        }

        if (hasAddedOrRemoved) {
          hasRelevantMutation = true;
          break;
        }
      }

      if (!hasRelevantMutation) return;

      clearTimeout(observer.timeout);
      observer.timeout = setTimeout(async () => {
        const conversations = findConversations();
        const hasFoldersContainer = document.querySelector('.arena-folders-container');

        if (conversations.length > 0 && hasFoldersContainer) {
          await injectFolderInterface();
        } else if (!hasFoldersContainer && conversations.length > 0) {
          await setup();
        }
      }, 800);
    });

    let targetToObserve = findConversationsList();
    if (targetToObserve) targetToObserve = targetToObserve.parentElement;
    if (!targetToObserve) targetToObserve = findSidebar();
    if (!targetToObserve) targetToObserve = document.body;

    if (targetToObserve) {
      observer.observe(targetToObserve, {
        childList: true,
        subtree: true
      });
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

  // Lancer l'initialisation
  init();
})();