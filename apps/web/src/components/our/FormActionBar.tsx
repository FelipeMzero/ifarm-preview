import { cn } from "@/lib/utils";

type FormActionBarProps = {
  children: React.ReactNode;
  className?: string;
};

/** Barra de ações fixa no rodapé da página, usada em formulários de página cheia
 * para manter o botão de salvar sempre visível durante a rolagem. */
export function FormActionBar({ children, className }: FormActionBarProps) {
  return (
    <div className={cn("border-border sticky bottom-0 -mx-8 -mb-8 border-t bg-background/95 px-8 py-4", className)}>
      <div className="flex justify-end gap-2">
        {children}
      </div>
    </div>
  );
}
