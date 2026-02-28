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
    <li className="border-b py-2 text-sm">
      <p className="font-medium">{token.name}</p>
      <p className="text-gray-600 break-all">{token.address}</p>
      {isLoading && <p>로딩 중...</p>}
      {isError && <p className="text-red-600">조회 실패</p>}
      {!isLoading && !isError && (
        <p>
          {formattedBalance} {token.symbol}
        </p>
      )}
    </li>
  );
}

export function TokenBalance({ account }: TokenBalanceProps) {
  return (
    <div className="p-4 bg-gray-100 rounded mb-4">
      <h2 className="font-medium">주요 ERC20 잔액 (Ethereum Mainnet)</h2>
      {!account && <p className="text-sm text-gray-600">지갑을 연결하면 잔액을 조회합니다.</p>}
      <ul className="space-y-1 mt-2">
        {TOP_TOKENS.map(token => (
          <TokenBalanceRow key={token.address} account={account} token={token} />
        ))}
      </ul>
    </div>
  );
}
