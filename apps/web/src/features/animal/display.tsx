import React from "react";
import { Mars, Venus } from "lucide-react";
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
  [EnumAnimalStatus.DISCARDED]: "outline",
  [EnumAnimalStatus.SLAUGHTERED]: "destructive",
  [EnumAnimalStatus.REFERENCE]: "outline",
};

export const SEX_ICON: Record<string, React.ReactNode> = {
  [EnumSex.MALE]: <Mars className="size-5 text-blue-700" />,
  [EnumSex.FEMALE]: <Venus className="size-5 text-pink-700" />,
};
