// js/index/index.js
console.log("index.js chargé");

// INITIALISATION
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé - Initialisation galerie");
    
    // Initialiser les filtres (inclut les boutons de suppression)
    if (typeof window.initFilterButtons === 'function') {
        window.initFilterButtons();
    }
    
    // Initialiser les checkboxes des dossiers
    if (typeof window.initFolderCheckboxes === 'function') {
        window.initFolderCheckboxes();
    }
    
    // Gestion des raccourcis clavier pour la modale
    document.addEventListener('keydown', (e) => {
        const modalEl = document.getElementById('previewModal');
        if (!modalEl || !modalEl.classList.contains('show')) return;
        
        if (e.key === "ArrowRight") {
            e.preventDefault();
            if (typeof window.changeMedia === 'function') window.changeMedia(1);
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            if (typeof window.changeMedia === 'function') window.changeMedia(-1);
        }
        if (e.key === "Escape" && window.previewModal) window.previewModal.hide();
    });
    
    // Clear search button
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn && typeof window.clearSearch === 'function') {
        clearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            window.clearSearch();
        });
    }
    
    console.log("Initialisation terminée");
});

// Exposer les fonctions principales
window.initGallery = window.initGallery;
window.changeMedia = window.changeMedia;
window.modalCopyAction = window.modalCopyAction;
window.filterFiles = window.filterFiles;
window.clearSearch = window.clearSearch;