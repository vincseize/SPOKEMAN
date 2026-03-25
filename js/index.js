// Initialisation des éléments de la modale
const previewModalElement = document.getElementById('previewModal');
const previewModal = new bootstrap.Modal(previewModalElement);
const modalContent = document.getElementById('modalMediaContent');
const modalFileName = document.getElementById('modalFileName');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const modalTagDisplay = document.getElementById('modalTagDisplay');
const modalTagsContainer = document.getElementById('modalTagsContainer');

let currentGallery = [];
let currentIndex = 0;

/**
 * Initialise la galerie à partir du clic sur une carte
 */
function initGallery(cardElement) {
    const container = cardElement.closest('.row');
    if (!container) return;

    // On récupère toutes les cartes visibles dans ce conteneur
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
    previewModal.show();
}

/**
 * Met à jour le contenu de la modale
 */
function updateModal() {
    const item = currentGallery[currentIndex];
    if (!item) return;

    modalContent.innerHTML = '';
    // Mise à jour du titre et compteur
    modalFileName.innerHTML = `<span class="badge bg-primary me-2">${currentIndex + 1} / ${currentGallery.length}</span> ${item.path.split('/').pop()}`;
    
    modalCopyBtn.dataset.copyUrl = item.url;
    modalDownloadBtn.href = item.path;

    // Affichage Média
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'webm', 'mov'];

    if (imgExts.includes(item.ext)) {
        modalContent.innerHTML = `<img src="${item.path}" class="img-fluid shadow rounded" style="max-height:70vh;">`;
    } else if (videoExts.includes(item.ext)) {
        modalContent.innerHTML = `<video src="${item.path}" controls autoplay class="w-100 shadow rounded" style="max-height:70vh;"></video>`;
    }

    // Gestion des TAGS
    const tagsRaw = (item.tags || "").trim();
    if (tagsRaw !== "") {
        modalTagsContainer.classList.remove('d-none');
        const tagsArray = tagsRaw.split(/\s+/);
        modalTagDisplay.innerHTML = tagsArray.map(t => 
            `<span class="badge">#${t}</span>`
        ).join('');
    } else {
        modalTagsContainer.classList.add('d-none');
        modalTagDisplay.innerHTML = '';
    }
}

/**
 * Navigation Suivant / Précédent (Logique simplifiée comme admin.js)
 */
function changeMedia(direction, event) {
    // Empêche Bootstrap de voir le clic et de fermer la modale
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
 * Copier le lien
 */
function modalCopyAction() {
    const url = modalCopyBtn.dataset.copyUrl;
    if (!url) return;
    
    navigator.clipboard.writeText(url).then(() => {
        const originalText = modalCopyBtn.innerHTML;
        modalCopyBtn.innerHTML = "✅ Copié !";
        setTimeout(() => { modalCopyBtn.innerHTML = originalText; }, 2000);
    });
}

/**
 * Écouteur de touches clavier
 */
document.addEventListener('keydown', (e) => {
    // Importante sécurité : on ne fait rien si la modale n'est pas ouverte
    if (!previewModalElement.classList.contains('show')) return;
    
    if (e.key === "ArrowRight") {
        changeMedia(1);
    } 
    else if (e.key === "ArrowLeft") {
        changeMedia(-1);
    } 
    else if (e.key === "Escape") {
        previewModal.hide();
    }
});

/**
 * Nettoyage à la fermeture (Arrête la vidéo)
 */
previewModalElement.addEventListener('hidden.bs.modal', () => {
    modalContent.innerHTML = '';
});