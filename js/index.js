/**
 * GESTION DE LA GALERIE & MODALE (INDEX)
 */
const previewModalElement = document.getElementById('previewModal');
const previewModal = new bootstrap.Modal(previewModalElement);
const modalContent = document.getElementById('modalMediaContent');
const modalFileName = document.getElementById('modalFileName');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const modalMediaSpecs = document.getElementById('modalMediaSpecs');

let currentGallery = [];
let currentIndex = 0;

/**
 * Initialise la galerie au clic sur une carte
 */
function initGallery(cardElement) {
    // On récupère uniquement les items du conteneur parent (Set ou Résultats de recherche)
    const container = cardElement.closest('.row');
    const allVisibleCards = Array.from(container.querySelectorAll('.media-card[data-path]'));
    
    currentGallery = allVisibleCards.map(el => ({ 
        path: el.dataset.path, 
        url: el.dataset.url, 
        ext: el.dataset.ext 
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
    if(!item) return;

    // Reset
    modalContent.innerHTML = '';
    modalMediaSpecs.innerHTML = '<span class="opacity-50">Chargement...</span>';
    
    // Titre et Compteur
    modalFileName.innerHTML = `<span class="badge bg-primary me-2">${currentIndex + 1} / ${currentGallery.length}</span> ${item.path.split('/').pop()}`;
    
    // Boutons Actions
    modalCopyBtn.dataset.copyUrl = item.url;
    modalCopyBtn.innerText = "📋 Copier le lien";
    modalDownloadBtn.href = item.path;

    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'webm', 'mov'];

    if (imgExts.includes(item.ext)) {
        modalContent.innerHTML = `<img src="${item.path}" class="img-fluid shadow rounded" style="max-height:70vh;" id="modalImg">`;
        const img = document.getElementById('modalImg');
        img.onload = function() {
            fetch(item.path).then(r => r.blob()).then(blob => {
                const size = (blob.size / 1024).toFixed(1) + ' KB';
                modalMediaSpecs.innerHTML = `${img.naturalWidth}x${img.naturalHeight} px | ${size}`;
            });
        };
    } 
    else if (videoExts.includes(item.ext)) {
        modalContent.innerHTML = `<video src="${item.path}" controls autoplay class="w-100 shadow rounded" style="max-height:70vh;" id="modalVid"></video>`;
        const video = document.getElementById('modalVid');
        video.onloadedmetadata = function() {
            fetch(item.path).then(r => r.blob()).then(blob => {
                const size = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
                const duration = Math.floor(video.duration / 60) + ":" + ("0" + Math.floor(video.duration % 60)).slice(-2);
                modalMediaSpecs.innerHTML = `Vidéo | ${duration} | ${size}`;
            });
        };
    } 
    else {
        modalContent.innerHTML = `
            <div class="p-5 bg-light rounded border text-center">
                <h1 class="display-1">📄</h1>
                <h5>Fichier .${item.ext.toUpperCase()}</h5>
                <p class="text-muted small">${item.path}</p>
            </div>`;
        modalMediaSpecs.innerHTML = "Document";
    }

    displayModalTags(item.path);
}

/**
 * Affiche les badges de tags (Correction du sélecteur parent)
 */
function displayModalTags(filePath) {
    const tagDisplay = document.getElementById('modalTagDisplay');
    const tagContainer = document.getElementById('modalTagsContainer');
    
    const card = document.querySelector(`.media-card[data-path="${filePath}"]`);
    if (!card || !tagDisplay || !tagContainer) return;

    const parentItem = card.closest('.media-item');
    const tagsAttr = parentItem ? parentItem.getAttribute('data-tags') : '';
    const tagsArray = tagsAttr ? tagsAttr.split(' ').filter(t => t.trim() !== "") : [];

    if (tagsArray.length > 0) {
        tagContainer.classList.remove('d-none');
        tagDisplay.innerHTML = tagsArray.map(t => 
            `<span class="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-normal px-2 py-1" style="font-size:0.7rem;">#${t}</span>`
        ).join('');
    } else {
        tagContainer.classList.add('d-none');
    }
}

/**
 * Navigation (Correction : évite la fermeture de la modale)
 */
function changeMedia(direction, event) {
    if(event) { 
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
 * Action Copier
 */
function modalCopyAction() {
    const url = modalCopyBtn.dataset.copyUrl;
    navigator.clipboard.writeText(url).then(() => {
        const originalText = modalCopyBtn.innerText;
        modalCopyBtn.innerText = "✅ Copié !";
        modalCopyBtn.classList.replace('btn-primary', 'btn-success');
        setTimeout(() => {
            modalCopyBtn.innerText = originalText;
            modalCopyBtn.classList.replace('btn-success', 'btn-primary');
        }, 2000);
    });
}

/**
 * Raccourcis clavier
 */
document.addEventListener('keydown', (e) => {
    if (!previewModalElement.classList.contains('show')) return;
    if (e.key === "ArrowRight") changeMedia(1);
    if (e.key === "ArrowLeft") changeMedia(-1);
    if (e.key === "Escape") previewModal.hide();
});

previewModalElement.addEventListener('hidden.bs.modal', () => {
    modalContent.innerHTML = '';
});