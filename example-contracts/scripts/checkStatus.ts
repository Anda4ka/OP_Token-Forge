/**
 * checkStatus.ts
 *
 * Diagnostic tool: checks wallet UTXOs, contract existence, and WASM bytecode.
 * Uses the persistent MLDSA key from wallet.ts (same as deployFactory/registerToken).
 */

import { JSONRpcProvider } from 'opnet';
import { networks, Network } from '@btc-vision/bitcoin';
import { Address } from '@btc-vision/transaction';
import { loadOrCreateWallet } from './wallet.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINKED_MARKER = path.resolve(__dirname, '../.quantum_key_linked');

const opnetTestnet: Network = {
    ...networks.testnet,
    bech32: 'opt',
    ...({ bech32Opnet: 'opt' } as any),
};

const PRIVATE_KEY_WIF = process.env['PRIVATE_KEY'];
if (!PRIVATE_KEY_WIF) throw new Error('Set PRIVATE_KEY env variable (testnet WIF)');

async function main() {
    const provider = new JSONRpcProvider({
        url: 'https://testnet.opnet.org',
        network: opnetTestnet,
        timeout: 30_000,
    });

    // Use persistent wallet (same MLDSA key as deploy/register scripts)
    const wallet = loadOrCreateWallet(PRIVATE_KEY_WIF, opnetTestnet);

    console.log('=== Диагностика ===');
    console.log(`Кошелёк: ${wallet.p2tr}\n`);

    // 1. Check UTXOs
    const utxos = await provider.utxoManager.getUTXOs({ address: wallet.p2tr });
    const totalSats = utxos.reduce((s, u) => s + Number(u.value), 0);
    console.log(`UTXOs кошелька: ${utxos.length} (${totalSats} sats total)`);
    for (const u of utxos) {
        console.log(`  - ${u.transactionId}:${u.outputIndex} = ${u.value} sats`);
    }

    // 2. Check MLDSA link status
    if (fs.existsSync(LINKED_MARKER)) {
        const savedAddr = fs.readFileSync(LINKED_MARKER, 'utf-8').trim();
        console.log(`\nMLDSA-ключ: привязан (сохранённый адрес: ${savedAddr})`);
    } else {
        console.log('\nMLDSA-ключ: НЕ привязан (.quantum_key_linked отсутствует)');
    }

    // 3. Check factory contract
    const factoryAddr = fs.existsSync(LINKED_MARKER)
        ? fs.readFileSync(LINKED_MARKER, 'utf-8').trim()
        : null;

    if (!factoryAddr) {
        console.log('\nАдрес фабрики неизвестен — деплой ещё не выполнен');
        provider.close();
        return;
    }

    console.log(`\nПроверка контракта ${factoryAddr}...`);
    try {
        const pubKeys = await provider.getPublicKeysInfoRaw([factoryAddr]);
        const info = (pubKeys as any)[factoryAddr];
        if (info) {
            console.log(`Адрес найден в сети:`);
            console.log(`   tweakedPubkey: ${info.tweakedPubkey}`);
            console.log(`   p2op: ${info.p2op}`);
        } else {
            console.log(`Адрес не найден в сети — reveal TX ещё не подтверждён`);
        }
    } catch (e) {
        console.log(`Ошибка запроса: ${e}`);
    }

    // 4. Check WASM bytecode
    console.log(`\nПроверка WASM байткода контракта...`);
    try {
        const pubKeys = await provider.getPublicKeysInfoRaw([factoryAddr]);
        const info = (pubKeys as any)[factoryAddr];
        if (!info || !info.tweakedPubkey) {
            throw new Error('Публичный ключ контракта не найден');
        }

        const factoryAddress = Address.fromString('0x' + info.tweakedPubkey);
        const code = await provider.getCode(factoryAddress, true);

        if (code instanceof Uint8Array) {
            console.log(code.length > 0
                ? `WASM развёрнут: ${code.length} байт`
                : `WASM пустой — контракт не развёрнут!`);
        } else {
            const bytecode = (code as any).bytecode;
            if (bytecode && bytecode.length > 0) {
                console.log(`WASM развёрнут: ${bytecode.length} байт`);
            } else {
                console.log(`WASM не найден — reveal TX ещё не подтверждён`);
            }
        }
    } catch (e: any) {
        console.log(`Ошибка: ${e.message}`);
    }

    console.log('\n=== Итог ===');
    console.log('Если WASM не найден:');
    console.log('  1. Подождите ~10 мин (reveal TX в мемпуле)');
    console.log('  2. Или повторите деплой: cd example-contracts && npx tsx scripts/deployFactory.ts');

    provider.close();
}

main().catch(console.error);
