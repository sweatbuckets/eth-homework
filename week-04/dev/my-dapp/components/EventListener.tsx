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
    <div className="p-4 bg-gray-100 rounded mb-4 text-lg leading-normal">
      <h2 className="font-medium mb-2">트랜잭션 히스토리 (카운트 이벤트)</h2>
      {isLoadingPast && <p className="text-gray-600 mb-2">과거 이벤트 불러오는 중...</p>}
      {pastError && <p className="text-red-600 mb-2">{pastError}</p>}
      {!pastError && (
        <p className="text-gray-600 mb-2">
          최근 500 블록 기준으로 조회 중
        </p>
      )}
      <ul className="space-y-2">
        {events.map((item, idx) => (
          <li key={idx} className="border-b py-2">
            <div className="font-medium">새 카운트: {item.newCount}</div>
            <div className="break-all">
              Tx:{' '}
              <a
                href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {item.txHash.slice(0, 10)}...
              </a>
            </div>
            <div className="text-gray-600">시간: {item.timestamp}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
