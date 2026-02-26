import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        nodePolyfills({
            globals: { Buffer: true, global: true, process: true },
            include: ['buffer', 'process', 'stream', 'events', 'util'],
        }),
    ],
    resolve: {
        conditions: ['browser', 'import', 'module'],
    },
    define: {
        global: 'globalThis',
    },
    optimizeDeps: {
        include: ['opnet', '@btc-vision/transaction', '@btc-vision/bitcoin'],
        esbuildOptions: {
            define: { global: 'globalThis' },
        },
    },
});
