import { Hono } from "hono";
import { cancelPurchaseRoute } from "./cancel-purchase/route";
import { consolidatePurchaseRoute } from "./consolidate-purchase/route";
import { createPurchaseRoute } from "./create-purchase/route";
import { getPurchaseRoute } from "./get-purchase/route";
import { listPurchasesRoute } from "./list-purchases/route";
import { payPurchaseRoute } from "./pay-purchase/route";
import { undoPurchasePaymentRoute } from "./undo-purchase-payment/route";
import { updatePurchaseRoute } from "./update-purchase/route";

// As operações de compra, cada uma na própria pasta (endpoint em route.ts, o que ela faz em
// handler.ts), montadas em /api/purchase. O rateio de custos (costs.ts) é usado por mais de
// uma operação; a recepção dos animais (reception.public.ts), também pelas sessões de manejo, pela
// área de recepções e pelo seed.
export const purchaseRoutes = new Hono();

purchaseRoutes.route("/", listPurchasesRoute);
purchaseRoutes.route("/", getPurchaseRoute);
purchaseRoutes.route("/", createPurchaseRoute);
purchaseRoutes.route("/", updatePurchaseRoute);
purchaseRoutes.route("/", payPurchaseRoute);
purchaseRoutes.route("/", undoPurchasePaymentRoute);
purchaseRoutes.route("/", consolidatePurchaseRoute);
purchaseRoutes.route("/", cancelPurchaseRoute);
