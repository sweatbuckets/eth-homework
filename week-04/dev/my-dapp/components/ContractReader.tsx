'use client';

import { useReadContract } from 'wagmi';

export const COUNTER_ABI = [
  { name: 'count', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'increment', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'decrement', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { 
    name: 'CountChanged',
    type: 'event',
    inputs: [{ indexed: false, name: 'newCount', type: 'uint256' }]
  }
] as const;

export const CONTRACT_ADDRESS = '0x67D983de3A40fe1a16172Bab40dF3ec7D0000C9A'; // 배포된 주소

interface ToastState {
  message: string;
  color: string;
}

interface ContractReaderProps {
  toast?: ToastState | null;
}

export function ContractReader({ toast }: ContractReaderProps) {
  const { data: count, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COUNTER_ABI,
    functionName: 'count',
  });

  if (isLoading) return <p>카운트 로딩 중...</p>;
  if (isError) return <p>카운트 조회 중 오류 발생</p>;

  return (
    <div className="p-4 bg-gray-100 rounded mb-4">
      <h2 className="font-medium">현재 카운트</h2>
      <p
        className="text-lg"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
      >
        <span>{count?.toString() ?? '0'}</span>
        {toast && (
          <span
            role="status"
            style={{
              backgroundColor: toast.color,
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: '12px',
              lineHeight: 1.6,
              fontWeight: 600,
            }}
          >
            {toast.message}
          </span>
        )}
      </p>
      <button
        className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
        onClick={() => refetch()}
      >
        새로고침
      </button>
    </div>
  );
}
