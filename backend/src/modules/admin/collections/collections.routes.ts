import { Router } from "express";
import { collectionsController } from "./collections.controller.js";
import { authGuard } from "../../../common/middlewares/authGuard.js";

const router = Router();

router.get("/", collectionsController.list);
router.post("/", authGuard, collectionsController.create);
router.patch("/:id", authGuard, collectionsController.update);
router.put("/:id", authGuard, collectionsController.update);
router.delete("/:id", authGuard, collectionsController.delete);

export default router;