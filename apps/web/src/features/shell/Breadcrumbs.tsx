"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { findNavMatch } from "./nav";

type Crumb = { label: string; href?: string };

const STATIC_SEGMENTS: Record<string, string> = {
  novo: "Novo",
  nova: "Nova",
  detalhes: "Detalhes",
  registro: "Registro",
};

// Nome genérico de um id, conforme o segmento que vem antes dele. Um id depois de
// outro id (ex: o animal dentro de uma recepção) cai em DEFAULT_RECORD_LABEL.
const RECORD_LABELS: Record<string, string> = {
  transferencias: "Transferência",
  manejos: "Sessão",
  recepcoes: "Recepção",
  compras: "Compra",
  registro: "Animal",
};
const DEFAULT_RECORD_LABEL = "Animal";

// Segmentos que só organizam a URL, sem página própria nem significado para o
// usuário (/recepcoes/compras/[id] é a compra dentro de Recepções, não o módulo
// Compras).
const HIDDEN_SEGMENTS: Record<string, string[]> = {
  "/recepcoes": ["compras"],
};

// Cadastros em que /[id] é a edição e /[id]/detalhes a visualização: o id some do
// caminho e fica só "Editar" ou "Detalhes".
const WITH_DETAILS_PAGE = ["/animais", "/lotes", "/pessoas", "/propriedades"];

function buildCrumbs(pathname: string): Crumb[] {
  const match = findNavMatch(pathname);
  if (!match) return [];

  const { section, item } = match;
  const crumbs: Crumb[] = [];
  if (section.label) crumbs.push({ label: section.label });
  crumbs.push({ label: item.label, href: item.href });

  const segments = pathname.slice(item.href.length).split("/").filter(Boolean);
  const hidden = HIDDEN_SEGMENTS[item.href] ?? [];
  let previous = item.href.split("/").at(-1) ?? "";
  let href = item.href;

  segments.forEach((segment, index) => {
    href = `${href}/${segment}`;
    const staticLabel = STATIC_SEGMENTS[segment];

    if (hidden.includes(segment)) {
      // não vira item, mas ainda nomeia o id seguinte
    } else if (staticLabel) {
      crumbs.push({ label: staticLabel, href });
    } else if (WITH_DETAILS_PAGE.includes(item.href) && index === 0) {
      if (segments.length === 1) crumbs.push({ label: "Editar" });
    } else if (/^\d+$/.test(segment)) {
      crumbs.push({ label: `Etapa ${segment}`, href });
    } else {
      crumbs.push({
        label: RECORD_LABELS[previous] ?? DEFAULT_RECORD_LABEL,
        href,
      });
    }

    previous = segment;
  });

  return crumbs;
}

export function AppBreadcrumb() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);
  if (!crumbs.length) return null;

  // Em telas pequenas, caminhos longos mostram só o primeiro e os dois últimos
  // níveis; o meio vira "…".
  const collapsible = crumbs.length > 3;
  const isCollapsed = (index: number) =>
    collapsible && index > 0 && index < crumbs.length - 2;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const hideOnMobile = isCollapsed(index);

          return (
            <Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator
                  className={cn(hideOnMobile && "hidden md:block")}
                />
              )}
              {collapsible && index === 1 && (
                <>
                  <BreadcrumbSeparator className="md:hidden" />
                  <BreadcrumbItem className="md:hidden">
                    <BreadcrumbEllipsis className="size-5" />
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbItem
                className={cn(
                  "min-w-0",
                  hideOnMobile && "hidden md:inline-flex",
                )}
              >
                {isLast ? (
                  <BreadcrumbPage className="truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild className="truncate">
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
