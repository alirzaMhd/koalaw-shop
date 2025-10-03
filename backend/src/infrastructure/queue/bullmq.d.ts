import { Queue, Worker, QueueEvents } from "bullmq";
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