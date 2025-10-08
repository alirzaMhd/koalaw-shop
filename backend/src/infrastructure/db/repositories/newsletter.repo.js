// src/infrastructure/db/repositories/newsletter.repo.ts
import { prisma } from "../prismaClient.js";
export const newsletterRepo = {
    async subscribe(email, source) {
        return await prisma.newsletterSubscription.upsert({
            where: { email },
            create: {
                email,
                source,
                consent: true,
            },
            update: {
                unsubscribedAt: null, // Re-subscribe if previously unsubscribed
                consent: true,
            },
        });
    },
    async unsubscribe(email) {
        return await prisma.newsletterSubscription.update({
            where: { email },
            data: {
                unsubscribedAt: new Date(),
            },
        });
    },
    async findByEmail(email) {
        return await prisma.newsletterSubscription.findUnique({
            where: { email },
        });
    },
    async isSubscribed(email) {
        const sub = await this.findByEmail(email);
        return sub && !sub.unsubscribedAt;
    },
    async getAllActive(skip = 0, take = 100) {
        return await prisma.newsletterSubscription.findMany({
            where: {
                unsubscribedAt: null,
            },
            skip,
            take,
            orderBy: { createdAt: "desc" },
        });
    },
    async getStats() {
        const [total, active, unsubscribed] = await Promise.all([
            prisma.newsletterSubscription.count(),
            prisma.newsletterSubscription.count({
                where: { unsubscribedAt: null },
            }),
            prisma.newsletterSubscription.count({
                where: { unsubscribedAt: { not: null } },
            }),
        ]);
        return { total, active, unsubscribed };
    },
};
//# sourceMappingURL=newsletter.repo.js.map