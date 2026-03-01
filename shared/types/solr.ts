// Shared Solr type definitions primarily for client composables

export interface SolrSelectBody {
	df: string;
	fq: string[];
	q: string;
	sort: string;
	wt: 'json';
	start: number;
	rows: number;
	facet: boolean;
	'facet.field': string[];
	'facet.mincount': number;
	'facet.limit': number;
	'facet.pivot'?: string | string[];
	fl?: string;
}

export interface SolrResponseHeader {
	status: number;
	QTime: number;
	params: Record<string, string>;
}

/**
 * Typed facet counts from a SOLR response.
 *
 * `facet_fields` maps each faceted field to an alternating array of
 * `[value, count, value, count, …]`.
 *
 * `facet_pivot` maps each pivot spec to an array of nested pivot objects.
 */
export interface SolrFacetCounts {
	facet_queries: Record<string, number>;
	facet_fields: Record<string, Array<string | number>>;
	facet_ranges: Record<string, unknown>;
	facet_intervals: Record<string, unknown>;
	facet_heatmaps: Record<string, unknown>;
	facet_pivot: Record<string, unknown[]>;
}

export interface SolrResponse<TDoc = Record<string, unknown>> {
	responseHeader: SolrResponseHeader;
	response: {
		numFound: number;
		start: number;
		docs: TDoc[];
	};
	facet_counts?: SolrFacetCounts;
}
