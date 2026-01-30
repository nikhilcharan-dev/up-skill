import { X } from 'lucide-react';
import './PDFModal.css';

const PDFModal = ({ isOpen, onClose, pdfUrl, title }) => {
    if (!isOpen) return null;

    return (
        <div className="pdf-modal-overlay" onClick={onClose}>
            <div className="pdf-modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
                <div className="pdf-modal-header">
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                    <div className="pdf-modal-title">
                        <h3>{title}</h3>
                    </div>


                </div>

                <div className="pdf-modal-body">
                    {pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            title="PDF Viewer"
                            className="pdf-viewer-frame"
                        />
                    ) : (
                        <div className="no-pdf-message">
                            <p>No PDF available for this lecture.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PDFModal;
