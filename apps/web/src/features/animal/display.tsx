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

// Destaca o identificador principal (brinco → RFID → ID) e mantém o ID sempre visível.
export function AnimalIdentification({
  animal,
}: {
  animal: { code: number; earTag: string | null; rfid: string | null };
}) {
  const { code, earTag, rfid } = animal;
  const primary = earTag
    ? { label: "Brinco", value: earTag, icon: Tag }
    : rfid
      ? { label: "RFID", value: rfid, icon: Nfc }
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
