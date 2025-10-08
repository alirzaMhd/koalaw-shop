import { Queue, Worker, QueueEvents } from "bullmq";
export declare function getRedisConnection(): {
    url: string;
    host?: undefined;
    port?: undefined;
    password?: undefined;
    db?: undefined;
    tls?: undefined;
} | {
    host: string;
    port: number;
    password: string | undefined;
    db: number | undefined;
    tls: {} | undefined;
    url?: undefined;
};
export declare const emailQueue: Queue<any, any, string, any, any, string>;
export declare const webhooksQueue: Queue<any, any, string, any, any, string>;
export declare const emailQueueEvents: QueueEvents;
export declare function bindDefaultEmailWorker(): Worker<any, any, string> | null;
export declare const queues: {
    email: Queue<any, any, string, any, any, string>;
    webhooks: Queue<any, any, string, any, any, string>;
};
export default queues;
//# sourceMappingURL=bullmq.d.ts.map