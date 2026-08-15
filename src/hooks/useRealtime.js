import { useEffect } from "react";
import { initializeEcho } from "../services/echo";

export default function useRealtime(modelName, callbacks = {}) {
    const { onCreated, onUpdated, onDeleted } = callbacks;

    useEffect(() => {
        let echo = null;
        try {
            echo = initializeEcho();
        } catch (e) {
            console.warn("Failed to initialize Echo:", e);
            return;
        }

        if (!echo) return;

        const role = sessionStorage.getItem("role");
        const userId = sessionStorage.getItem("user_id");

        const isGlobalAdmin = ['admin', 'super_admin', 'maintenance_staff', 'landlord'].includes(role);
        const channelsToListen = [];

        try {
            if (isGlobalAdmin && echo.private) {
                channelsToListen.push(echo.private('admin.updates'));
            }
            if (userId && echo.private) {
                channelsToListen.push(echo.private(`user.updates.${userId}`));
            }

            const modelLower = modelName ? modelName.toLowerCase() : "";

            channelsToListen.forEach(channel => {
                if (!channel || !channel.listen) return;

                if (onCreated) {
                    channel.listen(`.${modelLower}.created`, (e) => {
                        onCreated(e.model || e);
                    });
                }
                if (onUpdated) {
                    channel.listen(`.${modelLower}.updated`, (e) => {
                        onUpdated(e.model || e);
                    });
                }
                if (onDeleted) {
                    channel.listen(`.${modelLower}.deleted`, (e) => {
                        onDeleted(e.model || e);
                    });
                    channel.listen(`.${modelLower}.trashed`, (e) => {
                        onDeleted(e.model || e);
                    });
                }
            });
        } catch (err) {
            console.warn("Error setting up realtime listeners:", err);
        }

        return () => {
            try {
                channelsToListen.forEach(channel => {
                    if (!channel || !channel.stopListening) return;
                    const modelLower = modelName ? modelName.toLowerCase() : "";
                    channel.stopListening(`.${modelLower}.created`);
                    channel.stopListening(`.${modelLower}.updated`);
                    channel.stopListening(`.${modelLower}.deleted`);
                    channel.stopListening(`.${modelLower}.trashed`);
                });
            } catch (e) {
                // ignore cleanup errors
            }
        };
    }, [modelName]);
}
