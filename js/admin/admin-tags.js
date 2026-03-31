// js/admin/admin-tags.js
console.log("admin-tags.js chargé");

// SUPPRIMER UN TAG
window.removeTagFromRow = function(filePath, tagName) {
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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateFileRowTags(filePath);
        }
    })
    .catch(err => console.error('Erreur suppression tag:', err));
};

// AJOUTER UN TAG
window.addTagToRow = function(filePath, tagName) {
    const formData = new FormData();
    formData.append('file_path', filePath);
    formData.append('add_tag', tagName);
    formData.append('update_media_tags', '1');
    
    fetch('admin.php', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateFileRowTags(filePath);
        }
    })
    .catch(err => console.error('Erreur ajout tag:', err));
};

// METTRE À JOUR L'AFFICHAGE DES TAGS DANS UNE LIGNE
function updateFileRowTags(filePath) {
    const row = document.querySelector(`.file-item-row[data-path="${filePath}"]`);
    if (!row) return;
    
    fetch(`admin.php?get_tags_for=${encodeURIComponent(filePath)}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.tags !== undefined) {
            const tags = data.tags;
            row.setAttribute('data-tags', tags.join(' ').toLowerCase());
            
            const tagsContainer = row.querySelector('.d-flex.flex-wrap.gap-1.mt-1');
            if (tagsContainer) {
                if (tags.length === 0) {
                    tagsContainer.innerHTML = `
                        <span class="text-muted small">Aucun tag</span>
                        <button type="button" class="btn-add-tag-row btn btn-sm btn-outline-primary" data-path="${filePath}" style="font-size: 0.6rem; padding: 2px 6px;">+ Tag</button>
                    `;
                } else {
                    const tagsHtml = tags.map(tag => {
                        const tagColor = window.tagColors ? (window.tagColors[tag] || '#6c757d') : '#6c757d';
                        return `
                            <div class="tag-item" style="background: ${tagColor}; color: white; font-size: 0.65rem; padding: 2px 6px 2px 8px; border-radius: 4px; display: inline-flex; align-items: center;">
                                <span>#${escapeHtml(tag)}</span>
                                <button type="button" class="btn-remove-tag-row" data-path="${filePath}" data-tag="${escapeHtml(tag)}" 
                                        style="background: none; border: none; color: white; cursor: pointer; font-size: 0.7rem; padding: 0 0 0 4px;">✕</button>
                            </div>
                        `;
                    }).join('');
                    
                    tagsContainer.innerHTML = `
                        ${tagsHtml}
                        <button type="button" class="btn-add-tag-row btn btn-sm btn-outline-primary" data-path="${filePath}" style="font-size: 0.6rem; padding: 2px 6px;">+ Tag</button>
                    `;
                }
                
                if (typeof window.initAddTagButtons === 'function') {
                    window.initAddTagButtons();
                }
            }
        }
    })
    .catch(err => console.error('Erreur chargement tags:', err));
}

// AFFICHER LE SÉLECTEUR DE TAGS
window.showTagSelectorForRow = function(filePath) {
    console.log("showTagSelectorForRow appelé pour:", filePath);
    
    const row = document.querySelector(`.file-item-row[data-path="${filePath}"]`);
    if (!row) {
        console.error("Ligne non trouvée pour:", filePath);
        return;
    }
    
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
            window.addTagToRow(path, tag);
            modal.hide();
            setTimeout(() => document.getElementById('tempTagModal')?.remove(), 300);
        });
    });
};

// ESCAPE HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}