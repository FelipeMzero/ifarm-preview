'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './animais.css';
import ModalAnimal from './ModalAnimal';
import { Plus, Search, Eye, Beef, Download } from 'lucide-react';

const STATUS_BADGE: any = { 
  ATIVO: 'badge-green', 
  VENDIDO: 'badge-sky', 
  MORTO: 'badge-red', 
  TRANSFERIDO: 'badge-amber', 
  DESCARTE: 'badge-gray', 
  ABATE: 'badge-red' 
};

const SEXO_LABEL: any = {
  MACHO: <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: '1.1em' }}>♂ <span style={{ fontSize: '0.85em', fontWeight: 600 }}>Macho</span></span>,
  FEMEA: <span style={{ color: '#ec4899', fontWeight: 800, fontSize: '1.1em' }}>♀ <span style={{ fontSize: '0.85em', fontWeight: 600 }}>Fêmea</span></span>
};

export default function AnimaisPage() {
  const router = useRouter();
  const [animais, setAnimais] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ATIVO');
  const [showModal, setShowModal] = useState(false);
  
  const [lotes, setLotes] = useState([]);
  const [racas, setRacas] = useState([]);
  const [fazendas, setFazendas] = useState([]);
  const [animaisFazenda, setAnimaisFazenda] = useState([]);

  const carregarMetadados = async () => {
    try {
      const res = await fetch('/api/metadados');
      const data = await res.json();
      if (data) {
        setLotes(data.lotes || []);
        setRacas(data.racas || []);
        setFazendas(data.fazendas || []);
        setAnimaisFazenda(data.animaisFazenda || []);
      }
    } catch (e) {
      console.error('Erro metadados:', e);
    }
  };

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const res = await fetch(`/api/animais?${params.toString()}`);
      const json = await res.json();
      setAnimais(json.data || []);
      setTotal(json.total || 0);
    } catch { 
      setAnimais([]);
      setTotal(0);
    }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => {
    carregarMetadados();
  }, []);

  useEffect(() => { 
    const t = setTimeout(() => carregar(), 300); // Debounce
    return () => clearTimeout(t);
  }, [carregar]);

  const exportToCSV = () => {
    if (animais.length === 0) {
      alert('Não há animais para exportar');
      return;
    }

    const headers = ['Brinco', 'RFID', 'Raça', 'Sexo', 'Idade (meses)', 'Peso Atual (kg)', 'Origem', 'Lote', 'Status'];
    const rows = animais.map((a: any) => [
      a.brinco || '—',
      a.rfid || '—',
      a.raca || '—',
      a.sexo || '—',
      a.idadeMeses || '—',
      a.pesoAtualKg || '—',
      a.origem || '—',
      a.loteNome || '—',
      a.status || '—'
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `animais_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animais-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Animais</h1>
          <p className="page-sub">{total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Novo Animal
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={15} style={{ flexShrink: 0 }} />
          <input placeholder="Buscar por brinco, RFID ou apelido..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="VENDIDO">Vendidos</option>
          <option value="MORTO">Mortos</option>
          <option value="TRANSFERIDO">Transferidos</option>
          <option value="ABATE">Abatidos</option>
          <option value="DESCARTE">Descarte</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : animais.length === 0 ? (
            <div className="empty-state">
              <Beef size={40} style={{ opacity: .3 }} />
              <p className="empty-state-text">Nenhum animal listado.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Brinco</th>
                  <th>RFID</th>
                  <th>Raça</th>
                  <th>Sexo</th>
                  <th>Idade</th>
                  <th>Peso Atual</th>
                  <th>Origem</th>
                  <th>Lote</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {animais.map((a: any) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.brinco || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.rfid || '—'}</td>
                    <td>{a.raca || '—'}</td>
                    <td>{SEXO_LABEL[a.sexo] || a.sexo}</td>
                    <td>{a.idadeMeses != null ? `${a.idadeMeses} meses` : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{a.pesoAtualKg ? `${a.pesoAtualKg} kg` : '—'}</td>
                    <td><span className="badge badge-gray">{a.origem}</span></td>
                    <td>{a.loteNome ? <span className="badge badge-gray">{a.loteNome}</span> : '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{a.status}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/animais/${a.id}`)}>
                        <Eye size={13} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <ModalAnimal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); carregar(); carregarMetadados(); }}
          lotes={lotes}
          racas={racas}
          fazendas={fazendas}
          animaisFazenda={animaisFazenda}
        />
      )}
    </div>
  );
}
