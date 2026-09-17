import React, { useRef } from 'react';
import {
  renameKeyInBody,
  stripKeyFromBody,
  syncVariablesFromBody,
} from '../../../utils/templateVarSync';

const VAR_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'date', label: 'Data' },
  { value: 'money', label: 'Dinheiro' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Lista' },
];

const BLOCK_SHORTCUTS = [
  {
    id: 'title',
    label: 'Título',
    snippet: '[TITLE]\nTítulo do contrato\n[/TITLE]\n\n',
  },
  {
    id: 'table',
    label: 'Tabela',
    snippet: '[TABLE]\nColuna A | Coluna B\nValor 1 | Valor 2\n[/TABLE]\n\n',
  },
  {
    id: 'checklist',
    label: 'Checklist',
    snippet: '[CHECKLIST]\nItem a conferir\nOutro item\n[/CHECKLIST]\n\n',
  },
  {
    id: 'signatures',
    label: 'Assinaturas',
    snippet:
      '[SIGNATURES]\nCONTRATADA\nNome: {{issuerCivilName}}\nCNPJ: {{issuerDocument}}\n---\nCONTRATANTE\nRazão social: {{clientLegalName}}\nNome do representante: {{clientRepresentativeName}}\n---\nTESTEMUNHAS\nNome: ________________________________\nCPF: _________________________________\n[/SIGNATURES]\n\n',
  },
];

export const emptyTemplateForm = {
  name: '',
  description: '',
  bodyTemplate: '',
  variables: [],
};

function slugKey(label) {
  return String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .replace(/^[0-9]/, '')
    .toLowerCase()
    .slice(0, 40);
}

function insertAtCursor(textarea, current, snippet) {
  if (!textarea) {
    return { next: `${current || ''}${snippet}`, cursor: (current || '').length + snippet.length };
  }
  const start = textarea.selectionStart ?? (current || '').length;
  const end = textarea.selectionEnd ?? start;
  const before = (current || '').slice(0, start);
  const after = (current || '').slice(end);
  return { next: `${before}${snippet}${after}`, cursor: start + snippet.length };
}

