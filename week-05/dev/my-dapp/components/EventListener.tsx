'use client';

import { useEffect, useState } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { parseAbi, parseAbiItem } from 'viem';
import type { Address } from 'viem';
import { sepolia } from 'wagmi/chains';

// ============================================================
// 카운터 컨트랙트 ABI & 주소
// ============================================================
export const COUNTER_ABI = parseAbi([
  'function count() view returns (uint256)',
  'function increment()',
  'function decrement()',
  'event CountChanged(uint256 newCount)'
]);
const COUNT_CHANGED_EVENT = parseAbiItem('event CountChanged(uint256 newCount)');

export const CONTRACT_ADDRESS: Address = '0x67D983de3A40fe1a16172Bab40dF3ec7D0000C9A';

// ============================================================
// 이벤트 아이템 타입
// ============================================================
interface EventItem {
  newCount: number;
  txHash: string;
  timestamp: string;
}

const CHUNK_SIZE = BigInt(500);

// ============================================================
// EventListener 컴포넌트
// ============================================================
export function EventListener() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingPast, setIsLoadingPast] = useState(true);
  const [pastError, setPastError] = useState<string | null>(null);
  const publicClient = usePublicClient({ chainId: sepolia.id });

  // -----------------------------
  // 1️⃣ 과거 이벤트 조회
  // -----------------------------
  useEffect(() => {
    if (!publicClient) return;

    const fetchPastEvents = async () => {
      try {
        setIsLoadingPast(true);
        setPastError(null);
        const latestBlock = await publicClient.getBlockNumber();
        const startBlock = latestBlock > CHUNK_SIZE ? latestBlock - CHUNK_SIZE : BigInt(0);

        const logs = [];
        for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += CHUNK_SIZE + BigInt(1)) {
          const toBlock = fromBlock + CHUNK_SIZE > latestBlock ? latestBlock : fromBlock + CHUNK_SIZE;
          const chunkLogs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: COUNT_CHANGED_EVENT,
            fromBlock,
            toBlock,
          });
          logs.push(...chunkLogs);
        }

        const pastEvents: EventItem[] = logs.map(log => ({
          newCount: Number(log.args?.newCount),
          txHash: log.transactionHash,
          timestamp: new Date().toLocaleTimeString(), // 단순 표시
        }));

        setEvents(pastEvents.reverse()); // 최신순
      } catch (err) {
        console.error('과거 이벤트 조회 실패', err);
        setPastError('과거 이벤트 조회 실패: 배포 블록 또는 RPC 네트워크를 확인하세요.');
      } finally {
        setIsLoadingPast(false);
      }
    };

    fetchPastEvents();
  }, [publicClient]);

  // -----------------------------
  // 2️⃣ 실시간 이벤트 구독
  // -----------------------------
  useWatchContractEvent({
    chainId: sepolia.id,
    address: CONTRACT_ADDRESS,
    abi: COUNTER_ABI,
    eventName: 'CountChanged',
    onLogs(logs) {
      const latestLog = logs[logs.length - 1];
      if (!latestLog) return;

      const newCount = latestLog.args.newCount;
      const txHash = latestLog.transactionHash;
      const timestamp = new Date().toLocaleTimeString();

      setEvents(prev => [{ newCount: Number(newCount), txHash, timestamp }, ...prev]);
    },
  });

  // -----------------------------
  // 3️⃣ UI
  // -----------------------------
  return (
    <div className="mb-4 overflow-hidden rounded-[1.5rem] border border-fuchsia-200/70 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 p-5 shadow-[0_16px_40px_rgba(168,85,247,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-700">
        Counter Activity
      </p>
      <h2 className="mb-2 mt-2 text-2xl font-black tracking-tight text-slate-900">카운트 히스토리</h2>
      {isLoadingPast && <p className="mb-2 text-sm text-slate-600">과거 이벤트 불러오는 중...</p>}
      {pastError && <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{pastError}</p>}
      {!pastError && (
        <p className="mb-3 text-sm text-slate-600">
          최근 500 블록 기준으로 조회 중
        </p>
      )}
      <ul className="space-y-3">
        {events.map((item, idx) => (
          <li
            key={idx}
            className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-xs font-semibold text-fuchsia-700">
                Count Changed
              </span>
              <p className="text-base font-bold text-slate-900">새 카운트: {item.newCount}</p>
            </div>
            <div className="mt-3 break-all text-slate-600">
              Tx:{' '}
              <a
                href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-fuchsia-700 underline underline-offset-4"
              >
                {item.txHash.slice(0, 10)}...
              </a>
            </div>
            <div className="mt-1 text-slate-500">시간: {item.timestamp}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
