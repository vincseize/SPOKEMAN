<div class="modal fade" id="previewModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg position-relative">
        
        <button type="button" class="nav-btn nav-prev shadow" onclick="changeMedia(-1, event)" aria-label="Précédent">❮</button>
        <button type="button" class="nav-btn nav-next shadow" onclick="changeMedia(1, event)" aria-label="Suivant">❯</button>

        <div class="modal-content shadow-lg border-0 bg-white">
            <div class="modal-header">
                <div class="small text-muted fw-bold d-flex align-items-center" id="modalFileName">
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>

            <div class="modal-body text-center">
                <div id="modalMediaContent" class="mb-3">
                </div>
                
                <div id="modalTagsContainer" class="d-none">
                    <div id="modalTagDisplay" class="d-flex flex-wrap gap-2 justify-content-center">
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <div class="container-fluid p-0">
                    <div class="row align-items-center">
                        <div class="col-6 d-flex gap-2">
                            <button class="btn btn-sm btn-primary px-3 shadow-sm d-flex align-items-center gap-2" id="modalCopyBtn" onclick="modalCopyAction()">
                                📋 <span>Copier le lien</span>
                            </button>
                            <a id="modalDownloadBtn" href="#" download class="btn btn-sm btn-outline-dark px-3 shadow-sm d-flex align-items-center gap-2">
                                📥 <span>Télécharger</span>
                            </a>
                        </div>
                        <div class="col-6 text-end">
                            <div id="modalMediaSpecs" class="font-monospace">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>