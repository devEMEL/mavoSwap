import { Link, useParams } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, ArrowDownRight, ExternalLink, RefreshCw, Copy, Check, Clock } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { request } from 'graphql-request';
import { GET_POOL_BY_ID, GET_POOL_SWAPS, SUBGRAPH_ENDPOINT } from '../../../lib/queries';
import { TOKENS } from '../../../config/tokens';
import { formatPrice, getDisplayPrice } from '@/utils';
import { createChart, ColorType, LineSeries, LineType } from 'lightweight-charts';
import TokenImage from '../../../components/TokenImage';
import { BLOCK_EXPLORER_URL } from '@/lib/chains';

const getRelativeTime = (timestamp: number) => {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - timestamp);
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getPriceFromSqrt = (sqrtPriceStr: string, token0: any, token1: any) => {
  if (!token0 || !token1 || !sqrtPriceStr) return 0;
  const sqrtPrice = Number(sqrtPriceStr);
  const decimals0 = Number(token0.decimals);
  const decimals1 = Number(token1.decimals);
  
  const t0Price = Math.pow(sqrtPrice / Math.pow(2, 96), 2) * Math.pow(10, decimals0 - decimals1);
  
  const getPriority = (symbol: string) => {
    const sym = symbol.toUpperCase();
    if (sym === 'USDC') return 100;
    if (sym === 'EURC') return 90;
    if (sym === 'MUSDC') return 80;
    if (sym === 'USDT' || sym === 'DAI') return 70;
    if (sym === 'ETH' || sym === 'WETH') return 50;
    return 0;
  };
  
  const p0 = getPriority(token0.symbol);
  const p1 = getPriority(token1.symbol);
  
  if (p0 > p1) {
    return t0Price > 0 ? 1 / t0Price : 0;
  } else {
    return t0Price;
  }
};

