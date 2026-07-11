"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField } from "@/components/our/FormField";
import { authClient } from "@/lib/auth-client";

const resetPasswordSchema = z
  .object({
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

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

type ResetPasswordDialogProps = {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function ResetPasswordDialog({ userId, onOpenChange }: ResetPasswordDialogProps) {
  const { handleSubmit, control, reset, formState: { isSubmitting } } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  function close() {
    reset();
    onOpenChange(false);
  }

  async function onSubmit(data: ResetPasswordData) {
    if (!userId) return;

    const { error } = await authClient.admin.setUserPassword({
      userId,
      newPassword: data.newPassword,
    });

    if (error) {
      toast.error(error.message ?? "Não foi possível redefinir a senha.");
      return;
    }

    toast.success("Senha redefinida com sucesso!");
    close();
  }

  return (
    <Dialog open={userId !== null} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="p-8 sm:max-w-sm">
        <h2 className="text-xl font-semibold">Redefinir senha</h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            name="newPassword"
            label="Nova senha"
            required
            control={control}
            render={({ id, field }) => (
              <Input id={id} type="password" autoComplete="new-password" {...field} />
            )}
          />
          <FormField
            name="confirmPassword"
            label="Confirmar nova senha"
            required
            control={control}
            render={({ id, field }) => (
              <Input id={id} type="password" autoComplete="new-password" {...field} />
            )}
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={close}>
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
