import { Hono } from "hono";
import { cancelBatchTransferRoute } from "./cancel-batch-transfer/route";
import { confirmBatchTransferRoute } from "./confirm-batch-transfer/route";
import { createBatchTransferRoute } from "./create-batch-transfer/route";
import { getBatchTransferRoute } from "./get-batch-transfer/route";
import { listBatchTransfersRoute } from "./list-batch-transfers/route";
import { updateBatchTransferRoute } from "./update-batch-transfer/route";

// As operações de transferência entre lotes, cada uma na própria pasta (endpoint em
// route.ts, o que ela faz em handler.ts), montadas em /api/batch-transfer. A efetivação
// (confirm-transfer.ts) também é usada pela consolidação das sessões de manejo.
export const batchTransferRoutes = new Hono();

batchTransferRoutes.route("/", listBatchTransfersRoute);
batchTransferRoutes.route("/", getBatchTransferRoute);
batchTransferRoutes.route("/", createBatchTransferRoute);
batchTransferRoutes.route("/", updateBatchTransferRoute);
batchTransferRoutes.route("/", confirmBatchTransferRoute);
batchTransferRoutes.route("/", cancelBatchTransferRoute);
