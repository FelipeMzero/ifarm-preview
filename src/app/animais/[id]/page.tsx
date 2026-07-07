'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Edit, Calendar, Beef, Scale } from 'lucide-react';
import '../animais.css';

export default function AnimalDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [animal, setAnimal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      const res = await fetch(`/api/animais/${unwrappedParams.id}`);
      if (!res.ok) throw new Error("Não encontrado");
      const data = await res.json();
      setAnimal(data);
    } catch (error) {
      alert("Animal não encontrado.");
      router.push('/animais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [unwrappedParams.id]);

  const handleExcluir = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir este animal?\nEssa ação não pode ser desfeita.`)) return;
    
    try {
      const res = await fetch(`/api/animais/${unwrappedParams.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Animal excluído com sucesso!');
        router.push('/animais');
      } else {
        alert('Erro ao excluir animal.');
      }
    } catch (err) {
      alert('Erro de rede ao excluir.');
    }
  };

  if (loading) {
    return (
      <div className="animais-container">
        <div className="loading-center"><div className="spinner" /></div>
      </div>
    );
  }

  if (!animal) return null;

  const formatData = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
  };

  return (
    <div className="animais-container">
      <div className="page-header" style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary" style={{ padding: 8, borderRadius: '50%' }} onClick={() => router.push('/animais')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: 32, margin: 0 }}>
              {animal.brinco || animal.rfid || 'Animal S/N'}
            </h1>
            <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {animal.raca?.nome || 'Sem Raça'} 
              <span>•</span> 
              {animal.sexo === 'MACHO' ? <span style={{ color: '#3b82f6', fontWeight: 700 }}>♂ Macho</span> : <span style={{ color: '#ec4899', fontWeight: 700 }}>♀ Fêmea</span>}
              <span>•</span>
              <span className={`badge ${animal.status === 'ATIVO' ? 'badge-green' : 'badge-gray'}`}>{animal.status}</span>
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => alert('Função de edição em breve!')}>
            <Edit size={16} /> Editar
          </button>
          <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={handleExcluir}>
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      </div>

      {/* Cards de Destaque (KPIs) */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Peso Atual</div>
          <div className="stat-value" style={{ color: 'var(--col-primary)' }}>
            {animal.pesoAtualKg ? `${animal.pesoAtualKg} kg` : '—'}
          </div>
          <div className="stat-sub">Registrado no sistema</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Nascimento</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {formatData(animal.dataNascimento)}
          </div>
          <div className="stat-sub">Data de nascimento</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Lote Atual</div>
          <div className="stat-value" style={{ fontSize: 18, color: 'var(--col-secondary)' }}>
            {animal.lote?.nome || 'Sem Lote'}
          </div>
          <div className="stat-sub">Classificação</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Origem</div>
          <div className="stat-value" style={{ fontSize: 16, textTransform: 'capitalize' }}>
            {animal.origem.toLowerCase()}
          </div>
          <div className="stat-sub">Tipo de Entrada</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Detalhes de Identificação */}
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--col-text3)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Beef size={16} /> Informações de Identificação
          </h3>
          
          <div className="detail-row">
            <span className="detail-label">Brinco Oficial</span>
            <span className="detail-value">{animal.brinco || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">RFID / Chip</span>
            <span className="detail-value" style={{ fontFamily: 'monospace' }}>{animal.rfid || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Apelido</span>
            <span className="detail-value">{animal.nome || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Raça</span>
            <span className="detail-value">{animal.raca?.nome || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Sexo</span>
            <span className="detail-value">{animal.sexo === 'MACHO' ? 'Macho' : 'Fêmea'}</span>
          </div>
        </div>

        {/* Histórico e Origem */}
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--col-text3)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} /> Origem e Aquisição
          </h3>

          <div className="detail-row">
            <span className="detail-label">Fazenda Origem</span>
            <span className="detail-value">{animal.fazendaOrigem?.nome || animal.fazendaOrigemNome || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Data de Aquisição</span>
            <span className="detail-value">{formatData(animal.dataAquisicao)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Valor da Compra</span>
            <span className="detail-value">
              {animal.valorCompra ? `R$ ${parseFloat(animal.valorCompra).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '—'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Idade na Entrada</span>
            <span className="detail-value">{animal.idadeEntradaMeses != null ? `${animal.idadeEntradaMeses} meses` : '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Data Cadastro</span>
            <span className="detail-value">{formatData(animal.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Linhagem Genética */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--col-text3)', marginBottom: 16 }}>
          Linhagem Genética
        </h3>
        <div className="grid-2">
          <div className="detail-row" style={{ borderBottom: 'none', background: 'var(--col-surface2)', padding: '12px', borderRadius: '8px' }}>
            <span className="detail-label">Mãe</span>
            <span className="detail-value">{animal.mae?.brinco || animal.mae?.rfid || '—'}</span>
          </div>
          <div className="detail-row" style={{ borderBottom: 'none', background: 'var(--col-surface2)', padding: '12px', borderRadius: '8px' }}>
            <span className="detail-label">Pai</span>
            <span className="detail-value">{animal.pai?.brinco || animal.pai?.rfid || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
