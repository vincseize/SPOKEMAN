// js/admin/admin.js
console.log("admin.js chargé");

document.addEventListener('DOMContentLoaded', function() {
    
    if (typeof window.initModal === 'function') window.initModal();

    // Input de recherche : on déclenche le filtre à chaque touche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (window.filterFiles) window.filterFiles();
        });
    }

    // Checkboxes dossiers
    document.querySelectorAll('.folder-select-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            if (window.filterFiles) window.filterFiles();
        });
    });

    // Tags Cloud
    document.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            if (window.addSelectedTag) window.addSelectedTag(btn.getAttribute('data-tag'));
        };
    });

    // Sélection globale
    const selectAllBtn = document.getElementById('selectAllTags');
    if (selectAllBtn) {
        selectAllBtn.onclick = () => {
            document.querySelectorAll('.folder-select-checkbox').forEach(cb => cb.checked = true);
            window.filterFiles();
        };
    }

    const deselectAllBtn = document.getElementById('deselectAllTags');
    if (deselectAllBtn) {
        deselectAllBtn.onclick = () => {
            document.querySelectorAll('.folder-select-checkbox').forEach(cb => cb.checked = false);
            window.filterFiles();
        };
    }

    // Preview
    document.querySelectorAll('.preview-trigger').forEach(trigger => {
        trigger.onclick = (e) => {
            e.stopPropagation();
            const row = trigger.closest('.file-item-row');
            if (row && window.openModal) {
                window.openModal(
                    row.getAttribute('data-path'),
                    row.getAttribute('data-url'),
                    row.getAttribute('data-ext'),
                    row.getAttribute('data-filename')
                );
            }
        };
    });
    
    // === INITIALISER LES BOUTONS + TAG ===
    if (typeof window.initAddTagButtons === 'function') {
        window.initAddTagButtons();
    }
});

// Fonction pour initialiser les boutons + Tag (appelée aussi après ouverture de dossier)
function initAddTagButtons() {
    document.querySelectorAll('.btn-add-tag-row').forEach(btn => {
        btn.removeEventListener('click', handleAddTagClick);
        btn.addEventListener('click', handleAddTagClick);
    });
}

function handleAddTagClick(e) {
    e.stopPropagation();
    const path = this.getAttribute('data-path');
    if (path && window.showTagSelectorForRow) {
        window.showTagSelectorForRow(path);
    }
}

// Exposer la fonction globalement
window.initAddTagButtons = initAddTagButtons;