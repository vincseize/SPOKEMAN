console.log("admin.js chargé");

let currentGallery = [];
let currentIndex = 0;
let previewModal = null;
let currentFilePath = null;
// Récupérer les couleurs depuis la variable globale injectée par PHP
let tagColors = window.tagColors || {};

// OUVERTURE DE LA MODALE
function openModal(path, url, ext, fileName) {
    console.log("Ouverture modale:", path);
    currentFilePath = path;
    
    // Récupérer le dossier du fichier cliqué
    const clickedCard = document.querySelector(`.file-item-row[data-path="${path}"]`);
    if (!clickedCard) {
        console.error("Carte non trouvée pour le chemin:", path);
        return;
    }
    const clickedFolder = clickedCard.getAttribute('data-folder');
    console.log("Dossier du fichier cliqué:", clickedFolder);
    
    // Filtrer les cartes pour ne garder que celles du même dossier
    const allCards = document.querySelectorAll('.file-item-row');
    const filteredCards = Array.from(allCards).filter(card => {
        return card.getAttribute('data-folder') === clickedFolder;
    });
    
    console.log("Cartes du dossier:", filteredCards.length);
    
    currentGallery = filteredCards.map(card => {
        const tagsAttr = card.getAttribute('data-tags');
        const tags = tagsAttr && tagsAttr.trim() !== '' ? tagsAttr.split(' ') : [];
        
        return {
            path: card.getAttribute('data-path'),
            url: card.getAttribute('data-url'),
            ext: card.getAttribute('data-ext'),
            fileName: card.getAttribute('data-filename'),
            tags: tags
        };
    });
    
    console.log("Galerie construite avec", currentGallery.length, "fichiers");
    
    currentIndex = currentGallery.findIndex(item => item.path === path);
    if (currentIndex === -1) currentIndex = 0;
    
    updateModalContent();
    
    if (previewModal) {
        previewModal.show();
    }
}

// AFFICHER LES TAGS DANS LA MODALE
function displayModalTags(filePath, tags) {
    const container = document.getElementById('modalTagsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!tags || tags.length === 0) {
        container.innerHTML = '<span class="text-muted small">Aucun tag</span>';
        return;
    }
    
    tags.forEach(tag => {
        const tagColor = tagColors[tag] || '#6c757d';
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item d-flex align-items-center gap-1';
        tagElement.style.background = tagColor;
        tagElement.style.color = 'white';
        tagElement.style.borderRadius = '4px';
        tagElement.style.padding = '2px 6px 2px 10px';
        tagElement.style.fontSize = '0.7rem';
        tagElement.style.fontWeight = '500';
        
        tagElement.innerHTML = `
            <span>#${escapeHtml(tag)}</span>
            <button type="button" class="btn-remove-tag" onclick="window.removeTag('${escapeHtml(tag)}')" 
                    style="background: none; border: none; color: white; cursor: pointer; font-size: 0.8rem; padding: 0 4px; opacity: 0.7;"
                    onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                ✕
            </button>
        `;
        container.appendChild(tagElement);
    });
}

// SUPPRIMER UN TAG
function removeTag(tagName) {
    if (!confirm(`Retirer le tag "${tagName}" ?`)) return;
    
    const formData = new FormData();
    formData.append('file_path', currentFilePath);
    formData.append('remove_tag', tagName);
    formData.append('update_media_tags', '1');
    
    fetch('admin.php', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => {
        if (response.ok) {
            // Mettre à jour les tags dans la galerie
            const currentItem = currentGallery[currentIndex];
            if (currentItem) {
                const updatedTags = currentItem.tags.filter(t => t !== tagName);
                currentItem.tags = updatedTags;
                displayModalTags(currentFilePath, updatedTags);
                
                // Mettre à jour l'attribut data-tags dans la carte
                const card = document.querySelector(`.file-item-row[data-path="${currentFilePath}"]`);
                if (card) {
                    card.setAttribute('data-tags', updatedTags.join(' ').toLowerCase());
                    const tagsContainer = card.querySelector('.file-tags');
                    if (tagsContainer) {
                        tagsContainer.innerHTML = updatedTags.map(t => `<span class="tag-badge" style="background: ${tagColors[t] || '#6c757d'};">#${t}</span>`).join('');
                    }
                }
            }
        }
    })
    .catch(err => console.error('Erreur suppression tag:', err));
}

