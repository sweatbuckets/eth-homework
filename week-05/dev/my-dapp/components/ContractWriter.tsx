'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';

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

interface ContractWriterProps {
  embedded?: boolean;
  statusOnly?: boolean;
  onToastChange?: (toast: ToastState | null) => void;
}

export function ContractWriter({ embedded = false, statusOnly = false, onToastChange }: ContractWriterProps) {
  const { address, isConnected, chainId } = useAccount();
  const prevPendingRef = useRef(false);
  const prevConfirmingRef = useRef(false);
  const prevSuccessRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, color: string) => {
    if (!onToastChange) return;
    onToastChange({ message, color });
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      onToastChange(null);
    }, 2500);
  }, [onToastChange]);

  // increment/decrement 함수 호출(트랜잭션 전송)
  const { writeContract, data: txHash, isPending } = useWriteContract();

  // 트랜잭션 확인
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isPending && !prevPendingRef.current) {
      showToast('지갑에서 서명 요청 중...', '#2563eb');
    }
    if (isConfirming && !prevConfirmingRef.current) {
      showToast('트랜잭션 확인 중...', '#ea580c');
    }
    if (isSuccess && !prevSuccessRef.current) {
      showToast('트랜잭션 성공!', '#16a34a');
    }

    prevPendingRef.current = isPending;
    prevConfirmingRef.current = isConfirming;
    prevSuccessRef.current = isSuccess;
  }, [isPending, isConfirming, isSuccess, showToast]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (statusOnly) {
    return (
      <>
        {isPending && (
          <p className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">pending</p>
        )}
        {isConfirming && (
          <p className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">confirming</p>
        )}
        {isSuccess && (
          <p className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">success</p>
        )}
      </>
    );
  }

  const content = (
    <div className={`flex gap-2 flex-wrap items-center ${embedded ? '' : 'p-4 bg-gray-100 rounded mb-4'}`}>
      <button
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        disabled={isPending || isConfirming || !isConnected || !address || chainId !== sepolia.id}
        onClick={() =>
          writeContract({
            address: CONTRACT_ADDRESS,
            abi: COUNTER_ABI,
            functionName: 'increment',
            account: address,
            chainId: sepolia.id,
          })
        }
      >
        + 증가
      </button>

      <button
        className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
        disabled={isPending || isConfirming || !isConnected || !address || chainId !== sepolia.id}
        onClick={() =>
          writeContract({
            address: CONTRACT_ADDRESS,
            abi: COUNTER_ABI,
            functionName: 'decrement',
            account: address,
            chainId: sepolia.id,
          })
        }
      >
        - 감소
      </button>

      {isConnected && chainId !== sepolia.id && (
        <p className="basis-full text-sm text-rose-600">Sepolia 네트워크에서만 호출 가능합니다.</p>
      )}
    </div>
  );

  return content;
}
