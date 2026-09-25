import { createLucideIcon, type IconNode } from "lucide-react";

// Ícone no padrão Lucide (grade 24×24, traço 2, pontas arredondadas).
// Usado para representar animais/bovinos.
const iconNode: IconNode = [
  [
    "path",
    {
      d: "M7.5 4.3C6.8 2.9 5.5 2 4 2H2v1.5A3.5 3.5 0 0 0 5.5 7h-.5c-.7 2.3-.5 4.6.6 7",
      key: "ear-l",
    },
  ],
  [
    "path",
    {
      d: "M16.5 4.3c.7-1.4 2-2.3 3.5-2.3h2v1.5A3.5 3.5 0 0 1 18.5 7h.5c.7 2.3.5 4.6-.6 7",
      key: "ear-r",
    },
  ],
  ["path", { d: "M7.5 4.3Q12 1.8 16.5 4.3", key: "top" }],
  [
    "path",
    {
      d: "M12 15c-2-2-6-1.5-7 1.5C4.2 19 6 22 9 22h6c3 0 4.8-3 4-5.5-1-3-5-3.5-7-1.5",
      key: "muzzle",
    },
  ],
  ["path", { d: "M9 8.8v.5", key: "eye-l" }],
  ["path", { d: "M15 8.8v.5", key: "eye-r" }],
  ["path", { d: "M9 18h.01", key: "nostril-l" }],
  ["path", { d: "M15 18h.01", key: "nostril-r" }],
];

export const CowHead = createLucideIcon("CowHead", iconNode);
