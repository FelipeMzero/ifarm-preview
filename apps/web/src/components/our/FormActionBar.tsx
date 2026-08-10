import { cn } from "@/lib/utils";

type FormActionBarProps = {
  children: React.ReactNode;
  className?: string;
  /** Deve casar com o padding do container pai, para a barra esticar borda-a-borda. */
  padding?: 6 | 8;
};

const paddingClasses = {
  6: "-mx-6 -mb-6 px-6",
  8: "-mx-8 -mb-8 px-8",
} as const;

/** Barra de ações fixa no rodapé da página, usada em formulários de página cheia
 * para manter o botão de salvar sempre visível durante a rolagem. */
export function FormActionBar({ children, className, padding = 8 }: FormActionBarProps) {
  return (
    <div className={cn("border-border sticky bottom-0 border-t bg-background/80 py-4", paddingClasses[padding], className)}>
      <div className="flex justify-end gap-2">
        {children}
      </div>
    </div>
  );
}
