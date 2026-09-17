/**
 * Seed + schema helpers for contract templates (modelos).
 * Variáveis no corpo usam {{chave}}. Tipos: text, textarea, date, money, number, select.
 */

export const MONEY_KEYS = [
  'implementationFee',
  'subscriptionFee',
  'firstMonthTotal',
  'newDemandFee',
];

/** Variáveis do modelo multi-produto (sistemas / plataformas). */
export const MULTI_PRODUCT_VARIABLES = [
  { key: 'proposalValidityDays', label: 'Validade da proposta (dias)', type: 'number', required: true, defaultValue: '15' },
  { key: 'proposalDate', label: 'Data da proposta comercial', type: 'text', required: false, defaultValue: '' },
  { key: 'productSuite', label: 'Nome do(s) sistema(s) / pacote', type: 'text', required: true, defaultValue: 'Plataforma contratada' },
  { key: 'productsDetail', label: 'Detalhamento dos produtos / módulos', type: 'textarea', required: true, defaultValue: 'a) Módulo principal — acesso, usuários e operação central;\nb) Módulo complementar — conforme proposta comercial;\nc) Integrações e suporte descritos na proposta.' },
  { key: 'clientRepresentativeName', label: 'Representante legal (contratante)', type: 'text', required: false },
  { key: 'clientRepresentativeCpf', label: 'CPF do representante', type: 'text', required: false },
  { key: 'clientRepresentativeRole', label: 'Cargo / poderes do representante', type: 'text', required: false },
  { key: 'scope', label: 'Resumo do objeto', type: 'textarea', required: false, defaultValue: 'Implantação, licenciamento de uso e suporte do(s) sistema(s) contratado(s).' },
  { key: 'implementationFee', label: 'Valor da implantação (R$)', type: 'money', required: true, defaultValue: '0,00' },
  { key: 'subscriptionFee', label: 'Mensalidade (R$)', type: 'money', required: true, defaultValue: '0,00' },
  { key: 'firstMonthTotal', label: 'Total do 1º mês (R$)', type: 'money', required: false, defaultValue: '' },
  { key: 'newDemandFee', label: 'Nova demanda / funcionalidade (R$)', type: 'money', required: true, defaultValue: '1.000,00' },
  { key: 'newDemandHours', label: 'Horas por nova demanda', type: 'number', required: true, defaultValue: '4' },
  { key: 'usageLimit', label: 'Limite de uso incluso (ex.: projetos, usuários)', type: 'text', required: false, defaultValue: 'conforme proposta' },
  { key: 'deliveryWeeks', label: 'Prazo de go-live (semanas)', type: 'number', required: true, defaultValue: '2' },
  { key: 'trainingHours', label: 'Horas de treinamento incluso', type: 'number', required: true, defaultValue: '1' },
  { key: 'paymentDay', label: 'Dia de vencimento da mensalidade', type: 'number', required: true, defaultValue: '10' },
  { key: 'durationMonths', label: 'Vigência inicial da mensalidade (meses)', type: 'number', required: true, defaultValue: '12' },
  { key: 'city', label: 'Cidade / foro', type: 'text', required: true, defaultValue: 'Belo Horizonte / MG' },
  { key: 'contractDate', label: 'Data do contrato', type: 'date', required: true },
];

/**
 * Modelo multi-produto — mesma espinha do antigo MAX Cultural,
 * parametrizado para qualquer sistema/plataforma vendida.
 */
