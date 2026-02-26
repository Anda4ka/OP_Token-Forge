import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------
export type PausedEvent = {};
export type UnpausedEvent = {};
export type OwnershipTransferredEvent = {
    readonly previousOwner: string;
    readonly newOwner: string;
};
export type TokenDeployedEvent = {
    readonly token: Address;
    readonly owner: Address;
    readonly totalSupply: bigint;
    readonly name: string;
    readonly symbol: string;
};

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the pause function call.
 */
export type Pause = CallResult<{}, OPNetEvent<PausedEvent>[]>;

/**
 * @description Represents the result of the unpause function call.
 */
export type Unpause = CallResult<{}, OPNetEvent<UnpausedEvent>[]>;

/**
 * @description Represents the result of the transferOwnership function call.
 */
export type TransferOwnership = CallResult<{}, OPNetEvent<OwnershipTransferredEvent>[]>;

/**
 * @description Represents the result of the deployToken function call.
 */
export type DeployToken = CallResult<
    {
        token: Address;
    },
    OPNetEvent<TokenDeployedEvent>[]
>;

/**
 * @description Represents the result of the owner function call.
 */
export type Owner = CallResult<
    {
        owner: string;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the isPaused function call.
 */
export type IsPaused = CallResult<
    {
        paused: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getDeploymentCount function call.
 */
export type GetDeploymentCount = CallResult<
    {
        count: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getDeployedTokens function call.
 */
export type GetDeployedTokens = CallResult<
    {
        tokens: Address[];
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getDeploymentByIndex function call.
 */
export type GetDeploymentByIndex = CallResult<
    {
        token: Address;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// IVibeTokenFactory
// ------------------------------------------------------------------
export interface IVibeTokenFactory extends IOP_NETContract {
    pause(): Promise<Pause>;
    unpause(): Promise<Unpause>;
    transferOwnership(newOwner: string): Promise<TransferOwnership>;
    deployToken(
        name: string,
        symbol: string,
        totalSupply: bigint,
        decimals: number,
        tokenAddress: Address,
    ): Promise<DeployToken>;
    owner(): Promise<Owner>;
    isPaused(): Promise<IsPaused>;
    getDeploymentCount(): Promise<GetDeploymentCount>;
    getDeployedTokens(): Promise<GetDeployedTokens>;
    getDeploymentByIndex(): Promise<GetDeploymentByIndex>;
}
