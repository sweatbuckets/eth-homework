'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
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
  onToastChange?: (toast: ToastState | null) => void;
}

export function ContractWriter({ onToastChange }: ContractWriterProps) {
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

  // 카운트 조회
  const { refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COUNTER_ABI,
    functionName: 'count',
  });

  // increment/decrement 함수 호출(트랜잭션 전송)
  const { writeContract, data: txHash, isPending } = useWriteContract();

  // 트랜잭션 확인
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isSuccess) return;
    refetch();
  }, [isSuccess, refetch]);

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

  return (
    <div className="p-4 bg-gray-100 rounded mb-4 flex gap-2 flex-wrap items-center">
      <button
        className="px-3 py-1 bg-green-500 text-white rounded"
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
        className="px-3 py-1 bg-red-500 text-white rounded"
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

      {(isPending || isConfirming || isSuccess) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 0,
            borderRadius: 9999,
            width: 'fit-content',
            maxWidth: '100%',
            flexBasis: '100%',
            marginTop: '4px',
          }}
        >
          {isPending && (
            <p
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: 9999,
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              pending
            </p>
          )}
          {isConfirming && (
            <p
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: 9999,
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              confirming
            </p>
          )}
          {isSuccess && (
            <p
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: 9999,
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              success
            </p>
          )}
        </div>
      )}
      {isConnected && chainId !== sepolia.id && <p>Sepolia 네트워크에서만 호출 가능합니다.</p>}
    </div>
  );
}
