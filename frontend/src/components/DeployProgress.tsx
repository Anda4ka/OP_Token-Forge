import type { DeployState } from '../services/deploy';

const STEPS = [
    { key: 'deploying_wasm', label: 'Deploy Token Contract' },
    { key: 'waiting_confirmation', label: 'Wait for Confirmation' },
    { key: 'registering', label: 'Register in Factory' },
    { key: 'success', label: 'Complete' },
] as const;

interface DeployProgressProps {
    state: DeployState;
    onSkipWaiting?: () => void;
}

export function DeployProgress({ state, onSkipWaiting }: DeployProgressProps) {
    const currentIndex = STEPS.findIndex((s) => s.key === state.step);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
                {STEPS.map((step, i) => (
                    <div key={step.key} className="flex items-center gap-2 flex-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                                i < currentIndex
                                    ? 'bg-success text-white'
                                    : i === currentIndex
                                      ? 'bg-accent text-white'
                                      : 'bg-surface-lighter text-gray-500'
                            }`}
                        >
                            {i < currentIndex ? '\u2713' : i + 1}
                        </div>
                        {i < STEPS.length - 1 && (
                            <div
                                className={`h-0.5 flex-1 ${
                                    i < currentIndex ? 'bg-success' : 'bg-surface-lighter'
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-surface-light border border-border rounded-xl p-5">
                <p className="text-sm text-gray-400 mb-1">
                    {STEPS[currentIndex]?.label ?? 'Processing'}
                </p>
                <p className="text-white">{state.message}</p>

                {state.step === 'waiting_confirmation' && (
                    <div className="mt-4 space-y-3">
                        {/* Polling spinner */}
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-500">
                                Polling every 10s... (attempt {state.pollAttempts ?? 0}/30)
                            </span>
                        </div>

                        {/* Skip button */}
                        {state.canSkip && onSkipWaiting && (
                            <div className="bg-surface-lighter border border-border rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-2">
                                    OPNet RPC may not detect OP_20 contracts immediately.
                                    If you believe the contract is confirmed (check explorer),
                                    you can skip to registration.
                                </p>
                                <button
                                    onClick={onSkipWaiting}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/20 text-accent-light hover:bg-accent/30 transition-colors"
                                >
                                    Skip Waiting &rarr; Proceed to Registration
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {state.tokenAddress && (
                    <div className="mt-3 flex items-center gap-2">
                        <p className="text-xs text-gray-500 font-mono break-all flex-1">
                            Token: {state.tokenAddress}
                        </p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(state.tokenAddress ?? '');
                            }}
                            className="text-xs text-accent-light hover:text-accent shrink-0"
                            title="Copy address"
                        >
                            Copy
                        </button>
                    </div>
                )}

                {state.txId && (
                    <a
                        href={`https://opscan.org/transactions/${state.txId}?network=op_testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-xs text-accent-light hover:underline inline-block"
                    >
                        View Transaction
                    </a>
                )}

                {state.step === 'error' && state.error && (
                    <p className="mt-2 text-sm text-error">{state.error}</p>
                )}
            </div>
        </div>
    );
}
