import { Router } from "express";
import { collectionsController } from "./collections.controller.js";
import { authGuard } from "../../../common/middlewares/authGuard.js";
const router = Router();
// Optional simple role guard (reuse from product.routes if you have it)
const requireAdmin = (req, _res, next) => {
    const role = (req.user?.role || "").toLowerCase();
    if (role === "admin" || role === "manager" || role === "staff")
        return next();
    return next(new Error("FORBIDDEN"));
};
router.get("/", authGuard, requireAdmin, collectionsController.list);
router.post("/", authGuard, requireAdmin, collectionsController.create);
router.patch("/:id", authGuard, requireAdmin, collectionsController.update); // PATCH support
router.put("/:id", authGuard, requireAdmin, collectionsController.update); // keep PUT too
export default router;
//# sourceMappingURL=collections.routes.js.map