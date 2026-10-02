# 📦 Módulo: `MOD-TIPOS-SANITARIOS`

Módulo responsável pelo gerenciamento dos tipos de manejo sanitário utilizados para classificar os procedimentos sanitários aplicados aos animais. O módulo deve possibilitar consulta, criação, atualização e exclusão de tipos de manejo sanitário.

## Dicionário de dados conceitual

| Campo    | Descrição                                                  | Tipo  | Obrig. | Restrições                                                                           |
| -------- | ---------------------------------------------------------- | ----- | ------ | ------------------------------------------------------------------------------------ |
| `Nome`   | Nome do tipo de manejo, como "Vacinação" ou "Vermifugação" | Texto | Sim    | Único                                                                                |
| `Status` | Situação do cadastro                                       | Enum  | Sim    | `Ativo` ou `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)) |

---

# 1 - Regras de Negócio do Módulo (RN)

Não há regras de negócio específicas deste módulo.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-TSAN-01`: Gerenciar Tipos de Manejo Sanitário

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite listar, criar, editar, ativar/desativar e excluir, em uma tela única, os tipos de manejo sanitário utilizados na classificação dos procedimentos sanitários aplicados aos animais.

|                       |                                                                                                                                                                                      |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **gerenciar os tipos de manejo sanitário cadastrados no sistema** para classificar corretamente os procedimentos sanitários do rebanho. |
| **Dependências**      | —                                                                                                                                                                                    |
| **Regras Vinculadas** | —                                                                                                                                                                                    |
| **Atores**            | Administrador, Gerente                                                                                                                                                               |
| **Plataformas**       | Web                                                                                                                                                                                  |

### 2.1.2 - Critérios de Aceitação

- [ ] A listagem deve exibir o `Nome` de todos os tipos de manejo sanitário cadastrados, ordenados alfabeticamente.
- [ ] Deve ser possível pesquisar por `Nome`.
- [ ] A criação e edição de tipos de manejo sanitário deve ocorrer diretamente na listagem, sem necessidade de tela ou dialog separado.
- [ ] Um botão "Adicionar" deve inserir uma nova linha editável ao final da listagem para preenchimento do `Nome`.
- [ ] Um clique duplo sobre o `Nome` de um tipo já cadastrado deve habilitá-lo para edição inline.
- [ ] A confirmação da criação/edição ocorre ao perder o foco do campo (blur) ou pressionar Enter; a tecla Esc cancela a alteração em andamento, restaurando o valor anterior (ou removendo a linha, no caso de uma criação cancelada).
- [ ] O campo `Nome` é obrigatório e único.
- [ ] Deve ser possível excluir um tipo de manejo sanitário, desde que não esteja vinculado a nenhum procedimento sanitário.
- [ ] Caso o tipo de manejo sanitário esteja vinculado a algum procedimento sanitário, a exclusão deve ser impedida (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a tela de tipos de manejo sanitário.
2. O sistema exibe os tipos de manejo sanitário cadastrados, ordenados alfabeticamente.
3. O usuário localiza o tipo desejado, podendo pesquisar pelo `Nome` (ver fluxos alternativos).
4. O usuário cria, edita ou exclui um tipo de manejo sanitário (ver fluxos alternativos).
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe os tipos de manejo sanitário que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A2 – Criação (passo 4):**
  1. O usuário aciona "Adicionar".
  2. O sistema insere uma nova linha editável ao final da listagem.
  3. O usuário informa o `Nome` e confirma saindo do campo ou pressionando Enter.
  4. O sistema persiste o registro e exibe a mensagem: _"Registro salvo com sucesso!"_
  5. O fluxo retorna ao passo 3.

- **A3 – Nome duplicado (passos A2.4 e A5.4):**
  1. O `Nome` informado já pertence a outro tipo de manejo sanitário cadastrado.
  2. O sistema impede a gravação, mantém o campo em edição e destaca o erro: _"Este valor já está em uso."_
  3. O fluxo retorna ao passo de edição do `Nome` (A2.3 ou A5.3).

- **A4 – Nome em branco (passos A2.4 e A5.4):**
  1. O campo `Nome` foi deixado em branco.
  2. O sistema impede a gravação, mantém o campo em edição e destaca o erro: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo de edição do `Nome` (A2.3 ou A5.3).

- **A5 – Edição (passo 4):**
  1. O usuário dá um clique duplo sobre o `Nome` de um tipo de manejo sanitário já cadastrado.
  2. O sistema habilita o `Nome` para edição inline.
  3. O usuário altera o valor e confirma saindo do campo ou pressionando Enter.
  4. O sistema persiste a alteração e exibe a mensagem: _"Registro atualizado com sucesso!"_
  5. O fluxo retorna ao passo 3.

- **A6 – Edição cancelada (passos A2.3 e A5.3):**
  1. O usuário pressiona Esc.
  2. O sistema descarta a alteração: na criação, remove a nova linha sem persistir nenhum dado; na edição, restaura o valor original.
  3. O fluxo retorna ao passo 3.

- **A7 – Exclusão (passo 4):**
  1. O usuário aciona a ação "Excluir" de um tipo de manejo sanitário.
  2. O sistema solicita a confirmação da exclusão.
  3. O usuário confirma a exclusão.
  4. O sistema verifica que o tipo não está vinculado a nenhum procedimento sanitário, exclui o registro e exibe a mensagem: _"Registro excluído com sucesso!"_
  5. O fluxo retorna ao passo 3.

- **A8 – Exclusão cancelada (passo A7.3):**
  1. O usuário não confirma a exclusão.
  2. O sistema mantém o registro inalterado.
  3. O fluxo retorna ao passo 3.

- **A9 – Tipo vinculado a procedimento sanitário (passo A7.4):**
  1. O tipo de manejo sanitário está vinculado a um ou mais procedimentos sanitários.
  2. O sistema impede a exclusão e exibe a mensagem: _"Este registro está em uso e não pode ser excluído."_
  3. O fluxo retorna ao passo 3.

</div>
