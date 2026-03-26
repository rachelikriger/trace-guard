import type { ElasticClient, ElasticSearchRequest, ElasticSearchResponse } from './elasticClient';

export interface ElasticHttpClientOptions {
  readonly endpoint: string;
  readonly apiKey?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

const trimTrailingSlash = (value: string): string => (value.endsWith('/') ? value.slice(0, -1) : value);

const toHeaders = (options: ElasticHttpClientOptions): Record<string, string> => {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.apiKey !== undefined) {
    headers.authorization = `ApiKey ${options.apiKey}`;
  }

  return headers;
};

export class ElasticHttpClient implements ElasticClient {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;

  public constructor(options: ElasticHttpClientOptions) {
    this.endpoint = trimTrailingSlash(options.endpoint);
    this.headers = toHeaders(options);
  }

  public async search(request: ElasticSearchRequest): Promise<ElasticSearchResponse> {
    const path = `${this.endpoint}/${encodeURIComponent(request.index)}/_search`;
    const response = await fetch(path, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        size: request.size,
        sort: request.sort,
        query: request.query,
        ...(request.searchAfter !== undefined ? { search_after: request.searchAfter } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Elastic search failed with status ${response.status}: ${body}`);
    }

    const parsed = (await response.json()) as unknown;
    const responseRecord = parsed as Partial<ElasticSearchResponse>;
    if (!responseRecord.hits || !Array.isArray(responseRecord.hits.hits)) {
      throw new Error('Elastic search returned an unexpected payload shape.');
    }

    return responseRecord as ElasticSearchResponse;
  }
}
