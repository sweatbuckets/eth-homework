'use client';

// ============================================================
// WalletConnect 컴포넌트
// ============================================================
// RainbowKit의 ConnectButton과 wagmi의 useAccount를 활용하여
// 지갑 연결 UI를 제공합니다.

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { ContractReader } from './ContractReader'; // 이미 만든 상태 읽기 컴포넌트
import { ContractWriter } from './ContractWriter'; // 함수 호출 컴포넌트
import { EventListener } from './EventListener';   // 이벤트 리스너 컴포넌트
import { AccountTransactionHistory } from './AccountTransactionHistory';
import { TokenBalance } from './TokenBalance';  // ERC20 토큰 잔액 표시 컴포넌트
import { EthTransfer } from './EthTransfer';


export function WalletConnect() {
  const [txToast, setTxToast] = useState<{ message: string; color: string } | null>(null);
  // ============================================================
  // useAccount Hook
  // ============================================================
  // 연결된 지갑의 정보를 가져옵니다.
  // - address: 지갑 주소 (0x...)
  // - isConnected: 연결 상태 (boolean)
  // - isConnecting: 연결 중 상태 (boolean)
  // - isDisconnected: 연결 해제 상태 (boolean)
  const { address, isConnected } = useAccount();

  // ============================================================
  // useBalance Hook
  // ============================================================
  // 지갑의 ETH 잔액을 조회합니다.
  // - data: { formatted, symbol, decimals, value }
  // - isLoading: 로딩 상태
  // - isError: 에러 상태
  //
  // enabled 옵션: isConnected가 true일 때만 쿼리 실행
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    query: {
      enabled: isConnected,
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          mounted,
          openAccountModal,
          openChainModal,
          openConnectModal,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          if (!connected) {
            return (
              <button
                type="button"
                onClick={openConnectModal}
                className="w-fit rounded-full bg-gradient-to-r from-slate-950 to-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.28)]"
              >
                지갑 연결
              </button>
            );
          }

          return (
            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openChainModal}
                  className={`rounded-full border px-3 py-2 text-sm font-medium ${
                    chain.id === sepolia.id
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-300 bg-red-50 text-red-700'
                  }`}
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <span className="mr-2 inline-flex h-4 w-4 overflow-hidden rounded-full align-middle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={chain.iconUrl}
                        alt={chain.name ?? 'Chain icon'}
                        className="h-full w-full object-cover"
                      />
                    </span>
                  )}
                  {chain.name}
                </button>

                <button
                  type="button"
                  onClick={openAccountModal}
                  className="max-w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-slate-800"
                >
                  <span className="block max-w-full break-all text-left">
                    {account.address}
                  </span>
                </button>
              </div>

              {chain.id !== sepolia.id && (
                <p className="text-sm text-red-600">
                  현재 {chain.name}에 연결되어 있습니다. Sepolia로 전환하세요.
                </p>
              )}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {isConnected && (
        <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <div className="mb-5 grid gap-4 rounded-[1.5rem] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-white md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                Connected Wallet
              </p>
              <p className="mt-3 break-all text-sm font-medium text-slate-100">
                {address}
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                Sepolia Balance
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-white">
                {isBalanceLoading
                  ? '...'
                  : `${Number(balance?.formatted ?? '0').toFixed(4)} ${balance?.symbol ?? 'ETH'}`
                }
              </p>
            </div>
          </div>

          {/* ETH 전송 */}
          <EthTransfer />

          {/* 계정 기준 트랜잭션 히스토리 */}
          <AccountTransactionHistory account={address} />

          {/* 컨트랙트 상태 읽기/쓰기 */}
          <ContractReader
            status={<ContractWriter statusOnly onToastChange={setTxToast} />}
            toast={txToast}
            actions={<ContractWriter embedded onToastChange={setTxToast} />}
          />

          {/* 트랜잭션 히스토리 표시(이벤트 히스토리) */}
          <EventListener />

          {/* ERC20 토큰 잔액 */}
          <TokenBalance account={address} />

          {/* ============================================================
              TODO: 추가 기능 구현
              ============================================================
              - 컨트랙트 상태 읽기 (useReadContract)
              - 컨트랙트 함수 호출 (useWriteContract)
              - 트랜잭션 히스토리 표시
              - 토큰 잔액 표시 (ERC20)
              ============================================================ */}
        </div>
      )}
    </div>
  );
}
