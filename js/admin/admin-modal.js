    // js/admin-modal.js
    console.log("admin-modal.js chargé");

    let currentGallery = [];
    let currentIndex = 0;
    let previewModal = null;
    let currentFilePath = null;

    // Initialisation de la modale (appelée depuis admin.js)
    function initModal() {
        const modalElement = document.getElementById('previewModal');
        if (modalElement && typeof bootstrap !== 'undefined') {
            previewModal = new bootstrap.Modal(modalElement);
            
            // --- AJOUT DE L'OPTION 1 ---
            // On écoute la fermeture complète de la modale
            modalElement.addEventListener('hidden.bs.modal', function () {
                console.log("Fermeture modale : rafraîchissement pour synchronisation...");
                window.location.reload();
            });
            // ---------------------------

            console.log("Modale initialisée avec auto-refresh");
            return true;
        }
        console.log("Modale non initialisée - élément ou Bootstrap manquant");
        return false;
    }

    // OUVERTURE DE LA MODALE
    function openModal(path, url, ext, fileName) {
        console.log("Ouverture modale:", path);
        currentFilePath = path;
        
        // Réinitialiser la modale si nécessaire
        if (!previewModal) {
            initModal();
        }
        
        const clickedRow = document.querySelector(`.file-item-row[data-path="${path}"]`);
        if (!clickedRow) {
            console.error("Ligne non trouvée pour:", path);
            return;
        }
        
        const clickedFolder = clickedRow.getAttribute('data-folder');
        
        const allRows = document.querySelectorAll('.file-item-row');
        const filteredRows = Array.from(allRows).filter(row => 
            row.getAttribute('data-folder') === clickedFolder
        );
        
        currentGallery = filteredRows.map(row => {
            const tagsAttr = row.getAttribute('data-tags');
            const tags = tagsAttr && tagsAttr.trim() !== '' ? tagsAttr.split(' ') : [];
            
            return {
                path: row.getAttribute('data-path'),
                url: row.getAttribute('data-url'),
                ext: row.getAttribute('data-ext'),
                fileName: row.getAttribute('data-filename'),
                tags: tags
            };
        });
        
        currentIndex = currentGallery.findIndex(item => item.path === path);
        if (currentIndex === -1) currentIndex = 0;
        
        updateModalContent();
        
        if (previewModal) {
            previewModal.show();
            console.log("Modale affichée");
        } else {
            console.error("previewModal est null, impossible d'afficher");
        }
    }

    // MISE À JOUR MODALE
    function updateModalContent() {
        const item = currentGallery[currentIndex];
        if (!item) return;
        
        const modalContent = document.getElementById('modalMediaContent');
        const modalFileName = document.getElementById('modalFileName');
        const modalDeletePath = document.getElementById('modalDeletePath');
        const modalCopyBtn = document.getElementById('modalCopyBtn');
        const specsElem = document.getElementById('modalMediaSpecs');
        
        if (!modalContent) return;
        
        modalContent.innerHTML = '';
        
        if (modalFileName) {
            modalFileName.innerHTML = `<span class="badge bg-dark me-2">${currentIndex + 1} / ${currentGallery.length}</span> ${item.fileName || item.path.split('/').pop()}`;
        }
        
        if (modalDeletePath) {
            modalDeletePath.value = item.path;
        }
        
        if (modalCopyBtn) {
            modalCopyBtn.dataset.copyUrl = item.url;
            modalCopyBtn.innerText = "📋 Copier";
        }
        
        const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoExts = ['mp4', 'webm', 'mov'];
        
        if (imgExts.includes(item.ext)) {
            const img = new Image();
            img.src = item.path;
            img.className = "img-fluid shadow rounded";
            img.style.maxHeight = "65vh";
            img.onload = function() {
                if (specsElem) {
                    fetch(item.path).then(r => r.blob()).then(blob => {
                        const size = (blob.size / 1024).toFixed(1) + ' KB';
                        specsElem.innerHTML = `${img.naturalWidth}x${img.naturalHeight} px | ${size}`;
                    }).catch(() => {
                        specsElem.innerHTML = `${img.naturalWidth}x${img.naturalHeight} px`;
                    });
                }
            };
            modalContent.appendChild(img);
        } else if (videoExts.includes(item.ext)) {
            const video = document.createElement('video');
            video.src = item.path;
            video.controls = true;
            video.autoplay = true;
            video.className = "w-100 shadow rounded";
            video.style.maxHeight = "65vh";
            if (specsElem) specsElem.innerHTML = "Vidéo";
            modalContent.appendChild(video);
        } else {
            modalContent.innerHTML = `<div class="p-5 bg-light rounded border text-center"><h1 class="display-1">📄</h1><h5>.${item.ext.toUpperCase()}</h5></div>`;
            if (specsElem) specsElem.innerHTML = "Fichier document";
        }
        
        displayModalTags(item.path, item.tags || []);
    }

    // AFFICHER LES TAGS DANS LA MODALE
    function displayModalTags(filePath, tags) {
        const container = document.getElementById('modalTagsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (tags && tags.length > 0) {
            tags.forEach(tag => {
                const tagColor = window.tagColors ? (window.tagColors[tag] || '#6c757d') : '#6c757d';
                const tagElement = document.createElement('div');
                tagElement.className = 'tag-item';
                tagElement.style.background = tagColor;
                
                tagElement.innerHTML = `
                    <span>#${escapeHtml(tag)}</span>
                    <button type="button" class="btn-remove-tag-row-modal" data-tag="${escapeHtml(tag)}">✕</button>
                `;
                container.appendChild(tagElement);
            });
        }
        
        // Ajouter le bouton + Ajouter un tag
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'btn-add-tag';
        addButton.innerHTML = '+ Ajouter';
        addButton.onclick = function(e) {
            e.stopPropagation();
            showTagSelector();
        };
        container.appendChild(addButton);
        
        // Attacher les événements pour les boutons de suppression
        document.querySelectorAll('.btn-remove-tag-row-modal').forEach(btn => {
            btn.removeEventListener('click', handleModalRemoveTag);
            btn.addEventListener('click', handleModalRemoveTag);
        });
    }

    // GESTIONNAIRE DE SUPPRESSION DE TAG DANS LA MODALE
    function handleModalRemoveTag(e) {
        e.stopPropagation();
        const tagName = this.getAttribute('data-tag');
        if (window.removeTagFromRow) {
            window.removeTagFromRow(currentFilePath, tagName);
        }
    }

    // AFFICHER LE SÉLECTEUR DE TAGS DANS LA MODALE
    function showTagSelector() {
        const currentItem = currentGallery[currentIndex];
        const currentTags = currentItem?.tags || [];
        
        // Tags disponibles (ceux qui ne sont pas déjà attribués)
        const availableTags = Object.keys(window.tagColors || {}).filter(tag => !currentTags.includes(tag));
        
        const container = document.getElementById('availableTagsList');
        if (!container) return;
        
        if (availableTags.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">Aucun tag disponible</div>';
        } else {
            container.innerHTML = availableTags.map(tag => {
                const tagColor = window.tagColors ? (window.tagColors[tag] || '#6c757d') : '#6c757d';
                return `
                    <button type="button" class="btn btn-sm tag-select-btn-modal" 
                            data-tag="${escapeHtml(tag)}"
                            style="background: ${tagColor}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        #${escapeHtml(tag)}
                    </button>
                `;
            }).join('');
        }
        
        // Attacher les événements aux boutons
        document.querySelectorAll('.tag-select-btn-modal').forEach(btn => {
            btn.addEventListener('click', function() {
                const tag = this.getAttribute('data-tag');
                addTagToCurrentFile(tag);
            });
        });
        
        const modal = new bootstrap.Modal(document.getElementById('tagSelectorModal'));
        modal.show();
    }

    // AJOUTER UN TAG AU FICHIER COURANT
    function addTagToCurrentFile(tagName) {
        if (!currentFilePath) return;
        
        const formData = new FormData();
        formData.append('file_path', currentFilePath);
        formData.append('add_tag', tagName);
        formData.append('update_media_tags', '1');
        
        fetch('admin.php', {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => {
            if (response.ok) {
                // Mettre à jour les tags dans la galerie
                const currentItem = currentGallery[currentIndex];
                if (currentItem) {
                    const updatedTags = [...currentItem.tags, tagName];
                    currentItem.tags = updatedTags;
                    displayModalTags(currentFilePath, updatedTags);
                    
                    // Mettre à jour l'attribut data-tags dans la carte
                    const card = document.querySelector(`.file-item-row[data-path="${currentFilePath}"]`);
                    if (card) {
                        card.setAttribute('data-tags', updatedTags.join(' ').toLowerCase());
                        // Mettre à jour l'affichage des tags dans la ligne
                        const tagsContainer = card.querySelector('.d-flex.flex-wrap.gap-1.mt-1');
                        if (tagsContainer && window.updateRowTagsDisplay) {
                            window.updateRowTagsDisplay(card, updatedTags);
                        }
                    }
                }
                
                // Fermer la modale de sélection
                const selectorModal = bootstrap.Modal.getInstance(document.getElementById('tagSelectorModal'));
                if (selectorModal) selectorModal.hide();
            }
        })
        .catch(err => console.error('Erreur ajout tag:', err));
    }

    // NAVIGATION
    function changeMedia(direction, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        if (currentGallery.length <= 1) return;
        
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = currentGallery.length - 1;
        if (currentIndex >= currentGallery.length) currentIndex = 0;
        
        currentFilePath = currentGallery[currentIndex].path;
        updateModalContent();
    }

    // COPIER URL
    function modalCopyAction() {
        const modalCopyBtn = document.getElementById('modalCopyBtn');
        if (!modalCopyBtn) return;
        
        const url = modalCopyBtn.dataset.copyUrl;
        if (!url) return;
        
        navigator.clipboard.writeText(url).then(() => {
            const originalText = modalCopyBtn.innerText;
            modalCopyBtn.innerText = "✅ Copié !";
            setTimeout(() => {
                modalCopyBtn.innerText = originalText;
            }, 2000);
        });
    }

    // ESCAPE HTML
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Exposer les fonctions
    window.openModal = openModal;
    window.changeMedia = changeMedia;
    window.modalCopyAction = modalCopyAction;
    window.updateModalContent = updateModalContent;
    window.displayModalTags = displayModalTags;
    window.initModal = initModal;
    window.showTagSelector = showTagSelector;
    window.addTagToCurrentFile = addTagToCurrentFile;
    window.handleModalRemoveTag = handleModalRemoveTag;