import React from "react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  confirmVariant = "danger",
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body py-4">
              <p className="mb-0 text-muted">{message}</p>
            </div>
            <div className="modal-footer border-top-0 pt-0 pb-4 px-4">
              <button
                type="button"
                className="btn btn-light px-4"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant} px-4`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
