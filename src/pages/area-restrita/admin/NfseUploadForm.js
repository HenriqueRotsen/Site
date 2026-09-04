import React, { useCallback, useMemo, useRef, useState } from 'react';
import { formatBRL, formatDate, maskCnpjInput } from '../../../api/billing';
import { extractDanfseFromPdf, NFSE_PRESTADOR } from '../../../utils/danfseExtract';
import { SearchableSelect } from './SearchableSelect';

function reaisInputToCents(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw) && !raw.includes(',')) return parseInt(raw, 10) * 100;
  const normalized = raw.replace(/[R$\s]/gi, '').replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function countExtractedFields(parsed) {
  return [
    parsed.accessKey,
    parsed.number,
    parsed.competenceDate,
    parsed.amount,
    parsed.takerCnpj,
    parsed.serviceCode,
    parsed.serviceDescription,
  ].filter(Boolean).length;
}

function clientCnpjDigits(client) {
  return String(client?.cnpjDigits || client?.hint || client?.searchText || '').replace(/\D/g, '');
}

function findClientByCnpj(clients, cnpjValue) {
  const digits = String(cnpjValue || '').replace(/\D/g, '');
  if (digits.length !== 14 || digits === NFSE_PRESTADOR.cnpjDigits) return null;
  return clients.find((c) => clientCnpjDigits(c) === digits) || null;
}

function takerFromClient(client) {
  if (!client) return { takerName: '', takerCnpj: '' };
  return {
    takerName: client.label || '',
    takerCnpj: client.hint && !String(client.hint).includes('*')
      ? maskCnpjInput(client.hint)
      : client.cnpjFormatted
        ? maskCnpjInput(client.cnpjFormatted)
        : '',
  };
}

