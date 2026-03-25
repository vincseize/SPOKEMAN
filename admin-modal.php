<div class="modal fade" id="previewModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content shadow-lg border-0 bg-white">
            <button type="button" class="nav-btn nav-prev" onclick="changeMedia(-1, event)">❮</button>
            <button type="button" class="nav-btn nav-next" onclick="changeMedia(1, event)">❯</button>
            
            <div class="modal-header border-0 pb-0">
                <div class="small text-muted fw-bold" id="modalFileName"></div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body text-center">
                <div id="modalMediaContent" class="mb-3"></div>
                
                <div id="modalTagsContainer" class="p-2 bg-light rounded mb-3">
                    <form id="modalTagForm" class="d-flex flex-wrap justify-content-center gap-2">
                        <?php foreach ($tagsList as $t): ?>
                            <div class="tag-check-item">
                                <input type="checkbox" name="tags[]" value="<?= $t ?>" id="modal-tag-<?= md5($t) ?>" class="tag-input-checkbox modal-tag-sync">
                                <label for="modal-tag-<?= md5($t) ?>" class="tag-label-checkbox" style="font-size: 0.65rem; padding: 2px 8px;"><?= $t ?></label>
                            </div>
                        <?php endforeach; ?>
                    </form>
                </div>
            </div>

            <div class="modal-footer border-top bg-light py-2 px-3">
                <div class="container-fluid p-0">
                    <div class="row align-items-center">
                        <div class="col-md-6 d-flex gap-2">
                            <button class="btn btn-sm btn-dark" id="modalCopyBtn" onclick="modalCopyAction()">📋 Copier</button>
                            <form method="post" id="modalDeleteForm" class="m-0">
                                <input type="hidden" name="file_path" id="modalDeletePath">
                                <button name="delete_file" onclick="return confirm('Supprimer ?')" class="btn btn-sm btn-outline-danger">🗑️ Supprimer</button>
                            </form>
                        </div>
                        <div class="col-md-6 text-end">
                            <div id="modalMediaSpecs" class="small text-muted font-monospace" style="font-size: 0.75rem;">
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>