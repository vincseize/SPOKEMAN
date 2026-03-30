// js/admin.js
console.log("admin.js chargé");

// INITIALISATION
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé - Initialisation admin");
    
    // Initialiser la modale
    if (typeof window.initModal === 'function') {
        window.initModal();
    } else {
        console.error("window.initModal non disponible");
    }
    
    // ===== BOUTONS POUR LES CHECKBOXES DES DOSSIERS =====
    const selectAllFoldersBtn = document.getElementById('selectAllTags');
    const deselectAllFoldersBtn = document.getElementById('deselectAllTags');
    
    if (selectAllFoldersBtn) {
        selectAllFoldersBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.folder-select-checkbox').forEach(cb => {
                cb.checked = true;
            });
            // Re-filtrer après modification
            if (typeof window.filterFiles === 'function') {
                window.filterFiles();
            }
            console.log("Tous les dossiers sélectionnés");
        });
    }
    
    if (deselectAllFoldersBtn) {
        deselectAllFoldersBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.folder-select-checkbox').forEach(cb => {
                cb.checked = false;
            });
            // Re-filtrer après modification
            if (typeof window.filterFiles === 'function') {
                window.filterFiles();
            }
            console.log("Aucun dossier sélectionné");
        });
    }
    
    // ===== ÉCOUTEURS SUR LES CHECKBOXES INDIVIDUELLES =====
    document.querySelectorAll('.folder-select-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            console.log("Checkbox changée, appel filterFiles");
            if (typeof window.filterFiles === 'function') {
                window.filterFiles();
            }
        });
    });
    
    // Gestion des clics sur les tags dans la cloud
    document.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tag = this.getAttribute('data-tag');
            if (typeof window.addSelectedTag === 'function') {
                window.addSelectedTag(tag);
            }
        });
    });
    
    // Modale sur les vignettes
    document.querySelectorAll('.preview-trigger').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = this.closest('.file-item-row');
            if (row && typeof window.openModal === 'function') {
                window.openModal(
                    row.getAttribute('data-path'),
                    row.getAttribute('data-url'),
                    row.getAttribute('data-ext'),
                    row.getAttribute('data-filename')
                );
            } else {
                console.error("window.openModal non disponible");
            }
        });
    });
    
    // Renommage - gestion des inputs
    document.querySelectorAll('.rename-input').forEach(input => {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('focus', (e) => e.stopPropagation());
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                const form = input.closest('form');
                if (form && typeof window.submitRename === 'function') {
                    window.submitRename(form);
                }
            }
        });
    });
    
    // Renommage - soumission des formulaires
    document.querySelectorAll('.rename-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.submitRename === 'function') {
                window.submitRename(form);
            }
        });
    });
    
    // Copie de lien
    document.querySelectorAll('.btn-copy-minimal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.getAttribute('data-url');
            if (url && typeof window.copyLink === 'function') {
                window.copyLink(url, btn);
            }
        });
    });
    
    // Suppression de tag dans la ligne
    document.querySelectorAll('.btn-remove-tag-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.getAttribute('data-path');
            const tag = btn.getAttribute('data-tag');
            if (path && tag && typeof window.removeTagFromRow === 'function') {
                window.removeTagFromRow(path, tag);
            }
        });
    });
    
    // Ajout de tag
    document.querySelectorAll('.btn-add-tag-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.getAttribute('data-path');
            if (path && typeof window.showTagSelectorForRow === 'function') {
                window.showTagSelectorForRow(path);
            }
        });
    });
    
    // Suppression de fichier
    document.querySelectorAll('.delete-file-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.stopPropagation();
            if (!confirm('Supprimer ce fichier ?')) {
                e.preventDefault();
                return false;
            }
        });
    });
    
    // Raccourcis clavier pour la modale
    document.addEventListener('keydown', (e) => {
        const modalEl = document.getElementById('previewModal');
        if (!modalEl || !modalEl.classList.contains('show')) return;
        
        if (e.key === "ArrowRight") { e.preventDefault(); if (typeof window.changeMedia === 'function') window.changeMedia(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); if (typeof window.changeMedia === 'function') window.changeMedia(-1); }
        if (e.key === "Escape" && window.previewModal) window.previewModal.hide();
    });
    
    // Nettoyage modale
    const modalElement = document.getElementById('previewModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            const modalContent = document.getElementById('modalMediaContent');
            if (modalContent) modalContent.innerHTML = '';
        });
    }
    
    // Clear search button
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn && typeof window.clearSearch === 'function') {
        clearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            window.clearSearch();
        });
    }
    
    // ===== APPEL INITIAL DE filterFiles =====
    // Appeler filterFiles au chargement pour initialiser l'affichage
    if (typeof window.filterFiles === 'function') {
        setTimeout(function() {
            window.filterFiles();
            console.log("filterFiles appelé au chargement");
        }, 100);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const savedState = sessionStorage.getItem('spokeman_filter_state');
    const searchInput = document.getElementById('searchInput');
    
    if (savedState) {
        const state = JSON.parse(savedState);
        
        // 1. Restaurer le texte de recherche
        if (searchInput && state.searchTerm) {
            searchInput.value = state.searchTerm;
        }
        
        // 2. Restaurer les tags sélectionnés
        if (state.selectedTags) {
            window.selectedTags = state.selectedTags; // On met à jour la variable globale
            if (typeof updateSelectedTagsDisplay === 'function') updateSelectedTagsDisplay();
        }
        
        // 3. Restaurer les dossiers décochés
        if (state.uncheckedFolders) {
            document.querySelectorAll('.folder-select-checkbox').forEach(cb => {
                if (state.uncheckedFolders.includes(cb.getAttribute('data-folder'))) {
                    cb.checked = false;
                }
            });
        }
        
        // 4. Appliquer le filtre
        setTimeout(() => {
            if (typeof filterFiles === 'function') filterFiles();
        }, 100);
    }
    
    // --- GESTION DU SCROLL ---
    const savedScroll = sessionStorage.getItem('spokeman_scroll_pos');
    if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll));
        sessionStorage.removeItem('spokeman_scroll_pos');
    }
});