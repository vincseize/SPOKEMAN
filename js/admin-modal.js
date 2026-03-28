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
        console.log("Modale initialisée");
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
    
    if (!tags || tags.length === 0) {
        container.innerHTML = '<span class="text-muted small">Aucun tag</span>';
        return;
    }
    
    tags.forEach(tag => {
        const tagColor = window.tagColors ? (window.tagColors[tag] || '#6c757d') : '#6c757d';
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item d-flex align-items-center gap-1';
        tagElement.style.background = tagColor;
        tagElement.style.color = 'white';
        tagElement.style.borderRadius = '4px';
        tagElement.style.padding = '2px 6px 2px 10px';
        tagElement.style.fontSize = '0.7rem';
        tagElement.style.fontWeight = '500';
        
        tagElement.innerHTML = `
            <span>#${escapeHtml(tag)}</span>
            <button type="button" class="btn-remove-tag-row-modal" data-tag="${escapeHtml(tag)}" 
                    style="background: none; border: none; color: white; cursor: pointer; font-size: 0.8rem; padding: 0 4px; opacity: 0.7;">
                ✕
            </button>
        `;
        container.appendChild(tagElement);
    });
    
    // Attacher les événements pour les boutons de suppression dans la modale
    document.querySelectorAll('.btn-remove-tag-row-modal').forEach(btn => {
        btn.removeEventListener('click', handleModalRemoveTag);
        btn.addEventListener('click', handleModalRemoveTag);
    });
}

function handleModalRemoveTag(e) {
    e.stopPropagation();
    const tagName = this.getAttribute('data-tag');
    if (window.removeTagFromRow) {
        window.removeTagFromRow(currentFilePath, tagName);
    }
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