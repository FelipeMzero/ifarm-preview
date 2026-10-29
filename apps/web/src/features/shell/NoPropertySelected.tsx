import { Link } from "react-router";
import { Fence } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentProperty } from "./useCurrentProperty";

/**
 * Tela das páginas que dependem de uma propriedade quando nenhuma está selecionada: as listagens e
 * os cadastros pedem sempre a propriedade à API. Sem propriedades cadastradas, oferece cadastrar.
 */
export function NoPropertySelected() {
  const { options } = useCurrentProperty();

  if (options.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <Fence className="size-8" />
        <p>Nenhuma propriedade cadastrada ainda.</p>
        <Button asChild size="sm">
          <Link to="/propriedades/novo">Cadastrar propriedade</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <Fence className="size-8" />
      <p>Nenhuma propriedade selecionada.</p>
      <p className="text-sm">
        Escolha uma propriedade no menu lateral para continuar.
      </p>
    </div>
  );
}
