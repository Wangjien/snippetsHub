import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted, onUnmounted } from 'vue';

export function useGlobalShortcuts() {
    const registerGlobalShortcuts = async () => {
        try {
            // Register Alt+Space to toggle window visibility
            await register('Alt+Space', async (event: any) => {
                if (event.state === 'Pressed') {
                    const app = getCurrentWindow();
                    const isVisible = await app.isVisible();
                    if (isVisible) {
                        await app.hide();
                    } else {
                        await app.show();
                        await app.setFocus();
                    }
                }
            });
            console.log('Global shortcut Alt+Space registered');
        } catch (err) {
            console.error('Failed to register global shortcut:', err);
        }
    };

    const unregisterGlobalShortcuts = async () => {
        try {
            await unregister('Alt+Space');
        } catch (err) {
            console.warn('Failed to unregister global shortcut', err);
        }
    };

    onMounted(() => {
        registerGlobalShortcuts();
    });

    onUnmounted(() => {
        unregisterGlobalShortcuts();
    });
}
