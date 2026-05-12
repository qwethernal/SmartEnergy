export type EleringNpsPoint = {
  periodStart: Date;
  priceEurMwh: number;
};

type EleringNpsResponse = {
  success?: boolean;
  data?: {
    ee?: Array<{ timestamp: number; price: number }>;
  };
};

export async function fetchEleringNpsDay(params: {
  date: string;
  baseUrl: string;
  timeoutMs: number;
}): Promise<EleringNpsPoint[]> {
  const base = new URL(
    params.baseUrl.endsWith('/') ? params.baseUrl : `${params.baseUrl}/`,
  );
  base.pathname = '/api/nps/price';
  base.searchParams.set('date', params.date);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);
  const res = await fetch(base.toString(), { signal: controller.signal });
  clearTimeout(timer);
  if (!res.ok) {
    throw new Error(`Elering HTTP ${res.status}`);
  }
  const body = (await res.json()) as EleringNpsResponse;
  if (!body?.success || !body.data?.ee?.length) {
    throw new Error('Elering response missing ee series');
  }
  return body.data.ee.map((row) => ({
    periodStart: new Date(row.timestamp * 1000),
    priceEurMwh: Number(row.price),
  }));
}
