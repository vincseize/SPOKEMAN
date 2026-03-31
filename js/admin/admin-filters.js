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

// --- FERMER TOUS LES DOSSIERS ---
function closeAllFolders() {
    document.querySelectorAll('.collapse').forEach(el => {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
        bsCollapse.hide();
    });
}

// --- METTRE À JOUR L'AFFICHAGE DU BOUTON CLEAR ---
function updateClearButtonVisibility() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn && searchInput) {
        const hasSearch = searchInput.value.trim() !== '';
        const hasTags = selectedTags.length > 0;
        clearBtn.style.display = (hasSearch || hasTags) ? 'block' : 'none';
    }
}

// --- EFFACER TOUTE LA RECHERCHE ---
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    selectedTags = [];
    updateSelectedTagsDisplay();
    
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    document.querySelectorAll('.folder-block').forEach(block => {
        block.style.display = 'block';
    });
    
    document.querySelectorAll('.file-item-row').forEach(row => {
        row.style.display = '';
        row.style.opacity = '1';
    });
    
    saveFilterState();
    closeAllFolders();
}

// --- FILTRAGE ---
function filterFiles() {
    const input = document.getElementById('searchInput');
    const searchTerm = input ? input.value.toLowerCase().trim() : "";
    const isSearching = searchTerm !== "" || selectedTags.length > 0;

    document.querySelectorAll('.folder-block').forEach(block => {
        const rows = block.querySelectorAll('.file-item-row');
        const folderCheckbox = block.querySelector('.folder-select-checkbox');
        const collapseEl = block.querySelector('.collapse');
        const isChecked = folderCheckbox ? folderCheckbox.checked : true;
        
        let hasVisibleInBlock = false;

        rows.forEach(row => {
            const fileName = row.getAttribute('data-filename')?.toLowerCase() || "";
            const fileTags = (row.getAttribute('data-tags') || "").toLowerCase();
            
            let matchTags = selectedTags.length === 0 || selectedTags.every(t => fileTags.includes(t.toLowerCase()));
            let matchSearch = searchTerm === "" || fileName.includes(searchTerm);
            
            const isMatch = matchTags && matchSearch;
            
            if (!isChecked) {
                row.style.display = "none";
                row.style.opacity = "0.5";
            } else {
                row.style.display = isMatch ? "" : "none";
                row.style.opacity = "1";
                if (isMatch) hasVisibleInBlock = true;
            }
        });

        if (isSearching) {
            block.style.display = hasVisibleInBlock ? "block" : "none";
        } else {
            block.style.display = "block";
        }
        
        if (isSearching && hasVisibleInBlock && collapseEl) {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
            bsCollapse.show();
            setTimeout(() => {
                if (typeof window.initAddTagButtons === 'function') {
                    window.initAddTagButtons();
                }
            }, 100);
        }
    });
    
    if (isSearching) {
        saveFilterState();
    }
    
    updateClearButtonVisibility();
}

// --- INITIALISATION ---
window.addEventListener('load', () => {
    closeAllFolders();
    
    const saved = sessionStorage.getItem('spokeman_filter_state');
    if (saved) {
        const state = JSON.parse(saved);
        if (state.searchTerm) document.getElementById('searchInput').value = state.searchTerm;
        selectedTags = state.selectedTags || [];
        updateSelectedTagsDisplay();
    }
    
    const hasActiveSearch = document.getElementById('searchInput')?.value !== "" || selectedTags.length > 0;
    
    if (!hasActiveSearch) {
        restoreAccordionStateOnLoad();
    }
    
    if (hasActiveSearch) {
        filterFiles();
    }
    
    setTimeout(() => {
        if (typeof window.initAddTagButtons === 'function') {
            window.initAddTagButtons();
        }
    }, 200);
    
    // Bouton clear search
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            clearSearch();
        };
    }
    
    updateClearButtonVisibility();
});

// Fonctions globales
window.addSelectedTag = function(tag) {
    if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
        updateSelectedTagsDisplay();
        filterFiles();
        updateClearButtonVisibility();
    }
};

window.removeSelectedTag = function(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    updateSelectedTagsDisplay();
    filterFiles();
    updateClearButtonVisibility();
};

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

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

window.filterFiles = filterFiles;
window.saveOpenedFoldersState = saveOpenedFoldersState;
window.clearSearch = clearSearch;