export function NfseUploadForm({
  form,
  setForm,
  file,
  setFile,
  clientOptions,
  uploading,
  onCancel,
  onSubmit,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState(null);

  const selectedClient = useMemo(
    () => clientOptions.find((c) => c.value === form.clientId) || null,
    [clientOptions, form.clientId]
  );

  const selectClient = useCallback(
    (clientId) => {
      const client = clientOptions.find((c) => c.value === clientId) || null;
      const taker = takerFromClient(client);
      setForm((prev) => ({
        ...prev,
        clientId: clientId || '',
        takerName: taker.takerName,
        takerCnpj: taker.takerCnpj,
      }));
    },
    [clientOptions, setForm]
  );

  const applyParsed = useCallback(
    (parsed, clients) => {
      const matchedClient = findClientByCnpj(clients, parsed.takerCnpj);
      const taker = matchedClient
        ? takerFromClient(matchedClient)
        : { takerName: '', takerCnpj: '' };

      setForm((prev) => ({
        ...prev,
        clientId: matchedClient?.value || '',
        accessKey: parsed.accessKey || prev.accessKey,
        number: parsed.number || prev.number,
        competenceDate: parsed.competenceDate || prev.competenceDate,
        issuedAt: parsed.issuedAt || prev.issuedAt,
        dpsNumber: parsed.dpsNumber || prev.dpsNumber,
        dpsSeries: parsed.dpsSeries || prev.dpsSeries,
        takerName: taker.takerName,
        takerCnpj: taker.takerCnpj,
        serviceCode: parsed.serviceCode || prev.serviceCode,
        serviceDescription: parsed.serviceDescription || prev.serviceDescription,
        amount: parsed.amount || prev.amount,
        municipality: parsed.municipality || prev.municipality,
      }));

      return {
        filled: countExtractedFields(parsed),
        matchedClient: Boolean(matchedClient),
        extractedTakerCnpj: Boolean(parsed.takerCnpj),
      };
    },
    [setForm]
  );

  const processFile = useCallback(
    async (nextFile) => {
      if (!nextFile) return;
      if (nextFile.type && !nextFile.type.includes('pdf')) {
        setExtractStatus({ tone: 'error', message: 'Envie um arquivo PDF da DANFSe.' });
        return;
      }

      setFile(nextFile);
      setExtracting(true);
      setExtractStatus({ tone: 'info', message: 'Lendo o PDF e extraindo os dados...' });

      try {
        const { parsed } = await extractDanfseFromPdf(nextFile);
        const result = applyParsed(parsed, clientOptions);
        if (result.matchedClient) {
          setExtractStatus({
            tone: 'success',
            message: 'Dados extraídos. Tomador identificado e vinculado ao cliente cadastrado.',
          });
        } else if (result.filled >= 4) {
          setExtractStatus({
            tone: 'warning',
            message: result.extractedTakerCnpj
              ? 'Dados extraídos, mas o tomador do PDF não bate com nenhum cliente. Selecione o tomador no menu.'
              : 'Dados extraídos. Selecione o tomador (cliente) no menu suspenso.',
          });
        } else {
          setExtractStatus({
            tone: 'warning',
            message:
              'PDF carregado, mas poucos campos foram reconhecidos. Preencha o que faltar e selecione o tomador.',
          });
        }
      } catch (err) {
        setExtractStatus({
          tone: 'error',
          message: err.message || 'Não foi possível ler o PDF. Preencha os campos manualmente.',
        });
      } finally {
        setExtracting(false);
      }
    },
    [applyParsed, clientOptions, setFile]
  );

  const amountCents = reaisInputToCents(form.amount);

  return (
    <form className="admin-form nfse-upload" onSubmit={onSubmit}>
      <section
        className={`nfse-dropzone ${dragOver ? 'is-dragover' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={async (event) => {
          event.preventDefault();
          setDragOver(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped) await processFile(dropped);
        }}
      >
        <input
          ref={inputRef}
          id="nfse-pdf"
          type="file"
          accept="application/pdf,.pdf"
          className="nfse-dropzone__input"
          onChange={(e) => processFile(e.target.files?.[0] || null)}
        />
        <div className="nfse-dropzone__content">
          <div className="nfse-dropzone__icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
            </svg>
          </div>
          <div>
            <strong>{file ? file.name : 'Arraste o PDF da DANFSe aqui'}</strong>
            <p>
              {extracting
                ? 'Extraindo informações...'
                : file
                  ? 'Os campos abaixo foram preenchidos automaticamente. Você pode trocar o arquivo.'
                  : 'ou clique para selecionar. Os dados da nota serão lidos automaticamente.'}
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--secondary admin-btn--sm"
            onClick={() => inputRef.current?.click()}
            disabled={extracting || uploading}
          >
            {file ? 'Trocar PDF' : 'Selecionar PDF'}
          </button>
        </div>
      </section>

      {extractStatus && (
        <div className={`nfse-extract-alert nfse-extract-alert--${extractStatus.tone}`}>
          {extractStatus.message}
        </div>
      )}

      <div className="nfse-summary-cards">
        <article className="nfse-summary-card nfse-summary-card--wide">
          <span>Prestador (fixo)</span>
          <strong>{NFSE_PRESTADOR.legalName}</strong>
          <small>{NFSE_PRESTADOR.cnpj}</small>
        </article>
        <article className="nfse-summary-card nfse-summary-card--wide">
          <span>Tomador</span>
          <strong>{selectedClient?.label || form.takerName || 'Selecione no menu abaixo'}</strong>
          {(selectedClient?.hint || form.takerCnpj) && (
            <small>{selectedClient?.hint || form.takerCnpj}</small>
          )}
        </article>
        {(form.number || form.amount || form.competenceDate) && (
          <>
            <article className="nfse-summary-card">
              <span>Número</span>
              <strong>{form.number || '—'}</strong>
            </article>
            <article className="nfse-summary-card">
              <span>Competência</span>
              <strong>{form.competenceDate ? formatDate(form.competenceDate) : '—'}</strong>
            </article>
            <article className="nfse-summary-card">
              <span>Valor</span>
              <strong>{amountCents ? formatBRL(amountCents) : form.amount || '—'}</strong>
            </article>
          </>
        )}
      </div>

      <section className="nfse-card">
        <header className="nfse-card__header">
          <h3>Tomador do serviço</h3>
          <p>Selecione um cliente cadastrado — ele é o tomador e verá a nota no portal</p>
        </header>
        <div className="nfse-card__body">
          <div className="admin-field">
            <label htmlFor="nfse-client">Tomador (cliente)</label>
            <SearchableSelect
              id="nfse-client"
              value={form.clientId}
              onChange={selectClient}
              options={clientOptions}
              placeholder="Buscar cliente cadastrado..."
              required
            />
          </div>
          {selectedClient && (
            <div className="nfse-party-readonly">
              <div>
                <span>Nome</span>
                <strong>{form.takerName || selectedClient.label}</strong>
              </div>
              <div>
                <span>CNPJ</span>
                <strong>{form.takerCnpj || selectedClient.hint || '—'}</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="nfse-card">
        <header className="nfse-card__header">
          <h3>Identificação da nota</h3>
          <p>Dados principais da DANFSe</p>
        </header>
        <div className="nfse-card__body">
          <div className="admin-form-grid admin-form-grid--3">
            <div className="admin-field">
              <label>Número da NFS-e</label>
              <input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                required
              />
            </div>
            <div className="admin-field">
              <label>Competência</label>
              <input
                type="date"
                value={form.competenceDate}
                onChange={(e) => setForm({ ...form, competenceDate: e.target.value })}
                required
              />
            </div>
            <div className="admin-field">
              <label>Valor (R$)</label>
              <input
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="600,00"
                required
              />
            </div>
            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <label>Chave de acesso</label>
              <input
                value={form.accessKey}
                onChange={(e) => setForm({ ...form, accessKey: e.target.value.replace(/\D/g, '') })}
                placeholder="Somente números"
                required
              />
            </div>
            <div className="admin-field">
              <label>Emissão</label>
              <input
                value={form.issuedAt}
                onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                placeholder="07/07/2026 13:29:32"
              />
            </div>
            <div className="admin-field">
              <label>Nº DPS</label>
              <input
                value={form.dpsNumber}
                onChange={(e) => setForm({ ...form, dpsNumber: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Série DPS</label>
              <input
                value={form.dpsSeries}
                onChange={(e) => setForm({ ...form, dpsSeries: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="nfse-card">
        <header className="nfse-card__header">
          <h3>Serviço</h3>
          <p>Código, município e descrição da prestação</p>
        </header>
        <div className="nfse-card__body">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Código do serviço</label>
              <input
                value={form.serviceCode}
                onChange={(e) => setForm({ ...form, serviceCode: e.target.value })}
                placeholder="17.02.01"
              />
            </div>
            <div className="admin-field">
              <label>Município</label>
              <input
                value={form.municipality}
                onChange={(e) => setForm({ ...form, municipality: e.target.value })}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <label>Descrição do serviço</label>
              <textarea
                rows={3}
                value={form.serviceDescription}
                onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={onCancel} disabled={uploading}>
          Cancelar
        </button>
        <button type="submit" className="admin-btn" disabled={uploading || extracting || !file || !form.clientId}>
          {uploading ? 'Enviando...' : 'Salvar NFS-e'}
        </button>
      </div>
    </form>
  );
}
