import { Worker } from "bullmq";
interface NewsletterWelcomeJob {
    email: string;
}
interface NewsletterUnsubscribeJob {
    email: string;
}
interface NewsletterBroadcastJob {
    email: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
}
type NewsletterJobData = NewsletterWelcomeJob | NewsletterUnsubscribeJob | NewsletterBroadcastJob;
export declare const newsletterWorker: Worker<NewsletterJobData, any, string>;
export default newsletterWorker;
//# sourceMappingURL=newsletter.worker.d.ts.map