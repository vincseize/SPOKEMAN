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
    const allVisibleCards = Array.from(container.querySelectorAll('.media-card'));
    
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

    // Reset du contenu et des specs
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
        const img = new Image();
        img.src = item.path;
        img.className = "img-fluid shadow rounded";
        img.style.maxHeight = "70vh";
        img.onload = function() {
            // Récupération du poids via Fetch
            fetch(item.path).then(r => r.blob()).then(blob => {
                const size = (blob.size / 1024).toFixed(1) + ' KB';
                modalMediaSpecs.innerHTML = `${img.naturalWidth}x${img.naturalHeight} px | ${size}`;
            });
        };
        modalContent.appendChild(img);
    } 
    else if (videoExts.includes(item.ext)) {
        const video = document.createElement('video');
        video.src = item.path;
        video.controls = true;
        video.autoplay = true;
        video.className = "w-100 shadow rounded";
        video.style.maxHeight = "70vh";
        video.onloadedmetadata = function() {
            fetch(item.path).then(r => r.blob()).then(blob => {
                const size = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
                const duration = Math.floor(video.duration / 60) + ":" + ("0" + Math.floor(video.duration % 60)).slice(-2);
                modalMediaSpecs.innerHTML = `Vidéo | ${duration} | ${size}`;
            });
        };
        modalContent.appendChild(video);
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

    // Affichage des tags en mode lecture seule
    displayModalTags(item.path);
}

/**
 * Affiche les badges de tags dans la modale
 */
function displayModalTags(filePath) {
    const cardOrigin = document.querySelector(`.media-card[data-path="${filePath}"]`);
    const tagDisplay = document.getElementById('modalTagDisplay');
    const tagContainer = document.getElementById('modalTagsContainer');
    
    if (!cardOrigin || !tagDisplay) return;

    const tagsAttr = cardOrigin.closest('.media-item').dataset.tags;
    
    if (tagsAttr && tagsAttr.trim() !== "") {
        tagContainer.classList.remove('d-none');
        const tagsArray = tagsAttr.split(' ');
        tagDisplay.innerHTML = tagsArray.map(t => 
            `<span class="badge rounded-pill bg-secondary fw-normal" style="font-size:0.7rem">#${t}</span>`
        ).join('');
    } else {
        tagContainer.classList.add('d-none');
    }
}

/**
 * Navigation entre médias
 */
function changeMedia(direction, event) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    if (currentGallery.length <= 1) return;
    
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = currentGallery.length - 1;
    if (currentIndex >= currentGallery.length) currentIndex = 0;
    
    updateModal();
}

/**
 * Action Copier l'URL
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

/**
 * Nettoyage à la fermeture (Arrêt vidéo)
 */
previewModalElement.addEventListener('hidden.bs.modal', () => {
    modalContent.innerHTML = '';
});