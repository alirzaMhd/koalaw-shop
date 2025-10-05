import { Client } from "@elastic/elasticsearch";
export declare const elastic: Client;
export declare function ping(): Promise<boolean>;
export declare function ensureIndex(index: string, mapping?: any): Promise<void>;
export declare function indexDocument<T extends {
    id?: string;
}>(index: string, doc: T, id?: string): Promise<any>;
export declare function searchDocuments<T = any>(index: string, query: any, opts?: {
    from?: number;
    size?: number;
}): Promise<{
    items: T[];
    total: number;
}>;
export default elastic;
//# sourceMappingURL=elastic.client.d.ts.map