// src/modules/newsletter/newsletter.routes.ts
import { Router } from "express";
import { newsletterController } from "./newsletter.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
const router = Router();
// Public routes
router.post("/subscribe", newsletterController.subscribe);
router.post("/unsubscribe", newsletterController.unsubscribe);
router.get("/unsubscribe", newsletterController.unsubscribe); // One-click unsubscribe
// Protected routes (admin only)
router.get("/subscriptions", authGuard, newsletterController.getSubscriptions);
router.get("/statistics", authGuard, newsletterController.getStatistics);
router.post("/send", authGuard, newsletterController.sendNewsletter);
router.get("/export", authGuard, newsletterController.exportSubscribers);
export default router;
//# sourceMappingURL=newsletter.routes.js.map