export const MULTI_PRODUCT_BODY = `[TITLE]
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE IMPLANTAÇÃO, LICENCIAMENTO DE USO E SUPORTE — {{productSuite}}
[/TITLE]

Validade da proposta de origem: {{proposalValidityDays}} ({{proposalValidityDaysExtenso}}) dias corridos a contar da apresentação

PREÂMBULO
As Partes obrigam-se a cumprir o presente instrumento por si, seus herdeiros e sucessores, na forma das cláusulas seguintes.

CLÁUSULA 2ª — DO OBJETO
2.1. O presente Contrato tem por objeto a prestação de serviços de implantação, configuração, disponibilização contínua, gestão operacional e suporte de {{productSuite}}, bem como dos módulos e sistemas a ele integrados, conforme descritos abaixo:
{{productsDetail}}
2.2. A CONTRATANTE acessará os sistemas com controle de usuários e permissões, conforme o escopo comercial descrito na proposta de {{proposalDate}} e neste Contrato.
2.3. Integram o objeto, ainda:
a) implantação (setup, configuração, importação inicial de dados acordada e go-live);
b) disponibilização de infraestrutura de hospedagem e operação em produção, sob responsabilidade da CONTRATADA;
c) suporte corretivo relativo a erros e mau funcionamento do software entregue;
d) treinamento inicial de até {{trainingHours}} ({{trainingHoursExtenso}}) hora(s).
2.4. Não integram o objeto deste Contrato, salvo se expressamente incluídos em aditivo ou orçamento específico:
a) desenvolvimento de novos módulos, integrações, automações, relatórios customizados ou alterações estruturais;
b) integrações externas não previstas na proposta;
c) consultoria jurídica, contábil ou de prestação de contas perante órgãos públicos;
d) operação humana contínua (BPO) além do suporte técnico previsto;
e) customizações de marca, white-label ou apps móveis nativos, salvo acordo escrito.

CLÁUSULA 3ª — DO ESCOPO FUNCIONAL E DOS ENTREGÁVEIS
3.1. A CONTRATADA entregará ambiente em produção contendo os módulos/sistemas indicados na Cláusula 2ª, com:
a) cadastro e gestão de usuários e permissões;
b) operação dos módulos contratados;
c) documentação operacional mínima e orientação de uso no treinamento.
3.2. Prazo de entrega da versão inicial: até {{deliveryWeeks}} ({{deliveryWeeksExtenso}}) semanas contadas da assinatura deste Contrato e do recebimento da parcela de implantação, o que ocorrer por último, salvo atraso imputável à CONTRATANTE.
3.3. A CONTRATANTE reconhece que o software pode evoluir ao longo da vigência, sem prejuízo das obrigações de disponibilidade e correção de erros.

CLÁUSULA 4ª — DO VOLUME DE USO
4.1. A mensalidade prevista contempla o volume de uso indicado como {{usageLimit}}, conforme proposta comercial.
4.2. Ultrapassado o volume incluso, as Partes negociarão reajuste ou pacote adicional por escrito.

CLÁUSULA 5ª — DA INFRAESTRUTURA E DA HOSPEDAGEM
5.1. A responsabilidade pela infraestrutura de hospedagem e operação em produção será da CONTRATADA, que realizará administração, configuração, monitoramento e manutenção do ambiente.
5.2. Havendo necessidade de ampliação relevante de capacidade ou de planos superiores de infraestrutura, os valores poderão ser reajustados mediante comunicação prévia à CONTRATANTE.
5.3. A CONTRATANTE é responsável pela veracidade dos dados inseridos, pela gestão de seus usuários e pelo cumprimento de obrigações legais perante terceiros.

CLÁUSULA 6ª — DO SUPORTE, DA MANUTENÇÃO E DO TREINAMENTO
6.1. Correção de erros e manutenção corretiva básica estão incluídas na mensalidade, sem custo adicional, enquanto vigente a relação de mensalidade.
6.2. Não se confundem com erro: pedidos de nova funcionalidade, mudança de regra de negócio da CONTRATANTE, uso indevido ou falha de terceiros.
6.3. Treinamento: até {{trainingHours}} ({{trainingHoursExtenso}}) hora(s) inclusa(s). Sessões adicionais poderão ser contratadas à parte.

CLÁUSULA 7ª — DOS VALORES
7.1. Pelos serviços objeto deste Contrato, a CONTRATANTE pagará à CONTRATADA:
a) Implantação: {{implementationFeeFormatted}} ({{implementationFeeExtenso}}), em parcela única;
b) Mensalidade: {{subscriptionFeeFormatted}} ({{subscriptionFeeExtenso}}) por mês;
c) Quando aplicável, total do 1º mês: {{firstMonthTotalFormatted}} ({{firstMonthTotalExtenso}}).

CLÁUSULA 8ª — DAS NOVAS DEMANDAS
8.1. Ajustes, melhorias e novas funcionalidades fora do escopo de correção serão cobrados à razão de {{newDemandFeeFormatted}} ({{newDemandFeeExtenso}}) por demanda, limitada a até {{newDemandHours}} ({{newDemandHoursExtenso}}) horas, ou orçados à parte mediante aceite escrito.

CLÁUSULA 9ª — DO PAGAMENTO
9.1. Os pagamentos serão realizados via PIX, para dados indicados pela CONTRATADA em fatura ou comunicação escrita.
9.2. A mensalidade vence no dia {{paymentDay}} de cada mês de competência.
9.3. O atraso sujeitará a CONTRATANTE a juros de 1% ao mês e multa de 2% sobre o valor em atraso.

CLÁUSULA 10ª — DA VIGÊNCIA
10.1. A mensalidade permanece válida por {{durationMonths}} ({{durationMonthsExtenso}}) meses a contar do início da cobrança recorrente, podendo renovar-se automaticamente, salvo denúncia com 30 (trinta) dias de antecedência.

CLÁUSULA 11ª — DA PROPRIEDADE INTELECTUAL E DOS DADOS
11.1. O software, códigos, arquitetura e documentação técnica da CONTRATADA permanecem de sua titularidade.
11.2. A CONTRATANTE recebe licença de uso não exclusiva, intransferível e temporária enquanto a mensalidade estiver em dia.
11.3. Os dados de negócio inseridos pela CONTRATANTE são de sua titularidade. A CONTRATADA os tratará como confidenciais.

CLÁUSULA 12ª — DA RESCISÃO
12.1. Qualquer das Partes poderá rescindir mediante aviso prévio de 30 (trinta) dias, ou imediatamente em caso de inadimplemento grave.
12.2. Valores já devidos permanecem exigíveis. A implantação já executada ou em execução não gera direito à devolução, salvo se a CONTRATADA não tiver iniciado a implantação por culpa exclusiva sua.

CLÁUSULA 13ª — DA RESPONSABILIDADE
13.1. A CONTRATADA executará os serviços com diligência técnica e boa-fé.
13.2. Ressalvados dolo ou culpa grave, a responsabilidade civil total da CONTRATADA por danos diretos fica limitada, em cada período de 12 meses, ao montante pago pela CONTRATANTE nos 3 meses anteriores ao evento.

CLÁUSULA 14ª — DAS COMUNICAÇÕES
14.1. Comunicações contratuais serão válidas quando enviadas aos e-mails indicados na Cláusula 1ª (qualificação das Partes).

CLÁUSULA 15ª — DO FORO
15.1. Fica eleito o foro da Comarca de {{city}}, com renúncia a qualquer outro.

CLÁUSULA 16ª — DO ACEITE
16.1. E por estarem assim justas e contratadas, as Partes firmam o presente instrumento em 2 (duas) vias de igual teor, ou em via eletrônica única com validade jurídica.

LOCAL E DATA
{{city}}, {{contractDay}} de {{contractMonthName}} de {{contractYear}}.

[SIGNATURES]
CONTRATADA
Nome: {{issuerCivilName}}
Nome empresarial: {{issuerLegalName}}
CNPJ: {{issuerDocument}}
CPF: {{issuerCpf}}
E-mail: {{issuerEmail}}
---
CONTRATANTE
Razão social: {{clientLegalName}}
Nome do representante: {{clientRepresentativeName}}
CPF: {{clientRepresentativeCpf}}
Cargo: {{clientRepresentativeRole}}
---
TESTEMUNHAS
Nome: ________________________________
CPF: _________________________________
Nome: ________________________________
CPF: _________________________________
[/SIGNATURES]

ANEXO I — RESUMO COMERCIAL

[TABLE]
Descrição | Condição
Produto / pacote | {{productSuite}}
Implantação | {{implementationFeeFormatted}} (única)
Mensalidade | {{subscriptionFeeFormatted}} / mês
Volume incluso | {{usageLimit}}
1º mês (se aplicável) | {{firstMonthTotalFormatted}}
Nova demanda | {{newDemandFeeFormatted}} / até {{newDemandHours}}h
Go-live | até {{deliveryWeeks}} semanas
Treinamento | {{trainingHours}}h incluso
Pagamento | PIX · dia {{paymentDay}}
Vigência | {{durationMonths}} meses
Foro | {{city}}
[/TABLE]

ANEXO II — CHECKLIST PARA ASSINATURA

[CHECKLIST]
Qualificação da CONTRATANTE conferida (cadastro do cliente)
Representante legal e poderes conferidos
Nome do(s) sistema(s) e módulos conferidos
Valores e dia de vencimento conferidos
E-mail de comunicações confirmado
Proposta comercial anexada (se houver)
Revisão jurídica (recomendado)
[/CHECKLIST]
`;

