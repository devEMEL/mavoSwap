"use client";

import { useState, useEffect, useMemo } from 'react';
import { ArrowDown, Copy, Check, Loader2, Cpu, Sparkles } from 'lucide-react';
import TokenSelector, { Token } from '@/components/TokenSelector';
import Toast from '@/components/Toast';
import SwapConfirmationModal from '@/components/SwapConfirmationModal';
import { TOKENS } from '@/config/tokens';
import { useAccount, useGasPrice } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useTokenBalance } from '@/hooks/shared/useTokenBalance';
import { useTokenMetadata } from '@/hooks/shared/useTokenMetadata';
import { fetchSubgraph, GET_POOLS, SUBGRAPH_ENDPOINT } from '@/lib/queries';
import { useSwapQuote } from '@/hooks/swap/useSwapQuote';
import { useSwap } from '@/hooks/swap/useSwap';
import { ethers } from 'ethers';
import { useSearchParams } from 'react-router-dom';

interface SubgraphPool {
  id: string;
  token0: { id: string; symbol: string; name: string; decimals: string; derivedUSDC: string };
  token1: { id: string; symbol: string; name: string; decimals: string; derivedUSDC: string };
  feeTier: string;
  tickSpacing: string;
  hooks: string;
  liquidity: string;
  sqrtPrice: string;
  totalValueLockedUSD: string;
}

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const { data: gasPrice } = useGasPrice();
  const { open } = useAppKit();

  const [slippage, setSlippage] = useState('0.5');
  const [isAutoSlippage, setIsAutoSlippage] = useState(true);
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const [fromToken, setFromToken] = useState<Token | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      if (from) {
        const found = TOKENS.find(t => t.address.toLowerCase() === from.toLowerCase());
        if (found) return found;
        return { address: from as `0x${string}`, name: 'Loading...', symbol: '...', decimals: 18, logo: '' };
      }
    }
    return TOKENS[0];
  });

  const [toToken, setToToken] = useState<Token | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const to = params.get('to');
      if (to) {
        const found = TOKENS.find(t => t.address.toLowerCase() === to.toLowerCase());
        if (found) return found;
        return { address: to as `0x${string}`, name: 'Loading...', symbol: '...', decimals: 18, logo: '' };
      }
    }
    return TOKENS[1];
  });

  const fromTokenAddress = fromToken?.address || '';
  const toTokenAddress = toToken?.address || '';

  const { metadata: fromMetadata } = useTokenMetadata(
    fromToken && !TOKENS.find(t => t.address.toLowerCase() === fromToken.address.toLowerCase()) ? fromTokenAddress : undefined
  );
  const { metadata: toMetadata } = useTokenMetadata(
    toToken && !TOKENS.find(t => t.address.toLowerCase() === toToken.address.toLowerCase()) ? toTokenAddress : undefined
  );

  useEffect(() => {
    if (fromMetadata && fromToken && !TOKENS.find(t => t.address.toLowerCase() === fromToken.address.toLowerCase())) {
      if (fromToken.name !== fromMetadata.name || fromToken.symbol !== fromMetadata.symbol || fromToken.decimals !== fromMetadata.decimals) {
        setFromToken(prev => prev ? { ...prev, name: fromMetadata.name, symbol: fromMetadata.symbol, decimals: fromMetadata.decimals } : prev);
      }
    }
  }, [fromMetadata, fromToken]);

  useEffect(() => {
    if (toMetadata && toToken && !TOKENS.find(t => t.address.toLowerCase() === toToken.address.toLowerCase())) {
      if (toToken.name !== toMetadata.name || toToken.symbol !== toMetadata.symbol || toToken.decimals !== toMetadata.decimals) {
        setToToken(prev => prev ? { ...prev, name: toMetadata.name, symbol: toMetadata.symbol, decimals: toMetadata.decimals } : prev);
      }
    }
  }, [toMetadata, toToken]);

  useEffect(() => {
    if (fromParam) {
      const found = TOKENS.find(t => t.address.toLowerCase() === fromParam.toLowerCase());
      if (found) {
        setFromToken(found);
      } else if (fromParam === 'NATIVE') {
        setFromToken(TOKENS.find(t => t.address === '0x0000000000000000000000000000000000000000') || null);
      } else {
        setFromToken({ address: fromParam as `0x${string}`, name: 'Loading...', symbol: '...', decimals: 18, logo: '' });
      }
    }
    if (toParam) {
      const found = TOKENS.find(t => t.address.toLowerCase() === toParam.toLowerCase());
      if (found) {
        setToToken(found);
      } else if (toParam === 'NATIVE') {
        setToToken(TOKENS.find(t => t.address === '0x0000000000000000000000000000000000000000') || null);
      } else {
        setToToken({ address: toParam as `0x${string}`, name: 'Loading...', symbol: '...', decimals: 18, logo: '' });
      }
    }
  }, [fromParam, toParam]);

  // Pool lookup state
  const [allPools, setAllPools] = useState<SubgraphPool[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isExactInput, setIsExactInput] = useState(true);

  const { formattedBalance: fromBalance } = useTokenBalance({ token: fromToken ?? undefined, address });
  const { formattedBalance: toBalance } = useTokenBalance({ token: toToken ?? undefined, address });

  // Fetch all pools once on mount
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setPoolsLoading(true);
        const res = await fetchSubgraph<{ pools: SubgraphPool[] }>(GET_POOLS);
        setAllPools(res.pools || []);
      } catch (e) {
        console.error('Failed to fetch pools:', e);
      } finally {
        setPoolsLoading(false);
      }
    };
    fetchPools();
  }, []);

  // Compute pool ID from pool key
  const computePoolId = (pool: SubgraphPool) => {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint24", "int24", "address"],
      [
        pool.token0.id,
        pool.token1.id,
        parseInt(pool.feeTier),
        parseInt(pool.tickSpacing),
        pool.hooks,
      ]
    );
    return ethers.keccak256(encoded);
  };

  // Filter pools to those containing both selected tokens
  const matchingPools = useMemo(() => {
    if (!fromToken || !toToken) return [];
    const fromAddr = fromToken.address.toLowerCase();
    const toAddr = toToken.address.toLowerCase();

    return allPools
      .filter((pool) => {
        const t0 = pool.token0.id.toLowerCase();
        const t1 = pool.token1.id.toLowerCase();
        return (
          (t0 === fromAddr && t1 === toAddr) ||
          (t0 === toAddr && t1 === fromAddr)
        );
      })
      .map((pool) => ({
        ...pool,
        computedId: computePoolId(pool),
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toToken, allPools]);

  // Auto-select first matching pool (or clear selection)
  useEffect(() => {
    if (matchingPools.length > 0) {
      // Keep current selection if still valid
      const stillValid = matchingPools.some((p) => p.computedId === selectedPoolId);
      if (!stillValid) {
        setSelectedPoolId(matchingPools[0].computedId);
      }
    } else {
      setSelectedPoolId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingPools]);

  const selectedPool = useMemo(() => {
    return matchingPools.find(p => p.computedId === selectedPoolId) || null;
  }, [matchingPools, selectedPoolId]);

  const effectiveFromToken = fromToken || { address: (fromParam || '0x0000000000000000000000000000000000000000') as `0x${string}`, name: 'Unknown', symbol: '???', decimals: 18, logo: '' };
  const effectiveToToken = toToken || { address: (toParam || '0x0000000000000000000000000000000000000000') as `0x${string}`, name: 'Unknown', symbol: '???', decimals: 18, logo: '' };

  // Swap Quote Hook integration
  const {
    inputAmount,
    outputAmount,
    gas,
    isLoading: quoteLoading,
    error: quoteError,
    onInputChange,
    onOutputChange,
    setInputAmount,
    setOutputAmount,
    retriggerQuote,
  } = useSwapQuote({
    token0: effectiveFromToken,
    token1: effectiveToToken,
    poolFee: selectedPool ? parseInt(selectedPool.feeTier) : 3000,
    tickSpacing: selectedPool ? parseInt(selectedPool.tickSpacing) : 60,
    hooksAddress: selectedPool ? selectedPool.hooks : '0x0000000000000000000000000000000000000000',
    sqrtPriceX96: selectedPool ? selectedPool.sqrtPrice : '0',
  });

  // Re-quote when token decimals resolve/change (e.g. unknown token metadata loaded).
  useEffect(() => {
    retriggerQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveFromToken.decimals, effectiveToToken.decimals]);

  // Swap transaction hook
  const {
    executeSwap,
    toast: swapToast,
    dismissToast: dismissSwapToast,
    isSwapping,
    txnGas,
    clearTxnGas
  } = useSwap();

  // Load initial quote of '1' once selected pool is resolved
  useEffect(() => {
    if (selectedPoolId && !inputAmount) {
      onInputChange('1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoolId]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedHookAddress, setCopiedHookAddress] = useState(false);

  const truncateId = (id: string) => `${id.slice(0, 10)}…${id.slice(-6)}`;

  const handleCopyPoolId = (e: React.MouseEvent, fullId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullId);
    setCopiedId(fullId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyHookAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedHookAddress(true);
    setTimeout(() => setCopiedHookAddress(false), 1500);
  };

  const handleSwapClick = () => {
    if (!inputAmount || Number(inputAmount) <= 0) return;
    if (!outputAmount || Number(outputAmount) <= 0 || quoteError) return;
    setShowConfirmModal(true);
  };

  const handleFlipTokens = () => {
    const prevFrom = fromToken;
    const prevTo = toToken;
    const prevInput = inputAmount;
    const prevOutput = outputAmount;
    setFromToken(prevTo);
    setToToken(prevFrom);
    // Swap amounts and keep direction: exact input stays exact input
    setInputAmount(prevOutput);
    setOutputAmount(prevInput);
    setIsExactInput(true);
  };

  const handleConfirmSwap = async () => {
    if (!selectedPool) return;
    if (!fromToken || !toToken) return;

    const parsedSlippage = parseFloat(slippage);
    const finalSlippage = parsedSlippage > 0 ? parsedSlippage : 0.5;
    await executeSwap({
      fromToken,
      toToken,
      poolFee: parseInt(selectedPool.feeTier),
      tickSpacing: parseInt(selectedPool.tickSpacing),
      hooksAddress: selectedPool.hooks,
      amountIn: inputAmount,
      amountOut: outputAmount,
      slippagePct: finalSlippage,
      isExactInput,
    });
    setShowConfirmModal(false);
    clearTxnGas();


  };

  const formatGasFee = (gasBigint: bigint | null) => {
    if (!gasBigint) return '$0.00';
    const currentGasPrice = gasPrice ?? 20000000000n; // default to 20 gwei in wei

    const totalWei = gasBigint * currentGasPrice;
    const nativeAmount = Number(totalWei) / 1e18;
    console.log("current gasfee:", nativeAmount.toFixed(4))
    // Native token is USDC on Arc, so 1 Native Token = $1.00 USD
    return `$${nativeAmount.toFixed(4)}`;
  };

  const rateText = useMemo(() => {
    if (!inputAmount || !outputAmount || Number(inputAmount) === 0) return '';
    const rate = Number(outputAmount) / Number(inputAmount);
    return `1 ${effectiveFromToken.symbol} = ${rate.toFixed(4)} ${effectiveToToken.symbol}`;
  }, [inputAmount, outputAmount, effectiveFromToken, effectiveToToken]);

  const reverseRateText = useMemo(() => {
    if (!inputAmount || !outputAmount || Number(outputAmount) === 0) return '';
    const rate = Number(inputAmount) / Number(outputAmount);
    return `1 ${effectiveToToken.symbol} = ${rate.toFixed(4)} ${effectiveFromToken.symbol}`;
  }, [inputAmount, outputAmount, effectiveFromToken, effectiveToToken]);



  return (
    <div className="flex-grow flex items-center justify-center pb-40 relative w-full">
      {/* Background Glows */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-20 w-72 h-72 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[480px] mx-auto">

        {/* No pool found warning */}
        {!poolsLoading && matchingPools.length === 0 && (
          <div className="mb-3 px-4 py-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span className="text-[11px] uppercase tracking-widest text-red-400/80">No pool found for this pair</span>
          </div>
        )}

        {/* Main Swap Card */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#0c0c0c] shadow-2xl overflow-hidden">

          {/* Card Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-[13px] font-semibold text-white/70 tracking-wide">Swap</span>
            {poolsLoading && (
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 border border-primary/40 border-t-primary rounded-full animate-spin" />
                <span className="text-[10px] text-white/20 uppercase tracking-widest">Finding pools</span>
              </div>
            )}
            {rateText && !poolsLoading && (
              <span className="text-[11px] text-white/30 font-mono">{rateText}</span>
            )}
          </div>

          <div className="px-3 pb-3 space-y-1">

            {/* From Token Box */}
            <div className="bg-white/[0.04] hover:bg-white/[0.05] transition-all duration-200 rounded-2xl px-4 pt-4 pb-5 border border-white/[0.04] hover:border-white/[0.07]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] text-white/25 uppercase tracking-widest font-medium">You pay</span>
                <button
                  onClick={() => { if (fromBalance) onInputChange(fromBalance.replace(/,/g, '')); setIsExactInput(true); }}
                  className="text-[11px] text-white/35 hover:text-primary transition-colors cursor-pointer"
                >
                  balance: <span className="font-mono">{fromBalance}</span> <span className="token-symbol">{effectiveFromToken.symbol}</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputAmount}
                      onChange={(e) => { setIsExactInput(true); onInputChange(e.target.value); }}
                      className={`bg-transparent border-none p-0 text-[32px] leading-none focus:ring-0 focus:outline-none w-full placeholder:text-white/10 font-medium ${
                        isExactInput ? 'text-white' : 'text-white/35'
                      }`}
                      placeholder="0"
                    />
                    {quoteLoading && !isExactInput && (
                      <Loader2 size={16} className="animate-spin text-white/30 shrink-0" />
                    )}
                  </div>
                </div>
                <TokenSelector
                  selectedToken={fromToken}
                  onSelect={setFromToken}
                  tokens={TOKENS}
                  excludeToken={toToken}
                  className="shrink-0"
                />
              </div>
            </div>

            {/* Flip Button */}
            <div className="flex justify-center relative z-10 py-2">
              <button
                onClick={handleFlipTokens}
                className="w-9 h-9 bg-[#0c0c0c] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/30 hover:bg-primary/5 shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <ArrowDown size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* To Token Box */}
            <div className="bg-white/[0.025] hover:bg-white/[0.04] transition-all duration-200 rounded-2xl px-4 pt-4 pb-5 border border-white/[0.04] hover:border-white/[0.07]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] text-white/25 uppercase tracking-widest font-medium">You receive</span>
                <span className="text-[11px] text-white/25 font-mono">
                  balance: {toBalance} <span className="token-symbol">{effectiveToToken.symbol}</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={outputAmount}
                      onChange={(e) => { setIsExactInput(false); onOutputChange(e.target.value); }}
                      className={`bg-transparent border-none p-0 text-[32px] leading-none focus:ring-0 focus:outline-none w-full placeholder:text-white/10 font-medium ${
                        !isExactInput ? 'text-white' : 'text-white/35'
                      }`}
                      placeholder="0"
                    />
                    {quoteLoading && isExactInput && (
                      <Loader2 size={16} className="animate-spin text-white/30 shrink-0" />
                    )}
                  </div>
                </div>
                <TokenSelector
                  selectedToken={toToken}
                  onSelect={setToToken}
                  tokens={TOKENS}
                  excludeToken={fromToken}
                  className="shrink-0"
                />
              </div>
            </div>
          </div>

          {/* Quote Error */}
          {quoteError && (
            <div className="mx-3 mb-3 px-4 py-2.5 bg-red-500/[0.04] border border-red-500/10 text-red-400/80 text-[11px] uppercase tracking-widest text-center rounded-xl">
              {quoteError}
            </div>
          )}

          {/* Swap Button */}
          <div className="px-3 pb-3">
            {!isConnected ? (
              <button
                onClick={() => open()}
                className="w-full py-4 bg-primary text-black text-[15px] tracking-wide font-bold transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer shadow-lg"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={handleSwapClick}
                disabled={quoteLoading || !!quoteError || !inputAmount || Number(inputAmount) <= 0 || !outputAmount || Number(outputAmount) <= 0}
                className="w-full py-4 bg-primary text-black text-[15px] tracking-wide font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-lg"
              >
                {quoteLoading ? 'Getting Quote…' : 'Swap'}
              </button>
            )}
          </div>

          {/* Details Section */}
          {(rateText || isConnected) && (
            <div className="border-t border-white/[0.05]">

              {/* Slippage row */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-[11px] text-white/30 uppercase tracking-widest">Slippage</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.05] p-0.5">
                    {['0.1', '0.5', '1.0'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => { setSlippage(preset); setIsAutoSlippage(preset === '0.5'); }}
                        className={`px-2.5 py-1 text-[12px] font-semibold transition-all cursor-pointer ${
                          slippage === preset && isAutoSlippage === (preset === '0.5')
                            ? 'bg-primary text-black shadow'
                            : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                  <div className={`flex items-center bg-white/[0.03] border px-2.5 py-1 transition-all ${!isAutoSlippage && !['0.1','0.5','1.0'].includes(slippage) ? 'border-primary/40' : 'border-white/[0.05]'}`}>
                    <input
                      type="text"
                      value={slippage}
                      onChange={(e) => { setSlippage(e.target.value); setIsAutoSlippage(false); }}
                      className="bg-transparent border-none p-0 text-[11px] text-white/70 focus:ring-0 focus:outline-none w-6 text-right"
                    />
                    <span className="text-[11px] ml-0.5 text-white/25">%</span>
                  </div>
                </div>
              </div>

              {/* Reverse rate */}
              {reverseRateText && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
                  <span className="text-[11px] text-white/20 uppercase tracking-widest">Rate</span>
                  <span className="text-[11px] text-white/40 font-mono">{reverseRateText}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Swap Confirmation Modal */}
        <SwapConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          fromToken={effectiveFromToken}
          toToken={effectiveToToken}
          amountIn={inputAmount}
          amountOut={outputAmount}
          gasFeeUsd={txnGas || "-"}
          slippagePct={parseFloat(slippage) > 0 ? parseFloat(slippage) : 0.5}
          rateText={rateText}
          onConfirm={handleConfirmSwap}
          isSwapping={isSwapping}
          userAddress={address}
        />

        {/* Toast Notification Layer */}
        {swapToast.show && (
          <div className="fixed top-15 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
            <Toast
              type={swapToast.type}
              title={swapToast.title}
              message={swapToast.message}
              txHash={swapToast.txHash}
              onClose={dismissSwapToast}
            />
          </div>
        )}
      </div>
    </div>
  );
}
