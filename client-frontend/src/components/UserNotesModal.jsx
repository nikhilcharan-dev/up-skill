import { useState, useRef, useEffect } from 'react';
import { Editor } from 'primereact/editor';
import { X, Download, FileEdit } from 'lucide-react';
import jsPDF from 'jspdf';
import './UserNotesModal.css';

const UserNotesModal = ({ isOpen, onClose, initialText, title, onSave, isLoading }) => {
    const [text, setText] = useState('');

    // Sync internal state with prop when opening
    useEffect(() => {
        if (isOpen && !isLoading) {
            setText(initialText || '');
        }
    }, [isOpen, initialText, isLoading]);

    const handleTextChange = (e) => {
        setText(e.htmlValue);
    };

    const handleSave = () => {
        onSave(text);
        onClose();
    };

    const handleDownload = () => {
        // Create a new PDF document
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text(title || 'My Notes', 20, 20);

        // Remove HTML tags for simple text download (basic implementation)
        // For rich text, more complex HTML-to-PDF logic prevents styling loss,
        // but stripping tags is safer for a basic jsPDF text() call.
        // Alternatively we can use doc.html but it's async and tricky with styling.
        // Let's us a simple strip-html approach for now or just raw text.

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const plainText = tempDiv.innerText || tempDiv.textContent || '';

        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(plainText, 170); // Wrap text
        doc.text(splitText, 20, 30);

        doc.save(`${title || 'notes'}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <div className="notes-modal-overlay" onClick={handleSave}>
            <div className="notes-modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
                <div className="notes-modal-header">
                    <div className="notes-modal-title">
                        <FileEdit size={20} className="notes-icon" />
                        <h3>{title}</h3>
                    </div>

                    <div className="notes-header-actions">
                        <button
                            className="download-icon-btn"
                            onClick={handleDownload}
                            title="Download PDF"
                        >
                            <Download size={20} />
                        </button>
                        <button className="notes-close-btn" onClick={handleSave}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="notes-modal-body">
                    {isLoading ? (
                        <div className="notes-loading-state">
                            <div className="spinner"></div>
                            <p>Loading notes...</p>
                        </div>
                    ) : (
                        <Editor
                            value={text}
                            onTextChange={handleTextChange}
                            style={{ height: '320px' }}
                            placeholder="Start typing your notes here..."
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserNotesModal;
