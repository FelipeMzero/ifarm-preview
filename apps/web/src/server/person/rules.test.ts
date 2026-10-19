import { describe, expect, it } from "vitest";
import { withoutImmutableFields } from "./rules";

describe("withoutImmutableFields (RN-PESSOA-02)", () => {
  it("remove tipo e documento e mantém os demais campos", () => {
    const data = { type: "COMPANY", taxId: "123", name: "Fazenda", rg: null };
    expect(withoutImmutableFields(data)).toEqual({ name: "Fazenda", rg: null });
  });
});