export function ContractTemplateForm({
  form,
  setForm,
  submitting,
  onCancel,
  onSubmit,
  isEdit = false,
}) {
  const bodyRef = useRef(null);

  const applyBody = (nextBody, variables = form.variables) => {
    setForm((prev) => ({
      ...prev,
      bodyTemplate: nextBody,
      variables: syncVariablesFromBody(nextBody, variables),
    }));
  };

  const updateVar = (idx, field, value) => {
    setForm((prev) => {
      const variables = [...prev.variables];
      const current = { ...variables[idx] };
      const oldKey = current.key;

      if (field === 'label' && !current.keyLocked) {
        current.label = value;
        current.key = slugKey(value) || current.key;
      } else if (field === 'key') {
        current.key = String(value || '').replace(/[^a-zA-Z0-9_]/g, '');
      } else {
        current[field] = value;
      }

      variables[idx] = current;

      let bodyTemplate = prev.bodyTemplate;
      if (field === 'key' && oldKey && current.key && oldKey !== current.key) {
        bodyTemplate = renameKeyInBody(bodyTemplate, oldKey, current.key);
      }

      return {
        ...prev,
        bodyTemplate,
        variables:
          field === 'key'
            ? syncVariablesFromBody(bodyTemplate, variables)
            : variables,
      };
    });
  };

  const addVar = () => {
    setForm((prev) => {
      const key = `campo_${prev.variables.length + 1}`;
      const variables = [
        ...prev.variables,
        { key, label: '', type: 'text', required: false, defaultValue: '', keyLocked: false },
      ];
      const bodyTemplate = `${prev.bodyTemplate || ''}${prev.bodyTemplate?.endsWith('\n') || !prev.bodyTemplate ? '' : '\n'}{{${key}}}`;
      return {
        ...prev,
        bodyTemplate,
        variables: syncVariablesFromBody(bodyTemplate, variables),
      };
    });
  };

  const removeVar = (idx) => {
    setForm((prev) => {
      const target = prev.variables[idx];
      const key = target?.key;
      const bodyTemplate = key ? stripKeyFromBody(prev.bodyTemplate, key) : prev.bodyTemplate;
      const variables = prev.variables.filter((_, i) => i !== idx);
      return {
        ...prev,
        bodyTemplate,
        variables: syncVariablesFromBody(bodyTemplate, variables),
      };
    });
  };

  const insertText = (snippet) => {
    const { next, cursor } = insertAtCursor(bodyRef.current, form.bodyTemplate, snippet);
    applyBody(next, form.variables);
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const insertPlaceholder = (key) => {
    if (!key) return;
    insertText(`{{${key}}}`);
  };

  const onBodyChange = (e) => {
    applyBody(e.target.value, form.variables);
  };

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <section className="nfse-card">
        <header className="nfse-card__header">
          <h3>{isEdit ? 'Editar modelo' : 'Novo modelo'}</h3>
        </header>
        <div className="nfse-card__body">
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <label>Nome do modelo</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Ex.: Implantação e suporte de sistemas"
              />
            </div>
            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <label>Descrição</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Uso interno: quando usar este modelo"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="nfse-card">
        <header className="nfse-card__header">
          <h3>Variáveis</h3>
        </header>
        <div className="nfse-card__body">
          <div className="admin-table-wrap tpl-var-table-wrap">
            <table className="admin-table tpl-var-table">
              <thead>
                <tr>
                  <th>Rótulo</th>
                  <th>Chave</th>
                  <th>Tipo</th>
                  <th>Padrão</th>
                  <th>Obrig.</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {form.variables.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: '#6b6b6b' }}>
                      Nenhuma variável no texto. Use {'{{chave}}'} ou adicione abaixo.
                    </td>
                  </tr>
                ) : (
                  form.variables.map((variable, idx) => (
                    <tr key={`var-${variable.key || idx}`}>
                      <td>
                        <input
                          className="tpl-var-input"
                          value={variable.label}
                          onChange={(e) => updateVar(idx, 'label', e.target.value)}
                          placeholder="Rótulo"
                          required
                        />
                      </td>
                      <td>
                        <div className="tpl-var-key-cell">
                          <input
                            className="tpl-var-input tpl-var-input--mono"
                            value={variable.key}
                            onChange={(e) => updateVar(idx, 'key', e.target.value)}
                            onBlur={() =>
                              setForm((prev) => {
                                const variables = [...prev.variables];
                                variables[idx] = { ...variables[idx], keyLocked: true };
                                return { ...prev, variables };
                              })
                            }
                            required
                            spellCheck={false}
                          />
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--secondary"
                            title="Inserir no texto"
                            onClick={() => insertPlaceholder(variable.key)}
                          >
                            {'{{}}'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <select
                          className="tpl-var-select"
                          value={variable.type}
                          onChange={(e) => updateVar(idx, 'type', e.target.value)}
                        >
                          {VAR_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="tpl-var-input"
                          value={variable.defaultValue || ''}
                          onChange={(e) => updateVar(idx, 'defaultValue', e.target.value)}
                          placeholder="—"
                        />
                      </td>
                      <td className="tpl-var-check-cell">
                        <label className="tpl-var-check">
                          <input
                            type="checkbox"
                            checked={Boolean(variable.required)}
                            onChange={(e) => updateVar(idx, 'required', e.target.checked)}
                          />
                          <span className="tpl-var-check__box" aria-hidden="true" />
                        </label>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          onClick={() => removeVar(idx)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={addVar}>
            Adicionar variável
          </button>
        </div>
      </section>

      <section className="nfse-card">
        <header className="nfse-card__header">
          <h3>Texto do modelo</h3>
        </header>
        <div className="nfse-card__body">
          <div className="tpl-block-shortcuts">
            <span className="tpl-block-shortcuts__label">Inserir bloco</span>
            <div className="tpl-block-shortcuts__list">
              {BLOCK_SHORTCUTS.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  className="admin-btn admin-btn--sm admin-btn--secondary"
                  onClick={() => insertText(block.snippet)}
                >
                  {block.label}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-field">
            <textarea
              ref={bodyRef}
              rows={24}
              value={form.bodyTemplate}
              onChange={onBodyChange}
              required
              placeholder="Escreva o texto ou use os atalhos acima"
            />
          </div>
        </div>
      </section>

      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="admin-btn" disabled={submitting}>
          {submitting ? 'Salvando...' : isEdit ? 'Salvar modelo' : 'Criar modelo'}
        </button>
      </div>
    </form>
  );
}
