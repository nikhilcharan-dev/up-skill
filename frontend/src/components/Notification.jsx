import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import '../styles/Notification.css';

const Notification = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleShowToast = (event) => {
            const { message, type = 'error' } = event.detail;
            const id = Date.now();
            setNotifications((prev) => [...prev, { id, message, type }]);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
            }, 5000);
        };

        window.addEventListener('SHOW_TOAST', handleShowToast);
        return () => window.removeEventListener('SHOW_TOAST', handleShowToast);
    }, []);

    return (
        <div className="toast-container">
            {notifications.map((n) => (
                <Toast key={n.id} notification={n} />
            ))}
        </div>
    );
};

const Toast = ({ notification }) => {
    useEffect(() => {
        gsap.fromTo(`.toast-${notification.id}`,
            { x: 100, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
    }, [notification.id]);

    return (
        <div className={`toast toast-${notification.type} toast-${notification.id}`}>
            {/* <span className="toast-icon"></span> */}
            <span className="toast-message">{notification.message}</span>
        </div>
    );
};

export const showToast = (message, type = 'error') => {
    const event = new CustomEvent('SHOW_TOAST', { detail: { message, type } });
    window.dispatchEvent(event);
};

if (typeof window !== 'undefined') {
    window.showToast = showToast;
}

export default Notification;
