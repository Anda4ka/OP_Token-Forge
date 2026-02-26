import { useCallback, useRef, useState } from 'react';
import { DeployForm } from '../components/DeployForm';
import { DeployProgress } from '../components/DeployProgress';
import { deployToken, type DeploySignal, type DeployState, type TokenParams } from '../services/deploy';
import { useWallet } from '../hooks/useWallet';

export function DeployPage() {
    const { isConnected } = useWallet();
    const [deployState, setDeployState] = useState<DeployState | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const signalRef = useRef<DeploySignal>({ skipWaiting: false });

    async function handleDeploy(params: TokenParams) {
        setIsDeploying(true);
        signalRef.current = { skipWaiting: false };
        setDeployState({ step: 'deploying_wasm', message: 'Starting deployment...' });

        try {
            await deployToken(params, setDeployState, signalRef.current);
        } catch (err) {
            setDeployState({
                step: 'error',
                message: 'Deployment failed',
                error: (err as Error).message,
            });
        } finally {
            setIsDeploying(false);
        }
    }

    const handleSkipWaiting = useCallback(() => {
        signalRef.current.skipWaiting = true;
    }, []);

    function handleReset() {
        setDeployState(null);
        setIsDeploying(false);
        signalRef.current = { skipWaiting: false };
    }

    return (
        <div className="max-w-lg mx-auto py-12">
            <h1 className="text-3xl font-bold mb-2">Deploy Token</h1>
            <p className="text-gray-400 mb-8">
                Create a new OP_20 token on Bitcoin via OPNet.
            </p>

            {!isConnected && (
                <div className="bg-surface-light border border-warning/30 rounded-xl p-4 mb-6">
                    <p className="text-warning text-sm">
                        Please connect your OP_WALLET to deploy a token.
                    </p>
                </div>
            )}

            {deployState && deployState.step !== 'idle' ? (
                <div>
                    <DeployProgress
                        state={deployState}
                        onSkipWaiting={handleSkipWaiting}
                    />
                    {(deployState.step === 'success' || deployState.step === 'error') && (
                        <button
                            onClick={handleReset}
                            className="mt-6 px-4 py-2 rounded-lg bg-surface-lighter text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Deploy Another Token
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-surface-light border border-border rounded-xl p-6">
                    <DeployForm onSubmit={handleDeploy} disabled={isDeploying} />
                </div>
            )}
        </div>
    );
}
