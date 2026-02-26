import { getContract } from 'opnet';
import { Address } from '@btc-vision/transaction';
import { VibeTokenFactoryAbi } from '../abis/VibeTokenFactory.abi';
import { FACTORY_ADDRESS, opnetTestnet } from '../config/constants';
import { getProvider } from './provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let factoryContract: any = null;
let factoryAddress: Address | null = null;

export async function resolveAddress(bech32: string): Promise<Address> {
    const provider = getProvider();
    const pubKeysData = await provider.getPublicKeysInfoRaw([bech32]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = (pubKeysData as any)[bech32];
    if (!info?.tweakedPubkey) {
        throw new Error(`Address not found on network: ${bech32}`);
    }
    return Address.fromString('0x' + info.tweakedPubkey);
}

export async function getFactoryContract() {
    if (factoryContract) return factoryContract;

    const provider = getProvider();
    factoryAddress = await resolveAddress(FACTORY_ADDRESS);
    factoryContract = getContract(
        factoryAddress,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        VibeTokenFactoryAbi as any,
        provider,
        opnetTestnet,
    );
    return factoryContract;
}

/** Returns the resolved factory Address hex (e.g. "0x45e950ac..."). Must call getFactoryContract first. */
export function getFactoryAddressHex(): string {
    if (!factoryAddress) throw new Error('Factory not initialized — call getFactoryContract first');
    return factoryAddress.toHex();
}

export async function getDeploymentCount(): Promise<number> {
    const factory = await getFactoryContract();
    const result = await factory.getDeploymentCount();
    if (result.revert) throw new Error(result.revert);
    return Number(result.properties.count);
}

/**
 * Parse raw buffer from getDeployedTokens.
 * Contract writes: u32(count) + count * 32-byte addresses.
 * The opnet ARRAY_OF_ADDRESSES parser expects u16 length prefix,
 * so we parse the raw buffer manually.
 */
export async function getDeployedTokens(): Promise<string[]> {
    const factory = await getFactoryContract();
    const result = await factory.getDeployedTokens();
    if (result.revert) throw new Error(result.revert);

    // Parse raw buffer: u32 count + 32-byte addresses
    const buf = result.result?.buffer;
    if (!buf) return [];

    const bytes = new Uint8Array(
        buf instanceof ArrayBuffer ? buf : buf.buffer || buf,
    );
    if (bytes.length < 4) return [];

    // Read big-endian u32 count
    const count = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    if (count === 0) return [];

    const addresses: string[] = [];
    for (let i = 0; i < count; i++) {
        const offset = 4 + i * 32;
        if (offset + 32 > bytes.length) break;
        let hex = '0x';
        for (let j = 0; j < 32; j++) {
            hex += bytes[offset + j].toString(16).padStart(2, '0');
        }
        addresses.push(hex);
    }
    return addresses;
}

export interface DeploymentInfo {
    tokenAddress: string;
    ownerAddress: string;
}

export async function getDeploymentByIndex(_index: number): Promise<DeploymentInfo> {
    // NOTE: getDeploymentByIndex has a selector mismatch issue between
    // opnet client lib (computes selector from name+inputs) and btc-runtime
    // (computes from name only). We use getDeployedTokens instead.
    // Keeping this stub for potential future use.
    return {
        tokenAddress: '',
        ownerAddress: '',
    };
}
