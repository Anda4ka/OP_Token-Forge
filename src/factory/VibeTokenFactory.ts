import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    Blockchain,
    BytesWriter,
    Calldata,
    EMPTY_POINTER,
    NetEvent,
    OP_NET,
    Revert,
    SafeMath,
    StoredBoolean,
    StoredString,
    StoredU256,
} from '@btc-vision/btc-runtime/runtime';
import { StoredMapU256 } from '@btc-vision/btc-runtime/runtime/storage/maps/StoredMapU256';

/**
 * VibeTokenFactory
 *
 * An OP_NET factory contract responsible for coordinating deployments of OP_20 tokens.
 *
 * Responsibilities:
 * - Track the admin (deployer) address.
 * - Allow users to register new OP_20 token deployments via `deployToken`.
 * - Maintain an indexed list of deployed token addresses for discovery.
 * - Provide a pausability switch for the factory owner.
 * - Guard state-changing entrypoints against reentrancy.
 *
 * IMPORTANT OP_NET LIMITATION:
 * - Current OP_NET contracts cannot directly deploy new WASM contracts on-chain.
 * - This factory instead acts as an authoritative registry that:
 *   - Records metadata for OP_20 deployments initiated by off-chain tooling.
 *   - Emits a strongly-typed TokenDeployed event.
 *   - Maintains an indexed list of token addresses for frontends and indexers.
 *
 * Off-chain deployers (wallets, backends, CLIs) MUST:
 * - First deploy the OP_20 token contract.
 * - Then call `deployToken` on this factory in the same user workflow,
 *   passing the final token address and configuration.
 */

// =============================================================================
// Storage Pointer Allocation (Module Level)
// =============================================================================

const ownerPointer: u16 = Blockchain.nextPointer;
const pausedPointer: u16 = Blockchain.nextPointer;
const deploymentCountPointer: u16 = Blockchain.nextPointer;
const deploymentIndexToTokenPointer: u16 = Blockchain.nextPointer;
const deploymentIndexToOwnerPointer: u16 = Blockchain.nextPointer;
const reentrancyLockPointer: u16 = Blockchain.nextPointer;

// =============================================================================
// Events
// =============================================================================

/**
 * TokenDeployedEvent
 *
 * Encodes: tokenAddress, owner, totalSupply, name, symbol
 */
@final
class TokenDeployedEvent extends NetEvent {
    public constructor(token: Address, owner: Address, totalSupply: u256, name: string, symbol: string) {
        const writer = new BytesWriter(32 + 32 + 32 + 4 + name.length + 4 + symbol.length);
        writer.writeAddress(token);
        writer.writeAddress(owner);
        writer.writeU256(totalSupply);
        writer.writeStringWithLength(name);
        writer.writeStringWithLength(symbol);
        super('TokenDeployed', writer);
    }
}

@final
class PausedEvent extends NetEvent {
    public constructor() {
        super('Paused', new BytesWriter(0));
    }
}

@final
class UnpausedEvent extends NetEvent {
    public constructor() {
        super('Unpaused', new BytesWriter(0));
    }
}

@final
class OwnershipTransferredEvent extends NetEvent {
    public constructor(previousOwner: string, newOwner: string) {
        const writer = new BytesWriter(4 + previousOwner.length + 4 + newOwner.length);
        writer.writeStringWithLength(previousOwner);
        writer.writeStringWithLength(newOwner);
        super('OwnershipTransferred', writer);
    }
}

// =============================================================================
// Contract Implementation
// =============================================================================

@final
export class VibeTokenFactory extends OP_NET {
    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    private readonly _owner: StoredString;
    private readonly _paused: StoredBoolean;

    private readonly deploymentCount: StoredU256;
    private readonly deploymentIndexToToken: StoredMapU256;
    private readonly deploymentIndexToOwner: StoredMapU256;

