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

export const MAX_CULTURAL_VARIABLES = [
  { key: 'proposalValidityDays', label: 'Validade da proposta (dias)', type: 'number', required: true, defaultValue: '15' },
  { key: 'proposalDate', label: 'Data da proposta comercial', type: 'text', required: true, defaultValue: '17 de agosto de 2026' },
  { key: 'clientRepresentativeName', label: 'Representante legal (contratante)', type: 'text', required: false },
  { key: 'clientRepresentativeCpf', label: 'CPF do representante', type: 'text', required: false },
  { key: 'clientRepresentativeRole', label: 'Cargo / poderes do representante', type: 'text', required: false },
  { key: 'implementationFee', label: 'Valor da implantação (R$)', type: 'money', required: true, defaultValue: '11.990,00' },
  { key: 'subscriptionFee', label: 'Mensalidade (R$)', type: 'money', required: true, defaultValue: '2.990,00' },
  { key: 'firstMonthTotal', label: 'Total do 1º mês (R$)', type: 'money', required: true, defaultValue: '14.980,00' },
  { key: 'newDemandFee', label: 'Nova demanda / funcionalidade (R$)', type: 'money', required: true, defaultValue: '1.000,00' },
  { key: 'newDemandHours', label: 'Horas por nova demanda', type: 'number', required: true, defaultValue: '4' },
  { key: 'maxProjects', label: 'Projetos ativos inclusos', type: 'number', required: true, defaultValue: '30' },
  { key: 'deliveryWeeks', label: 'Prazo de go-live (semanas)', type: 'number', required: true, defaultValue: '2' },
  { key: 'trainingHours', label: 'Horas de treinamento incluso', type: 'number', required: true, defaultValue: '1' },
  { key: 'paymentDay', label: 'Dia de vencimento da mensalidade', type: 'number', required: true, defaultValue: '10' },
  { key: 'durationMonths', label: 'Vigência inicial da mensalidade (meses)', type: 'number', required: true, defaultValue: '12' },
  { key: 'city', label: 'Cidade / foro', type: 'text', required: true, defaultValue: 'Belo Horizonte / MG' },
  { key: 'contractDate', label: 'Data do contrato', type: 'date', required: true },
  { key: 'scope', label: 'Resumo do objeto (uso interno / listagem)', type: 'textarea', required: false, defaultValue: 'Implantação, licenciamento e suporte MAX Cultural + MAX Origem + MAX Fluxo' },
];

