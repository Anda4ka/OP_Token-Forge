/**
 * wallet.ts
 *
 * Загружает или создаёт фиксированный MLDSA-ключ.
 * MLDSA-ключ ДОЛЖЕН быть один и тот же во всех скриптах.
 * Первый запуск — создаёт .quantum_key файл.
 * Последующие запуски — читают из файла.
 *
 * ВАЖНО: никогда не генерируй новый Wallet.generate() перед каждым вызовом —
 * это создаёт новый случайный ключ, который нельзя переназначить,
 * и вызов контракта падает с "Can not reassign existing MLDSA public key".
 */

import { Wallet, MLDSASecurityLevel } from '@btc-vision/transaction';
import { Network } from '@btc-vision/bitcoin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_FILE = path.resolve(__dirname, '../.quantum_key');

export function loadOrCreateWallet(privateKeyWIF: string, network: Network): Wallet {
    let quantumBase58: string;

    if (fs.existsSync(KEY_FILE)) {
        // Загружаем сохранённый ключ
        quantumBase58 = fs.readFileSync(KEY_FILE, 'utf-8').trim();
        console.log('🔑 MLDSA-ключ загружен из файла .quantum_key');
    } else {
        // Первый запуск — генерируем и сохраняем
        const tempWallet = Wallet.generate(network, MLDSASecurityLevel.LEVEL2);
        quantumBase58 = tempWallet.toQuantumBase58();
        fs.writeFileSync(KEY_FILE, quantumBase58, 'utf-8');
        console.log('🔑 Новый MLDSA-ключ создан и сохранён в .quantum_key');
        console.log('⚠️  СОХРАНИ ЭТОТ ФАЙЛ! Он нужен для всех вызовов контракта.');
    }

    return Wallet.fromWif(privateKeyWIF, quantumBase58, network, MLDSASecurityLevel.LEVEL2);
}
