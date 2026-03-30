console.log("admin-filters.js chargé");

let selectedTags = [];

// --- NOUVEAU : SAUVEGARDE DE L'ÉTAT ---
function saveFilterState() {
    const state = {
        searchTerm: document.getElementById('searchInput')?.value || "",
        selectedTags: selectedTags,
        // On sauvegarde les IDs des dossiers décochés (plus simple)
        uncheckedFolders: Array.from(document.querySelectorAll('.folder-select-checkbox:not(:checked)'))
                               .map(cb => cb.getAttribute('data-folder'))
    };
    sessionStorage.setItem('spokeman_filter_state', JSON.stringify(state));
}

function addSelectedTag(tag) {
    if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
        updateSelectedTagsDisplay();
        filterFiles();
        console.log("Tag ajouté au filtre:", tag);
    }
}

function removeSelectedTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    updateSelectedTagsDisplay();
    filterFiles();
    console.log("Tag retiré du filtre:", tag);
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
        btn.addEventListener('click', handleRemoveTag);
    });
}

function handleRemoveTag(e) {
    e.stopPropagation();
    const tag = this.getAttribute('data-tag');
    removeSelectedTag(tag);
}

function filterFiles() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (!input) return;
    
    let searchTerm = input.value.toLowerCase().trim();
    if (clearBtn) clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    
    // On lance la sauvegarde à chaque filtrage
    saveFilterState();

    let hasVisibleRows = false;
    
    document.querySelectorAll('.folder-block').forEach(block => {
        const folderCheckbox = block.querySelector('.folder-select-checkbox');
        const isChecked = folderCheckbox ? folderCheckbox.checked : true;
        const fileList = block.querySelector('.file-list');
        
        if (!isChecked) {
            if (fileList) fileList.style.display = 'none';
            block.style.opacity = '0.6';
            block.style.background = '#fafafa';
        } else {
            if (fileList) fileList.style.display = '';
            block.style.opacity = '1';
            block.style.background = '';
            
            const rows = block.querySelectorAll('.file-item-row');
            let hasVisibleInBlock = false;
            
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
            
            if (hasVisibleInBlock) hasVisibleRows = true;
        }
    });

    // Gestion du message "Aucun résultat"
    const noResultsDiv = document.getElementById('noSearchResults');
    if (!hasVisibleRows && (selectedTags.length > 0 || searchTerm !== "")) {
        const message = `Aucun résultat pour votre recherche dans les dossiers sélectionnés.`;
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

function clearSearch() {
    selectedTags = [];
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    sessionStorage.removeItem('spokeman_filter_state'); // On nettoie le cache
    updateSelectedTagsDisplay();
    filterFiles();
}

window.addSelectedTag = addSelectedTag;
window.removeSelectedTag = removeSelectedTag;
window.filterFiles = filterFiles;
window.clearSearch = clearSearch;