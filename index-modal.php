<div class="modal fade" id="previewModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg position-relative">
        
        <button type="button" class="nav-btn nav-prev shadow" onclick="changeMedia(-1, event)">❮</button>
        <button type="button" class="nav-btn nav-next shadow" onclick="changeMedia(1, event)">❯</button>

        <div class="modal-content shadow-lg border-0 bg-white">
            <div class="modal-header border-0 pb-0">
                <div class="small text-muted fw-bold" id="modalFileName"></div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body text-center">
                <div id="modalMediaContent" class="mb-3"></div>
                
                <div id="modalTagsContainer" class="p-2 bg-light rounded mb-3 d-none">
                    <div id="modalTagDisplay" class="d-flex flex-wrap justify-content-center gap-2"></div>
                </div>
            </div>

            <div class="modal-footer border-top bg-light py-2 px-3">
                <div class="container-fluid p-0">
                    <div class="row align-items-center">
                        <div class="col-6 d-flex gap-2">
                            <button class="btn btn-sm btn-primary px-3 shadow-sm" id="modalCopyBtn" onclick="modalCopyAction()">📋 Copier</button>
                            <a id="modalDownloadBtn" href="#" download class="btn btn-sm btn-outline-dark px-3 shadow-sm">📥 Télécharger</a>
                        </div>
                        <div class="col-6 text-end">
                            <div id="modalMediaSpecs" class="small text-muted font-monospace" style="font-size: 0.75rem;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>