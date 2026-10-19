import { describe, expect, it } from "vitest";
import * as shared from "@ifarm/shared";
import * as prisma from "@/generated/prisma/enums";

// Os enums de @ifarm/shared espelham os do schema.prisma; este teste falha se divergirem.
describe("enums de @ifarm/shared", () => {
  it.each(["PersonType", "MaritalStatus"] as const)(
    "%s igual ao do Prisma",
    (name) => {
      expect(shared[name]).toEqual(prisma[name]);
    },
  );
});
