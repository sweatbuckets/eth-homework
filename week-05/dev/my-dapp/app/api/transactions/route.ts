import { NextRequest, NextResponse } from 'next/server';

const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';
const SEPOLIA_CHAIN_ID = '11155111';

interface EtherscanTx {
  blockNumber: string;
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  isError: string;
}

interface EtherscanResponse {
  status: string;
  message: string;
  result: EtherscanTx[] | string;
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ETHERSCAN_API_KEY가 설정되어 있지 않습니다.' },
      { status: 500 },
    );
  }

  if (!address) {
    return NextResponse.json(
      { error: 'address 쿼리 파라미터가 필요합니다.' },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    chainid: SEPOLIA_CHAIN_ID,
    module: 'account',
    action: 'txlist',
    address,
    startblock: '0',
    endblock: '99999999',
    page: '1',
    offset: '10',
    sort: 'desc',
    apikey: apiKey,
  });

  const response = await fetch(`${ETHERSCAN_API_URL}?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Etherscan API 호출에 실패했습니다.' },
      { status: 502 },
    );
  }

  const rawBody = await response.text();

  let data: EtherscanResponse;

  try {
    data = JSON.parse(rawBody) as EtherscanResponse;
  } catch {
    return NextResponse.json(
      { error: 'Etherscan API가 JSON이 아닌 응답을 반환했습니다.' },
      { status: 502 },
    );
  }

  if (data.status !== '1') {
    const message =
      typeof data.result === 'string' ? data.result : data.message || '트랜잭션을 불러오지 못했습니다.';

    if (message === 'No transactions found') {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    items: Array.isArray(data.result) ? data.result : [],
  });
}
