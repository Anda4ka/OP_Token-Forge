/**
 * deployFactory.ts
 *
 * Деплоит VibeTokenFactory.wasm в OPNet testnet.
 * После успешного деплоя создаёт .quantum_key_linked — признак того,
 * что MLDSA-ключ уже привязан к адресу.
 */

import { TransactionFactory, IDeploymentParameters } from '@btc-vision/transaction';
import { JSONRpcProvider } from 'opnet';
import { networks, Network } from '@btc-vision/bitcoin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { loadOrCreateWallet } from './wallet.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINKED_MARKER = path.resolve(__dirname, '../.quantum_key_linked');

const opnetTestnet: Network = {
    ...networks.testnet,
    bech32: 'opt',
    ...({ bech32Opnet: 'opt' } as any),
};

const PRIVATE_KEY_WIF = process.env['PRIVATE_KEY'];
if (!PRIVATE_KEY_WIF) throw new Error('Set PRIVATE_KEY env variable (testnet WIF)');
const WASM_PATH = path.resolve(__dirname, '../../build/vibe-token-factory.wasm');

const provider = new JSONRpcProvider({
    url: 'https://testnet.opnet.org',
    network: opnetTestnet,
    timeout: 60_000,
});

async function main() {
    console.log('=== Деплой VibeTokenFactory ===\n');

    // Используем персистентный MLDSA-ключ
    const wallet = loadOrCreateWallet(PRIVATE_KEY_WIF, opnetTestnet);
    console.log(`Кошелёк: ${wallet.p2tr}`);

    if (!fs.existsSync(WASM_PATH)) {
        throw new Error(`WASM файл не найден: ${WASM_PATH}`);
    }
    const bytecode = new Uint8Array(fs.readFileSync(WASM_PATH));
    console.log(`WASM: ${bytecode.length} байт`);

    const utxos = await provider.utxoManager.getUTXOs({ address: wallet.p2tr });
    if (utxos.length === 0) throw new Error('Нет UTXOs. Пополните баланс: ' + wallet.p2tr);
    const totalSats = utxos.reduce((s, u) => s + Number(u.value), 0);
    console.log(`UTXOs: ${utxos.length} (${totalSats} sats total)`);

    // Check if MLDSA key was already linked in a previous attempt
    const alreadyLinked = fs.existsSync(LINKED_MARKER);
    if (alreadyLinked) {
        console.log('MLDSA-ключ уже привязан (файл .quantum_key_linked найден)');
        console.log('Флаги link/reveal НЕ устанавливаются');
    } else {
        console.log('Первый деплой — MLDSA-ключ будет привязан');
    }

    console.log('\nПолучение PoW challenge...');
    const challenge = await provider.getChallenge();

    const deploymentParams: IDeploymentParameters = {
        from: wallet.p2tr,
        utxos,
        signer: wallet.keypair,
        mldsaSigner: wallet.mldsaKeypair,
        network: opnetTestnet,
        feeRate: 2,
        priorityFee: 0n,
        gasSatFee: 10_000n,
        bytecode,
        challenge,
        // Only link MLDSA key on first deployment; re-linking causes revert
        linkMLDSAPublicKeyToAddress: !alreadyLinked,
        revealMLDSAPublicKey: !alreadyLinked,
    };

    const txFactory = new TransactionFactory();
    const deployment = await txFactory.signDeployment(deploymentParams);

    console.log(`\nАдрес фабрики: ${deployment.contractAddress}`);

    console.log('\nОтправка обеих транзакций атомарно...');
    const results = await provider.sendRawTransactions([
        deployment.transaction[0],  // funding
        deployment.transaction[1],  // reveal
    ]);

    let allSuccess = true;
    for (let i = 0; i < results.length; i++) {
        const txName = i === 0 ? 'Funding' : 'Reveal';
        const r = results[i];
        console.log(`${txName} TX: result=${r.result}, success=${r.success}, error=${r.error ?? 'нет'}`);
        if (!r.success) {
            allSuccess = false;
            console.error(`${txName} TX отклонена: ${r.error}`);
        }
    }

    if (!allSuccess) {
        console.error('\nДеплой не удался. Проверьте ошибки выше.');
        console.error('Если "Can not reassign MLDSA" — создайте .quantum_key_linked (touch .quantum_key_linked)');
        console.error('Если "MLDSA key not linked" — удалите .quantum_key_linked');
        provider.close();
        process.exit(1);
    }

    // Always save the latest factory address (even if MLDSA was already linked)
    fs.writeFileSync(LINKED_MARKER, deployment.contractAddress as string, 'utf-8');
    console.log(`\n.quantum_key_linked обновлён: ${deployment.contractAddress}`);

    console.log('\n=== ГОТОВО ===');
    console.log(`Адрес фабрики: ${deployment.contractAddress}`);
    console.log('Обновите FACTORY_ADDR в registerToken.ts!');
    console.log('\nПодождите ~10 мин пока reveal TX подтвердится, затем:');
    console.log('  npx tsx scripts/checkStatus.ts');
    console.log('  npx tsx scripts/registerToken.ts');

    provider.close();
}

main().catch(err => {
    console.error('Ошибка:', err);
    provider.close();
    process.exit(1);
});
