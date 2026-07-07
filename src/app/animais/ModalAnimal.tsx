'use client';

import { useState } from 'react';

export default function ModalAnimal({ onClose, onSaved, lotes = [], racas = [], animaisFazenda = [], fazendas = [] }: any) {
  const [form, setForm] = useState({
    brinco: '', rfid: '', sexo: 'MACHO', racaId: '', loteId: '',
    dataNascimento: '', origem: 'NASCIMENTO',
    pesoNascimentoKg: '', nome: '',
    maeId: '', paiId: '',
    fazendaOrigem: '', fazendaOrigemId: '',
    dataAquisicao: '', valorCompra: '', idadeEntradaMeses: ''
  });
  const [loading, setLoading] = useState(false);
  
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/animais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Erro ao cadastrar');

      onSaved();
    } catch (error) {
      console.error(error);
      alert('Erro ao cadastrar animal.');
    } finally { 
      setLoading(false); 
    }
  };

  const isCompraTransf = form.origem === 'COMPRA' || form.origem === 'TRANSFERENCIA';

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h2 className="modal-title">Novo Animal</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 10px' }}>Identificação</p>
          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">RFID / Chip</label>
              <input className="form-control" placeholder="Ex: 900082000169813" value={form.rfid} onChange={e => set('rfid', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Brinco</label>
              <input className="form-control" placeholder="Ex: MS-001234" value={form.brinco} onChange={e => set('brinco', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Apelido</label>
              <input className="form-control" placeholder="Opcional" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sexo *</label>
              <select className="form-control" value={form.sexo} onChange={e => set('sexo', e.target.value)} required>
                <option value="MACHO">Macho</option>
                <option value="FEMEA">Fêmea</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Raça</label>
              <select className="form-control" value={form.racaId} onChange={e => set('racaId', e.target.value)}>
                <option value="">Selecionar...</option>
                {racas.map((r: any) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lote</label>
              <select className="form-control" value={form.loteId} onChange={e => set('loteId', e.target.value)}>
                <option value="">Sem lote</option>
                {lotes.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data Nascimento</label>
              <input className="form-control" type="date" value={form.dataNascimento} onChange={e => set('dataNascimento', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Peso Nascimento (kg)</label>
              <input className="form-control" type="number" step="0.1" min="0" placeholder="Ex: 32.5" value={form.pesoNascimentoKg} onChange={e => set('pesoNascimentoKg', e.target.value)} />
            </div>
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '18px 0 10px' }}>Filiação (opcional)</p>
          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Mãe</label>
              <select className="form-control" value={form.maeId} onChange={e => set('maeId', e.target.value)}>
                <option value="">Selecionar mãe...</option>
                {animaisFazenda.filter((a: any) => a.sexo === 'FEMEA').map((a: any) => (
                  <option key={a.id} value={a.id}>{a.brinco || a.rfid || a.id.slice(0,8)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pai (Touro)</label>
              <select className="form-control" value={form.paiId} onChange={e => set('paiId', e.target.value)}>
                <option value="">Selecionar pai...</option>
                {animaisFazenda.filter((a: any) => a.sexo === 'MACHO').map((a: any) => (
                  <option key={a.id} value={a.id}>{a.brinco || a.rfid || a.id.slice(0,8)}</option>
                ))}
              </select>
            </div>
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '18px 0 10px' }}>Origem</p>
          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Origem *</label>
              <select className="form-control" value={form.origem} onChange={e => set('origem', e.target.value)}>
                <option value="NASCIMENTO">Nascimento</option>
                <option value="COMPRA">Compra</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </div>

            {isCompraTransf && (
              <>
                <div className="form-group">
                  <label className="form-label">Data de Aquisição *</label>
                  <input className="form-control" type="date" value={form.dataAquisicao} onChange={e => set('dataAquisicao', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fazenda de Origem</label>
                  <select className="form-control" value={form.fazendaOrigemId} onChange={(e: any) => {
                    const sel = fazendas.find((f: any) => f.id.toString() === e.target.value);
                    set('fazendaOrigemId', e.target.value);
                    set('fazendaOrigem', sel?.nome || '');
                  }}>
                    <option value="">Selecionar fazenda...</option>
                    {fazendas.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nome da Fazenda (se externa)</label>
                  <input className="form-control" placeholder="Ex: Fazenda Santa Fé" value={form.fazendaOrigem} onChange={e => set('fazendaOrigem', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Idade na Entrada (meses)</label>
                  <input className="form-control" type="number" min="0" placeholder="Ex: 8" value={form.idadeEntradaMeses} onChange={e => set('idadeEntradaMeses', e.target.value)} />
                </div>
              </>
            )}

            {form.origem === 'COMPRA' && (
              <div className="form-group">
                <label className="form-label">Valor da Compra (R$) *</label>
                <input className="form-control" type="number" step="0.01" min="0" placeholder="Ex: 3500.00" value={form.valorCompra} onChange={e => set('valorCompra', e.target.value)} required />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processando...' : 'Cadastrar Animal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
