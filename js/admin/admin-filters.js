// js/admin/admin-filters.js
console.log("🚀 admin-filters.js : Chargement...");

let selectedTags = [];

// --- SAUVEGARDE ---
function saveFilterState() {
    const state = {
        searchTerm: document.getElementById('searchInput')?.value || "",
        selectedTags: selectedTags
    };
    sessionStorage.setItem('spokeman_filter_state', JSON.stringify(state));
}

// --- SAUVEGARDER L'ÉTAT DES DOSSIERS OUVERTS ---
function saveOpenedFoldersState() {
    const openedFolders = [];
    document.querySelectorAll('.collapse.show').forEach(el => {
        openedFolders.push(el.id);
    });
    sessionStorage.setItem('spokeman_opened_folders', JSON.stringify(openedFolders));
}

// --- RESTAURER L'ÉTAT DES ACCORDÉONS AU CHARGEMENT ---
function restoreAccordionStateOnLoad() {
    const savedOpenedFolders = sessionStorage.getItem('spokeman_opened_folders');
    if (savedOpenedFolders) {
        const openedFolders = JSON.parse(savedOpenedFolders);
        document.querySelectorAll('.collapse').forEach(el => {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
            if (openedFolders.includes(el.id)) {
                bsCollapse.show();
            } else {
                bsCollapse.hide();
            }
        });
    }
    
    const savedScrollPos = sessionStorage.getItem('spokeman_scroll_pos');
    if (savedScrollPos) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedScrollPos));
        }, 50);
    }
}

// --- FERMER TOUS LES DOSSIERS (utilisé uniquement à l'initialisation) ---
function closeAllFolders() {
    document.querySelectorAll('.collapse').forEach(el => {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
        bsCollapse.hide();
    });
}

// --- OUVRIR UN DOSSIER ---
function openFolder(folderId) {
    const el = document.getElementById(folderId);
    if (el) {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
        bsCollapse.show();
    }
}

// --- FILTRAGE ---
function filterFiles() {
    const input = document.getElementById('searchInput');
    const searchTerm = input ? input.value.toLowerCase().trim() : "";
    const isSearching = searchTerm !== "" || selectedTags.length > 0;

    // Appliquer les filtres sur chaque ligne
    document.querySelectorAll('.folder-block').forEach(block => {
        const rows = block.querySelectorAll('.file-item-row');
        const folderCheckbox = block.querySelector('.folder-select-checkbox');
        const collapseEl = block.querySelector('.collapse');
        const isChecked = folderCheckbox ? folderCheckbox.checked : true;
        
        let hasVisibleInBlock = false;

        // Filtrage des lignes
        rows.forEach(row => {
            const fileName = row.getAttribute('data-filename')?.toLowerCase() || "";
            const fileTags = (row.getAttribute('data-tags') || "").toLowerCase();
            
            let matchTags = selectedTags.length === 0 || selectedTags.every(t => fileTags.includes(t.toLowerCase()));
            let matchSearch = searchTerm === "" || fileName.includes(searchTerm);
            
            const isMatch = matchTags && matchSearch;
            
            // Si dossier décoché, on cache les fichiers mais on garde le dossier visible
            if (!isChecked) {
                row.style.display = "none";
                row.style.opacity = "0.5";
            } else {
                row.style.display = isMatch ? "" : "none";
                row.style.opacity = "1";
                if (isMatch) hasVisibleInBlock = true;
            }
        });

        // Gestion de l'affichage du bloc dossier
        if (isSearching) {
            // Pendant une recherche : cacher les dossiers sans résultats
            block.style.display = hasVisibleInBlock ? "block" : "none";
        } else {
            // Pas de recherche : tout afficher
            block.style.display = "block";
        }
        
        // Si le dossier a des résultats et qu'une recherche est active, l'ouvrir
        if (isSearching && hasVisibleInBlock && collapseEl) {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
            bsCollapse.show();
        }
    });
    
    // Sauvegarder l'état des filtres
    if (isSearching) {
        saveFilterState();
    }
}

// --- INITIALISATION ---
window.addEventListener('load', () => {
    // 1. Fermer tous les dossiers au chargement
    closeAllFolders();
    
    // 2. Restaurer l'état des filtres
    const saved = sessionStorage.getItem('spokeman_filter_state');
    if (saved) {
        const state = JSON.parse(saved);
        if (state.searchTerm) document.getElementById('searchInput').value = state.searchTerm;
        selectedTags = state.selectedTags || [];
        updateSelectedTagsDisplay();
    }
    
    // 3. Restaurer l'état des accordéons (uniquement si pas de recherche active)
    const hasActiveSearch = document.getElementById('searchInput')?.value !== "" || selectedTags.length > 0;
    
    if (!hasActiveSearch) {
        restoreAccordionStateOnLoad();
    }
    
    // 4. Appliquer le filtre si nécessaire
    if (hasActiveSearch) {
        filterFiles();
    }
});

// Fonctions globales
window.addSelectedTag = function(tag) {
    if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
        updateSelectedTagsDisplay();
        filterFiles();
    }
};

window.removeSelectedTag = function(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    updateSelectedTagsDisplay();
    filterFiles();
};

// Mise à jour de l'affichage des tags sélectionnés avec couleurs
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
            <span class="selected-tag-badge" style="background: ${tagColor}; color: white;">
                #${escapeHtml(tag)}
                <span onclick="window.removeSelectedTag('${escapeHtml(tag)}')">×</span>
            </span>
        `;
    }).join('');
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

window.filterFiles = filterFiles;
window.saveOpenedFoldersState = saveOpenedFoldersState;