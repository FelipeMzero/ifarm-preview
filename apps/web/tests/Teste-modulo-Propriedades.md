# Relatório de Teste Exploratório

## 📝 Resumo

Este relatório documenta a execução de testes exploratórios no **Módulo Propriedades (MOD-PROPRIEDADES)** do sistema iFarm. O objetivo foi validar o comportamento do sistema seguindo as especificações e regras de negócio documentadas para a gestão de fazendas (inserção de dados, validação de unicidade, consistência de área e exclusão), simulando o uso real em um ambiente de desenvolvimento. Foram realizados testes de limite, inserção de dados anômalos e verificação de integridade de estado, assegurando a robustez da interface e do fluxo de dados.

## 🖥️ Ambiente de Teste

- **Sistema Operacional:** Arch Linux com interface KDE Plasma
- **Navegador:** Chrome
- **Versão do Projeto:** (branch) `feat/FA-10/Teste-modulo-Propriedades`
- **Data da Execução:** 21/07/2026

## 🎯 Escopo dos Testes (Baseado no Documento de Requisitos)

Os testes foram guiados pelas seguintes regras e funcionalidades:

1.  **RN-PROPRIEDADE-01:** Validação da unicidade dos campos CIB, CCIR e CAR.
2.  **RN-PROPRIEDADE-03:** Teste da consistência de Área (Área Produtiva > Área Total).
3.  **RN-PROPRIEDADE-04:** Bloqueio de exclusão de propriedades com registros dependentes.
4.  **RF-PROPRIEDADE-02 & 03:** Criação e Atualização de propriedades (teste de campos obrigatórios e preenchimento automático de CEP/coordenadas).

## ✅ Resultado Geral

**Nenhuma falha de software (bug) foi encontrada durante o período de teste.** O sistema comportou-se de forma resiliente, respeitando todas as validações de estado e regras de negócio especificadas na documentação. As exceções foram tratadas adequadamente, e o comportamento do _frontend_ e _backend_ manteve-se consistente, o que atesta uma boa Engenharia de Software no desenvolvimento deste módulo.

---

## 🔍 Detalhamento das Validações Executadas (Passaram no Teste)

Embora não tenham sido encontrados erros, os seguintes cenários críticos foram ativamente testados e homologados:

### [Sucesso] Validação de Campos Obrigatórios (RF-PROPRIEDADE-02)

- **Ação:** Tentativa de salvar uma propriedade deixando os campos `Nome` e `Titular` em branco.
- **Comportamento Observado:** O sistema interceptou a ação antes do envio da requisição (validação de _frontend_), destacando os campos ausentes e mantendo os dados parciais intactos. Não houve erro de servidor (HTTP 500).

### [Sucesso] Consistência de Área (RN-PROPRIEDADE-03)

- **Ação:** Inserção de uma propriedade com `Área Total` de `100` e `Área Produtiva` de `150`.
- **Comportamento Observado:** A regra de negócio foi respeitada rigorosamente. O sistema bloqueou a persistência dos dados e exibiu a notificação específica _"A área produtiva não pode ser maior que a área total"_.

### [Sucesso] Unicidade de Identificação Fundiária (RN-PROPRIEDADE-01)

- **Ação:** Tentativa de cadastro de uma nova fazenda utilizando o `CAR` de uma propriedade previamente inserida (MT-5107909-E8C2B3F6D1A94E8BB7F5C3E2A1D0B9C8).
- **Comportamento Observado:** A restrição de chave única no banco de dados atuou conforme esperado, e a API traduziu o erro para uma mensagem amigável ao usuário (_"Este valor já está em uso"_).

### [Sucesso] Integração de API de Terceiros (ViaCEP e OpenStreetMap)

- **Ação:** Inserção de um CEP válido no formulário de criação/edição.
- **Comportamento Observado:** As requisições assíncronas para o preenchimento automático do endereço, Latitude e Longitude ocorreram sem travamentos e com tratamento adequado de carregamento (_loading state_).

### [Sucesso] Proteção contra Exclusão Indevida (RN-PROPRIEDADE-04)

- **Ação:** Tentativa de exclusão de uma propriedade "semeada" via _seed_ do Prisma que já possuía registros vinculados (como áreas ou lotes simulados).
- **Comportamento Observado:** A integridade referencial foi mantida. O sistema bloqueou o _delete_ e exibiu corretamente a mensagem informando sobre a existência de vínculos.
