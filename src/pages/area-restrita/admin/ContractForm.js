import React, { useEffect, useMemo, useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { formatAddressLine } from '../../../utils/brazilianInput';
import { billingApi, maskCnpjInput } from '../../../api/billing';
import { fillContractTemplate } from '../../../utils/contractFill';

const SYSTEM_PARTY_KEYS = new Set([
  'issuerName',
  'issuerLegalName',
  'issuerCivilName',
  'issuerCnpj',
  'issuerCpf',
  'issuerDocument',
  'issuerStateRegistration',
  'issuerAddress',
  'issuerEmail',
  'issuerSite',
  'issuerCityUf',
  'issuerPhone',
  'clientLegalName',
  'clientTradeName',
  'clientCnpj',
  'clientStateRegistration',
  'clientAddress',
  'clientZip',
  'clientCityUf',
  'clientEmail',
  'clientPhone',
]);

function isSystemPartyKey(key) {
  const k = String(key || '');
  return SYSTEM_PARTY_KEYS.has(k) || k.startsWith('issuer');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export const emptyContractForm = {
  templateId: '',
  clientId: '',
  sendEmail: '',
  ccEmails: '',
  variables: {},
  bodyText: '',
};

/** Mapeia o cadastro da contratada para as variáveis {{issuer*}} (assinaturas etc.). */
export function issuerPartyVariables(issuer) {
  if (!issuer) return {};
  const cnpj = String(issuer.cnpj || '').trim();
  return {
    issuerName: String(issuer.name || '').trim(),
    issuerLegalName: String(issuer.legalName || '').trim(),
    issuerCivilName: String(issuer.civilName || '').trim(),
    issuerCnpj: cnpj,
    issuerCpf: String(issuer.cpf || '').trim(),
    issuerDocument: cnpj,
    issuerStateRegistration: String(issuer.stateRegistration || '').trim(),
    issuerAddress: String(issuer.address || '').trim(),
    issuerEmail: String(issuer.email || '').trim(),
    issuerSite: String(issuer.site || '').trim(),
    issuerCityUf: String(issuer.cityUf || '').trim(),
    issuerPhone: String(issuer.phone || '').trim(),
  };
}

function fillBody(template, variables, issuerVars = {}) {
  // issuerVars por último: não deixa campos vazios do formulário apagarem a contratada
  return fillContractTemplate(template, { ...variables, ...issuerVars });
}

function applyIssuerToBody(bodyText, issuerVars = {}) {
  if (!bodyText || !Object.keys(issuerVars).length) return bodyText;
  if (!/\{\{\s*issuer[A-Za-z0-9_]*\s*\}\}/.test(bodyText)) return bodyText;
  return fillContractTemplate(bodyText, issuerVars);
}

function defaultsFromTemplate(template) {
  const vars = {};
  (template?.variables || []).forEach((v) => {
    if (isSystemPartyKey(v.key)) return;
    if (v.defaultValue != null && v.defaultValue !== '') vars[v.key] = String(v.defaultValue);
    else if (v.type === 'date' && v.key === 'contractDate') vars[v.key] = todayIso();
    else vars[v.key] = '';
  });
  if (!vars.contractDate) vars.contractDate = todayIso();
  return vars;
}

function clientPartyVariables(full, option, sendEmail) {
  const address = full ? formatAddressLine(full) : '';
  return {
    clientLegalName: full?.legalName || option?.label || '',
    clientTradeName: full?.contactName || '',
    clientCnpj: full?.cnpjFormatted
      ? maskCnpjInput(full.cnpjFormatted)
      : option?.hint
        ? maskCnpjInput(option.hint)
        : '',
    clientAddress: address,
    clientEmail: full?.billingEmail || sendEmail || '',
    clientZip: full?.addressZip || '',
    clientCityUf:
      full?.addressCity && full?.addressState
        ? `${full.addressCity} / ${full.addressState}`
        : full?.addressCity || '',
    clientPhone: full?.contactPhone || '',
  };
}

export function ContractForm({
  form,
  setForm,
  clientOptions,
  clientsById,
  templates = [],
  submitting,
  previewing,
  onCancel,
  onPreview,
  onSubmit,
  mode = 'create',
  contractNumber = null,
}) {
  const [bodyTouched, setBodyTouched] = useState(false);
  const [issuerVars, setIssuerVars] = useState({});
  const isRectify = mode === 'rectify';

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === form.templateId) || null,
    [templates, form.templateId]
  );

  const editableVariables = useMemo(
    () => (selectedTemplate?.variables || []).filter((v) => v?.key && !isSystemPartyKey(v.key)),
    [selectedTemplate]
  );

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
    hint: t.description || '',
    searchText: `${t.name} ${t.description || ''}`,
  }));

  useEffect(() => {
    let cancelled = false;
    billingApi
      .getIssuer()
      .then((data) => {
        if (cancelled) return;
        const nextIssuer = issuerPartyVariables(data.issuer);
        setIssuerVars(nextIssuer);
        setForm((prev) => ({
          ...prev,
          variables: { ...prev.variables, ...nextIssuer },
          bodyText: applyIssuerToBody(prev.bodyText, nextIssuer),
        }));
      })
      .catch(() => {
        if (!cancelled) setIssuerVars({});
      });
    return () => {
      cancelled = true;
    };
  }, [setForm]);

  useEffect(() => {
    if (!selectedTemplate || bodyTouched) return;
    setForm((prev) => {
      const next = fillBody(selectedTemplate.bodyTemplate, prev.variables || {}, issuerVars);
      if (next === prev.bodyText) return prev;
      return { ...prev, bodyText: next };
    });
  }, [selectedTemplate, form.variables, issuerVars, bodyTouched, setForm]);

  const selectTemplate = (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    setBodyTouched(false);
    setForm((prev) => {
      const partyKeys = Object.fromEntries(
        Object.entries(prev.variables || {}).filter(
          ([key]) => isSystemPartyKey(key) || key.startsWith('clientRepresentative') || key.startsWith('issuer')
        )
      );
      const variables = {
        ...defaultsFromTemplate(template),
        ...partyKeys,
        ...issuerVars,
      };
      return {
        ...prev,
        templateId: templateId || '',
        variables,
        bodyText: template ? fillBody(template.bodyTemplate, variables, issuerVars) : '',
      };
    });
  };

  const selectClient = (clientId) => {
    const option = clientOptions.find((c) => c.value === clientId);
    const full = clientsById?.[clientId];
    setForm((prev) => {
      const party = clientPartyVariables(full, option, prev.sendEmail);
      const variables = {
        ...prev.variables,
        ...party,
        ...issuerVars,
      };
      return {
        ...prev,
        clientId: clientId || '',
        sendEmail: full?.billingEmail || prev.sendEmail,
        variables,
        bodyText:
          !bodyTouched && selectedTemplate
            ? fillBody(selectedTemplate.bodyTemplate, variables, issuerVars)
            : applyIssuerToBody(prev.bodyText, issuerVars),
      };
    });
  };

  const updateVariable = (key, value) => {
    setForm((prev) => {
      const variables = { ...prev.variables, [key]: value, ...issuerVars };
      return {
        ...prev,
        variables,
        bodyText:
          !bodyTouched && selectedTemplate
            ? fillBody(selectedTemplate.bodyTemplate, variables, issuerVars)
            : applyIssuerToBody(prev.bodyText, issuerVars),
      };
    });
  };

  const renderField = (variable) => {
    const value = form.variables?.[variable.key] ?? '';
    if (variable.type === 'textarea') {
      return (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => updateVariable(variable.key, e.target.value)}
          required={variable.required}
        />
      );
    }
    if (variable.type === 'select' && Array.isArray(variable.options)) {
      return (
        <select
          className="tpl-var-select"
          value={value}
          onChange={(e) => updateVariable(variable.key, e.target.value)}
          required={variable.required}
        >
          <option value="">Selecione...</option>
          {variable.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    const inputType = variable.type === 'date' ? 'date' : variable.type === 'number' ? 'number' : 'text';
    return (
      <input
        type={inputType}
        value={value}
        onChange={(e) => {
          const next =
            variable.key === 'clientCnpj' || variable.key === 'issuerDocument'
              ? maskCnpjInput(e.target.value)
              : e.target.value;
          updateVariable(variable.key, next);
        }}
        required={variable.required}
        placeholder={variable.type === 'money' ? '0,00' : ''}
      />
    );
  };

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <section className="nfse-card">
        <header className="nfse-card__header">
          <h3>{isRectify ? 'Retificação' : 'Modelo e partes'}</h3>
          {isRectify ? (
            <p>Mantém o número {contractNumber || '—'}. O documento sai como retificado.</p>
          ) : null}
        </header>
        <div className="nfse-card__body">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="contract-template">Modelo de contrato</label>
              <SearchableSelect
                id="contract-template"
                value={form.templateId}
                onChange={selectTemplate}
                options={templateOptions}
                placeholder="Buscar modelo..."
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="contract-client">Contratante</label>
              <SearchableSelect
                id="contract-client"
                value={form.clientId}
                onChange={selectClient}
                options={clientOptions}
                placeholder="Buscar empresa..."
                required
                disabled={isRectify}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="contract-email">Destinatário (Para)</label>
              <input
                id="contract-email"
                type="email"
                value={form.sendEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, sendEmail: e.target.value }))}
                placeholder="destinatario@empresa.com"
                required
              />
              <small className="admin-field-hint">Enviado de contato@henriquerotsen.com.br · você sempre recebe cópia</small>
            </div>
            <div className="admin-field">
              <label htmlFor="contract-cc">Com cópia (Cc)</label>
              <input
                id="contract-cc"
                type="text"
                value={form.ccEmails}
                onChange={(e) => setForm((prev) => ({ ...prev, ccEmails: e.target.value }))}
                placeholder="opcional@empresa.com, outro@empresa.com"
              />
              <small className="admin-field-hint">Além da sua cópia automática; separe por vírgula</small>
            </div>
          </div>
        </div>
      </section>

      {selectedTemplate && editableVariables.length > 0 && (
        <section className="nfse-card">
          <header className="nfse-card__header">
            <h3>Variáveis do modelo</h3>
          </header>
          <div className="nfse-card__body">
            <div className="admin-form-grid admin-form-grid--3">
              {editableVariables.map((variable) => (
                <div
                  key={variable.key}
                  className="admin-field"
                  style={variable.type === 'textarea' ? { gridColumn: '1 / -1' } : undefined}
                >
                  <label htmlFor={`contract-var-${variable.key}`}>
                    {variable.label || variable.key}
                  </label>
                  {renderField(variable)}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="nfse-card">
        <header className="nfse-card__header">
          <h3>Texto do contrato</h3>
        </header>
        <div className="nfse-card__body">
          <div className="admin-field">
            <textarea
              rows={22}
              value={form.bodyText}
              onChange={(e) => {
                setBodyTouched(true);
                setForm((prev) => ({ ...prev, bodyText: e.target.value }));
              }}
              required
              disabled={!form.templateId}
            />
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--secondary admin-btn--sm"
            disabled={!selectedTemplate}
            onClick={() => {
              setBodyTouched(false);
              setForm((prev) => {
                const variables = { ...prev.variables, ...issuerVars };
                return {
                  ...prev,
                  variables,
                  bodyText: fillBody(selectedTemplate.bodyTemplate, variables, issuerVars),
                };
              });
            }}
          >
            Restaurar modelo
          </button>
        </div>
      </section>

      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={onPreview} disabled={submitting || previewing || !form.templateId}>
          {previewing ? 'Gerando prévia...' : 'Ver prévia'}
        </button>
        <button type="submit" className="admin-btn" disabled={submitting || !form.clientId || !form.templateId}>
          {submitting
            ? isRectify
              ? 'Retificando...'
              : 'Enviando...'
            : isRectify
              ? 'Gerar retificação e enviar'
              : 'Gerar PDF e enviar'}
        </button>
      </div>
    </form>
  );
}
