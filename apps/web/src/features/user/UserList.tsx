import { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Plus, Power, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
import { ErrorPage } from "@/components/our/ErrorPage";
import { FormField } from "@/components/our/FormField";
import { SelectField } from "@/components/our/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authClient, useSession } from "@/lib/auth-client";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { FIELD_LIMITS } from "@ifarm/shared";

const DEFAULT_PAGE_SIZE = 10;

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: string | Date;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  technician: "Técnico",
  worker: "Funcionário",
};

const newUserSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo não pode ser vazio")
    .max(
      FIELD_LIMITS.user.name,
      `Máximo de ${FIELD_LIMITS.user.name} caracteres`,
    ),
  email: z
    .string()
    .email("E-mail inválido")
    .max(
      FIELD_LIMITS.user.email,
      `Máximo de ${FIELD_LIMITS.user.email} caracteres`,
    ),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
  role: z.enum(
    ["admin", "manager", "technician", "worker"],
    "Este campo não pode ser vazio",
  ),
});

type NewUserData = z.infer<typeof newUserSchema>;

function buildColumns(
  currentUserId: string | undefined,
  onResetPassword: (id: string) => void,
  onToggleAccess: (row: UserRow) => void,
): ColumnDef<UserRow>[] {
  return [
    { header: "Nome", accessorKey: "name" },
    { header: "E-mail", accessorKey: "email" },
    {
      header: "Papel",
      accessorKey: "role",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "admin" ? "default" : "outline"}>
          {ROLE_LABEL[row.original.role ?? "worker"] ?? row.original.role}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "banned",
      cell: ({ row }) => (
        <Badge variant={row.original.banned ? "outline" : "default"}>
          {row.original.banned ? "Bloqueado" : "Ativo"}
        </Badge>
      ),
    },
    {
      header: "Criado em",
      accessorKey: "createdAt",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const isSelf = row.original.id === currentUserId;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Redefinir senha"
              onClick={() => onResetPassword(row.original.id)}
            >
              <KeyRound className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title={
                isSelf
                  ? "Você não pode revogar seu próprio acesso"
                  : row.original.banned
                    ? "Reativar acesso"
                    : "Revogar acesso"
              }
              disabled={isSelf}
              className={
                row.original.banned
                  ? ""
                  : "text-destructive hover:text-destructive"
              }
              onClick={() => onToggleAccess(row.original)}
            >
              <Power className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

export default function UserList() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(
    null,
  );
  const [togglingAccessFor, setTogglingAccessFor] = useState<UserRow | null>(
    null,
  );

  const isAdmin = session?.user.role === "admin";

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<NewUserData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "worker" },
  });

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await authClient.admin.listUsers({
          query: {
            limit: pageSize,
            offset: pageIndex * pageSize,
            sortBy: "createdAt",
            sortDirection: "desc",
          },
        });
        if (cancelled) return;
        if (error) {
          setError(
            error.message ?? "Não foi possível obter os dados do servidor.",
          );
        } else {
          setUsers(data.users as UserRow[]);
          setTotal(data.total);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsFirstLoad(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, pageIndex, pageSize, refreshKey]);

  async function onSubmit(formData: NewUserData) {
    const { error } = await authClient.admin.createUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    if (error) {
      toast.error(error.message ?? "Não foi possível criar o usuário.");
      return;
    }

    toast.success("Usuário criado com sucesso!");
    reset();
    setIsCreating(false);
    setRefreshKey((k) => k + 1);
  }

  async function confirmToggleAccess() {
    if (!togglingAccessFor) return;
    const { id, banned } = togglingAccessFor;

    const { error } = banned
      ? await authClient.admin.unbanUser({ userId: id })
      : await authClient.admin.banUser({ userId: id });

    if (error) {
      toast.error(
        error.message ?? "Não foi possível atualizar o acesso do usuário.",
      );
    } else {
      toast.success(
        banned
          ? "Acesso reativado com sucesso!"
          : "Acesso revogado com sucesso!",
      );
      setRefreshKey((k) => k + 1);
    }
    setTogglingAccessFor(null);
  }

  const columns = buildColumns(
    session?.user.id,
    setResetPasswordUserId,
    setTogglingAccessFor,
  );

  if (isSessionPending) {
    return <ListSkeleton columns={6} />;
  }

  if (!isAdmin) {
    return (
      <ErrorPage
        title="Acesso negado"
        message="Apenas administradores podem gerenciar usuários."
      />
    );
  }

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isFirstLoad) {
    return <ListSkeleton columns={6} />;
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Usuários</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Users size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            pageCount={Math.ceil(total / pageSize)}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
          />
        )}
      </div>

      <Dialog
        open={isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            reset();
          }
        }}
      >
        <DialogContent className="p-8 sm:max-w-md">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <h2 className="text-xl font-semibold">Novo Usuário</h2>

            <FormField
              name="name"
              label="Nome"
              required
              control={control}
              render={({ id, field }) => (
                <Input id={id} maxLength={FIELD_LIMITS.user.name} {...field} />
              )}
            />
            <FormField
              name="email"
              label="E-mail"
              required
              control={control}
              render={({ id, field }) => (
                <Input
                  id={id}
                  type="email"
                  maxLength={FIELD_LIMITS.user.email}
                  {...field}
                />
              )}
            />
            <FormField
              name="password"
              label="Senha"
              required
              control={control}
              render={({ id, field }) => (
                <Input id={id} type="password" {...field} />
              )}
            />
            <FormField
              name="role"
              label="Papel"
              required
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  items={[
                    { value: "worker", label: "Funcionário" },
                    { value: "technician", label: "Técnico" },
                    { value: "manager", label: "Gerente" },
                    { value: "admin", label: "Administrador" },
                  ]}
                />
              )}
            />

            <div className="flex justify-end gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ResetPasswordDialog
        userId={resetPasswordUserId}
        onOpenChange={(open) => {
          if (!open) setResetPasswordUserId(null);
        }}
      />

      <ConfirmDialog
        open={togglingAccessFor !== null}
        onOpenChange={(open) => {
          if (!open) setTogglingAccessFor(null);
        }}
        onConfirm={confirmToggleAccess}
        title={togglingAccessFor?.banned ? "Reativar acesso" : "Revogar acesso"}
        description={
          togglingAccessFor?.banned
            ? "O usuário voltará a conseguir fazer login normalmente."
            : "O usuário será desconectado e não conseguirá mais fazer login até que o acesso seja reativado."
        }
        confirmLabel={togglingAccessFor?.banned ? "Reativar" : "Revogar"}
      />
    </div>
  );
}
