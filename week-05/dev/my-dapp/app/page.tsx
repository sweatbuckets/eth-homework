import { WalletConnect } from '@/components/WalletConnect';

// ============================================================
// 메인 페이지
// ============================================================
// 이 페이지는 서버 컴포넌트입니다.
// 클라이언트 전용 기능(지갑 연결 등)은 WalletConnect 컴포넌트에서 처리합니다.
export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_#fffaf0_0%,_#f8fafc_42%,_#eef2ff_100%)] px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-amber-200/60 bg-white/80 px-6 py-7 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
            Bay-17th • Week 05
          </p>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Wallet connect, ETH transfer, and onchain activity
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            RainbowKit 커스텀 지갑 연결, Sepolia ETH 전송, 계정 트랜잭션, 카운트 이벤트 정보를 제공하는 dApp
          </p>
        </div>

        <WalletConnect />
      </div>
    </main>
  );
}
