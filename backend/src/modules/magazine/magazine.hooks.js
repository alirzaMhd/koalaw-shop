// src/modules/magazine/magazine.hooks.ts
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { indexMagazinePostById, deleteMagazinePostById } from "../search/search.service.js";
import { logger } from "../../config/logger.js";
// Call this after creating or updating a magazine post
export async function onMagazinePostSaved(postId) {
    try {
        await indexMagazinePostById(postId);
    }
    catch (error) {
        logger.error({ error, postId }, "Failed to index magazine post");
    }
}
// Call this after deleting a magazine post
export async function onMagazinePostDeleted(postId) {
    try {
        await deleteMagazinePostById(postId);
    }
    catch (error) {
        logger.error({ error, postId }, "Failed to delete magazine post from index");
    }
}
//# sourceMappingURL=magazine.hooks.js.map