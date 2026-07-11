import { adminAc, defaultAc, userAc } from "better-auth/plugins/admin/access";

// "tecnico" tem as mesmas permissões (nenhuma) do papel padrão "user" do plugin admin.
const tecnicoAc = defaultAc.newRole({
  user: [],
  session: [],
});

export const roles = {
  admin: adminAc,
  user: userAc,
  tecnico: tecnicoAc,
};

// Fonte única de quais roles NÃO podem acessar cada recurso. Consumido tanto pelo
// proxy (checagem otimista de UI) quanto pelas API routes (autorização real, via withAuth).
export const RESOURCE_ACCESS = {
  pessoas: { forbiddenRoles: ["tecnico"] },
  usuarios: { forbiddenRoles: ["user", "tecnico"] },
} as const;
