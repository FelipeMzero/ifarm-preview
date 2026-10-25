import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  InlineEditableList,
  InlineEditableColumn,
} from "@/components/our/InlineEditableList";
import { ErrorPage } from "@/components/our/ErrorPage";
import { InlineListSkeleton } from "@/components/our/PageSkeletons";
import { healthManagementTypeClient } from "@/lib/clients";
import { type HealthManagementType } from "@ifarm/shared";
import { FIELD_LIMITS } from "@ifarm/shared";
import {
  healthManagementTypeKeys,
  healthManagementTypeListQuery,
} from "./queries";

const COLUMNS: InlineEditableColumn<HealthManagementType>[] = [
  {
    key: "name",
    label: "Nome",
    placeholder: "Nome do tipo (ex.: Vacinação, Vermifugação)",
    maxLength: FIELD_LIMITS.healthManagementType.name,
  },
];

export function HealthManagementTypeList() {
  const queryClient = useQueryClient();
  const {
    data: types,
    isPending,
    refetch,
  } = useQuery(healthManagementTypeListQuery());

  // Cada alteração recarrega a lista. O InlineEditableList espera a promessa (o onSuccess
  // devolve a da invalidação) para limpar o campo ou sair da edição, e avisa se ela falhar.
  const reloadTypes = () =>
    queryClient.invalidateQueries({ queryKey: healthManagementTypeKeys.all });

  const create = useMutation({
    mutationFn: (name: string) =>
      healthManagementTypeClient.createHealthManagementType(name),
    onSuccess: reloadTypes,
  });
  const update = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      healthManagementTypeClient.updateHealthManagementType(id, name),
    onSuccess: reloadTypes,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      healthManagementTypeClient.deleteHealthManagementType(id),
    onSuccess: reloadTypes,
  });
  const toggleStatus = useMutation({
    mutationFn: (id: string) =>
      healthManagementTypeClient.toggleHealthManagementTypeStatus(id),
    onSuccess: reloadTypes,
  });

  if (isPending) {
    return <InlineListSkeleton />;
  }

  if (!types) {
    return (
      <ErrorPage
        message="Não foi possível obter os tipos de manejo sanitário."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Tipos de manejo sanitário</h1>
      <InlineEditableList
        items={types}
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
        itemLabel="tipo de manejo sanitário"
        isActive={(type) => !type.deactivatedAt}
        onToggleActive={async (id) => {
          await toggleStatus.mutateAsync(id);
        }}
      />
    </div>
  );
}
