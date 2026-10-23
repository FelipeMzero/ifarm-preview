import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Beef, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/our/FormField";
import { signIn } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Este campo não pode ser vazio"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, control } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormData) {
    setIsSubmitting(true);
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }

    navigate("/painel", { replace: true });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center gap-2 text-center">
        <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Beef className="size-5" />
        </div>
        <CardTitle className="text-xl">iFarm</CardTitle>
        <CardDescription>Entre com sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            name="email"
            label="E-mail"
            required
            control={control}
            render={({ id, field }) => (
              <Input id={id} type="email" autoComplete="email" {...field} />
            )}
          />
          <FormField
            name="password"
            label="Senha"
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
          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
