"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Building2, Mail, MapPin, Package, Phone, ShoppingCart, Trash2, Tractor, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { deletePessoa, getPessoa } from "./services";
import { PessoaFormData, EnumPessoaTipo, EnumEstadoCivil } from "./schema";
import { formatDocumento } from "@/lib/documento";

const ESTADO_CIVIL_LABEL: Record<string, string> = {
  [EnumEstadoCivil.SOLTEIRO]: "Solteiro(a)",
  [EnumEstadoCivil.CASADO]: "Casado(a)",
  [EnumEstadoCivil.UNIAO_ESTAVEL]: "União Estável",
  [EnumEstadoCivil.DIVORCIADO]: "Divorciado(a)",
  [EnumEstadoCivil.VIUVO]: "Viúvo(a)",
};

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
}

function formatData(iso: string): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

// Dados ilustrativos: essas informações ainda não existem no sistema (RF-PESSOA-04 em construção).
const PROPRIEDADES_FICTICIAS = [
  { nome: "Fazenda Santa Rita", papel: "Titular", area: "120 ha", municipio: "Uberlândia/MG" },
];

const COMPRAS_FICTICIAS = [
  { data: "2026-05-12", produto: "Ração bovina", quantidade: "40 sacos", valor: "R$ 3.200,00" },
  { data: "2026-04-03", produto: "Vermífugo", quantidade: "12 frascos", valor: "R$ 780,00" },
  { data: "2026-02-20", produto: "Sal mineral", quantidade: "8 sacos", valor: "R$ 640,00" },
];

const PRODUTOS_FORNECIDOS_FICTICIOS = [
  { data: "2026-06-01", produto: "Leite in natura", quantidade: "1.200 L", valor: "R$ 4.800,00" },
  { data: "2026-05-01", produto: "Leite in natura", quantidade: "1.150 L", valor: "R$ 4.600,00" },
];

function FichaSkeleton() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function PessoaFicha({ id, onClose }: { id: string; onClose?: () => void }) {
  const router = useRouter();
  const [pessoa, setPessoa] = useState<PessoaFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getPessoa(id);
        if (!cancelled) setPessoa(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    try {
      await deletePessoa(id);
      toast.success("Registro excluído com sucesso!");
      if (onClose) onClose(); else router.push("/pessoas");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível excluir o registro.");
    } finally {
      setConfirmingDelete(false);
    }
  }

  if (error) {
    return (
      <ErrorPage message="Não foi possível obter os dados da pessoa." onRetry={() => window.location.reload()} />
    );
  }

  if (loading || !pessoa) {
    return <FichaSkeleton />;
  }

  const isFisica = pessoa.tipo === EnumPessoaTipo.FISICA;
  const endereco = [
    pessoa.logradouro && pessoa.numero ? `${pessoa.logradouro}, ${pessoa.numero}` : pessoa.logradouro,
    pessoa.complemento,
    pessoa.bairro,
    pessoa.municipio && pessoa.uf ? `${pessoa.municipio}/${pessoa.uf}` : pessoa.municipio,
    pessoa.cep,
  ].filter(Boolean).join(" — ");

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div className={onClose ? "flex items-center justify-end" : "flex items-center justify-between"}>
        {!onClose && (
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
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
              {isFisica ? <User className="size-5" /> : <Building2 className="size-5" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{pessoa.nome}</h1>
              <Badge variant="outline">{isFisica ? "Física" : "Jurídica"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isFisica ? "CPF" : "CNPJ"}: {formatDocumento(pessoa.tipo, pessoa.documento)}
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
            <span>{pessoa.telefone ? formatTelefone(pessoa.telefone) : "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span>{pessoa.email || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <span>{endereco || "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isFisica ? "Dados Pessoais" : "Dados da Empresa"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {isFisica ? (
              <>
                <div>
                  <p className="text-muted-foreground">RG</p>
                  <p>{pessoa.rg || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de Nascimento</p>
                  <p>{pessoa.dataNascimento ? formatData(pessoa.dataNascimento) : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado Civil</p>
                  <p>{pessoa.estadoCivil ? ESTADO_CIVIL_LABEL[pessoa.estadoCivil] ?? pessoa.estadoCivil : "—"}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground">Nome Fantasia</p>
                  <p>{pessoa.nomeFantasia || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inscrição Estadual</p>
                  <p>{pessoa.inscricaoEstadual || "—"}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-xs text-muted-foreground">
        As seções abaixo exibem dados ilustrativos — os módulos correspondentes ainda não foram implementados.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tractor className="size-4" /> Propriedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fazenda</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Município</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROPRIEDADES_FICTICIAS.map((p) => (
                <TableRow key={p.nome}>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell><Badge variant="secondary">{p.papel}</Badge></TableCell>
                  <TableCell>{p.area}</TableCell>
                  <TableCell>{p.municipio}</TableCell>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPRAS_FICTICIAS.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{formatData(c.data)}</TableCell>
                  <TableCell>{c.produto}</TableCell>
                  <TableCell>{c.quantidade}</TableCell>
                  <TableCell>{c.valor}</TableCell>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRODUTOS_FORNECIDOS_FICTICIOS.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{formatData(p.data)}</TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell>{p.quantidade}</TableCell>
                  <TableCell>{p.valor}</TableCell>
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