/** Corpo do modelo — sem Cláusula 1ª (partes): o sistema injeta CONTRATADA (CCMEI) + CONTRATANTE (cliente). */
export const MAX_CULTURAL_BODY = `[TITLE]
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE IMPLANTAÇÃO, LICENCIAMENTO DE USO E SUPORTE DA PLATAFORMA MAX CULTURAL
[/TITLE]

Validade da proposta de origem: {{proposalValidityDays}} ({{proposalValidityDaysExtenso}}) dias corridos a contar da apresentação

PREÂMBULO
As Partes obrigam-se a cumprir o presente instrumento por si, seus herdeiros e sucessores, na forma das cláusulas seguintes.

CLÁUSULA 2ª — DO OBJETO
2.1. O presente Contrato tem por objeto a prestação de serviços de implantação, configuração, disponibilização contínua, gestão operacional e suporte da plataforma MAX Cultural, porta de entrada única da operação da CONTRATANTE, bem como dos sistemas a ela integrados:
a) MAX Cultural — hub de autenticação única (SSO), gestão de usuários, papéis e permissões, e acesso centralizado aos produtos contratados;
b) MAX Origem (evolução do Salink) — planejamento, fornecedores, auditoria e operação de projetos culturais;
c) MAX Fluxo (evolução do SigaCultural) — operação e consultas vinculadas ao fluxo operacional da CONTRATANTE.
2.2. A CONTRATANTE acessará os sistemas por meio do MAX Cultural, com controle centralizado de quem acessa o quê, conforme o escopo comercial descrito na proposta de {{proposalDate}} e neste Contrato.
2.3. Integram o objeto, ainda:
a) implantação (setup, configuração, importação inicial de dados acordada e go-live);
b) disponibilização de infraestrutura de hospedagem e operação em produção, sob responsabilidade da CONTRATADA, nos termos da Cláusula 5ª;
c) suporte corretivo vitalício relativo a erros e mau funcionamento do software entregue, nos termos da Cláusula 6ª;
d) treinamento inicial de até {{trainingHours}} ({{trainingHoursExtenso}}) hora(s), nos termos da Cláusula 7ª.
2.4. Não integram o objeto deste Contrato, salvo se expressamente incluídos em aditivo ou orçamento específico:
a) desenvolvimento de novos módulos, integrações, automações, relatórios customizados ou alterações estruturais;
b) Open Finance / conexão bancária e demais integrações externas não previstas;
c) consultoria jurídica, contábil ou de prestação de contas perante órgãos públicos;
d) operação humana contínua (BPO) além do suporte técnico previsto;
e) customizações de marca, white-label ou apps móveis nativos, salvo acordo escrito.

CLÁUSULA 3ª — DO ESCOPO FUNCIONAL E DOS ENTREGÁVEIS
3.1. A CONTRATADA entregará ambiente em produção contendo as três plataformas indicadas na Cláusula 2ª, acessíveis mediante login único no MAX Cultural, com:
a) cadastro e gestão de usuários e permissões;
b) operação dos módulos contratados do MAX Origem e do MAX Fluxo;
c) sincronização e operação das plataformas conforme funcionalidades disponíveis na versão implantada;
d) documentação operacional mínima e orientação de uso no treinamento.
3.2. Prazo de entrega da versão inicial: até {{deliveryWeeks}} ({{deliveryWeeksExtenso}}) semanas contadas da assinatura deste Contrato e do recebimento da parcela de implantação, o que ocorrer por último, salvo atraso imputável à CONTRATANTE (ex.: ausência de dados, acessos, validações ou decisões pendentes).
3.3. A “versão inicial” corresponde ao go-live operacional do escopo acordado, podendo evoluções posteriores seguir o regime de novas demandas (Cláusula 8ª) ou revisão de escopo.
3.4. A CONTRATANTE reconhece que o sistema encontra-se em desenvolvimento contínuo e que melhorias poderão ser incorporadas ao longo da vigência, sem prejuízo das obrigações de disponibilidade e correção de erros previstas neste Contrato.

CLÁUSULA 4ª — DO VOLUME DE USO E DOS PROJETOS
4.1. A mensalidade prevista neste Contrato contempla até {{maxProjects}} ({{maxProjectsExtenso}}) projetos em operação ativa.
4.2. Projetos excedentes ou encerrados poderão ser mantidos em modo de arquivo, observando-se o prazo legal de retenção aplicável à CONTRATANTE, e poderão ser reativados ou disponibilizados mediante aviso prévio de 7 (sete) dias corridos.
4.3. Outras fontes de recurso (incluindo, sem se limitar a, Lei Aldir Blanc, leis estaduais de cultura, MROSC, vendas, prestações de serviços, doações e correlatos) poderão integrar o ecossistema MAX Cultural, desde que não ocasionem aumento significativo de custo de processamento e/ou armazenamento. Caso ocorra aumento relevante, as Partes negociarão reajuste à parte, por escrito.

CLÁUSULA 5ª — DA INFRAESTRUTURA E DA HOSPEDAGEM
5.1. A responsabilidade pela infraestrutura de hospedagem e operação dos sistemas em produção, incluindo contas, licenças, domínio e acessos às plataformas utilizadas (hospedagem da aplicação, banco de dados, autenticação e envio de e-mails), será da CONTRATADA, que realizará a administração, configuração, monitoramento e manutenção do ambiente.
5.2. A CONTRATADA disponibilizará infraestrutura adequada ao porte contratado (até {{maxProjects}} projetos ativos), incluindo banco de dados, ambiente em nuvem e domínio próprio vinculado à operação.
5.3. Havendo necessidade de ampliação de armazenamento, processamento, tráfego, integrações (incluindo Open Finance / conexão bancária) ou contratação de planos superiores de infraestrutura, os valores poderão ser reajustados conforme o volume efetivamente utilizado e as atualizações de preços dos fornecedores de nuvem e serviços correlatos, mediante comunicação prévia à CONTRATANTE.
5.4. A CONTRATANTE é responsável pela veracidade dos dados inseridos, pela gestão de seus usuários finais, pela guarda de credenciais sob seu controle e pelo cumprimento de obrigações legais perante órgãos públicos, patrocinadores e terceiros.

CLÁUSULA 6ª — DO SUPORTE, DA MANUTENÇÃO E DO TREINAMENTO OPERACIONAL
6.1. Correção de erros e mau funcionamento do software entregue, bem como a manutenção corretiva básica e a manutenção da disponibilidade razoável do ambiente, estão incluídas na mensalidade, sem custo adicional, de forma vitalícia enquanto vigente a relação de mensalidade ou, após eventual encerramento desta, pelo período em que as Partes mantiverem acordo escrito de suporte corretivo — observado o disposto na Cláusula 12ª quanto à resilição.
6.2. Para os fins deste Contrato, considera-se erro ou mau funcionamento o comportamento do sistema em desacordo com o funcionamento esperado do escopo entregue, não se confundindo com:
a) pedido de nova funcionalidade ou melhoria;
b) mudança de regra de negócio da CONTRATANTE;
c) uso indevido, configuração incorreta por usuário, ou falha de terceiros (SALIC, provedores de e-mail, internet da CONTRATANTE etc.);
d) indisponibilidade de serviços externos fora do controle da CONTRATADA.
6.3. Canais de suporte e prazos de atendimento inicial serão informados por escrito no go-live. Em regra, solicitações serão acolhidas em dias úteis, em horário comercial de Brasília, salvo acordo diverso.
6.4. Treinamento: a CONTRATADA oferecerá 1 (uma) sessão de até {{trainingHours}} ({{trainingHoursExtenso}}) hora(s) para demonstração de uso e esclarecimento de dúvidas. Sessões adicionais poderão ser contratadas à parte.

CLÁUSULA 7ª — DOS VALORES
7.1. Pelos serviços objeto deste Contrato, a CONTRATANTE pagará à CONTRATADA:

[TABLE]
Item | Valor
Implantação dos 3 (três) sistemas (mão de obra, setup, configuração, importação acordada e go-live) — parcela única | {{implementationFeeFormatted}}
Mensalidade da plataforma (MAX Cultural + MAX Origem + MAX Fluxo) | {{subscriptionFeeFormatted}} / mês
Nova demanda / funcionalidade (ativação) | {{newDemandFeeFormatted}} por demanda, até {{newDemandHours}}h
Correção de erros / manutenção corretiva básica | Incluso na mensalidade
[/TABLE]

7.2. A mensalidade de {{subscriptionFeeFormatted}} ({{subscriptionFeeExtenso}}) corresponde ao conjunto das 3 (três) plataformas, observadas as condições de volume da Cláusula 4ª.
7.3. No primeiro mês, o investimento total corresponde a {{firstMonthTotalFormatted}} ({{firstMonthTotalExtenso}}), somando a implantação e a primeira mensalidade.
7.4. Nos meses subsequentes, enquanto vigente a mensalidade, o valor recorrente será de {{subscriptionFeeFormatted}} ({{subscriptionFeeExtenso}}) por competência.

CLÁUSULA 8ª — DAS NOVAS DEMANDAS E DO REGIME DE EVOLUÇÃO
8.1. Ajustes, melhorias e novas demandas ou funcionalidades solicitados pela CONTRATANTE, fora do escopo de correção de erros e manutenção corretiva básica, serão cobrados à razão de {{newDemandFeeFormatted}} ({{newDemandFeeExtenso}}) por demanda, limitada a até {{newDemandHours}} ({{newDemandHoursExtenso}}) horas de trabalho por ativação.
8.2. Demandas que excedam esse limite, bem como desenvolvimento de novos módulos, integrações, automações, relatórios customizados ou alterações estruturais dos sistemas, serão orçadas à parte, mediante proposta escrita aceita pela CONTRATANTE.
8.3. Nenhuma evolução fora do escopo obriga a CONTRATADA sem aceite formal do respectivo orçamento.

CLÁUSULA 9ª — DA FORMA E DAS CONDIÇÕES DE PAGAMENTO
9.1. Os pagamentos serão realizados exclusivamente via PIX, para a chave / dados bancários indicados pela CONTRATADA em fatura ou comunicação escrita.
9.2. A implantação deverá ser paga à vista, por ocasião da assinatura deste Contrato (ou conforme etapa expressa em cronograma anexo, se houver).
9.3. A mensalidade será paga de forma recorrente, por competência mensal, até o dia {{paymentDay}} de cada mês (ou, na ausência de indicação, até o dia do aniversário da data de início de vigência).
9.4. Ativações de mão de obra / novas demandas serão pagas à vista, por demanda ou etapa correspondente, antes ou imediatamente após a execução, conforme combinado por escrito.
9.5. O atraso superior a 10 (dez) dias corridos no pagamento de qualquer obrigação poderá ensejar:
a) suspensão do acesso aos sistemas, mediante aviso prévio de 3 (três) dias úteis;
b) incidência de multa de 2% (dois por cento) sobre o valor em atraso, acrescida de juros de 1% (um por cento) ao mês e correção monetária pelo IPCA, quando aplicável;
c) rescisão por justa causa, nos termos da Cláusula 12ª, se o inadimplemento persistir por mais de 30 (trinta) dias corridos.
9.6. Tributos incidentes sobre a prestação de serviços serão tratados conforme a legislação aplicável ao enquadramento fiscal da CONTRATADA, podendo ser destacados em nota fiscal / recibo quando obrigatório.

CLÁUSULA 10ª — DA VIGÊNCIA, DA REVISÃO E DO REAJUSTE
10.1. Este Contrato entra em vigor na data de sua assinatura pelas Partes (“Data de Início”).
10.2. A mensalidade permanece válida por {{durationMonths}} ({{durationMonthsExtenso}}) meses a contar do início da vigência da cobrança recorrente. No mês seguinte ao período inicial, as Partes reavaliarão o volume de uso, a escala da operação e o escopo efetivamente utilizado, podendo haver redução ou majoração da mensalidade conforme a realidade da CONTRATANTE, por escrito.
10.3. Após os {{durationMonths}} ({{durationMonthsExtenso}}) meses iniciais, o Contrato prorroga-se automaticamente por períodos sucessivos de {{durationMonths}} meses, salvo denúncia por qualquer das Partes com aviso prévio de 30 (trinta) dias corridos.
10.4. Reajustes decorrentes de aumento de infraestrutura, integrações ou planos superiores observarão a Cláusula 5.3.

CLÁUSULA 11ª — DA PROPRIEDADE INTELECTUAL E DA LICENÇA DE USO
11.1. O software MAX Cultural, MAX Origem e MAX Fluxo, inclusive códigos-fonte, arquitetura, interfaces, marcas, bancos de dados estruturais e documentação técnica da CONTRATADA, são e permanecerão de titularidade exclusiva da CONTRATADA (ou de licenciantes de terceiros por ela utilizados).
11.2. A CONTRATANTE recebe, durante a vigência da mensalidade em dia, licença de uso não exclusiva, intransferível e temporária dos sistemas, limitada às suas operações internas e ao volume contratado.
11.3. É vedado à CONTRATANTE, salvo autorização prévia e escrita da CONTRATADA:
a) sublicenciar, vender, ceder ou disponibilizar o sistema a terceiros estranhos à sua operação;
b) realizar engenharia reversa, descompilar ou extrair o código-fonte;
c) remover avisos de propriedade intelectual;
d) utilizar o sistema para fins ilícitos.
11.4. Os dados de negócio inseridos pela CONTRATANTE (projetos, fornecedores, usuários, documentos etc.) são de titularidade da CONTRATANTE. A CONTRATADA tratará tais dados como confidenciais e os utilizará apenas para execução deste Contrato e cumprimento de obrigações legais.
11.5. Em caso de término do Contrato, a CONTRATADA disponibilizará, mediante solicitação escrita no prazo de até 30 (trinta) dias do encerramento, exportação razoável dos dados da CONTRATANTE em formato eletrônico usual (ex.: CSV, JSON ou arquivos armazenados), podendo cobrar esforço extraordinário se a exportação exigir desenvolvimento específico.

CLÁUSULA 12ª — DA RESCISÃO
12.1. O Contrato poderá ser rescindido:
a) por acordo escrito das Partes;
b) por denúncia imotivada, com aviso prévio de 30 (trinta) dias corridos, após o período inicial de {{durationMonths}} meses da mensalidade — ou a qualquer tempo por acordo;
c) por justa causa, em caso de inadimplemento grave não sanado em 15 (quinze) dias corridos após notificação (ou prazo específico da Cláusula 9.5 para inadimplemento pecuniário);
d) imediatamente, em caso de falência, recuperação judicial/extrajudicial ou dissolução da outra Parte, na forma da lei.
12.2. A rescisão não gera direito à devolução da parcela de implantação já executada ou em execução, salvo se a CONTRATADA não tiver iniciado a implantação por culpa exclusiva sua, hipótese em que se restituirá o valor proporcional não utilizado.
12.3. Mensalidades já vencidas permanecem devidas. Mensalidade do mês da rescisão será devida integralmente se o aviso ocorrer após o dia de vencimento da competência, salvo acordo diverso.
12.4. Com o término, a CONTRATADA poderá desativar acessos após cumprir a obrigação de exportação da Cláusula 11.5, quando solicitada tempestivamente.

CLÁUSULA 13ª — DAS RESPONSABILIDADES E DAS LIMITAÇÕES
13.1. A CONTRATADA obriga-se a executar os serviços com diligência técnica, boa-fé e padrões profissionais adequados à natureza da solução.
13.2. A CONTRATADA não se responsabiliza por:
a) decisões de gestão, prestação de contas ou compliance da CONTRATANTE perante MinC, SALIC, tribunais de contas, patrocinadores ou terceiros;
b) indisponibilidade, mudança de API, bloqueio ou falha de sistemas públicos ou de terceiros (incluindo SALIC);
c) perda de dados causada por culpa exclusiva da CONTRATANTE ou de seus usuários;
d) lucros cessantes, danos indiretos ou mera expectativa de resultado econômico, na máxima extensão permitida pela legislação aplicável às relações civis empresariais.
13.3. Ressalvados dolo ou culpa grave, a responsabilidade civil total da CONTRATADA por danos diretos comprovados decorrentes deste Contrato fica limitada, em cada período de 12 (doze) meses, ao montante efetivamente pago pela CONTRATANTE à CONTRATADA nos 3 (três) meses anteriores ao evento.
13.4. A CONTRATANTE declara possuir poderes e legitimidade para contratar e para tratar dados pessoais de seus colaboradores e terceiros inseridos na plataforma, comprometendo-se a observar a Lei nº 13.709/2018 (LGPD) no que lhe couber como controladora.
13.5. Na medida em que tratar dados pessoais sob instruções da CONTRATANTE para execução deste Contrato, a CONTRATADA atuará como operadora, adotando medidas de segurança compatíveis com o porte do serviço.

CLÁUSULA 14ª — DA CONFIDENCIALIDADE
14.1. As Partes obrigam-se a manter sigilo sobre informações técnicas, comerciais, financeiras e operacionais a que tiverem acesso em razão deste Contrato, pelo prazo de vigência e por 3 (três) anos após o término, exceto se:
a) forem de domínio público sem culpa da Parte receptora;
b) já forem de conhecimento legítimo prévio;
c) houver obrigação legal ou ordem de autoridade competente;
d) houver autorização escrita da Parte titular.

CLÁUSULA 15ª — DAS COMUNICAÇÕES
15.1. Todas as comunicações contratuais serão válidas quando enviadas aos e-mails indicados na Cláusula 1ª, ou a outros que venham a ser informados por escrito, presumindo-se recebidas no primeiro dia útil seguinte ao envio, se não houver confirmação anterior.

CLÁUSULA 16ª — DAS DISPOSIÇÕES GERAIS
16.1. Este Contrato, juntamente com a proposta comercial de {{proposalDate}} (naquilo que não conflitar com este instrumento), constitui o acordo integral entre as Partes sobre o objeto. Em caso de conflito, prevalece este Contrato.
16.2. A tolerância quanto ao descumprimento de qualquer cláusula não implica renúncia de direito, novação ou alteração tácita.
16.3. A eventual nulidade de alguma disposição não prejudica as demais, que permanecerão em pleno vigor.
16.4. É vedada a cessão deste Contrato pela CONTRATANTE sem anuência prévia e escrita da CONTRATADA. A CONTRATADA poderá utilizar subcontratados de infraestrutura e apoio técnico, permanecendo responsável perante a CONTRATANTE.
16.5. Anexos eventualmente firmados (cronograma, lista de importações, SLA detalhado) integram este Contrato para todos os fins.
16.6. As Partes reconhecem a validade de assinaturas eletrônicas e digitais com padrão ICP-Brasil ou plataforma de assinatura com trilha de auditoria, atribuindo-lhes a mesma eficácia da assinatura manuscrita.

CLÁUSULA 17ª — DO FORO
17.1. Fica eleito o foro da Comarca de {{city}}, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir dúvidas ou controvérsias oriundas deste Contrato.

CLÁUSULA 18ª — DO ACEITE
18.1. E por estarem assim justas e contratadas, as Partes firmam o presente instrumento em 2 (duas) vias de igual teor, ou em via eletrônica única com validade jurídica, na presença das testemunhas abaixo (se aplicável).

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

ANEXO I — RESUMO COMERCIAL (CONFERÊNCIA RÁPIDA)

[TABLE]
Descrição | Condição
Produtos | MAX Cultural + MAX Origem + MAX Fluxo
Implantação | {{implementationFeeFormatted}} (única)
Mensalidade | {{subscriptionFeeFormatted}} / mês (até {{maxProjects}} projetos ativos)
1º mês (total) | {{firstMonthTotalFormatted}}
Nova demanda | {{newDemandFeeFormatted}} / até {{newDemandHours}}h
Correção de erros | Incluso
Go-live inicial | até {{deliveryWeeks}} semanas após assinatura + pagamento da implantação
Treinamento | {{trainingHours}}h incluso
Infraestrutura | sob responsabilidade da CONTRATADA
Pagamento | PIX
Revisão de mensalidade | após {{durationMonths}} meses
Foro | {{city}}
[/TABLE]

ANEXO II — CHECKLIST DE DADOS PARA ASSINATURA
Preencher antes do envio final:

[CHECKLIST]
Qualificação completa da CONTRATADA (CPF ou CNPJ, endereço)
Qualificação completa da CONTRATANTE (razão social, CNPJ, endereço, representante)
Dia de vencimento da mensalidade
Chave PIX / dados para faturamento
Confirmar e-mail oficial de comunicações da CONTRATANTE
Anexar proposta de {{proposalDate}} (PDF) como referência
Revisar juridicamente (recomendado) antes da assinatura
[/CHECKLIST]

Documento elaborado com base na proposta comercial MAX Cultural apresentada em {{proposalDate}}. Recomenda-se revisão por advogado(a) de confiança das Partes antes da assinatura, sobretudo quanto a enquadramento fiscal, LGPD e cláusulas de limitação de responsabilidade.
`;

export function maxCulturalSeed(env = {}) {
  return {
    name: 'MAX Cultural — Implantação, licença e suporte',
    description:
      'Modelo MAX Cultural (cláusulas comerciais). As partes (CONTRATADA = CCMEI; CONTRATANTE = cliente) são preenchidas automaticamente pelo sistema.',
    bodyTemplate: MAX_CULTURAL_BODY,
    variables: MAX_CULTURAL_VARIABLES.map((v) => ({ ...v })),
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
      'Modelo genérico inspirado na estrutura do MAX Cultural (objeto, valores, vigência, anexos). Partes preenchidas pelo sistema.',
    bodyTemplate: GENERIC_SERVICES_BODY,
    variables: GENERIC_SERVICES_VARIABLES.map((v) => ({ ...v })),
  };
}

export const BUILTIN_TEMPLATE_IDS = {
  maxCultural: 'tpl-max-cultural',
  /** Novo id para o genérico baseado no MAX (evita colidir com soft-delete do tpl-generic antigo). */
  generic: 'tpl-servicos-generico',
};
