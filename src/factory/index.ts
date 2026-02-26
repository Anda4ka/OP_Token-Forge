import { Blockchain } from '@btc-vision/btc-runtime/runtime';
import { revertOnError } from '@btc-vision/btc-runtime/runtime/abort/abort';
import { VibeTokenFactory } from './VibeTokenFactory';

// DO NOT ADD CUSTOM LOGIC HERE.
Blockchain.contract = (): VibeTokenFactory => {
    return new VibeTokenFactory();
};

// Export WASM entry points
export * from '@btc-vision/btc-runtime/runtime/exports';

// Panic handler
export function abort(message: string, fileName: string, line: u32, column: u32): void {
    revertOnError(message, fileName, line, column);
}

