// js/index-folders.js
console.log("index-folders.js chargé");

// Gestion des checkboxes des dossiers
function initFolderCheckboxes() {
    const selectAllFoldersBtn = document.getElementById('selectAllFoldersGal');
    const deselectAllFoldersBtn = document.getElementById('deselectAllFoldersGal');
    
    function setAllCheckboxes(checked) {
        document.querySelectorAll('.folder-select-checkbox-gal').forEach(cb => {
            cb.checked = checked;
        });
        console.log(checked ? "Tous les dossiers sélectionnés" : "Aucun dossier sélectionné");
    }
    
    if (selectAllFoldersBtn) {
        selectAllFoldersBtn.addEventListener('click', function(e) {
            e.preventDefault();
            setAllCheckboxes(true);
        });
    }
    
    if (deselectAllFoldersBtn) {
        deselectAllFoldersBtn.addEventListener('click', function(e) {
            e.preventDefault();
            setAllCheckboxes(false);
        });
    }
    
    const checkboxes = document.querySelectorAll('.folder-select-checkbox-gal');
    console.log(`Checkboxes trouvées dans la galerie: ${checkboxes.length}`);
}

// Exposer
window.initFolderCheckboxes = initFolderCheckboxes;