// js/admin.js
console.log("admin.js chargé");

// Variables pour stocker les tags sélectionnés (filtrage uniquement)
let selectedTags = [];

// COPIER LIEN
function copyLink(url, btn) {
    navigator.clipboard.writeText(url).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = "OK";
        setTimeout(() => btn.innerHTML = original, 1500);
    });
}

// SUPPRESSION DOSSIER - DOUBLE CONFIRMATION
function confirmFolderDelete(path, name) {
    if (confirm(`Supprimer le dossier "${name}" et tout son contenu ?`)) {
        if (confirm(`⚠️ DERNIÈRE CONFIRMATION ⚠️\n\nSupprimer définitivement "${name}" et tous ses fichiers ?\n\nCette action est irréversible !`)) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.innerHTML = `<input type="hidden" name="folder_path" value="${path}"><input type="hidden" name="force_delete_folder" value="1">`;
            document.body.appendChild(form);
            form.submit();
        }
    }
}

// SUPPRIMER UN TAG
function removeTagFromRow(filePath, tagName) {
    if (!confirm(`Retirer le tag "${tagName}" ?`)) return;
    
    const formData = new FormData();
    formData.append('file_path', filePath);
    formData.append('remove_tag', tagName);
    formData.append('update_media_tags', '1');
    
    fetch('admin.php', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => {
        if (response.ok) {
            window.location.reload();
        }
    })
    .catch(err => console.error('Erreur suppression tag:', err));
}

// AJOUTER UN TAG
function addTagToRow(filePath, tagName) {
    const formData = new FormData();
    formData.append('file_path', filePath);
    formData.append('add_tag', tagName);
    formData.append('update_media_tags', '1');
    
    fetch('admin.php', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => {
        if (response.ok) {
            window.location.reload();
        }
    })
    .catch(err => console.error('Erreur ajout tag:', err));
}

// AFFICHER LE SÉLECTEUR DE TAGS
function showTagSelectorForRow(filePath) {
    const row = document.querySelector(`.file-item-row[data-path="${filePath}"]`);
    if (!row) return;
    
    const currentTags = row.getAttribute('data-tags') ? row.getAttribute('data-tags').split(' ') : [];
    const tagColors = window.tagColors || {};
    const availableTags = Object.keys(tagColors).filter(tag => !currentTags.includes(tag));
    
    if (availableTags.length === 0) {
        alert('Aucun tag disponible');
        return;
    }
    
    const modalHtml = `
        <div class="modal fade" id="tempTagModal" tabindex="-1">
            <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-header">
                        <h6 class="modal-title">Ajouter un tag</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex flex-wrap gap-2">
                            ${availableTags.map(tag => {
                                const tagColor = tagColors[tag] || '#6c757d';
                                return `<button type="button" class="btn btn-sm tag-select-btn" 
                                        data-path="${filePath}" data-tag="${escapeHtml(tag)}"
                                        style="background: ${tagColor}; color: white; border: none; padding: 4px 12px; border-radius: 4px;">
                                    #${escapeHtml(tag)}
                                </button>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('tempTagModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('tempTagModal'));
    modal.show();
    
    document.querySelectorAll('.tag-select-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const path = this.getAttribute('data-path');
            const tag = this.getAttribute('data-tag');
            addTagToRow(path, tag);
            modal.hide();
            setTimeout(() => document.getElementById('tempTagModal')?.remove(), 300);
        });
    });
}

// SOUMISSION RENOMMAGE
function submitRename(form) {
    console.log("Soumission du formulaire de renommage");
    
    const formData = new FormData(form);
    
    const filePath = formData.get('file_path');
    const newName = formData.get('new_name');
    
    if (!filePath) {
        console.error("Chemin du fichier manquant");
        return;
    }
    
    if (!newName || newName.trim() === '') {
        console.error("Nom invalide");
        return;
    }
    
    console.log("Renommage de:", filePath, "vers:", newName);
    
    fetch('admin.php', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => {
        console.log("Réponse reçue, status:", response.status);
        if (response.ok) {
            console.log("Renommage réussi, rechargement...");
            window.location.reload();
        } else {
            console.error("Erreur lors du renommage, status:", response.status);
        }
    })
    .catch(err => console.error('Erreur fetch:', err));
}

