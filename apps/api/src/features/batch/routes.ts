import { Hono } from "hono";
import { closeBatchRoute } from "./close-batch/route";
import { createBatchRoute } from "./create-batch/route";
import { deleteBatchRoute } from "./delete-batch/route";
import { getBatchRoute } from "./get-batch/route";
import { getBatchDetailsRoute } from "./get-batch-details/route";
import { listBatchesRoute } from "./list-batches/route";
import { reopenBatchRoute } from "./reopen-batch/route";
import { updateBatchRoute } from "./update-batch/route";

// As operações de lote, cada uma na própria pasta (endpoint em route.ts, o que ela faz em
// handler.ts), montadas em /api/batch.
export const batchRoutes = new Hono();

batchRoutes.route("/", listBatchesRoute);
batchRoutes.route("/", getBatchRoute);
batchRoutes.route("/", getBatchDetailsRoute);
batchRoutes.route("/", createBatchRoute);
batchRoutes.route("/", updateBatchRoute);
batchRoutes.route("/", deleteBatchRoute);
batchRoutes.route("/", closeBatchRoute);
batchRoutes.route("/", reopenBatchRoute);
