import { networks, type Network } from '@btc-vision/bitcoin';

export const FACTORY_ADDRESS = 'opt1sqznrflg7krnelcuvvl8zmq66cg36yqqcgufmpuxz';
export const FACTORY_HEX = '0x45e950ac9e2e0817ed39a8dead459b346f12826318fc2b1a02fc6db1703f83bc';
export const RPC_URL = 'https://testnet.opnet.org';
export const OP20_WASM_PATH = '/op20-token.wasm';

export const opnetTestnet: Network = {
    ...networks.testnet,
    bech32: 'opt',
    ...({ bech32Opnet: 'opt' } as Record<string, string>),
};
