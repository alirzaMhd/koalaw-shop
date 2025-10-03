export declare const transporter: Transporter;
export declare const mailer: {
    sendMail(opts: {
        from?: string;
        to: string | string[];
        cc?: string[];
        bcc?: string[];
        subject: string;
        html?: string;
        text?: string;
        headers?: Record<string, string>;
    }): Promise<any>;
};
export default mailer;
//# sourceMappingURL=mailer.d.ts.map