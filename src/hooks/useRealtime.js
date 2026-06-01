import { useEffect } from "react";
import { initializeEcho } from "../services/echo";
import { toast } from "react-toastify";

/**
 * useRealtime hook to listen to WebSocket events for specific models.
 *
 * @param {string} modelName - The base name of the model (e.g., 'Property', 'User', 'Tenant', 'Issue')
 * @param {Function} onCreated - Callback when a record is created
 * @param {Function} onUpdated - Callback when a record is updated
 * @param {Function} onDeleted - Callback when a record is deleted
 */
export default function useRealtime(modelName, { onCreated, onUpdated, onDeleted }) {
    useEffect(() => {
        const echo = initializeEcho();
        const role = sessionStorage.getItem("role");
        const userId = sessionStorage.getItem("user_id"); // Assuming user_id is saved in session

        if (!echo) return;

        // Determine if we listen to global admin updates or user-specific updates
        const isGlobalAdmin = ['admin', 'super_admin', 'maintenance_staff', 'landlord'].includes(role);
        
        // Let's listen to both admin channel (if authorized) and user specific channel
        const channelsToListen = [];
        
        if (isGlobalAdmin) {
            channelsToListen.push(echo.private('admin.updates'));
        }
        
        if (userId) {
            channelsToListen.push(echo.private(`user.updates.${userId}`));
        }

        const handleEvent = (eventData, type) => {
            // Check if the event belongs to the requested model
            // Laravel broadcasts events typically as `App\\Events\\ModelCreated`
            // But with BroadcastsEvents trait, it usually relies on model name
            // The trait BroadcastsEvents will broadcast as `PropertyCreated`, etc.
            
            // Note: Laravel 11 BroadcastsEvents suffix determines event: Created, Updated, Deleted, Restored.
            // But we need to check the class to match the modelName.
        };

        channelsToListen.forEach(channel => {
            channel.listen(`.\\App\\Models\\${modelName}`, (e) => {
                // Not standard logic, let's use standard Laravel Model Broadcasting
                // The event name is standard \Illuminate\Broadcasting\BroadcastEvent or custom.
                // Actually Laravel's BroadcastsEvents trait uses: ModelCreated, ModelUpdated.
            });
            
            // To make it fully reliable without exact class name matching:
            channel.listen(`.Eloquent`, (e) => {
                // Laravel broadcasts with event name equivalent to the class name or predefined "broadcastAs"
            });
            
            // The event name is exactly modelName.lowercase() + '.created'
            const modelLower = modelName.toLowerCase();
            
            channel.listen(`.${modelLower}.created`, (e) => {
                if (onCreated) onCreated(e.model || e);
                toast.success(`A new ${modelLower} was created!`);
            });
            channel.listen(`.${modelLower}.updated`, (e) => {
                if (onUpdated) onUpdated(e.model || e);
            });
            channel.listen(`.${modelLower}.deleted`, (e) => {
                if (onDeleted) onDeleted(e.model || e);
            });
            channel.listen(`.${modelLower}.trashed`, (e) => {
                if (onDeleted) onDeleted(e.model || e);
            });
        });

        return () => {
            channelsToListen.forEach(channel => {
                const modelLower = modelName.toLowerCase();
                channel.stopListening(`.${modelLower}.created`);
                channel.stopListening(`.${modelLower}.updated`);
                channel.stopListening(`.${modelLower}.deleted`);
                channel.stopListening(`.${modelLower}.trashed`);
            });
        };
    }, [modelName, onCreated, onUpdated, onDeleted]);
}
