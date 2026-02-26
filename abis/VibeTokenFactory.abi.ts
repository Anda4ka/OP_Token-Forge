import { ABIDataTypes, BitcoinAbiTypes, OP_NET_ABI } from 'opnet';

export const VibeTokenFactoryEvents = [
    {
        name: 'Paused',
        values: [],
        type: BitcoinAbiTypes.Event,
    },
    {
        name: 'Unpaused',
        values: [],
        type: BitcoinAbiTypes.Event,
    },
    {
        name: 'OwnershipTransferred',
        values: [
            { name: 'previousOwner', type: ABIDataTypes.STRING },
            { name: 'newOwner', type: ABIDataTypes.STRING },
        ],
        type: BitcoinAbiTypes.Event,
    },
    {
        name: 'TokenDeployed',
        values: [
            { name: 'token', type: ABIDataTypes.ADDRESS },
            { name: 'owner', type: ABIDataTypes.ADDRESS },
            { name: 'totalSupply', type: ABIDataTypes.UINT256 },
            { name: 'name', type: ABIDataTypes.STRING },
            { name: 'symbol', type: ABIDataTypes.STRING },
        ],
        type: BitcoinAbiTypes.Event,
    },
];

export const VibeTokenFactoryAbi = [
    {
        name: 'pause',
        inputs: [],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'unpause',
        inputs: [],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'transferOwnership',
        inputs: [{ name: 'newOwner', type: ABIDataTypes.STRING }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'deployToken',
        inputs: [
            { name: 'name', type: ABIDataTypes.STRING },
            { name: 'symbol', type: ABIDataTypes.STRING },
            { name: 'totalSupply', type: ABIDataTypes.UINT256 },
            { name: 'decimals', type: ABIDataTypes.UINT8 },
            { name: 'tokenAddress', type: ABIDataTypes.ADDRESS },
        ],
        outputs: [{ name: 'token', type: ABIDataTypes.ADDRESS }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'owner',
        constant: true,
        inputs: [],
        outputs: [{ name: 'owner', type: ABIDataTypes.STRING }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'isPaused',
        constant: true,
        inputs: [],
        outputs: [{ name: 'paused', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getDeploymentCount',
        constant: true,
        inputs: [],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getDeployedTokens',
        constant: true,
        inputs: [],
        outputs: [{ name: 'tokens', type: ABIDataTypes.ARRAY_OF_ADDRESSES }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getDeploymentByIndex',
        constant: true,
        inputs: [],
        outputs: [{ name: 'token', type: ABIDataTypes.ADDRESS }],
        type: BitcoinAbiTypes.Function,
    },
    ...VibeTokenFactoryEvents,
    ...OP_NET_ABI,
];

export default VibeTokenFactoryAbi;
