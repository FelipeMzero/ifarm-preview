import React from "react";
import { Mars, Nfc, Tag, Venus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EnumAnimalOrigin, EnumAnimalStatus, EnumSex } from "./schema";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const ORIGIN_VARIANT: Record<string, BadgeVariant> = {
  [EnumAnimalOrigin.BIRTH]: "default",
  [EnumAnimalOrigin.PURCHASE]: "secondary",
  [EnumAnimalOrigin.DONATION]: "outline",
  [EnumAnimalOrigin.REFERENCE]: "outline",
};

export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  [EnumAnimalStatus.ACTIVE]: "default",
  [EnumAnimalStatus.SOLD]: "secondary",
  [EnumAnimalStatus.DONATED]: "secondary",
  [EnumAnimalStatus.DEAD]: "destructive",
  [EnumAnimalStatus.MISSING]: "outline",
  [EnumAnimalStatus.SLAUGHTERED]: "destructive",
  [EnumAnimalStatus.REFERENCE]: "outline",
};

export const SEX_ICON: Record<string, React.ReactNode> = {
  [EnumSex.MALE]: <Mars className="size-5 text-blue-700" />,
  [EnumSex.FEMALE]: <Venus className="size-5 text-pink-700" />,
};

// Marca um valor registrado na sessão de manejo e que ainda não vale fora dela.
export function NewValueMark() {
  return (
    <span
      className="shrink-0 rounded-sm bg-primary/10 px-1 text-[10px] font-medium uppercase leading-4 text-primary"
      title="Registrado nesta sessão; passa a valer na consolidação"
    >
      novo
    </span>
  );
}

// Destaca o identificador principal (brinco → RFID → ID) e mantém o ID sempre visível.
// `fresh` marca os identificadores registrados na sessão de manejo em andamento.
export function AnimalIdentification({
  animal,
  fresh,
}: {
  animal: { code: number; earTag: string | null; rfid: string | null };
  fresh?: { earTag?: boolean; rfid?: boolean };
}) {
  const { code, earTag, rfid } = animal;
  const primary = earTag
    ? { label: "Brinco", value: earTag, icon: Tag, fresh: fresh?.earTag }
    : rfid
      ? { label: "RFID", value: rfid, icon: Nfc, fresh: fresh?.rfid }
      : null;

  if (!primary) {
    return <span className="font-medium tabular-nums">ID {code}</span>;
  }

  const Icon = primary.icon;

  return (
    <div className="flex flex-col leading-tight">
      <div className="flex items-center gap-1.5">
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-label={primary.label}
        />
        <span className="max-w-40 truncate font-medium" title={primary.value}>
          {primary.value}
        </span>
        {primary.fresh && <NewValueMark />}
        {earTag && rfid && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`RFID ${rfid}`}
              >
                <Nfc className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              RFID <span className="font-mono">{rfid}</span>
              {fresh?.rfid && " (novo, desta sessão)"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        ID {code}
      </span>
    </div>
  );
}
