'use client';

import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import type { Address } from 'viem';

interface EtherscanTx {
  blockNumber: string;
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  isError: string;
}

interface AccountTransactionHistoryProps {
  account?: Address;
}

export function AccountTransactionHistory({ account }: AccountTransactionHistoryProps) {
  const [items, setItems] = useState<EtherscanTx[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;

    let ignore = false;

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/transactions?address=${account}`, {
          cache: 'no-store',
        });

        const rawBody = await response.text();
        let data: { items?: EtherscanTx[]; error?: string };

        try {
          data = JSON.parse(rawBody) as { items?: EtherscanTx[]; error?: string };
        } catch {
          throw new Error('서버가 JSON이 아닌 응답을 반환했습니다.');
        }

        if (!response.ok) {
          throw new Error(data.error || '트랜잭션 히스토리를 불러오지 못했습니다.');
        }

        if (!ignore) {
          setItems(data.items ?? []);
        }
      } catch (fetchError) {
        if (!ignore) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : '트랜잭션 히스토리를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      ignore = true;
    };
  }, [account]);

  return (
    <div className="mb-4 overflow-hidden rounded-[1.5rem] border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5 shadow-[0_16px_40px_rgba(59,130,246,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
        Account Activity
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
        계정 트랜잭션 히스토리
      </h2>
      <p className="mt-2 text-sm text-slate-600">Sepolia · Etherscan API 기준 최근 10건</p>

      {isLoading && <p className="mt-4 text-sm text-slate-600">불러오는 중...</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {!isLoading && !error && items.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">표시할 트랜잭션이 없습니다.</p>
      )}

      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          const isSent = item.from.toLowerCase() === account?.toLowerCase();
          const value = formatEther(BigInt(item.value));
          const timestamp = new Date(Number(item.timeStamp) * 1000).toLocaleString();

          return (
            <li
              key={item.hash}
              className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isSent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {isSent ? '보냄' : '받음'}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.isError === '0' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.isError === '0' ? '성공' : '실패'}
                </span>
                <p className="text-base font-bold text-slate-900">{value} ETH</p>
              </div>

              <p className="mt-3 break-all text-slate-600">
                상대 주소: {isSent ? item.to : item.from}
              </p>
              <p className="mt-1 text-slate-500">{timestamp}</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${item.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block break-all text-sm font-medium text-sky-700 underline underline-offset-4"
              >
                {item.hash}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