// AFFICHER LE SÉLECTEUR DE TAGS
function showTagSelector() {
    const currentItem = currentGallery[currentIndex];
    const currentTags = currentItem?.tags || [];
    
    // Tags disponibles (ceux qui ne sont pas déjà attribués)
    const availableTags = Object.keys(tagColors).filter(tag => !currentTags.includes(tag));
    
    const container = document.getElementById('availableTagsList');
    if (!container) return;
    
    if (availableTags.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">Aucun tag disponible</div>';
    } else {
        container.innerHTML = availableTags.map(tag => {
            const tagColor = tagColors[tag] || '#6c757d';
            return `
                <button type="button" class="btn btn-sm" 
                        onclick="window.addTag('${escapeHtml(tag)}')"
                        style="background: ${tagColor}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                    #${escapeHtml(tag)}
                </button>
            `;
        }).join('');
    }
    
    const modal = new bootstrap.Modal(document.getElementById('tagSelectorModal'));
    modal.show();
}

// AJOUTER UN TAG
function addTag(tagName) {
    const formData = new FormData();
    formData.append('file_path', currentFilePath);
    formData.append('add_tag', tagName);
    formData.append('update_media_tags', '1');
    
    fetch('admin.php', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => {
        if (response.ok) {
            // Mettre à jour les tags dans la galerie
            const currentItem = currentGallery[currentIndex];
            if (currentItem) {
                const updatedTags = [...currentItem.tags, tagName];
                currentItem.tags = updatedTags;
                displayModalTags(currentFilePath, updatedTags);
                
                // Mettre à jour l'attribut data-tags dans la carte
                const card = document.querySelector(`.file-item-row[data-path="${currentFilePath}"]`);
                if (card) {
                    card.setAttribute('data-tags', updatedTags.join(' ').toLowerCase());
                    const tagsContainer = card.querySelector('.file-tags');
                    if (tagsContainer) {
                        tagsContainer.innerHTML = updatedTags.map(t => `<span class="tag-badge" style="background: ${tagColors[t] || '#6c757d'};">#${t}</span>`).join('');
                    }
                }
                
                // Fermer la modale de sélection
                const selectorModal = bootstrap.Modal.getInstance(document.getElementById('tagSelectorModal'));
                if (selectorModal) selectorModal.hide();
            }
        }
    })
    .catch(err => console.error('Erreur ajout tag:', err));
}

// MISE À JOUR MODALE
function updateModalContent() {
    const item = currentGallery[currentIndex];
    if (!item) return;
    
    const modalContent = document.getElementById('modalMediaContent');
    const modalFileName = document.getElementById('modalFileName');
    const modalDeletePath = document.getElementById('modalDeletePath');
    const modalCopyBtn = document.getElementById('modalCopyBtn');
    const specsElem = document.getElementById('modalMediaSpecs');
    
    if (!modalContent) return;
    
    modalContent.innerHTML = '';
    
    if (modalFileName) {
        modalFileName.innerHTML = `<span class="badge bg-dark me-2">${currentIndex + 1} / ${currentGallery.length}</span> ${item.fileName || item.path.split('/').pop()}`;
    }
    
    if (modalDeletePath) {
        modalDeletePath.value = item.path;
    }
    
    if (modalCopyBtn) {
        modalCopyBtn.dataset.copyUrl = item.url;
        modalCopyBtn.innerText = "📋 Copier";
    }
    
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'webm', 'mov'];
    
    if (imgExts.includes(item.ext)) {
        const img = new Image();
        img.src = item.path;
        img.className = "img-fluid shadow rounded";
        img.style.maxHeight = "65vh";
        img.onload = function() {
            if (specsElem) {
                fetch(item.path).then(r => r.blob()).then(blob => {
                    const size = (blob.size / 1024).toFixed(1) + ' KB';
                    specsElem.innerHTML = `${img.naturalWidth}x${img.naturalHeight} px | ${size}`;
                }).catch(() => {
                    specsElem.innerHTML = `${img.naturalWidth}x${img.naturalHeight} px`;
                });
            }
        };
        modalContent.appendChild(img);
    } else if (videoExts.includes(item.ext)) {
        const video = document.createElement('video');
        video.src = item.path;
        video.controls = true;
        video.autoplay = true;
        video.className = "w-100 shadow rounded";
        video.style.maxHeight = "65vh";
        if (specsElem) specsElem.innerHTML = "Vidéo";
        modalContent.appendChild(video);
    } else {
        modalContent.innerHTML = `<div class="p-5 bg-light rounded border text-center"><h1 class="display-1">📄</h1><h5>.${item.ext.toUpperCase()}</h5></div>`;
        if (specsElem) specsElem.innerHTML = "Fichier document";
    }
    
    // Afficher les tags
    displayModalTags(item.path, item.tags || []);
}

