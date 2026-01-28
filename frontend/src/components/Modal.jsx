import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import '../styles/Modal.css';

function Modal({ isOpen, onClose, title, children, size = 'md', zIndex = 50 }) {
    const overlayRef = useRef();
    const contentRef = useRef();

    useEffect(() => {
        if (isOpen) {
            // Animate in
            gsap.fromTo(overlayRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: 'power2.out' }
            );
            gsap.fromTo(contentRef.current,
                { opacity: 0, y: 20, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' }
            );
        }
    }, [isOpen]);

    const handleClose = () => {
        // Animate out
        gsap.to(contentRef.current, {
            opacity: 0, y: 20, scale: 0.95,
            duration: 0.2, ease: 'power2.in'
        });
        gsap.to(overlayRef.current, {
            opacity: 0, duration: 0.2, ease: 'power2.in',
            onComplete: onClose
        });
    };

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="modal-overlay"
            onClick={handleOverlayClick}
            style={{ zIndex }}
        >
            <div ref={contentRef} className={`modal-content modal-${size}`}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button type="button" className="modal-close" onClick={handleClose}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default Modal;