// AJOUTER UN TAG AU FILTRAGE
function addSelectedTag(tag) {
    if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
        updateSelectedTagsDisplay();
        filterFiles();
        console.log("Tag ajouté au filtre:", tag, "Tags actifs:", selectedTags);
    }
}

// SUPPRIMER UN TAG DU FILTRAGE
function removeSelectedTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    updateSelectedTagsDisplay();
    filterFiles();
    console.log("Tag retiré du filtre:", tag, "Tags actifs:", selectedTags);
}

// METTRE À JOUR L'AFFICHAGE DES BADGES DE FILTRAGE
function updateSelectedTagsDisplay() {
    const container = document.getElementById('selectedTagsContainer');
    if (!container) return;
    
    if (selectedTags.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = selectedTags.map(tag => {
        const tagColor = window.tagColors ? (window.tagColors[tag] || '#6c757d') : '#6c757d';
        return `
            <div class="selected-tag badge" style="background: ${tagColor}; color: white; font-size: 0.75rem; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px;">
                #${escapeHtml(tag)}
                <button type="button" class="remove-tag-btn" data-tag="${escapeHtml(tag)}" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 0.8rem; padding: 0; margin-left: 2px;">
                    ✕
                </button>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.remove-tag-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tag = this.getAttribute('data-tag');
            removeSelectedTag(tag);
        });
    });
}

// FILTRAGE - Recherche par nom + tags sélectionnés
function filterFiles() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (!input) return;
    
    let searchTerm = input.value.toLowerCase().trim();
    
    if (clearBtn) {
        clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    }
    
    console.log("=== FILTRAGE ===");
    console.log("Recherche nom:", searchTerm);
    console.log("Tags sélectionnés:", selectedTags);
    
    let hasVisibleRows = false;
    
    document.querySelectorAll('.file-item-row').forEach(row => {
        const fileName = row.getAttribute('data-filename')?.toLowerCase() || "";
        const fileTagsAttr = row.getAttribute('data-tags') || "";
        const fileTagsArray = fileTagsAttr.trim() === "" ? [] : fileTagsAttr.split(/\s+/);
        
        let isMatch = true;
        
        // Filtrage par tags (tous les tags sélectionnés doivent être présents)
        if (selectedTags.length > 0) {
            isMatch = selectedTags.every(tag => fileTagsArray.includes(tag));
        }
        
        // Filtrage par nom de fichier
        if (isMatch && searchTerm !== "") {
            isMatch = fileName.includes(searchTerm);
        }
        
        row.style.display = isMatch ? "" : "none";
        if (isMatch) hasVisibleRows = true;
    });
    
    console.log("Fichiers visibles:", hasVisibleRows);
    
    document.querySelectorAll('.folder-block').forEach(block => {
        const visibleRows = block.querySelectorAll('.file-item-row:not([style*="display: none"])');
        block.style.display = visibleRows.length > 0 ? "" : "none";
    });
    
    const noResultsDiv = document.getElementById('noSearchResults');
    if (!hasVisibleRows && (selectedTags.length > 0 || searchTerm !== "")) {
        let message = "";
        if (selectedTags.length > 0 && searchTerm !== "") {
            message = `Aucun résultat pour les tags [${selectedTags.map(t => "#"+t).join(", ")}] et le nom "${searchTerm}"`;
        } else if (selectedTags.length > 0) {
            message = `Aucun résultat pour les tags [${selectedTags.map(t => "#"+t).join(", ")}]`;
        } else {
            message = `Aucun résultat pour "${searchTerm}"`;
        }
        
        if (!noResultsDiv) {
            const mainCol = document.querySelector('.col-lg-9');
            const div = document.createElement('div');
            div.id = 'noSearchResults';
            div.className = 'alert alert-info text-center mt-3';
            div.innerHTML = message;
            mainCol?.appendChild(div);
        } else {
            noResultsDiv.style.display = 'block';
            noResultsDiv.innerHTML = message;
        }
    } else if (noResultsDiv) {
        noResultsDiv.style.display = 'none';
    }
}

// EFFACER LA RECHERCHE (nom et tags)
function clearSearch() {
    selectedTags = [];
    updateSelectedTagsDisplay();
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
        filterFiles();
        input.focus();
    }
    console.log("Recherche effacée");
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
    console.log("DOM chargé - Initialisation admin");
    
    if (typeof window.initModal === 'function') {
        window.initModal();
    } else {
        console.error("window.initModal non disponible");
    }
    
    // Gestion des clics sur les tags dans la cloud
    document.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tag = this.getAttribute('data-tag');
            addSelectedTag(tag);
        });
    });
    
    // Modale sur les vignettes
    document.querySelectorAll('.preview-trigger').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = this.closest('.file-item-row');
            if (row && typeof window.openModal === 'function') {
                window.openModal(
                    row.getAttribute('data-path'),
                    row.getAttribute('data-url'),
                    row.getAttribute('data-ext'),
                    row.getAttribute('data-filename')
                );
            } else {
                console.error("window.openModal non disponible");
            }
        });
    });
    
    // Renommage - gestion des inputs
    document.querySelectorAll('.rename-input').forEach(input => {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('focus', (e) => e.stopPropagation());
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                const form = input.closest('form');
                if (form) submitRename(form);
            }
        });
    });
    
    // Renommage - soumission des formulaires
    document.querySelectorAll('.rename-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            submitRename(form);
        });
    });
    
    // Copie de lien
    document.querySelectorAll('.btn-copy-minimal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.getAttribute('data-url');
            if (url) copyLink(url, btn);
        });
    });
    
    // Suppression de tag dans la ligne
    document.querySelectorAll('.btn-remove-tag-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.getAttribute('data-path');
            const tag = btn.getAttribute('data-tag');
            if (path && tag) removeTagFromRow(path, tag);
        });
    });
    
    // Ajout de tag
    document.querySelectorAll('.btn-add-tag-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.getAttribute('data-path');
            if (path) showTagSelectorForRow(path);
        });
    });
    
    // Suppression de fichier
    document.querySelectorAll('.delete-file-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.stopPropagation();
            if (!confirm('Supprimer ce fichier ?')) {
                e.preventDefault();
                return false;
            }
        });
    });
    
    // Raccourcis clavier pour la modale
    document.addEventListener('keydown', (e) => {
        const modalEl = document.getElementById('previewModal');
        if (!modalEl || !modalEl.classList.contains('show')) return;
        
        if (e.key === "ArrowRight") { e.preventDefault(); if (typeof window.changeMedia === 'function') window.changeMedia(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); if (typeof window.changeMedia === 'function') window.changeMedia(-1); }
        if (e.key === "Escape" && window.previewModal) window.previewModal.hide();
    });
    
    // Nettoyage modale
    const modalElement = document.getElementById('previewModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            const modalContent = document.getElementById('modalMediaContent');
            if (modalContent) modalContent.innerHTML = '';
        });
    }
    
    // Clear search button
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            clearSearch();
        });
    }
});

// Exposer les fonctions
window.copyLink = copyLink;
window.confirmFolderDelete = confirmFolderDelete;
window.removeTagFromRow = removeTagFromRow;
window.addTagToRow = addTagToRow;
window.showTagSelectorForRow = showTagSelectorForRow;
window.submitRename = submitRename;
window.filterFiles = filterFiles;
window.escapeHtml = escapeHtml;
window.addSelectedTag = addSelectedTag;
window.removeSelectedTag = removeSelectedTag;
window.clearSearch = clearSearch;