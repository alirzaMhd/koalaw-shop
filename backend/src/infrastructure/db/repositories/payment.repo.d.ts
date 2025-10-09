import { Prisma } from "@prisma/client";
export declare const paymentRepo: {
    findById(id: string): Prisma.Prisma__PaymentClient<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    listForOrder(orderId: string): Prisma.PrismaPromise<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    }[]>;
    create(data: any): Prisma.Prisma__PaymentClient<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    update(id: string, data: any): Prisma.Prisma__PaymentClient<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findPendingGatewayByOrder(orderId: string): Prisma.Prisma__PaymentClient<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findByAuthority(authority: string): Prisma.Prisma__PaymentClient<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
};
export default paymentRepo;
//# sourceMappingURL=payment.repo.d.ts.map