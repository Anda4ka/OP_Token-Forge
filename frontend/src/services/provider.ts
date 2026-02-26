import { JSONRpcProvider } from 'opnet';
import { opnetTestnet, RPC_URL } from '../config/constants';

let provider: JSONRpcProvider | null = null;

export function getProvider(): JSONRpcProvider {
    if (!provider) {
        provider = new JSONRpcProvider(RPC_URL, opnetTestnet, 30_000);
    }
    return provider;
}
