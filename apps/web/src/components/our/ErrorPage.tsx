import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

type ErrorPageProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorPage({
  title = "Algo deu errado",
  message,
  onRetry,
}: ErrorPageProps) {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-6 p-8 text-center">

      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>

      <div>
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <p className="mt-2 text-muted-foreground">
          {message}
        </p>
      </div>

      {onRetry && (
        <Button onClick={onRetry} className="w-40">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}