// js/admin.js
console.log("admin.js chargé");

// COPIER LIEN
function copyLink(url, btn) {
    navigator.clipboard.writeText(url).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = "OK";
        setTimeout(() => btn.innerHTML = original, 1500);
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
    
    // Vérifier que les données sont présentes
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

// FILTRAGE
function filterFiles() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    const searchTerm = input.value.toLowerCase();
    
    document.querySelectorAll('.file-item-row').forEach(row => {
        const fileName = row.getAttribute('data-filename')?.toLowerCase() || "";
        const fileTags = row.getAttribute('data-tags')?.toLowerCase() || "";
        const isMatch = searchTerm === "" || fileName.includes(searchTerm) || fileTags.includes(searchTerm);
        row.style.display = isMatch ? "" : "none";
    });
    
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
    console.log("DOM chargé - Initialisation admin");
    
    // Initialiser la modale via la fonction de admin-modal.js
    if (typeof window.initModal === 'function') {
        window.initModal();
    } else {
        console.error("window.initModal non disponible");
    }
    
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
            if (!confirm('Supprimer ce fichier ?')) {
                e.preventDefault();
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