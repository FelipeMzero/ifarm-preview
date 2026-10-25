import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  InlineEditableList,
  InlineEditableColumn,
} from "@/components/our/InlineEditableList";
import { ErrorPage } from "@/components/our/ErrorPage";
import { InlineListSkeleton } from "@/components/our/PageSkeletons";
import { neuteringTechniqueClient } from "@/lib/clients";
import { type NeuteringTechnique } from "@ifarm/shared";
import { FIELD_LIMITS } from "@ifarm/shared";
import { neuteringTechniqueKeys, neuteringTechniqueListQuery } from "./queries";

const COLUMNS: InlineEditableColumn<NeuteringTechnique>[] = [
  {
    key: "name",
    label: "Nome",
    placeholder: "Nome da técnica (ex.: Burdizzo, Cirúrgica)",
    maxLength: FIELD_LIMITS.neuteringTechnique.name,
  },
];

export function NeuteringTechniqueList() {
  const queryClient = useQueryClient();
  const {
    data: techniques,
    isPending,
    refetch,
  } = useQuery(neuteringTechniqueListQuery());

  // Cada alteração recarrega a lista. O InlineEditableList espera a promessa (o onSuccess
  // devolve a da invalidação) para limpar o campo ou sair da edição, e avisa se ela falhar.
  const reloadTechniques = () =>
    queryClient.invalidateQueries({ queryKey: neuteringTechniqueKeys.all });

  const create = useMutation({
    mutationFn: (name: string) =>
      neuteringTechniqueClient.createNeuteringTechnique(name),
    onSuccess: reloadTechniques,
  });
  const update = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      neuteringTechniqueClient.updateNeuteringTechnique(id, name),
    onSuccess: reloadTechniques,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      neuteringTechniqueClient.deleteNeuteringTechnique(id),
    onSuccess: reloadTechniques,
  });
  const toggleStatus = useMutation({
    mutationFn: (id: string) =>
      neuteringTechniqueClient.toggleNeuteringTechniqueStatus(id),
    onSuccess: reloadTechniques,
  });

  if (isPending) {
    return <InlineListSkeleton />;
  }

  if (!techniques) {
    return (
      <ErrorPage
        message="Não foi possível obter as técnicas de castração."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Técnicas de castração</h1>
      <InlineEditableList
        items={techniques}
        columns={COLUMNS}
        onCreate={async (values) => {
          await create.mutateAsync(values.name);
        }}
        onUpdate={async (id, values) => {
          await update.mutateAsync({ id, name: values.name });
        }}
        onDelete={async (id) => {
          await remove.mutateAsync(id);
        }}
        itemLabel="técnica de castração"
        isActive={(technique) => !technique.deactivatedAt}
        onToggleActive={async (id) => {
          await toggleStatus.mutateAsync(id);
        }}
      />
    </div>
  );
}
