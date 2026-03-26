export interface ElasticSearchRequest {
  readonly index: string;
  readonly size: number;
  readonly sort: ReadonlyArray<Record<string, 'asc' | 'desc'>>;
  readonly query: Record<string, unknown>;
  readonly searchAfter?: ReadonlyArray<unknown>;
}

export interface ElasticSearchHit {
  readonly _id: string;
  readonly _source?: unknown;
  readonly sort?: ReadonlyArray<unknown>;
}

export interface ElasticSearchResponse {
  readonly hits: {
    readonly hits: ElasticSearchHit[];
  };
}

export interface ElasticClient {
  search(request: ElasticSearchRequest): Promise<ElasticSearchResponse>;
}
