// js/admin-filters.js
console.log("admin-filters.js chargé");

// Variables pour stocker les tags sélectionnés (filtrage uniquement)
let selectedTags = [];

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
                #${window.escapeHtml(tag)}
                <button type="button" class="remove-tag-btn" data-tag="${window.escapeHtml(tag)}" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 0.8rem; padding: 0; margin-left: 2px;">
                    ✕
                </button>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.remove-tag-btn').forEach(btn => {
        btn.removeEventListener('click', handleRemoveTag);
        btn.addEventListener('click', handleRemoveTag);
    });
}

function handleRemoveTag(e) {
    e.stopPropagation();
    const tag = this.getAttribute('data-tag');
    removeSelectedTag(tag);
}

// js/admin-filters.js - Version corrigée
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
    
    // Récupérer les dossiers cochés
    const checkedFolders = new Set();
    document.querySelectorAll('.folder-select-checkbox:checked').forEach(cb => {
        const folderPath = cb.getAttribute('data-folder');
        if (folderPath) {
            checkedFolders.add(folderPath);
        }
    });
    
    console.log("Dossiers cochés:", Array.from(checkedFolders));
    
    document.querySelectorAll('.folder-block').forEach(block => {
        const folderCheckbox = block.querySelector('.folder-select-checkbox');
        const folderPath = folderCheckbox ? folderCheckbox.getAttribute('data-folder') : null;
        const isChecked = folderCheckbox ? folderCheckbox.checked : true;
        const fileList = block.querySelector('.file-list');
        
        console.log(`Dossier: ${folderPath}, coché: ${isChecked}`);
        
        if (!isChecked) {
            // Dossier décoché : cacher toute la liste des fichiers
            if (fileList) {
                fileList.style.display = 'none';
            }
            block.style.opacity = '0.6';
            block.style.background = '#fafafa';
            block.style.display = "block";
        } else {
            // Dossier coché : afficher la liste des fichiers
            if (fileList) {
                fileList.style.display = '';
            }
            block.style.opacity = '1';
            block.style.background = '';
            block.style.display = "block";
            
            // Filtrer les fichiers dans ce dossier
            const rows = block.querySelectorAll('.file-item-row');
            let hasVisibleInBlock = false;
            
            rows.forEach(row => {
                const fileName = row.getAttribute('data-filename')?.toLowerCase() || "";
                const fileTagsAttr = row.getAttribute('data-tags') || "";
                const fileTagsArray = fileTagsAttr.trim() === "" ? [] : fileTagsAttr.split(/\s+/);
                
                let isMatch = true;
                
                if (selectedTags.length > 0) {
                    isMatch = selectedTags.every(tag => fileTagsArray.includes(tag));
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
    
    console.log("Fichiers visibles:", hasVisibleRows);
    
    const noResultsDiv = document.getElementById('noSearchResults');
    if (!hasVisibleRows && (selectedTags.length > 0 || searchTerm !== "")) {
        let message = "";
        if (selectedTags.length > 0 && searchTerm !== "") {
            message = `Aucun résultat pour les tags [${selectedTags.map(t => "#"+t).join(", ")}] et le nom "${searchTerm}" dans les dossiers sélectionnés`;
        } else if (selectedTags.length > 0) {
            message = `Aucun résultat pour les tags [${selectedTags.map(t => "#"+t).join(", ")}] dans les dossiers sélectionnés`;
        } else {
            message = `Aucun résultat pour "${searchTerm}" dans les dossiers sélectionnés`;
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

// Exposer
window.addSelectedTag = addSelectedTag;
window.removeSelectedTag = removeSelectedTag;
window.filterFiles = filterFiles;
window.clearSearch = clearSearch;