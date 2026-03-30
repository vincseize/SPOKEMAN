/**
 * js/admin/admin-filters.js
 * Debug Version
 */
console.log("🚀 admin-filters.js : Chargement du script...");

let selectedTags = [];

// Helper pour l'échappement HTML
window.escapeHtml = window.escapeHtml || function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// --- SAUVEGARDE DE L'ÉTAT ---
function saveFilterState() {
    const state = {
        searchTerm: document.getElementById('searchInput')?.value || "",
        selectedTags: selectedTags,
        uncheckedFolders: Array.from(document.querySelectorAll('.folder-select-checkbox:not(:checked)'))
                               .map(cb => cb.getAttribute('data-folder'))
    };
    sessionStorage.setItem('spokeman_filter_state', JSON.stringify(state));
}

// --- GESTION DES TAGS ---
function addSelectedTag(tag) {
    console.log("🏷️ Tag ajouté :", tag);
    if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
        updateSelectedTagsDisplay();
        filterFiles();
    }
}

function removeSelectedTag(tag) {
    console.log("🏷️ Tag retiré :", tag);
    selectedTags = selectedTags.filter(t => t !== tag);
    updateSelectedTagsDisplay();
    filterFiles();
}

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
                #${window.escapeHtml(tag)}
                <button type="button" class="remove-tag-btn" data-tag="${window.escapeHtml(tag)}" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 0.8rem; padding: 0; margin-left: 2px;">
                    ✕
                </button>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.remove-tag-btn').forEach(btn => {
        btn.onclick = handleRemoveTag;
    });
}

function handleRemoveTag(e) {
    e.stopPropagation();
    const tag = this.getAttribute('data-tag');
    removeSelectedTag(tag);
}

// --- COLLAPSE MANUEL (Logique de clic sur dossier) ---
function toggleFolderCollapse(id, event) {
    console.log("🖱️ CLIC détecté sur le bandeau dossier !");
    console.log("ID cible transmis par PHP :", id);
    
    const el = document.getElementById(id);
    
    if (!el) {
        console.error("❌ ERREUR : L'élément avec l'ID '" + id + "' est introuvable dans la page.");
        return;
    }

    if (typeof bootstrap === 'undefined') {
        console.error("❌ ERREUR : Bootstrap JS (bootstrap.bundle.min.js) n'est pas détecté.");
        return;
    }

    try {
        console.log("🔄 Exécution du Toggle Bootstrap sur :", el);
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el);
        bsCollapse.toggle();
    } catch (err) {
        console.error("❌ ERREUR Bootstrap Collapse :", err);
    }
}

// --- FONCTION DE FILTRAGE PRINCIPALE ---
function filterFiles() {
    console.log("🔍 Filtrage en cours...");
    const input = document.getElementById('searchInput');
    let searchTerm = input ? input.value.toLowerCase().trim() : "";
    const isSearching = searchTerm !== "" || selectedTags.length > 0;
    let hasVisibleRows = false;

    document.querySelectorAll('.folder-block').forEach(block => {
        const rows = block.querySelectorAll('.file-item-row');
        const collapseEl = block.querySelector('.collapse');
        const folderCheckbox = block.querySelector('.folder-select-checkbox');
        const isChecked = folderCheckbox ? folderCheckbox.checked : true;
        
        let hasVisibleInBlock = false;

        if (isChecked) {
            rows.forEach(row => {
                const fileName = row.getAttribute('data-filename')?.toLowerCase() || "";
                const fileTagsAttr = row.getAttribute('data-tags') || "";
                const fileTagsArray = fileTagsAttr.split(/\s+/).filter(t => t !== "");
                
                let isMatch = true;
                if (selectedTags.length > 0) {
                    isMatch = selectedTags.every(tag => fileTagsArray.includes(tag.toLowerCase()));
                }
                if (isMatch && searchTerm !== "") {
                    isMatch = fileName.includes(searchTerm);
                }
                
                row.style.display = isMatch ? "" : "none";
                if (isMatch) hasVisibleInBlock = true;
            });
        }

        if (hasVisibleInBlock) hasVisibleRows = true;

        // LOGIQUE DE COLLAPSE AUTO
        if (collapseEl && isSearching) {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
            if (hasVisibleInBlock) {
                bsCollapse.show();
            } else {
                bsCollapse.hide();
            }
        }
    });

    saveFilterState();
}

function clearSearch() {
    console.log("🧹 Clear search...");
    selectedTags = [];
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    sessionStorage.removeItem('spokeman_filter_state');
    updateSelectedTagsDisplay();
    filterFiles();
}

// --- INITIALISATION AU CHARGEMENT ---
window.addEventListener('load', () => {
    console.log("🏁 Initialisation des collapses...");
    
    const collapses = document.querySelectorAll('.collapse');
    
    // Récupérer les dossiers qui étaient ouverts avant le refresh
    const savedOpened = sessionStorage.getItem('spokeman_opened_folders');
    const openedIds = savedOpened ? JSON.parse(savedOpened) : [];

    collapses.forEach((el) => {
        try {
            // Si l'ID du dossier est dans notre liste sauvegardée, on l'affiche
            // Sinon, on le cache par défaut
            const shouldBeOpen = openedIds.includes(el.id);
            
            const bsCollapse = new bootstrap.Collapse(el, { 
                toggle: false 
            });

            if (shouldBeOpen) {
                bsCollapse.show();
            } else {
                bsCollapse.hide();
            }
        } catch (e) {
            console.error("Échec initialisation dossier :", e);
        }
    });

    // Une fois restauré, on peut nettoyer le storage pour ne pas 
    // polluer les navigations futures (optionnel)
    sessionStorage.removeItem('spokeman_opened_folders');
});

// Exposition globale
window.addSelectedTag = addSelectedTag;
window.removeSelectedTag = removeSelectedTag;
window.filterFiles = filterFiles;
window.clearSearch = clearSearch;
window.toggleFolderCollapse = toggleFolderCollapse;

console.log("✅ admin-filters.js : Prêt.");