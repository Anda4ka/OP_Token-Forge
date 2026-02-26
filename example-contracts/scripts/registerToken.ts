/**
 * registerToken.ts
 *
 * Регистрирует уже задеплоенный OP_20 токен в VibeTokenFactory.
 *
 * КЛЮЧЕВОЕ ПРАВИЛО OP_NET:
 *  - MLDSA-ключ привязывается к адресу ОДИН РАЗ (при первом deployToken или при деплое фабрики).
 *  - Флаги linkMLDSAPublicKeyToAddress / revealMLDSAPublicKey нужны ТОЛЬКО при первой привязке.
 *  - При повторных вызовах эти флаги ВЫЗЫВАЮТ REVERT: "Can not reassign existing MLDSA key".
 *  - Признак "ключ уже привязан" = файл .quantum_key_linked существует рядом с package.json.
 */

import { getContract, JSONRpcProvider, TransactionParameters } from 'opnet';
import { Address, ABIDataTypes } from '@btc-vision/transaction';
import { networks, Network } from '@btc-vision/bitcoin';
import { loadOrCreateWallet } from './wallet.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Файл-маркер: создаётся после первой успешной привязки MLDSA-ключа
const LINKED_MARKER = path.resolve(__dirname, '../.quantum_key_linked');

const opnetTestnet: Network = {
    ...networks.testnet,
    bech32: 'opt',
    ...({ bech32Opnet: 'opt' } as any),
};

const VIBE_FACTORY_ABI = [
    {
        name: 'deployToken',
        type: 'function',
        inputs: [
            { name: 'name', type: ABIDataTypes.STRING },
            { name: 'symbol', type: ABIDataTypes.STRING },
            { name: 'totalSupply', type: ABIDataTypes.UINT256 },
            { name: 'decimals', type: ABIDataTypes.UINT8 },
            { name: 'tokenAddress', type: ABIDataTypes.ADDRESS },
        ],
        outputs: [{ name: 'token', type: ABIDataTypes.ADDRESS }],
    },
    {
        name: 'getDeployedTokens',
        type: 'function',
        inputs: [],
        outputs: [{ name: 'tokens', type: ABIDataTypes.ARRAY_OF_ADDRESSES }],
    },
];

async function main() {
    const provider = new JSONRpcProvider({
        url: 'https://testnet.opnet.org',
        network: opnetTestnet,
        timeout: 30_000,
    });

    const privateKeyWIF = process.env['PRIVATE_KEY'];
    if (!privateKeyWIF) throw new Error('Set PRIVATE_KEY env variable (testnet WIF)');

    // Всегда один и тот же MLDSA-ключ — берём из .quantum_key
    const wallet = loadOrCreateWallet(privateKeyWIF, opnetTestnet);
    console.log(`Кошелёк: ${wallet.p2tr}`);

    // Нужно ли привязывать MLDSA-ключ в этот раз?
    const needMLDSALink = !fs.existsSync(LINKED_MARKER);
    if (needMLDSALink) {
        console.log('ℹ️  Первая привязка MLDSA-ключа (linkMLDSAPublicKeyToAddress=true)');
    } else {
        console.log('ℹ️  MLDSA-ключ уже привязан, флаги link/reveal НЕ нужны');
    }

    const FACTORY_ADDR = 'opt1sqznrflg7krnelcuvvl8zmq66cg36yqqcgufmpuxz';
    const TOKEN_ADDR = 'opt1sqztnregt45jn5mt5r34r4l7ey695jgty7yj8cthc';

    console.log('Получение публичных ключей...');
    const pubKeysData = await provider.getPublicKeysInfoRaw([FACTORY_ADDR, TOKEN_ADDR]);

    const factoryInfo = (pubKeysData as any)[FACTORY_ADDR];
    const tokenInfo = (pubKeysData as any)[TOKEN_ADDR];

    if (!factoryInfo || !tokenInfo) {
        throw new Error(
            `Публичные ключи не найдены:\n` +
            `  factory: ${JSON.stringify(factoryInfo)}\n` +
            `  token:   ${JSON.stringify(tokenInfo)}`,
        );
    }

    const factoryAddress = Address.fromString('0x' + (factoryInfo.tweakedPubkey as string));
    const tokenAddress = Address.fromString('0x' + (tokenInfo.tweakedPubkey as string));

    const factory = getContract(factoryAddress, VIBE_FACTORY_ABI as any, provider, opnetTestnet);

    console.log('Симуляция deployToken...');
    const simulation = await (factory as any).deployToken(
        'Farm coin',
        'farm',
        2100000000000000n,
        8,
        tokenAddress,
    );

    if (simulation.revert) {
        console.error('❌ Симуляция Revert:', simulation.revert);
        provider.close();
        return;
    }
    console.log('✅ Симуляция прошла успешно');

    const params: TransactionParameters = {
        signer: wallet.keypair,
        mldsaSigner: wallet.mldsaKeypair,
        refundTo: wallet.p2tr,
        maximumAllowedSatToSpend: 100_000n,
        feeRate: 2,
        network: opnetTestnet,

        // ВАЖНО: библиотека opnet по умолчанию ставит linkMLDSAPublicKeyToAddress: true (через ?? true),
        // поэтому нужно ЯВНО передавать false, а не просто не передавать параметр.
        linkMLDSAPublicKeyToAddress: needMLDSALink,
        revealMLDSAPublicKey: needMLDSALink,
    };

    const tx = await simulation.sendTransaction(params);

    console.log(`\n✅ Транзакция отправлена!`);
    console.log(`TXID: ${tx.transactionId}`);
    console.log(`Ожидаемая комиссия: ${tx.estimatedFees} sats`);

    // Помечаем что MLDSA-ключ привязан
    if (needMLDSALink) {
        fs.writeFileSync(LINKED_MARKER, tx.transactionId as string, 'utf-8');
        console.log('📝 .quantum_key_linked создан — при следующих вызовах link-флаги НЕ нужны');
    }

    provider.close();
}

main().catch(err => {
    console.error('Фатальная ошибка:', err);
    process.exit(1);
});
