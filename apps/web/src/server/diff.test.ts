import { describe, expect, it } from "vitest";
import { diffIds } from "./diff";

describe("diffIds", () => {
  it("separa quem sai, quem entra e quem continua", () => {
    const current = [
      { id: 1, animalId: "a" },
      { id: 2, animalId: "b" },
    ];
    const { removed, added, kept } = diffIds(
      current,
      ["b", "c"],
      (i) => i.animalId,
    );
    expect(removed).toEqual([{ id: 1, animalId: "a" }]);
    expect(added).toEqual(["c"]);
    expect(kept).toEqual(["b"]);
  });

  it("lista vazia remove todos", () => {
    const { removed, added, kept } = diffIds(
      [{ animalId: "a" }],
      [],
      (i) => i.animalId,
    );
    expect(removed).toHaveLength(1);
    expect(added).toEqual([]);
    expect(kept).toEqual([]);
  });
});