/** @deprecated alias — conteúdo multi-produto. */
export const MAX_CULTURAL_VARIABLES = MULTI_PRODUCT_VARIABLES;
/** @deprecated alias — conteúdo multi-produto. */
export const MAX_CULTURAL_BODY = MULTI_PRODUCT_BODY;

export function maxCulturalSeed(_env = {}) {
  return multiProductSeed();
}

export function multiProductSeed(_env = {}) {
  return {
    name: 'Implantação, licença e suporte de sistemas',
    description:
      'Modelo multi-produto (qualquer sistema/plataforma). Use productSuite e productsDetail. Partes preenchidas pelo sistema.',
    bodyTemplate: MULTI_PRODUCT_BODY,
    variables: MULTI_PRODUCT_VARIABLES.map((v) => ({ ...v })),
  };
}


/** Variáveis do modelo genérico (estrutura inspirada no MAX Cultural). */
export const GENERIC_SERVICES_VARIABLES = [
  { key: 'proposalValidityDays', label: 'Validade da proposta (dias)', type: 'number', required: true, defaultValue: '15' },
  { key: 'proposalDate', label: 'Data da proposta comercial', type: 'text', required: false, defaultValue: '' },
  { key: 'clientRepresentativeName', label: 'Representante legal (contratante)', type: 'text', required: false },
  { key: 'clientRepresentativeCpf', label: 'CPF do representante', type: 'text', required: false },
  { key: 'clientRepresentativeRole', label: 'Cargo / poderes do representante', type: 'text', required: false },
  { key: 'scope', label: 'Objeto / escopo dos serviços', type: 'textarea', required: true, defaultValue: 'Prestação de serviços de tecnologia conforme proposta comercial.' },
  { key: 'implementationFee', label: 'Valor da implantação (R$)', type: 'money', required: true, defaultValue: '0,00' },
  { key: 'subscriptionFee', label: 'Mensalidade / assinatura (R$)', type: 'money', required: true, defaultValue: '0,00' },
  { key: 'subscriptionPeriod', label: 'Periodicidade', type: 'select', required: true, defaultValue: 'mensal', options: ['mensal', 'trimestral', 'anual'] },
  { key: 'firstMonthTotal', label: 'Total do 1º mês (R$)', type: 'money', required: false, defaultValue: '' },
  { key: 'newDemandFee', label: 'Nova demanda / funcionalidade (R$)', type: 'money', required: false, defaultValue: '1.000,00' },
  { key: 'newDemandHours', label: 'Horas por nova demanda', type: 'number', required: false, defaultValue: '4' },
  { key: 'deliveryWeeks', label: 'Prazo de entrega inicial (semanas)', type: 'number', required: true, defaultValue: '4' },
  { key: 'trainingHours', label: 'Horas de treinamento incluso', type: 'number', required: false, defaultValue: '1' },
  { key: 'paymentDay', label: 'Dia de vencimento', type: 'number', required: true, defaultValue: '10' },
  { key: 'durationMonths', label: 'Vigência inicial (meses)', type: 'number', required: true, defaultValue: '12' },
  { key: 'startDate', label: 'Início da vigência', type: 'date', required: false },
  { key: 'city', label: 'Cidade / foro', type: 'text', required: true, defaultValue: 'Belo Horizonte / MG' },
  { key: 'contractDate', label: 'Data do contrato', type: 'date', required: true },
];

