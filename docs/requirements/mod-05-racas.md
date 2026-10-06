# 📦 Módulo: `MOD-RACAS`

Módulo responsável pelo gerenciamento das raças de animais utilizadas para classificação do rebanho. O módulo deve possibilitar consulta, criação, atualização e exclusão de raças.

## Dicionário de dados conceitual

| Campo    | Descrição                              | Tipo  | Obrig. | Restrições                                                                           |
| -------- | -------------------------------------- | ----- | ------ | ------------------------------------------------------------------------------------ |
| `Nome`   | Nome da raça, como "Nelore" ou "Angus" | Texto | Sim    | Único; até 60 caracteres                                                             |
| `Status` | Situação do cadastro                   | Enum  | Sim    | `Ativo` ou `Inativo` (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)) |

---

# 1 - Regras de Negócio do Módulo (RN)

Não há regras de negócio específicas deste módulo.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-RACA-01`: Gerenciar Raças

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Permite listar, criar, editar, ativar/desativar e excluir, em uma tela única, as raças utilizadas na classificação dos animais.

|                       |                                                                                                                                                 |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente**, quero **gerenciar as raças cadastradas no sistema** para classificar corretamente os animais do rebanho. |
| **Dependências**      | —                                                                                                                                               |
| **Regras Vinculadas** | —                                                                                                                                               |
| **Atores**            | Administrador, Gerente                                                                                                                          |
| **Plataformas**       | Web                                                                                                                                             |
| **Versão**            | 1                                                                                                                                               |
| **Especificação**     | 📌 Definida                                                                                                                                     |

### 2.1.2 - Critérios de Aceitação

- [ ] A listagem deve exibir o `Nome` de todas as raças cadastradas, ordenadas alfabeticamente.
- [ ] Deve ser possível pesquisar por `Nome`.
- [ ] A criação e edição de raças deve ocorrer diretamente na listagem, sem necessidade de tela ou dialog separado.
- [ ] Um botão "Adicionar" deve inserir uma nova linha editável ao final da listagem para preenchimento do `Nome`.
- [ ] Um clique duplo sobre o `Nome` de uma raça já cadastrada deve habilitá-lo para edição inline.
- [ ] A confirmação da criação/edição ocorre ao perder o foco do campo (blur) ou pressionar Enter; a tecla Esc cancela a alteração em andamento, restaurando o valor anterior (ou removendo a linha, no caso de uma criação cancelada).
- [ ] O campo `Nome` é obrigatório e único.
- [ ] Deve ser possível excluir uma raça, desde que não esteja vinculada a nenhum animal.
- [ ] Caso a raça esteja vinculada a algum animal, a exclusão deve ser impedida (ver [Exclusão vs Inativação](comum.md#exclusão-vs-inativação)).

### 2.1.3 - Fluxos

**Fluxo principal**

1. O fluxo começa quando o usuário acessa a tela de raças.
2. O sistema exibe as raças cadastradas, ordenadas alfabeticamente.
3. O usuário localiza a raça desejada, podendo pesquisar pelo `Nome` (ver fluxos alternativos).
4. O usuário cria, edita ou exclui uma raça (ver fluxos alternativos).
5. O fluxo termina.

**Fluxos alternativos**

- **A1 – Pesquisa (passo 3):**
  1. O usuário informa um termo de pesquisa.
  2. O sistema exibe as raças que correspondem ao termo informado.
  3. O fluxo retorna ao passo 3.

- **A2 – Criação (passo 4):**
  1. O usuário aciona "Adicionar".
  2. O sistema insere uma nova linha editável ao final da listagem.
  3. O usuário informa o `Nome` e confirma saindo do campo ou pressionando Enter.
  4. O sistema persiste o registro e exibe a mensagem: _"Registro salvo com sucesso!"_
  5. O fluxo retorna ao passo 3.

- **A3 – Nome duplicado (passos A2.4 e A5.4):**
  1. O `Nome` informado já pertence a outra raça cadastrada.
  2. O sistema impede a gravação, mantém o campo em edição e destaca o erro: _"Este valor já está em uso."_
  3. O fluxo retorna ao passo de edição do `Nome` (A2.3 ou A5.3).

- **A4 – Nome em branco (passos A2.4 e A5.4):**
  1. O campo `Nome` foi deixado em branco.
  2. O sistema impede a gravação, mantém o campo em edição e destaca o erro: _"Este campo é obrigatório."_
  3. O fluxo retorna ao passo de edição do `Nome` (A2.3 ou A5.3).

- **A5 – Edição (passo 4):**
  1. O usuário dá um clique duplo sobre o `Nome` de uma raça já cadastrada.
  2. O sistema habilita o `Nome` para edição inline.
  3. O usuário altera o valor e confirma saindo do campo ou pressionando Enter.
  4. O sistema persiste a alteração e exibe a mensagem: _"Registro atualizado com sucesso!"_
  5. O fluxo retorna ao passo 3.

- **A6 – Edição cancelada (passos A2.3 e A5.3):**
  1. O usuário pressiona Esc.
  2. O sistema descarta a alteração: na criação, remove a nova linha sem persistir nenhum dado; na edição, restaura o valor original.
  3. O fluxo retorna ao passo 3.

- **A7 – Exclusão (passo 4):**
  1. O usuário aciona a ação "Excluir" de uma raça.
  2. O sistema solicita a confirmação da exclusão.
  3. O usuário confirma a exclusão.
  4. O sistema verifica que a raça não está vinculada a nenhum animal, exclui o registro e exibe a mensagem: _"Registro excluído com sucesso!"_
  5. O fluxo retorna ao passo 3.

- **A8 – Exclusão cancelada (passo A7.3):**
  1. O usuário não confirma a exclusão.
  2. O sistema mantém o registro inalterado.
  3. O fluxo retorna ao passo 3.

- **A9 – Raça vinculada a animal (passo A7.4):**
  1. A raça está vinculada a um ou mais animais.
  2. O sistema impede a exclusão e exibe a mensagem: _"Este registro está em uso e não pode ser excluído."_
  3. O fluxo retorna ao passo 3.

</div>
