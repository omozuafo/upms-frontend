import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;

export const initializeEcho = () => {
    if (echoInstance) return echoInstance;

    const token = sessionStorage.getItem('token');
    if (!token) return null;

    try {
        const reverbHost = import.meta.env.VITE_REVERB_HOST;
        // If no Reverb host configured in production, skip Echo connection safely
        if (!reverbHost && window.location.hostname !== 'localhost') {
            return null;
        }

        echoInstance = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY || 'b0tukdtsjrpenzbwayqu',
            wsHost: reverbHost || 'localhost',
            wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
            wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
            forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
            enabledTransports: ['ws', 'wss'],
            authEndpoint: `${import.meta.env.VITE_API_URL || 'https://upms-backend.onrender.com/api'}/broadcasting/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        return echoInstance;
    } catch (e) {
        console.warn('Echo initialization skipped or failed:', e);
        return null;
    }
};

export const getEcho = () => echoInstance;

export const destroyEcho = () => {
    if (echoInstance) {
        try {
            echoInstance.disconnect();
        } catch (e) {
            // ignore
        }
        echoInstance = null;
    }
};
