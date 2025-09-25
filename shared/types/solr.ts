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
	defType?: 'dismax' | 'edismax';
	qf?: string;
}

export interface SolrResponseHeader {
	status: number;
	QTime: number;
	params: Record<string, string>;
}

export interface SolrResponse<TDoc = Record<string, unknown>> {
	responseHeader: SolrResponseHeader;
	response: {
		numFound: number;
		start: number;
		docs: TDoc[];
	};
	facet_counts?: Record<string, unknown>;
}
