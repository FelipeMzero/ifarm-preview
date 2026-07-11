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
