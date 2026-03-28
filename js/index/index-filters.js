// js/index/index-filters.js
console.log("index-filters.js chargé");

// Variables pour stocker les tags sélectionnés (filtrage uniquement)
let selectedTags = [];

// AJOUTER UN TAG AU FILTRAGE
function addSelectedTag(tag) {
    if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
        applyFilters();
        console.log("Tag ajouté au filtre:", tag, "Tags actifs:", selectedTags);
    }
}

// SUPPRIMER UN TAG DU FILTRAGE
function removeSelectedTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    applyFilters();
    console.log("Tag retiré du filtre:", tag, "Tags actifs:", selectedTags);
}

// APPLIQUER LES FILTRES - Recharger la page avec les paramètres
function applyFilters() {
    const input = document.getElementById('searchInput');
    const searchTerm = input ? input.value.trim() : '';
    
    // Construire l'URL avec les paramètres
    let url = 'index.php?';
    const params = [];
    
    if (searchTerm !== '') {
        params.push('search=' + encodeURIComponent(searchTerm));
    }
    
    if (selectedTags.length > 0) {
        params.push('tags=' + encodeURIComponent(selectedTags.join(',')));
    }
    
    if (params.length > 0) {
        window.location.href = url + params.join('&');
    } else {
        // Pas de filtres, revenir à la page d'accueil
        window.location.href = 'index.php';
    }
}

// FILTRAGE - Recherche par nom + tags sélectionnés
function filterFiles() {
    applyFilters();
}

// EFFACER UNIQUEMENT LA RECHERCHE PAR NOM (garder les tags)
function clearSearchOnly() {
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
    }
    
    // Recharger avec les tags uniquement
    let url = 'index.php?';
    const params = [];
    
    if (selectedTags.length > 0) {
        params.push('tags=' + encodeURIComponent(selectedTags.join(',')));
    }
    
    if (params.length > 0) {
        window.location.href = url + params.join('&');
    } else {
        window.location.href = 'index.php';
    }
}

// EFFACER TOUT (recherche ET tags)
function clearAllFilters() {
    selectedTags = [];
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
    }
    window.location.href = 'index.php';
}

// SUPPRIMER UN TAG DEPUIS LES RÉSULTATS
function removeTagFromResults(tag) {
    // Récupérer les tags actuels depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    let currentTags = urlParams.get('tags') ? urlParams.get('tags').split(',') : [];
    
    // Filtrer pour enlever le tag
    currentTags = currentTags.filter(t => t !== tag);
    
    // Récupérer le terme de recherche actuel
    const searchTerm = urlParams.get('search') || '';
    
    // Construire la nouvelle URL
    let newUrl = 'index.php?';
    const params = [];
    
    if (searchTerm !== '') {
        params.push('search=' + encodeURIComponent(searchTerm));
    }
    
    if (currentTags.length > 0) {
        params.push('tags=' + encodeURIComponent(currentTags.join(',')));
    }
    
    if (params.length > 0) {
        window.location.href = newUrl + params.join('&');
    } else {
        window.location.href = 'index.php';
    }
}

// Initialisation des boutons de filtrage
function initFilterButtons() {
    // Boutons de la barre des tags
    document.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tag = this.getAttribute('data-tag');
            addSelectedTag(tag);
        });
    });
    
    // Boutons de suppression dans les résultats (dynamiques)
    document.querySelectorAll('.btn-remove-filter-tag').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tag = this.getAttribute('data-tag');
            removeTagFromResults(tag);
        });
    });
    
    // Récupérer les tags depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const tagsParam = urlParams.get('tags');
    if (tagsParam) {
        selectedTags = tagsParam.split(',');
    }
    
    // Afficher/masquer le bouton clear selon la présence de recherche ou tags
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        const hasSearch = searchInput && searchInput.value.trim() !== '';
        const hasTags = selectedTags.length > 0;
        clearBtn.style.display = (hasSearch || hasTags) ? 'block' : 'none';
        
        // Modifier le comportement du bouton clear
        clearBtn.removeEventListener('click', clearAllFilters);
        clearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            clearSearchOnly();
        });
    }
}

// Exposer
window.addSelectedTag = addSelectedTag;
window.removeSelectedTag = removeSelectedTag;
window.filterFiles = filterFiles;
window.clearSearch = clearSearchOnly;
window.clearAllFilters = clearAllFilters;
window.initFilterButtons = initFilterButtons;
window.removeTagFromResults = removeTagFromResults;