export default function PoolDetailsPage() {
  const { id } = useParams();
  const [pool, setPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [swapsPage, setSwapsPage] = useState(0);
  const [swapsLoading, setSwapsLoading] = useState(false);

  const [chartSwaps, setChartSwaps] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyPoolId = () => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    setSwapsPage(0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchPool = async () => {
      try {
        setLoading(true);
        const data: any = await request(SUBGRAPH_ENDPOINT, GET_POOL_BY_ID, { id: id.toLowerCase() });
        setPool(data.pool);
      } catch (error) {
        console.error('Error fetching pool details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPool();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchSwaps = async () => {
      try {
        setSwapsLoading(true);
        const data: any = await request(SUBGRAPH_ENDPOINT, GET_POOL_SWAPS, {
          poolId: id.toLowerCase(),
          first: 11,
          skip: swapsPage * 10
        });
        setSwaps(data.swaps || []);
      } catch (error) {
        console.error('Error fetching swaps:', error);
      } finally {
        setSwapsLoading(false);
      }
    };
    fetchSwaps();
  }, [id, swapsPage]);

  useEffect(() => {
    if (!id) return;
    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        const data: any = await request(SUBGRAPH_ENDPOINT, GET_POOL_SWAPS, {
          poolId: id.toLowerCase(),
          first: 100,
          skip: 0
        });
        setChartSwaps(data.swaps || []);
      } catch (error) {
        console.error('Error fetching chart swaps:', error);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChartData();
  }, [id]);

  const reversedSwaps = [...chartSwaps].reverse();
  const pointsData = reversedSwaps.map((swap: any, idx: number) => {
    const price = getPriceFromSqrt(swap.sqrtPriceX96, pool?.token0, pool?.token1);
    const date = new Date(Number(swap.timestamp) * 1000);
    return {
      price,
      timestamp: Number(swap.timestamp),
      date,
      index: idx
    };
  });

  const currentPriceVal = pool ? getPriceFromSqrt(pool.sqrtPrice || '0', pool.token0, pool.token1) : 0;
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || chartSwaps.length === 0 || !pool) return;

    const container = chartContainerRef.current;
    
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.4)',
        fontFamily: 'Montserrat, Figtree, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: 'rgba(255, 255, 255, 0.4)',
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: 'rgba(255,255,255,0.15)',
          width: 1,
          style: 3,
          labelVisible: false,
        },
        horzLine: {
          color: 'rgba(255,255,255,0.15)',
          width: 1,
          style: 3,
          labelVisible: false,
        },
      },
      handleScale: false,
      handleScroll: false,
      width: container.clientWidth || 500,
      height: container.clientHeight || 160,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#F472B6',
      lineWidth: 1,                 // thin line
      lineType: LineType.Simple,    // straight segments between points = zigzag
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBackgroundColor: '#F472B6',
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: {
        type: 'price',
        precision: 6,
        minMove: 0.000001,
      },
    });

    const chartData: { time: number; value: number }[] = [];
  let lastTime = 0;
  pointsData.forEach((pt) => {
    let currentTime = pt.timestamp;
    if (currentTime <= lastTime) {
      currentTime = lastTime + 1; // times must be strictly ascending
    }
    chartData.push({ time: currentTime, value: pt.price });
    lastTime = currentTime;
  });

  lineSeries.setData(chartData as any);
  chart.timeScale().fitContent();

  chart.subscribeCrosshairMove((param) => {
    if (!param.time) {
      setHoveredPoint(null);
      return;
    }
    const timeVal = Number(param.time);
    const pt = chartData.find((d) => d.time === timeVal);
    if (pt) {
      setHoveredPoint({
        price: pt.value,
        date: new Date(pt.time * 1000),
      });
    } else {
      setHoveredPoint(null);
    }
  });


    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
      chart.timeScale().fitContent();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [chartSwaps, pool]);

  const token0Address = pool?.token0?.id || "0x0000000000000000000000000000000000000000";
  const token1Address = pool?.token1?.id || "0x0000000000000000000000000000000000000000";

  const getCurrencyParam = (address: string) => {
    return (address === "0" || address === "0x0000000000000000000000000000000000000000") ? "NATIVE" : address;
  };



  const formatCurrency = (val: string | number | undefined) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(Number(val));
  };

  const currentDayStart = Math.floor(Date.now() / 1000 / 86400) * 86400;
  const sevenDaysAgo = currentDayStart - 86400 * 7;

  const latestDay = pool?.poolDayData?.[0];
  const isRecent24h = latestDay && Number(latestDay.date) >= currentDayStart - 86400;
  
  const vol24h = isRecent24h ? Number(latestDay.volumeUSD) : 0;
  const fees24h = isRecent24h ? Number(latestDay.feesUSD) : 0;

  const vol7d = pool?.poolDayData?.reduce((acc: number, day: any) => {
    return Number(day.date) >= sevenDaysAgo ? acc + Number(day.volumeUSD) : acc;
  }, 0) || 0;
  const fees7d = pool?.poolDayData?.reduce((acc: number, day: any) => {
    return Number(day.date) >= sevenDaysAgo ? acc + Number(day.feesUSD) : acc;
  }, 0) || 0;

  const feePercent = pool?.feeTier ? (Number(pool.feeTier) / 10000).toFixed(2) + '%' : '0.00%';

  const addLiquidityPath = `/positions/create/currency0=${getCurrencyParam(token0Address)}&currency1=${getCurrencyParam(token1Address)}&fee=${pool?.feeTier || ''}&tickSpacing=${pool?.tickSpacing || ''}&hooks=${pool?.hooks || '0x0000000000000000000000000000000000000000'}&poolId=${id}`;



  return (
    <div className="pb-40 relative z-10 flex flex-col items-center w-full">
      {/* Abstract Background Mesh specific to details */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-6xl h-full opacity-10 pointer-events-none flex justify-center">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full"></div>
      </div>

      <main className="w-full">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              <div className="w-16 h-16 rounded-full border-4 border-black overflow-hidden bg-black flex items-center justify-center relative z-[2]">
                {loading ? (
                  <div className="w-full h-full bg-white/5 animate-pulse" />
                ) : (
                  <TokenImage
                    tokenAddress={token0Address}
                    symbol={pool?.token0?.symbol}
                    className="w-full h-full object-contain"
                    alt={pool?.token0?.symbol || 'token0'}
                  />
                )}
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-black overflow-hidden bg-black flex items-center justify-center relative z-[1]">
                {loading ? (
                  <div className="w-full h-full bg-white/5 animate-pulse" />
                ) : (
                  <TokenImage
                    tokenAddress={token1Address}
                    symbol={pool?.token1?.symbol}
                    className="w-full h-full object-contain"
                    alt={pool?.token1?.symbol || 'token1'}
                  />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                {loading ? (
                  <div className="h-9 w-48 bg-white/5 rounded animate-pulse" />
                ) : (
                  <>
                    <h1 className="text-3xl tracking-tighter text-white">
                      {pool?.token0?.symbol} / {pool?.token1?.symbol}
                    </h1>
                    <span className="bg-white/10 px-3 py-1 text-[12px] text-white/60">{feePercent} Fee</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                {loading ? (
                  <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                ) : (
                  <span className="text-3xl tracking-tighter text-white/60">
                     <span>{getDisplayPrice(pool)}</span>
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-white/20">Pool ID:</span>
                <span className="text-[12px] font-mono text-white/40">
                  {id ? `${id.slice(0, 10)}...${id.slice(-8)}` : 'UNKNOWN'}
                </span>
                {id && (
                  <button
                    onClick={handleCopyPoolId}
                    className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer text-white/40 hover:text-white flex items-center justify-center"
                    title="Copy Pool ID"
                  >
                    {copied ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link 
              to={`/?from=${token0Address}&to=${token1Address}`}
              className="flex-1 md:flex-none border border-white/10 text-white px-8 py-3.5 text-sm tracking-wide font-bold flex items-center justify-center hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              Swap
            </Link>
            <Link
              to={addLiquidityPath}
              className="flex-1 md:flex-none bg-primary text-black px-8 py-3.5 text-sm tracking-wide font-bold transition-all gold-glow hover:brightness-110 active:scale-[0.98] flex items-center justify-center text-center"
            >
              Add Liquidity
            </Link>
          </div>
        </header>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {[
            { label: '24h Volume', val: formatCurrency(vol24h) },
            { label: '7d Volume', val: formatCurrency(vol7d) },
            { label: 'All Time Volume', val: formatCurrency(pool?.volumeUSD) },
            { label: '24h Fees', val: formatCurrency(fees24h) },
            { label: '7d Fees', val: formatCurrency(fees7d) },
            { label: 'All Time Fees', val: formatCurrency(pool?.feesUSD) }
          ].map((m, i) => (
            <div
              key={i}
              className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden bg-white/[0.03] border border-white/[0.07] hover:border-white/15 transition-all duration-300 hover:scale-[1.02]"
            >
              <p className="text-[10px] tracking-[0.18em] text-white/30 leading-tight">{m.label}</p>
              {loading ? (
                <div className="h-7 w-20 bg-white/5 rounded-lg animate-pulse" />
              ) : (
                <p className="text-xl font-semibold tracking-tight leading-none text-white">{m.val}</p>
              )}
            </div>
          ))}
        </div>

        {/* Bento Grid for Analytics */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          {/* Price Chart Module (The Monolith) */}
          <div className="col-span-12 lg:col-span-8 glass-morphism bg-white/[0.01] border border-white/5 p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-white/30">Price History</span>
                  {chartLoading && <RefreshCw size={12} className="text-white/30 animate-spin" />}
                </div>
                <div className="flex bg-black/40 border border-white/5 p-1 rounded-lg">
                  {/* <span className="text-[11px] text-primary px-2 py-0.5">Last 100 Swaps</span> */}
                </div>
              </div>

              {/* Display Hovered or Current Price */}
              <div className="mb-2">
                <p className="text-3xl tracking-tighter text-white">
                  {hoveredPoint ? (
                    `$${hoveredPoint.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                  ) : currentPriceVal ? (
                    `$${currentPriceVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                  ) : (
                    '...'
                  )}
                </p>
                <p className="text-[12px] text-white/40 font-mono mt-1">
                  {hoveredPoint ? (
                    hoveredPoint.date.toLocaleString()
                  ) : (
                    ''
                  )}
                </p>
              </div>
            </div>

            {/* Chart Container */}
            <div className="relative flex-1 min-h-[160px] flex items-end">
              {chartLoading && chartSwaps.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/20 text-[12px] flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-primary" />
                    Loading Chart...
                  </div>
                </div>
              ) : chartSwaps.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/20 text-[12px]">
                    No swap history available
                  </div>
                </div>
              ) : (
                <div ref={chartContainerRef} className="w-full h-full" />
              )}
            </div>
          </div>

          {/* Stats Column */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* TVL Card */}
            <div className="glass-morphism bg-white/[0.01] border border-white/5 p-8 flex flex-col justify-center">
              <p className="text-[12px] text-white/30 mb-2">Total Value Locked</p>
              {loading ? (
                <div className="h-9 w-32 bg-white/5 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-3xl tracking-tighter text-white inline-block">
                  {formatCurrency(pool?.totalValueLockedUSD)}
                </p>
              )}

              {/* Commented out the APR Section as requested */}
              {/*
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-[12px] text-white/30 mb-1">Total APR</p>
                <p className="text-3xl text-primary tracking-tight">24.8%</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(244,114,182,0.5)]"></span>
                <span className="text-[12px] text-white/40">Top 1% of Pools</span>
              </div>
              */}
            </div>

            {/* Pool Balances */}
            <div className="glass-morphism bg-white/[0.01] border border-white/5 p-6 border-l-[3px] border-l-primary">
              <p className="text-[12px] text-white/30 mb-4">Pool Balances</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-white/10 bg-black flex items-center justify-center overflow-hidden">
                      <TokenImage
                        tokenAddress={token0Address}
                        symbol={pool?.token0?.symbol}
                        className="w-full h-full object-contain"
                        alt={pool?.token0?.symbol || 'token0'}
                      />
                    </div>
                    <span className="text-xs text-white">
                      {loading ? '...' : pool?.token0?.symbol}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-white tracking-tight">
                    {loading ? '...' : Number(pool?.totalValueLockedToken0 || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-white/10 bg-black flex items-center justify-center overflow-hidden">
                      <TokenImage
                        tokenAddress={token1Address}
                        symbol={pool?.token1?.symbol}
                        className="w-full h-full object-contain"
                        alt={pool?.token1?.symbol || 'token1'}
                      />
                    </div>
                    <span className="text-xs text-white">
                      {loading ? '...' : pool?.token1?.symbol}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-white tracking-tight">
                    {loading ? '...' : Number(pool?.totalValueLockedToken1 || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Swaps Table - Redesigned to match Profile Activity */}
        <section className="bg-black/50 rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white tracking-tight">Recent Trades</h3>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-mono">
                {swaps.length} trades recorded
              </span>
              {chartLoading && <RefreshCw size={12} className="text-white/30 animate-spin" />}
            </div>
          </div>

          <div className="hidden md:grid grid-cols-[100px_1fr_120px_140px_140px_110px] gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40 border-b border-white/[0.06] bg-[#0a0a0a]">
            <div>Time</div>
            <div>Type</div>
            <div className="text-right">Total USD</div>
            <div className="text-right"><span className="token-symbol">{pool?.token0?.symbol}</span></div>
            <div className="text-right"><span className="token-symbol">{pool?.token1?.symbol}</span></div>
            <div className="text-right">Txn</div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {loading || swapsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[100px_1fr_120px_140px_140px_110px] gap-4 px-6 py-3.5 items-center animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-14" />
                  <div className="h-4 bg-white/5 rounded w-28" />
                  <div className="h-4 bg-white/5 rounded w-16 md:ml-auto" />
                  <div className="h-4 bg-white/5 rounded w-20 md:ml-auto" />
                  <div className="h-4 bg-white/5 rounded w-20 md:ml-auto" />
                  <div className="h-4 bg-white/5 rounded w-16 md:ml-auto" />
                </div>
              ))
            ) : swaps && swaps.length > 0 ? (
              swaps.slice(0, 10).map((row: any) => {
                const isBuy = Number(row.amount0) < 0;
                const relTime = getRelativeTime(Number(row.timestamp));
                const fullTime = new Date(Number(row.timestamp) * 1000).toLocaleString();
                const amt0 = Math.abs(Number(row.amount0));
                const amt1 = Math.abs(Number(row.amount1));

                return (
                  <div 
                    key={row.id} 
                    className="grid grid-cols-1 md:grid-cols-[100px_1fr_120px_140px_140px_110px] gap-3 md:gap-4 px-6 py-3.5 items-center hover:bg-white/[0.035] transition-colors group"
                  >
                    {/* Time */}
                    <div className="flex md:block justify-between items-center text-xs text-white/50 font-mono" title={fullTime}>
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-white/30 font-sans">Time</span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-white/30 hidden md:inline" />
                        {relTime}
                      </span>
                    </div>

                    {/* Type & Direction */}
                    <div className="flex md:block justify-between items-center">
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-white/30 font-sans">Type</span>
                      <div className="flex items-center gap-2">
                        {isBuy ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase">
                            <ArrowUpRight size={13} className="stroke-[2.5]" />
                            buy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-sm bg-rose-500/10 text-rose-400 border border-rose-500/25 uppercase">
                            <ArrowDownRight size={13} className="stroke-[2.5]" />
                            sell
                          </span>
                        )}
                        <span className="text-xs text-white/70 font-medium">
                          {isBuy ? (
                            <span><span className="token-symbol text-white/50">{pool.token1.symbol}</span> → <span className="token-symbol text-emerald-400 font-semibold">{pool.token0.symbol}</span></span>
                          ) : (
                            <span><span className="token-symbol text-white/50">{pool.token0.symbol}</span> → <span className="token-symbol text-rose-400 font-semibold">{pool.token1.symbol}</span></span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Total USD */}
                    <div className="flex md:block justify-between items-center md:text-right">
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-white/30 font-sans">Total USD</span>
                      <span className={`text-sm font-bold font-mono ${isBuy ? 'text-emerald-400' : 'text-white/90'}`}>
                        {formatCurrency(row.amountUSD)}
                      </span>
                    </div>

                    {/* Token 0 Amount */}
                    <div className="flex md:block justify-between items-center md:text-right">
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-white/30 font-sans"><span className="token-symbol">{pool.token0.symbol}</span></span>
                      <span className={`text-xs font-mono font-medium ${isBuy ? 'text-emerald-400' : 'text-rose-400/80'}`}>
                        {isBuy ? '+' : '-'}{amt0.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="token-symbol text-white/40">{pool.token0.symbol}</span>
                      </span>
                    </div>

                    {/* Token 1 Amount */}
                    <div className="flex md:block justify-between items-center md:text-right">
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-white/30 font-sans"><span className="token-symbol">{pool.token1.symbol}</span></span>
                      <span className={`text-xs font-mono font-medium ${!isBuy ? 'text-emerald-400' : 'text-rose-400/80'}`}>
                        {!isBuy ? '+' : '-'}{amt1.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="token-symbol text-white/40">{pool.token1.symbol}</span>
                      </span>
                    </div>

                    {/* Txn Hash */}
                    <div className="flex md:block justify-between items-center md:text-right">
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-white/30 font-sans">Txn</span>
                      <a
                        href={`${BLOCK_EXPLORER_URL}/tx/${row.transaction.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-white/50 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all rounded-sm group/hash"
                      >
                        {row.transaction.id.slice(0, 4)}...{row.transaction.id.slice(-4)}
                        <ExternalLink size={10} className="text-primary/70 shrink-0" />
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-14 text-center text-white/30 text-xs">
                no trades found for this pool
              </div>
            )}
          </div>

          <div className="p-4 bg-white/[0.01] border-t border-white/[0.06] flex items-center justify-between px-6">
            <span className="text-xs text-white/40 font-mono">
              Page {swapsPage + 1}
            </span>
            <div className="flex gap-3">
              <button
                disabled={swapsPage === 0 || swapsLoading}
                onClick={() => setSwapsPage(prev => Math.max(0, prev - 1))}
                className="border border-white/10 text-white px-5 py-2 text-sm font-semibold tracking-wide hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-transparent active:scale-95 cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={swaps.length <= 10 || swapsLoading}
                onClick={() => setSwapsPage(prev => prev + 1)}
                className="border border-white/10 text-white px-5 py-2 text-sm font-semibold tracking-wide hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-transparent active:scale-95 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
