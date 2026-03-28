// js/index-gallery.js
console.log("index-gallery.js chargé");

// Variables
let currentGallery = [];
let currentIndex = 0;

// Éléments DOM
const previewModalElement = document.getElementById('previewModal');
const previewModal = previewModalElement ? new bootstrap.Modal(previewModalElement) : null;
const modalContent = document.getElementById('modalMediaContent');
const modalFileName = document.getElementById('modalFileName');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const modalTagDisplay = document.getElementById('modalTagDisplay');
const modalTagsContainer = document.getElementById('modalTagsContainer');

/**
 * Initialise la galerie à partir du clic sur une carte
 */
function initGallery(cardElement) {
    const container = cardElement.closest('.row');
    if (!container) return;

    const allVisibleCards = Array.from(container.querySelectorAll('.media-card[data-path]'));
    
    currentGallery = allVisibleCards.map(el => ({ 
        path: el.dataset.path || "", 
        url: el.dataset.url || "", 
        ext: el.dataset.ext || "",
        tags: el.dataset.tags || "" 
    }));

    currentIndex = currentGallery.findIndex(item => item.path === cardElement.dataset.path);
    
    if (currentIndex === -1) return;

    updateModal();
    if (previewModal) previewModal.show();
}

/**
 * Met à jour le contenu de la modale
 */
function updateModal() {
    const item = currentGallery[currentIndex];
    if (!item) return;

    if (modalContent) modalContent.innerHTML = '';
    
    if (modalFileName) {
        modalFileName.innerHTML = `<span class="badge bg-primary me-2">${currentIndex + 1} / ${currentGallery.length}</span> ${item.path.split('/').pop()}`;
    }
    
    if (modalCopyBtn) modalCopyBtn.dataset.copyUrl = item.url;
    if (modalDownloadBtn) modalDownloadBtn.href = item.path;

    // Affichage Média
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'webm', 'mov'];

    if (imgExts.includes(item.ext)) {
        if (modalContent) modalContent.innerHTML = `<img src="${item.path}" class="img-fluid shadow rounded" style="max-height:70vh;">`;
    } else if (videoExts.includes(item.ext)) {
        if (modalContent) modalContent.innerHTML = `<video src="${item.path}" controls autoplay class="w-100 shadow rounded" style="max-height:70vh;"></video>`;
    }

    // Gestion des TAGS AVEC COULEURS
    const tagsRaw = (item.tags || "").trim();
    if (tagsRaw !== "") {
        if (modalTagsContainer) modalTagsContainer.classList.remove('d-none');
        const tagsArray = tagsRaw.split(/\s+/);
        const tagColors = window.tagColors || {};
        
        if (modalTagDisplay) {
            modalTagDisplay.innerHTML = tagsArray.map(tag => {
                const tagColor = tagColors[tag] || '#0d6efd';
                return `<span class="badge" style="background: ${tagColor}; color: white; font-size: 0.75rem; padding: 4px 10px; border-radius: 20px;">#${tag}</span>`;
            }).join('');
        }
    } else {
        if (modalTagsContainer) modalTagsContainer.classList.add('d-none');
        if (modalTagDisplay) modalTagDisplay.innerHTML = '';
    }
}

/**
 * Navigation Suivant / Précédent
 */
function changeMedia(direction, event) {
    if (event) { 
        event.preventDefault(); 
        event.stopPropagation(); 
    }

    if (currentGallery.length <= 1) return;
    
    currentIndex += direction;
    
    if (currentIndex < 0) currentIndex = currentGallery.length - 1;
    if (currentIndex >= currentGallery.length) currentIndex = 0;
    
    updateModal();
}

/**
 * Copier le lien dans la modale
 */
function modalCopyAction() {
    if (!modalCopyBtn) return;
    const url = modalCopyBtn.dataset.copyUrl;
    if (!url) return;
    
    navigator.clipboard.writeText(url).then(() => {
        const originalText = modalCopyBtn.innerHTML;
        modalCopyBtn.innerHTML = "✅ Copié !";
        setTimeout(() => { modalCopyBtn.innerHTML = originalText; }, 2000);
    });
}

/**
 * Nettoyage modale
 */
if (previewModalElement) {
    previewModalElement.addEventListener('hidden.bs.modal', () => {
        if (modalContent) modalContent.innerHTML = '';
    });
}

// Exposer
window.initGallery = initGallery;
window.updateModal = updateModal;
window.changeMedia = changeMedia;
window.modalCopyAction = modalCopyAction;
window.currentGallery = () => currentGallery;
window.currentIndex = () => currentIndex;