// NAVIGATION
function changeMedia(direction, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (currentGallery.length <= 1) return;
    
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = currentGallery.length - 1;
    if (currentIndex >= currentGallery.length) currentIndex = 0;
    
    currentFilePath = currentGallery[currentIndex].path;
    updateModalContent();
}

// COPIER URL
function modalCopyAction() {
    const modalCopyBtn = document.getElementById('modalCopyBtn');
    if (!modalCopyBtn) return;
    
    const url = modalCopyBtn.dataset.copyUrl;
    if (!url) return;
    
    navigator.clipboard.writeText(url).then(() => {
        const originalText = modalCopyBtn.innerText;
        modalCopyBtn.innerText = "✅ Copié !";
        setTimeout(() => {
            modalCopyBtn.innerText = originalText;
        }, 2000);
    });
}

// SUPPRESSION DOSSIER
function confirmFolderDelete(path, name) {
    if (confirm(`Supprimer le dossier "${name}" et tout son contenu ?`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.innerHTML = `<input type="hidden" name="folder_path" value="${path}"><input type="hidden" name="force_delete_folder" value="1">`;
        document.body.appendChild(form);
        form.submit();
    }
}

// COPIE LIEN
function copyLink(url, btn) {
    navigator.clipboard.writeText(url).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = "OK";
        setTimeout(() => btn.innerHTML = original, 1500);
    });
}

// FILTRAGE
function filterFiles() {
    console.log("filterFiles appelé");
    const input = document.getElementById('searchInput');
    if (!input) return;
    const searchTerm = input.value.toLowerCase();
    
    document.querySelectorAll('.file-item-row').forEach(row => {
        const fileName = row.getAttribute('data-filename')?.toLowerCase() || "";
        const fileTags = row.getAttribute('data-tags')?.toLowerCase() || "";
        const isMatch = searchTerm === "" || fileName.includes(searchTerm) || fileTags.includes(searchTerm);
        row.style.display = isMatch ? "" : "none";
    });
    
    // Afficher/cacher les dossiers vides
    document.querySelectorAll('.folder-block').forEach(block => {
        const visibleRows = block.querySelectorAll('.file-item-row[style=""]');
        block.style.display = visibleRows.length > 0 ? "" : "none";
    });
}

// ESCAPE HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// INITIALISATION
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé");
    
    const modalElement = document.getElementById('previewModal');
    if (modalElement) {
        previewModal = new bootstrap.Modal(modalElement);
        console.log("Modale initialisée");
    }
    
    const cards = document.querySelectorAll('.file-item-row');
    console.log("Fichiers trouvés:", cards.length);
    
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Ne pas déclencher si on clique sur un formulaire, bouton, input, ou zone de renommage
            if (e.target.closest('form') || 
                e.target.closest('button') || 
                e.target.closest('input') || 
                e.target.closest('.rename-container') ||
                e.target.closest('.btn-rename') ||
                e.target.closest('.btn-validate')) {
                console.log("Clic ignoré (élément interactif)");
                return;
            }
            e.stopPropagation();
            const path = this.getAttribute('data-path');
            const url = this.getAttribute('data-url');
            const ext = this.getAttribute('data-ext');
            const fileName = this.getAttribute('data-filename');
            openModal(path, url, ext, fileName);
        });
    });
    
    // Empêcher la propagation des événements sur les inputs de renommage
    document.querySelectorAll('.rename-input').forEach(input => {
        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        input.addEventListener('focus', function(e) {
            e.stopPropagation();
        });
        input.addEventListener('keydown', function(e) {
            e.stopPropagation();
        });
    });
    
    // Empêcher la propagation sur les boutons de renommage
    document.querySelectorAll('.btn-rename, .btn-validate').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    document.addEventListener('keydown', function(e) {
        const modalElement = document.getElementById('previewModal');
        if (!modalElement || !modalElement.classList.contains('show')) return;
        
        if (e.key === "ArrowRight") {
            e.preventDefault();
            changeMedia(1);
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            changeMedia(-1);
        }
        if (e.key === "Escape" && previewModal) {
            previewModal.hide();
        }
    });
    
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', function() {
            const modalContent = document.getElementById('modalMediaContent');
            if (modalContent) modalContent.innerHTML = '';
        });
    }
});

// Exposer les fonctions globalement
window.openModal = openModal;
window.changeMedia = changeMedia;
window.modalCopyAction = modalCopyAction;
window.confirmFolderDelete = confirmFolderDelete;
window.copyLink = copyLink;
window.filterFiles = filterFiles;
window.removeTag = removeTag;
window.addTag = addTag;
window.showTagSelector = showTagSelector;