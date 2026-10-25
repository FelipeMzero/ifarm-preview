import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  InlineEditableList,
  InlineEditableColumn,
} from "@/components/our/InlineEditableList";
import { ErrorPage } from "@/components/our/ErrorPage";
import { InlineListSkeleton } from "@/components/our/PageSkeletons";
import { breedClient } from "@/lib/clients";
import { type Breed } from "@ifarm/shared";
import { FIELD_LIMITS } from "@ifarm/shared";
import { breedKeys, breedListQuery } from "./queries";

const COLUMNS: InlineEditableColumn<Breed>[] = [
  {
    key: "name",
    label: "Nome",
    placeholder: "Nome da raça",
    maxLength: FIELD_LIMITS.breed.name,
  },
];

export function BreedList() {
  const queryClient = useQueryClient();
  const { data: breeds, isPending, refetch } = useQuery(breedListQuery());

  // Cada alteração recarrega a lista. O InlineEditableList espera a promessa (o onSuccess
  // devolve a da invalidação) para limpar o campo ou sair da edição, e avisa se ela falhar.
  const reloadBreeds = () =>
    queryClient.invalidateQueries({ queryKey: breedKeys.all });

  const create = useMutation({
    mutationFn: (name: string) => breedClient.createBreed(name),
    onSuccess: reloadBreeds,
  });
  const update = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      breedClient.updateBreed(id, name),
    onSuccess: reloadBreeds,
  });
  const remove = useMutation({
    mutationFn: (id: string) => breedClient.deleteBreed(id),
    onSuccess: reloadBreeds,
  });
  const toggleStatus = useMutation({
    mutationFn: (id: string) => breedClient.toggleBreedStatus(id),
    onSuccess: reloadBreeds,
  });

  if (isPending) {
    return <InlineListSkeleton />;
  }

  if (!breeds) {
    return (
      <ErrorPage
        message="Não foi possível obter as raças."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Raças</h1>
      <InlineEditableList
        items={breeds}
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
        itemLabel="raça"
        isActive={(breed) => !breed.deactivatedAt}
        onToggleActive={async (id) => {
          await toggleStatus.mutateAsync(id);
        }}
      />
    </div>
  );
}
