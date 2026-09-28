import { adminAc, userAc } from "better-auth/plugins/admin/access";

// Só "admin" tem permissões reais no plugin admin do better-auth (gerenciar
// usuários). Os demais papéis reaproveitam "userAc" (nenhuma permissão).
export const roles = {
  admin: adminAc,
  manager: userAc,
  technician: userAc,
  worker: userAc,
};

// Fonte única de quais roles NÃO podem acessar cada recurso. Consumido tanto pelo
// proxy (checagem otimista de UI) quanto pelas API routes (autorização real, via withAuth).
// As chaves (pessoas/usuarios) ficam em pt-br de propósito: são comparadas
// diretamente contra o segmento da rota (/pessoas, /usuarios) em src/proxy.ts.
export const RESOURCE_ACCESS = {
  animais: { forbiddenRoles: ["technician", "worker"] },
  racas: { forbiddenRoles: ["technician", "worker"] },
  "tipos-sanitarios": { forbiddenRoles: ["technician", "worker"] },
  pessoas: { forbiddenRoles: ["technician", "worker"] },
  propriedades: { forbiddenRoles: ["technician", "worker"] },
  usuarios: { forbiddenRoles: ["manager", "technician", "worker"] },
  areas: { forbiddenRoles: ["technician"] },
  lotes: { forbiddenRoles: ["technician"] },
  manejos: { forbiddenRoles: ["technician"] },
  // Compras envolvem valores: mesma restrição de Animais.
  compras: { forbiddenRoles: ["technician", "worker"] },
  // Recepção dos animais comprados: trabalho de curral, sem valores (como os manejos).
  recepcoes: { forbiddenRoles: ["technician"] },
} as const;
