'use client';

import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { formatUnits } from 'viem';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
] as const;

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  address: Address;
}

const TOP_TOKENS: TokenInfo[] = [
  { name: 'Tether USD', symbol: 'USDT', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { name: 'USD Coin', symbol: 'USDC', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
];

interface TokenBalanceProps {
  account?: Address;
}

interface TokenBalanceRowProps {
  account?: Address;
  token: TokenInfo;
}

function TokenBalanceRow({ account, token }: TokenBalanceRowProps) {
  const [rawBalance, setRawBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!account) return;

    const client = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        const balance = await client.readContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [account],
        });
        setRawBalance(balance);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [account, token.address]);

  const formattedBalance = formatUnits(rawBalance, token.decimals);

  return (
    <li className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{token.name}</p>
        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">
          {token.symbol}
        </span>
      </div>
      <p className="mt-2 break-all text-slate-500">{token.address}</p>
      {isLoading && <p className="mt-3 text-slate-600">로딩 중...</p>}
      {isError && <p className="mt-3 text-red-600">조회 실패</p>}
      {!isLoading && !isError && (
        <p className="mt-3 text-base font-bold text-slate-900">
          {formattedBalance} {token.symbol}
        </p>
      )}
    </li>
  );
}

export function TokenBalance({ account }: TokenBalanceProps) {
  return (
    <div className="mb-4 overflow-hidden rounded-[1.5rem] border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-5 shadow-[0_16px_40px_rgba(6,182,212,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
        Token Snapshot
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
        주요 ERC20 잔액
      </h2>
      <p className="mt-2 text-sm text-slate-600">Ethereum Mainnet 기준</p>
      {!account && <p className="mt-3 text-sm text-slate-600">지갑을 연결하면 잔액을 조회합니다.</p>}
      <ul className="mt-4 space-y-3">
        {TOP_TOKENS.map(token => (
          <TokenBalanceRow key={token.address} account={account} token={token} />
        ))}
      </ul>
    </div>
  );
}
