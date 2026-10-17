import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { botchainMainnet, elysiumTestnet, SUPPORTED_CHAINS, DEFAULT_CHAIN, getChainById, getExplorerUrl } from '@/lib/chains';
import { getContracts, ChainContracts } from '@/lib/constants';
import { getTokens, TokenConfig } from '@/config/tokens';
import { getSubgraphEndpoint } from '@/lib/queries';

export interface ActiveChainContextValue {
  chainId: number;
  activeChain: typeof botchainMainnet | typeof elysiumTestnet;
  isSupported: boolean;
  contracts: ChainContracts;
  tokens: TokenConfig[];
  subgraphEndpoint: string;
  explorerUrl: string;
  supportedChains: typeof SUPPORTED_CHAINS;
  switchNetwork: (targetChainId: number) => Promise<void>;
  isSwitching: boolean;
}

const ActiveChainContext = createContext<ActiveChainContextValue | null>(null);

const STORAGE_KEY = 'mavo_active_chain_id';

export function ActiveChainProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();

  const [selectedChainId, setSelectedChainId] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (parsed === botchainMainnet.id || parsed === elysiumTestnet.id) {
          return parsed;
        }
      }
    }
    return DEFAULT_CHAIN.id;
  });

  // When wallet connects or changes chain, sync if supported
  useEffect(() => {
    if (isConnected && connectedChainId) {
      if (connectedChainId === botchainMainnet.id || connectedChainId === elysiumTestnet.id) {
        setSelectedChainId(connectedChainId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, String(connectedChainId));
        }
      }
    }
  }, [isConnected, connectedChainId]);

  const activeChainId = useMemo(() => {
    if (isConnected && connectedChainId && (connectedChainId === botchainMainnet.id || connectedChainId === elysiumTestnet.id)) {
      return connectedChainId;
    }
    return selectedChainId;
  }, [isConnected, connectedChainId, selectedChainId]);

  const activeChain = useMemo(() => getChainById(activeChainId), [activeChainId]);
  const isSupported = useMemo(() => activeChainId === botchainMainnet.id || activeChainId === elysiumTestnet.id, [activeChainId]);
  const contracts = useMemo(() => getContracts(activeChainId), [activeChainId]);
  const tokens = useMemo(() => getTokens(activeChainId), [activeChainId]);
  const subgraphEndpoint = useMemo(() => getSubgraphEndpoint(activeChainId), [activeChainId]);
  const explorerUrl = useMemo(() => getExplorerUrl(activeChainId), [activeChainId]);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    setSelectedChainId(targetChainId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(targetChainId));
    }

    if (isConnected && switchChainAsync) {
      try {
        await switchChainAsync({ chainId: targetChainId });
      } catch (err) {
        console.warn('User rejected or failed network switch:', err);
      }
    }
  }, [isConnected, switchChainAsync]);

  const value = useMemo<ActiveChainContextValue>(() => ({
    chainId: activeChainId,
    activeChain,
    isSupported,
    contracts,
    tokens,
    subgraphEndpoint,
    explorerUrl,
    supportedChains: SUPPORTED_CHAINS,
    switchNetwork,
    isSwitching: isPending,
  }), [activeChainId, activeChain, isSupported, contracts, tokens, subgraphEndpoint, explorerUrl, switchNetwork, isPending]);

  return (
    <ActiveChainContext.Provider value={value}>
      {children}
    </ActiveChainContext.Provider>
  );
}

export function useActiveChain(): ActiveChainContextValue {
  const context = useContext(ActiveChainContext);
  if (!context) {
    const fallbackChainId = DEFAULT_CHAIN.id;
    return {
      chainId: fallbackChainId,
      activeChain: DEFAULT_CHAIN,
      isSupported: true,
      contracts: getContracts(fallbackChainId),
      tokens: getTokens(fallbackChainId),
      subgraphEndpoint: getSubgraphEndpoint(fallbackChainId),
      explorerUrl: getExplorerUrl(fallbackChainId),
      supportedChains: SUPPORTED_CHAINS,
      switchNetwork: async () => {},
      isSwitching: false,
    };
  }
  return context;
}