    private readonly reentrancyLock: StoredBoolean;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    public constructor() {
        super();

        this._owner = new StoredString(ownerPointer);
        this._paused = new StoredBoolean(pausedPointer, false);

        this.deploymentCount = new StoredU256(deploymentCountPointer, EMPTY_POINTER);
        this.deploymentIndexToToken = new StoredMapU256(deploymentIndexToTokenPointer);
        this.deploymentIndexToOwner = new StoredMapU256(deploymentIndexToOwnerPointer);

        this.reentrancyLock = new StoredBoolean(reentrancyLockPointer, false);
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    /**
     * onDeployment is called exactly once when the factory is deployed.
     *
     * Sets the initial owner to the transaction origin.
     */
    public override onDeployment(_calldata: Calldata): void {
        const deployer: Address = Blockchain.tx.origin;
        this._owner.value = deployer.toString();
    }

    /**
     * onUpdate is invoked on contract upgrades.
     *
     * For now we simply delegate to the base implementation.
     */
    public override onUpdate(calldata: Calldata): void {
        super.onUpdate(calldata);
    }

    // -------------------------------------------------------------------------
    // Modifiers (Internal Checks)
    // -------------------------------------------------------------------------

    private requireOwner(sender: Address): void {
        const storedOwner = this._owner.value;

        if (storedOwner.length == 0) {
            throw new Revert('Owner not initialized');
        }

        if (storedOwner != sender.toString()) {
            throw new Revert('Caller is not the owner');
        }
    }

    private requireNotPaused(): void {
        if (this._paused.value) {
            throw new Revert('Factory is paused');
        }
    }

    private enterNonReentrant(): void {
        if (this.reentrancyLock.value) {
            throw new Revert('ReentrancyGuard: reentrant call');
        }

        this.reentrancyLock.value = true;
    }

    private exitNonReentrant(): void {
        this.reentrancyLock.value = false;
    }

    // -------------------------------------------------------------------------
    // Owner-only Administrative Functions
    // -------------------------------------------------------------------------

    /**
     * Pause the factory.
     *
     * While paused, `deployToken` will revert.
     */
    @method()
    @emit('Paused')
    @returns()
    public pause(_calldata: Calldata): BytesWriter {
        this.requireOwner(Blockchain.tx.sender);

        if (this._paused.value) {
            throw new Revert('Factory already paused');
        }

        this._paused.value = true;
        this.emitEvent(new PausedEvent());

        return new BytesWriter(1);
    }

    /**
     * Unpause the factory.
     */
    @method()
    @emit('Unpaused')
    @returns()
    public unpause(_calldata: Calldata): BytesWriter {
        this.requireOwner(Blockchain.tx.sender);

        if (!this._paused.value) {
            throw new Revert('Factory is not paused');
        }

        this._paused.value = false;
        this.emitEvent(new UnpausedEvent());

        return new BytesWriter(1);
    }

    /**
     * Transfer ownership of the factory to a new address.
     */
    @method({
        name: 'newOwner',
        type: ABIDataTypes.STRING,
    })
    @emit('OwnershipTransferred')
    @returns()
    public transferOwnership(calldata: Calldata): BytesWriter {
        const sender: Address = Blockchain.tx.sender;
        this.requireOwner(sender);

        const newOwnerStr = calldata.readStringWithLength();
        if (newOwnerStr.length == 0) {
            throw new Revert('New owner is empty');
        }

        const previousOwner = this._owner.value;
        this._owner.value = newOwnerStr;
        this.emitEvent(new OwnershipTransferredEvent(previousOwner, newOwnerStr));

        const writer = new BytesWriter(4 + previousOwner.length + 4 + newOwnerStr.length);
        writer.writeStringWithLength(previousOwner);
        writer.writeStringWithLength(newOwnerStr);

        return writer;
    }

    // -------------------------------------------------------------------------
    // Core Factory Functionality
    // -------------------------------------------------------------------------

    /**
     * Register a newly deployed OP_20 token.
     *
     * Off-chain workflow:
     * 1. User deploys an OP_20 token using OP_NET tooling.
     * 2. Wallet/backend calls this method with the final token address and metadata.
     *
     * This function enforces:
     * - Factory not paused.
     * - No reentrancy on state changes.
     *
     * ABI:
     * - name: string
     * - symbol: string
     * - totalSupply: uint256
     * - decimals: uint8
     * - tokenAddress: address
     */
    @method(
        { name: 'name', type: ABIDataTypes.STRING },
        { name: 'symbol', type: ABIDataTypes.STRING },
        { name: 'totalSupply', type: ABIDataTypes.UINT256 },
        { name: 'decimals', type: ABIDataTypes.UINT8 },
        { name: 'tokenAddress', type: ABIDataTypes.ADDRESS },
    )
    @emit('TokenDeployed')
    @returns({
        name: 'token',
        type: ABIDataTypes.ADDRESS,
    })
    public deployToken(calldata: Calldata): BytesWriter {
        this.requireNotPaused();
        this.enterNonReentrant();

        const caller: Address = Blockchain.tx.sender;

        // Decode parameters
        const name = calldata.readStringWithLength();
        const symbol = calldata.readStringWithLength();
        const totalSupply = calldata.readU256();
        const decimals = calldata.readU8();
        const tokenAddress = calldata.readAddress();

        // Validation — on Revert the VM rolls back all state (including reentrancy lock)
        if (name.length == 0) {
            throw new Revert('Token name is empty');
        }

        if (symbol.length == 0) {
            throw new Revert('Token symbol is empty');
        }

        if (name.length > 64) {
            throw new Revert('Token name too long');
        }

        if (symbol.length > 32) {
            throw new Revert('Token symbol too long');
        }

        if (totalSupply.isZero()) {
            throw new Revert('Total supply must be greater than zero');
        }

        // Store deployment record
        const index = this.deploymentCount.value;
        const nextIndex = SafeMath.add(index, u256.One);

        this.deploymentIndexToToken.set(index, this._addressToU256(tokenAddress));
        this.deploymentIndexToOwner.set(index, this._addressToU256(caller));

        this.deploymentCount.set(nextIndex);

        // Emit event for indexers and off-chain consumers
        this.emitEvent(new TokenDeployedEvent(tokenAddress, caller, totalSupply, name, symbol));

        const writer = new BytesWriter(32);
        writer.writeAddress(tokenAddress);

        this.exitNonReentrant();

        return writer;
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    /**
     * Returns the current owner of the factory.
     */
    @view()
    @returns({ name: 'owner', type: ABIDataTypes.STRING })
    public owner(_calldata: Calldata): BytesWriter {
        const val = this._owner.value;
        const writer = new BytesWriter(4 + val.length);
        writer.writeStringWithLength(val);
        return writer;
    }

    /**
     * Returns whether the factory is paused.
     */
    @view()
    @returns({ name: 'paused', type: ABIDataTypes.BOOL })
    public isPaused(_calldata: Calldata): BytesWriter {
        const writer = new BytesWriter(1);
        writer.writeBoolean(this._paused.value);
        return writer;
    }

    /**
     * Returns the number of registered OP_20 token deployments.
     */
    @view()
    @returns({ name: 'count', type: ABIDataTypes.UINT256 })
    public getDeploymentCount(_calldata: Calldata): BytesWriter {
        const writer = new BytesWriter(32);
        writer.writeU256(this.deploymentCount.value);
        return writer;
    }

    /**
     * Returns the list of all deployed token addresses.
     *
     * NOTE:
     * - For large registries this can be expensive; frontends are encouraged to
     *   paginate via `getDeploymentCount` + per-index lookups instead.
     */
    @view()
    @returns({ name: 'tokens', type: ABIDataTypes.ARRAY_OF_ADDRESSES })
    public getDeployedTokens(_calldata: Calldata): BytesWriter {
        const count: u256 = this.deploymentCount.value;
        const total = count.toU32(); // Factory is not expected to host >2^32 tokens.

        // 4 bytes for count + 32 bytes per address
        const writer = new BytesWriter(4 + total * 32);
        writer.writeU32(total);

        for (let i: u32 = 0; i < total; i++) {
            const key = u256.fromU32(i);
            const tokenAsU256 = this.deploymentIndexToToken.get(key);

            if (tokenAsU256.isZero()) {
                // Sparse slot safety: encode zero address for missing entries.
                writer.writeAddress(Address.zero());
            } else {
                const tokenAddress = this._u256ToAddress(tokenAsU256);
                writer.writeAddress(tokenAddress);
            }
        }

        return writer;
    }

    /**
     * Returns the token address and owner for a specific deployment index.
     */
    @view(
        {
            name: 'index',
            type: ABIDataTypes.UINT256,
        },
    )
    @returns({ name: 'token', type: ABIDataTypes.ADDRESS })
    public getDeploymentByIndex(calldata: Calldata): BytesWriter {
        const index = calldata.readU256();

        if (index.isZero() && this.deploymentCount.value.isZero()) {
            throw new Revert('No deployments');
        }

        if (u256.ge(index, this.deploymentCount.value)) {
            throw new Revert('Index out of bounds');
        }

        const tokenAsU256 = this.deploymentIndexToToken.get(index);
        const ownerAsU256 = this.deploymentIndexToOwner.get(index);

        const tokenAddress = this._u256ToAddress(tokenAsU256);
        const ownerAddress = this._u256ToAddress(ownerAsU256);

        const writer = new BytesWriter(64);
        writer.writeAddress(tokenAddress);
        writer.writeAddress(ownerAddress);

        return writer;
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Convert Address to u256 for storage.
     */
    protected _addressToU256(addr: Address): u256 {
        return u256.fromUint8ArrayBE(addr);
    }

    /**
     * Convert u256 to Address.
     */
    protected _u256ToAddress(val: u256): Address {
        if (val.isZero()) {
            return Address.zero();
        }

        const bytes = val.toUint8Array(true);
        return Address.fromUint8Array(bytes);
    }
}

