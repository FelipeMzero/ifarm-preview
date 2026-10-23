import { useEffect, useState } from "react";

import {
  InlineEditableList,
  InlineEditableColumn,
} from "@/components/our/InlineEditableList";
import { ErrorPage } from "@/components/our/ErrorPage";
import { Skeleton } from "@/components/ui/skeleton";
import { healthManagementTypeClient } from "@/lib/clients";
import { type HealthManagementType } from "@ifarm/shared";
import { FIELD_LIMITS } from "@ifarm/shared";

const COLUMNS: InlineEditableColumn<HealthManagementType>[] = [
  {
    key: "name",
    label: "Nome",
    placeholder: "Nome do tipo (ex.: Vacinação, Vermifugação)",
    maxLength: FIELD_LIMITS.healthManagementType.name,
  },
];

function HealthManagementTypeListSkeleton() {
  return (
    <div className="w-full max-w-2xl space-y-3">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full rounded-md" />
    </div>
  );
}

export default function HealthManagementTypeList() {
  const [types, setTypes] = useState<HealthManagementType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data =
          await healthManagementTypeClient.getHealthManagementTypes();
        if (!cancelled) setTypes(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(values: Record<string, string>) {
    const created = await healthManagementTypeClient.createHealthManagementType(
      values.name,
    );
    setTypes((prev) => [...prev, created]);
  }

  async function handleUpdate(id: string, values: Record<string, string>) {
    const updated = await healthManagementTypeClient.updateHealthManagementType(
      id,
      values.name,
    );
    setTypes((prev) => prev.map((type) => (type.id === id ? updated : type)));
  }

  async function handleDelete(id: string) {
    await healthManagementTypeClient.deleteHealthManagementType(id);
    setTypes((prev) => prev.filter((type) => type.id !== id));
  }

  async function handleToggleActive(id: string) {
    const updated =
      await healthManagementTypeClient.toggleHealthManagementTypeStatus(id);
    setTypes((prev) => prev.map((type) => (type.id === id ? updated : type)));
  }

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os tipos de manejo sanitário."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return <HealthManagementTypeListSkeleton />;
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Tipos de manejo sanitário</h1>
      <InlineEditableList
        items={types}
        columns={COLUMNS}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        itemLabel="tipo de manejo sanitário"
        isActive={(type) => !type.deactivatedAt}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
