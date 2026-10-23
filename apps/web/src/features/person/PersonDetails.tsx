import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  Trash2,
  Fence,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { personClient } from "@/lib/clients";
import {
  PersonType,
  formatDate,
  formatTaxId,
  type PersonInput,
} from "@ifarm/shared";
import { MARITAL_STATUS_LABELS as MARITAL_STATUS_LABEL } from "@ifarm/shared";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11)
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10)
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
}

// Dados ilustrativos: essas informações ainda não existem no sistema (RF-PESSOA-04 em construção).
const FICTITIOUS_PROPERTIES = [
  {
    name: "Fazenda Santa Rita",
    role: "Titular",
    area: "120 ha",
    city: "Uberlândia/MG",
  },
];

const FICTITIOUS_PURCHASES = [
  {
    date: "2026-05-12",
    product: "Ração bovina",
    quantity: "40 sacos",
    value: "R$ 3.200,00",
  },
  {
    date: "2026-04-03",
    product: "Vermífugo",
    quantity: "12 frascos",
    value: "R$ 780,00",
  },
  {
    date: "2026-02-20",
    product: "Sal mineral",
    quantity: "8 sacos",
    value: "R$ 640,00",
  },
];

const FICTITIOUS_SUPPLIED_PRODUCTS = [
  {
    date: "2026-06-01",
    product: "Leite in natura",
    quantity: "1.200 L",
    value: "R$ 4.800,00",
  },
  {
    date: "2026-05-01",
    product: "Leite in natura",
    quantity: "1.150 L",
    value: "R$ 4.600,00",
  },
];

function DetailsSkeleton() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function PersonDetails({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await personClient.getPerson(id);
        if (!cancelled) setPerson(data);
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
  }, [id]);

  async function handleDelete() {
    try {
      await personClient.deletePerson(id);
      toast.success("Registro excluído com sucesso!");
      if (onClose) onClose();
      else navigate("/pessoas");
    } catch (e) {
      toast.error(
        (e as Error).message || "Não foi possível excluir o registro.",
      );
    } finally {
      setConfirmingDelete(false);
    }
  }

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados da pessoa."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading || !person) {
    return <DetailsSkeleton />;
  }

  const isIndividual = person.type === PersonType.INDIVIDUAL;
  const address = [
    person.street && person.number
      ? `${person.street}, ${person.number}`
      : person.street,
    person.complement,
    person.neighborhood,
    person.city && person.state
      ? `${person.city}/${person.state}`
      : person.city,
    person.zipCode,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div
        className={
          onClose
            ? "flex items-center justify-end"
            : "flex items-center justify-between"
        }
      >
        {!onClose && (
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 className="size-4" /> Excluir
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>
              {isIndividual ? (
                <User className="size-5" />
              ) : (
                <Building2 className="size-5" />
              )}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{person.name}</h1>
              <Badge variant="outline">
                {isIndividual ? "Física" : "Jurídica"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isIndividual ? "CPF" : "CNPJ"}:{" "}
              {formatTaxId(person.type, person.taxId)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato e Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <span>{person.phone ? formatPhone(person.phone) : "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span>{person.email || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <span>{address || "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isIndividual ? "Dados Pessoais" : "Dados da Empresa"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {isIndividual ? (
              <>
                <div>
                  <p className="text-muted-foreground">RG</p>
                  <p>{person.rg || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de Nascimento</p>
                  <p>{person.birthDate ? formatDate(person.birthDate) : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado Civil</p>
                  <p>
                    {person.maritalStatus
                      ? (MARITAL_STATUS_LABEL[
                          person.maritalStatus as keyof typeof MARITAL_STATUS_LABEL
                        ] ?? person.maritalStatus)
                      : "—"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground">Nome Fantasia</p>
                  <p>{person.tradeName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inscrição Estadual</p>
                  <p>{person.stateRegistration || "—"}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-xs text-muted-foreground">
        As seções abaixo exibem dados ilustrativos — os módulos correspondentes
        ainda não foram implementados.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fence className="size-4" /> Propriedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="[&_tr]:border-border">
            <TableHeader>
              <TableRow>
                <TableHead>Fazenda</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Município</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FICTITIOUS_PROPERTIES.map((p) => (
                <TableRow key={p.name}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.role}</Badge>
                  </TableCell>
                  <TableCell>{p.area}</TableCell>
                  <TableCell>{p.city}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-4" /> Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="[&_tr]:border-border">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FICTITIOUS_PURCHASES.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{formatDate(c.date)}</TableCell>
                  <TableCell>{c.product}</TableCell>
                  <TableCell>{c.quantity}</TableCell>
                  <TableCell>{c.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" /> Produtos Fornecidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="[&_tr]:border-border">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FICTITIOUS_SUPPLIED_PRODUCTS.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{formatDate(p.date)}</TableCell>
                  <TableCell>{p.product}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{p.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        onConfirm={handleDelete}
        description="Tem certeza que deseja excluir este registro?"
      />
    </div>
  );
}