/**
 * Modelo genérico com a mesma espinha dorsal do MAX Cultural
 * (título, cláusulas, resumo, checklist, assinaturas), sem texto específico do produto.
 */
export const GENERIC_SERVICES_BODY = `[TITLE]
CONTRATO DE PRESTAÇÃO DE SERVIÇOS
[/TITLE]

Validade da proposta de origem: {{proposalValidityDays}} ({{proposalValidityDaysExtenso}}) dias corridos a contar da apresentação

PREÂMBULO
As Partes obrigam-se a cumprir o presente instrumento por si, seus herdeiros e sucessores, na forma das cláusulas seguintes.

CLÁUSULA 2ª — DO OBJETO
2.1. O presente Contrato tem por objeto a prestação dos seguintes serviços pela CONTRATADA à CONTRATANTE:
{{scope}}
2.2. Integram o objeto, ainda, a implantação inicial, a disponibilização contínua do serviço durante a vigência e o suporte corretivo relativo a erros e mau funcionamento, nos termos deste Contrato.
2.3. Não integram o objeto, salvo se expressamente incluídos em aditivo ou orçamento específico: desenvolvimento de novos módulos, integrações, automações, relatórios customizados, consultoria jurídica/contábil ou operação humana contínua (BPO).

CLÁUSULA 3ª — DOS ENTREGÁVEIS E DO PRAZO
3.1. A CONTRATADA entregará a versão inicial dos serviços no prazo de até {{deliveryWeeks}} ({{deliveryWeeksExtenso}}) semanas contadas da assinatura deste Contrato e do recebimento da parcela de implantação (quando houver), o que ocorrer por último, salvo atraso imputável à CONTRATANTE.
3.2. Quando previsto, a CONTRATADA oferecerá treinamento inicial de até {{trainingHours}} ({{trainingHoursExtenso}}) hora(s).

CLÁUSULA 4ª — DOS VALORES E DA FORMA DE PAGAMENTO
4.1. Pela implantação, a CONTRATANTE pagará à CONTRATADA o valor de {{implementationFeeFormatted}} ({{implementationFeeExtenso}}), em parcela única.
4.2. Pela manutenção/assinatura, a CONTRATANTE pagará {{subscriptionFeeFormatted}} ({{subscriptionFeeExtenso}}) com periodicidade {{subscriptionPeriod}}.
4.3. Os pagamentos serão realizados via PIX ou outro meio indicado pela CONTRATADA, até o dia {{paymentDay}} de cada período de competência.
4.4. O atraso sujeitará a CONTRATANTE a juros de 1% (um por cento) ao mês e multa de 2% (dois por cento) sobre o valor em atraso.

CLÁUSULA 5ª — DA VIGÊNCIA
5.1. O Contrato inicia-se em {{startDateFormatted}} e a cobrança recorrente terá vigência inicial de {{durationMonths}} ({{durationMonthsExtenso}}) meses, podendo ser renovada automaticamente por iguais períodos, salvo denúncia por qualquer das Partes com antecedência mínima de 30 (trinta) dias.

CLÁUSULA 6ª — DAS OBRIGAÇÕES DAS PARTES
6.1. Caberá à CONTRATADA executar os serviços com diligência, qualidade técnica e sigilo das informações recebidas.
6.2. Caberá à CONTRATANTE fornecer informações, acessos e materiais necessários, bem como efetuar os pagamentos nas datas acordadas.

CLÁUSULA 7ª — DO SUPORTE E DAS NOVAS DEMANDAS
7.1. A correção de erros e o suporte corretivo básico estão incluídos na mensalidade enquanto vigente a relação contratual.
7.2. Ajustes, melhorias e novas funcionalidades fora do escopo de correção serão cobrados à razão de {{newDemandFeeFormatted}} ({{newDemandFeeExtenso}}) por demanda, limitada a até {{newDemandHours}} ({{newDemandHoursExtenso}}) horas, ou orçados à parte.

CLÁUSULA 8ª — DA CONFIDENCIALIDADE E DOS DADOS
8.1. As Partes manterão confidencialidade sobre informações técnicas, comerciais e operacionais pelo prazo de vigência e por 2 (dois) anos após o término.
8.2. Os dados de negócio da CONTRATANTE permanecem de sua titularidade. A CONTRATADA os utilizará apenas para execução deste Contrato e cumprimento de obrigações legais.

CLÁUSULA 9ª — DA RESCISÃO
9.1. O Contrato poderá ser rescindido por qualquer das Partes mediante aviso prévio de 30 (trinta) dias, ou imediatamente em caso de inadimplemento grave.
9.2. Valores já devidos até a data da rescisão permanecem exigíveis. A parcela de implantação já executada ou em execução não gera direito à devolução, salvo se a CONTRATADA não tiver iniciado a implantação por culpa exclusiva sua.

CLÁUSULA 10ª — DO FORO
10.1. Fica eleito o foro da Comarca de {{city}}, com renúncia a qualquer outro, por mais privilegiado que seja.

CLÁUSULA 11ª — DO ACEITE
11.1. E por estarem assim justas e contratadas, as Partes firmam o presente instrumento em 2 (duas) vias de igual teor, ou em via eletrônica única com validade jurídica.

LOCAL E DATA
{{city}}, {{contractDay}} de {{contractMonthName}} de {{contractYear}}.

[SIGNATURES]
CONTRATADA
Nome: {{issuerCivilName}}
Nome empresarial: {{issuerLegalName}}
CNPJ: {{issuerDocument}}
CPF: {{issuerCpf}}
E-mail: {{issuerEmail}}
---
CONTRATANTE
Razão social: {{clientLegalName}}
Nome do representante: {{clientRepresentativeName}}
CPF: {{clientRepresentativeCpf}}
Cargo: {{clientRepresentativeRole}}
---
TESTEMUNHAS
Nome: ________________________________
CPF: _________________________________
Nome: ________________________________
CPF: _________________________________
[/SIGNATURES]

ANEXO I — RESUMO COMERCIAL

[TABLE]
Descrição | Condição
Objeto | conforme Cláusula 2ª
Implantação | {{implementationFeeFormatted}} (única)
Assinatura | {{subscriptionFeeFormatted}} / {{subscriptionPeriod}}
1º mês (se aplicável) | {{firstMonthTotalFormatted}}
Nova demanda | {{newDemandFeeFormatted}} / até {{newDemandHours}}h
Entrega inicial | até {{deliveryWeeks}} semanas
Vigência | {{durationMonths}} meses
Pagamento | PIX · dia {{paymentDay}}
Foro | {{city}}
[/TABLE]

ANEXO II — CHECKLIST PARA ASSINATURA

[CHECKLIST]
Qualificação da CONTRATANTE conferida (cadastro do cliente)
Representante legal e poderes conferidos
Valores e dia de vencimento conferidos
E-mail de comunicações confirmado
Proposta comercial anexada (se houver)
Revisão jurídica (recomendado)
[/CHECKLIST]
`;

export function genericServicesSeed(_env = {}) {
  return {
    name: 'Prestação de serviços (genérico)',
    description:
      'Modelo curto multi-produto (objeto, valores, vigência, anexos). Partes preenchidas pelo sistema.',
    bodyTemplate: GENERIC_SERVICES_BODY,
    variables: GENERIC_SERVICES_VARIABLES.map((v) => ({ ...v })),
  };
}

export const BUILTIN_TEMPLATE_IDS = {
  /** Id legado; conteúdo agora é multi-produto. */
  maxCultural: 'tpl-max-cultural',
  generic: 'tpl-servicos-generico',
};
