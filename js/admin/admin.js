// js/admin.js
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
});