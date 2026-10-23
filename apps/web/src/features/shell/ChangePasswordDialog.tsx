import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField } from "@/components/our/FormField";
import { authClient } from "@/lib/auth-client";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Este campo não pode ser vazio"),
    newPassword: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Este campo não pode ser vazio"),
  })
  .check((ctx) => {
    if (ctx.value.newPassword !== ctx.value.confirmPassword) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.confirmPassword,
        path: ["confirmPassword"],
        message: "As senhas não coincidem",
      });
    }
  });

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, control, reset, setError } =
    useForm<ChangePasswordData>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    });

  async function onSubmit(data: ChangePasswordData) {
    setIsSubmitting(true);
    const { error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    });
    setIsSubmitting(false);

    if (error) {
      setError("currentPassword", {
        type: "server",
        message: "Senha atual incorreta",
      });
      toast.error("Não foi possível alterar a senha.");
      return;
    }

    toast.success("Senha alterada com sucesso!");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="p-8 sm:max-w-sm">
        <h2 className="text-xl font-semibold">Alterar senha</h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            name="currentPassword"
            label="Senha atual"
            required
            control={control}
            render={({ id, field }) => (
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                {...field}
              />
            )}
          />
          <FormField
            name="newPassword"
            label="Nova senha"
            required
            control={control}
            render={({ id, field }) => (
              <Input
                id={id}
                type="password"
                autoComplete="new-password"
                {...field}
              />
            )}
          />
          <FormField
            name="confirmPassword"
            label="Confirmar nova senha"
            required
            control={control}
            render={({ id, field }) => (
              <Input
                id={id}
                type="password"
                autoComplete="new-password"
                {...field}
              />
            )}
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
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
  );
}
