# 📦 Módulo: `MOD-TECNICAS-CASTRACAO`

Módulo responsável pelo gerenciamento das técnicas de castração utilizadas no registro das castrações dos animais. O módulo deve possibilitar consulta, criação, atualização e exclusão de técnicas de castração.

Os dados identificados para técnicas de castração são:

| Campo   | Tipo        | Descrição                                                   |
| ------- | ----------- | ----------------------------------------------------------- |
| `Nome*` | Texto/Único | Nome da técnica, como "Burdizzo", "Cirúrgica" ou "Elástico" |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-CAST-01` - Preservação de Registro:** Técnicas de castração que possuam registros associados não podem ser excluídas.

---

# 2 - Requisitos Funcionais (RF)

## ✅ 2.1 - `RF-CAST-01`: Gerenciar Técnicas de Castração

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Tela única responsável por listar, criar, editar, ativar/desativar e excluir técnicas de castração cadastradas no sistema, utilizadas no registro das castrações dos animais.

| Tipo                  | Valor                                                                                                                                                                      |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente** quero **gerenciar as técnicas de castração cadastradas no sistema** para registrar corretamente as castrações realizadas no rebanho. |
| **Dependências**      | —                                                                                                                                                                          |
| **Regras Vinculadas** | `RN-CAST-01`                                                                                                                                                               |
| **Atores**            | Administrador, Gerente                                                                                                                                                     |
| **Plataformas**       | Web                                                                                                                                                                        |

### 2.1.2 - Critérios de Aceitação

- [ ] A listagem deve exibir o `Nome` de todas as técnicas de castração cadastradas, ordenadas alfabeticamente.
- [ ] Deve ser possível pesquisar por `Nome`.
- [ ] A criação e edição de técnicas de castração deve ocorrer diretamente na listagem, sem necessidade de tela ou dialog separado.
- [ ] Um botão "Adicionar" deve inserir uma nova linha editável ao final da listagem para preenchimento do `Nome`.
- [ ] Um clique duplo sobre o `Nome` de uma técnica já cadastrada deve habilitá-lo para edição inline.
- [ ] A confirmação da criação/edição ocorre ao perder o foco do campo (blur) ou pressionar Enter; a tecla Esc cancela a alteração em andamento, restaurando o valor anterior (ou removendo a linha, no caso de uma criação cancelada).
- [ ] O campo `Nome` é obrigatório e único.
- [ ] Deve ser possível excluir uma técnica de castração, desde que não esteja vinculada a nenhuma castração.
- [ ] Caso a técnica de castração esteja vinculada a alguma castração, a exclusão deve ser impedida.

### 2.1.3 - Cenários de Uso

**Cenário 1: Cadastro realizado com sucesso**

- **Dado que** o usuário acionou "Adicionar" e informou um `Nome` válido e ainda não utilizado por outra técnica de castração;
- **Quando** ele confirmar saindo do campo ou pressionando Enter;
- **Então** o sistema deve persistir o registro e exibir a mensagem: _"Registro salvo com sucesso!"_.

**Cenário 2: Tentativa de cadastro com nome duplicado**

- **Dado que** o usuário informou, na linha de criação, um `Nome` que já pertence a outra técnica de castração cadastrada;
- **Quando** ele confirmar saindo do campo ou pressionando Enter;
- **Então** o sistema deve impedir a gravação, manter o campo em edição e destacar o erro: _"Este valor já está em uso."_.

**Cenário 3: Tentativa de cadastro com campo obrigatório ausente**

- **Dado que** o usuário acionou "Adicionar" e deixou o campo `Nome` em branco;
- **Quando** ele tentar confirmar saindo do campo ou pressionando Enter;
- **Então** o sistema deve impedir a gravação, manter o campo em edição e destacar o erro: _"Este campo é obrigatório."_.

**Cenário 4: Cancelamento da criação**

- **Dado que** o usuário acionou "Adicionar" e começou a preencher o `Nome`;
- **Quando** ele pressionar Esc;
- **Então** o sistema deve descartar a nova linha sem persistir nenhum dado.

**Cenário 5: Atualização realizada com sucesso**

- **Dado que** o usuário deu clique duplo sobre o `Nome` de uma técnica de castração já cadastrada e alterou o valor para um nome válido e não utilizado por outra técnica;
- **Quando** ele confirmar saindo do campo ou pressionando Enter;
- **Então** o sistema deve persistir a alteração e exibir a mensagem: _"Registro atualizado com sucesso!"_.

**Cenário 6: Cancelamento da edição**

- **Dado que** o usuário deu clique duplo sobre o `Nome` de uma técnica de castração já cadastrada e alterou o valor;
- **Quando** ele pressionar Esc;
- **Então** o sistema deve restaurar o valor original, descartando a alteração.

**Cenário 7: Exclusão de técnica de castração sem vínculo**

- **Dado que** existe uma técnica de castração cadastrada sem nenhuma castração vinculada a ela;
- **Quando** o usuário confirmar a ação de "Excluir";
- **Então** o sistema deve excluir o registro e exibir a mensagem: _"Registro excluído com sucesso!"_.

**Cenário 8: Tentativa de exclusão de técnica de castração com vínculo**

- **Dado que** existe uma técnica de castração cadastrada com uma ou mais castrações vinculadas a ela;
- **Quando** o usuário tentar excluí-la;
- **Então** o sistema deve impedir a exclusão e exibir a mensagem: _"Este registro está em uso e não pode ser excluído."_ (Aplica `RN-CAST-01`).

</div>
