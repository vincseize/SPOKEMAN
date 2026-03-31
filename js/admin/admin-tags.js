// js/admin/admin-tags.js
console.log("admin-tags.js chargé");

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
                                        data-path="${filePath}" data-tag="${window.escapeHtml ? window.escapeHtml(tag) : tag}"
                                        style="background: ${tagColor}; color: white; border: none; padding: 4px 12px; border-radius: 4px;">
                                    #${window.escapeHtml ? window.escapeHtml(tag) : tag}
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

// Exposer
window.removeTagFromRow = removeTagFromRow;
window.addTagToRow = addTagToRow;
window.showTagSelectorForRow = showTagSelectorForRow;