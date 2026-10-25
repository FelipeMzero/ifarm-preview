import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

type ErrorPageProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  /** Botão de voltar (ex.: para a lista, quando o registro não existe mais). */
  onBack?: () => void;
  backLabel?: string;
};

export function ErrorPage({
  title = "Algo deu errado",
  message,
  onRetry,
  onBack,
  backLabel = "Voltar",
}: ErrorPageProps) {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>

      <div>
        <h2 className="text-xl font-semibold">{title}</h2>

        <p className="mt-2 text-muted-foreground">{message}</p>
      </div>

      {(onRetry || onBack) && (
        <div className="flex flex-wrap justify-center gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4" /> {backLabel}
            </Button>
          )}
          {onRetry && (
            <Button onClick={onRetry} className="w-40">
              Tentar novamente
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
