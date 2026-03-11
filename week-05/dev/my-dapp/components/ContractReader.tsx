'use client';

import { ReactNode } from 'react';
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
  actions?: ReactNode;
  status?: ReactNode;
  toast?: ToastState | null;
}

export function ContractReader({ actions, status, toast }: ContractReaderProps) {
  const { data: count, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COUNTER_ABI,
    functionName: 'count',
  });

  if (isLoading) return <p>카운트 로딩 중...</p>;
  if (isError) return <p>카운트 조회 중 오류 발생</p>;

  return (
    <div className="mb-4 overflow-hidden rounded-[1.5rem] border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-[0_16px_40px_rgba(139,92,246,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">
        Counter Control
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">현재 카운트</h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-4xl font-black tracking-tight text-slate-900">
          {count?.toString() ?? '0'}
        </span>
        {status}
        {toast && (
          <span
            role="status"
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: toast.color }}
          >
            {toast.message}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          onClick={() => refetch()}
        >
          새로고침
        </button>
        {actions}
      </div>
    </div>
  );
}
