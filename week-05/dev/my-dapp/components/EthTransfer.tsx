'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { parseEther, isAddress } from 'viem';
import { sepolia } from 'wagmi/chains';
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from 'wagmi';

export function EthTransfer() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    data: hash,
    error: sendError,
    isPending: isSending,
    sendTransaction,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: Boolean(hash),
    },
  });

  const isWrongNetwork = chainId !== sepolia.id;

  const parsedAmount = useMemo(() => {
    if (!amount) return null;

    try {
      return parseEther(amount);
    } catch {
      return null;
    }
  }, [amount]);

  useEffect(() => {
    if (!submitted) return;

    if (sendError) {
      setError(sendError.message);
      setSubmitted(false);
      return;
    }

    if (receiptError) {
      setError(receiptError.message);
      setSubmitted(false);
      return;
    }

    if (hash || isConfirmed) {
      setError(null);
    }
  }, [submitted, sendError, receiptError, hash, isConfirmed]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected) {
      setError('지갑을 먼저 연결하세요.');
      return;
    }

    if (isWrongNetwork) {
      setError('Sepolia 네트워크로 전환한 뒤 다시 시도하세요.');
      return;
    }

    if (!isAddress(recipient)) {
      setError('올바른 받는 주소를 입력하세요.');
      return;
    }

    if (!parsedAmount || parsedAmount <= BigInt(0)) {
      setError('0보다 큰 ETH 금액을 입력하세요.');
      return;
    }

    setError(null);
    setSubmitted(true);

    sendTransaction({
      to: recipient,
      value: parsedAmount,
    });
  };

  const isDisabled =
    !isConnected ||
    isWrongNetwork ||
    isSending ||
    isConfirming ||
    !recipient ||
    !amount;

  return (
    <div className="mb-5 overflow-hidden rounded-[1.5rem] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_16px_40px_rgba(251,146,60,0.12)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          Transfer
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">ETH 전송</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sepolia에서 다른 주소로 테스트 ETH를 전송합니다.
        </p>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor="recipient">
            받는 주소
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value.trim())}
            placeholder="0x..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor="amount">
            전송할 ETH
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.01"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-5 py-4 text-lg font-bold text-white shadow-[0_16px_36px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(249,115,22,0.34)] disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-400"
        >
          {isSending ? '전송 요청 중...' : isConfirming ? '트랜잭션 확인 중...' : '전송'}
        </button>
      </form>

      {isWrongNetwork && (
        <p className="mt-4 text-sm text-amber-700">
          현재 네트워크가 Sepolia가 아닙니다. 네트워크를 전환하세요.
        </p>
      )}

      {error && <p className="mt-4 break-all rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {hash && (
        <p className="mt-4 break-all rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-700">
          트랜잭션 해시: {hash}
        </p>
      )}

      {isConfirmed && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          전송이 완료되었습니다.
        </p>
      )}
    </div>
  );
}
