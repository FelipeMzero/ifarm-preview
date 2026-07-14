# 📦 Módulo: `MOD-RACAS`

Módulo responsável pelo gerenciamento das raças de animais utilizadas para classificação do rebanho. O módulo deve possibilitar consulta, criação, atualização e exclusão de raças.

Os dados identificados para raças são:

| Campo | Tipo | Descrição |
|-|-|-|
| `Nome*` | Texto/Único | Nome da raça, como "Nelore" ou "Angus" |

---

# 1 - Regras de Negócio do Módulo (RN)

* **`RN-RACA-01` - Preservação de Histórico:** Raças vinculadas a um ou mais animais cadastrados não podem ter sua existência apagada, garantindo a rastreabilidade do rebanho.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-RACA-01`: Gerenciar Raças
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição
Tela única responsável por listar, criar, editar e excluir raças cadastradas no sistema, utilizadas na classificação de animais.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Gerente** quero **gerenciar as raças cadastradas no sistema** para classificar corretamente os animais do rebanho. |
| **Dependências** | — |
| **Regras Vinculadas**| `RN-RACA-01` |
| **Atores** | Gerente |
| **Plataformas**| Web |

### 2.1.2 - Critérios de Aceitação
* [ ] A listagem deve exibir o `Nome` de todas as raças cadastradas, ordenadas alfabeticamente.
* [ ] Deve ser possível pesquisar por `Nome`.
* [ ] A criação e edição de raças deve ocorrer diretamente na listagem, sem necessidade de tela ou dialog separado.
* [ ] Um botão "Adicionar" deve inserir uma nova linha editável ao final da listagem para preenchimento do `Nome`.
* [ ] Um clique duplo sobre o `Nome` de uma raça já cadastrada deve habilitá-lo para edição inline.
* [ ] A confirmação da criação/edição ocorre ao perder o foco do campo (blur) ou pressionar Enter; a tecla Esc cancela a alteração em andamento, restaurando o valor anterior (ou removendo a linha, no caso de uma criação cancelada).
* [ ] O campo `Nome` é obrigatório e único.
* [ ] Deve ser possível excluir uma raça, desde que não esteja vinculada a nenhum animal.
* [ ] Caso a raça esteja vinculada a algum animal, a exclusão deve ser impedida.

### 2.1.3 - Cenários de Uso

**Cenário 1: Cadastro realizado com sucesso**
* **Dado que** o usuário acionou "Adicionar" e informou um `Nome` válido e ainda não utilizado por outra raça;
* **Quando** ele confirmar saindo do campo ou pressionando Enter;
* **Então** o sistema deve persistir o registro e exibir a mensagem: *"Registro salvo com sucesso!"*.

**Cenário 2: Tentativa de cadastro com nome duplicado**
* **Dado que** o usuário informou, na linha de criação, um `Nome` que já pertence a outra raça cadastrada;
* **Quando** ele confirmar saindo do campo ou pressionando Enter;
* **Então** o sistema deve impedir a gravação, manter o campo em edição e destacar o erro: *"Este valor já está em uso."*.

**Cenário 3: Tentativa de cadastro com campo obrigatório ausente**
* **Dado que** o usuário acionou "Adicionar" e deixou o campo `Nome` em branco;
* **Quando** ele tentar confirmar saindo do campo ou pressionando Enter;
* **Então** o sistema deve impedir a gravação, manter o campo em edição e destacar o erro: *"Este campo é obrigatório."*.

**Cenário 4: Cancelamento da criação**
* **Dado que** o usuário acionou "Adicionar" e começou a preencher o `Nome`;
* **Quando** ele pressionar Esc;
* **Então** o sistema deve descartar a nova linha sem persistir nenhum dado.

**Cenário 5: Atualização realizada com sucesso**
* **Dado que** o usuário deu clique duplo sobre o `Nome` de uma raça já cadastrada e alterou o valor para um nome válido e não utilizado por outra raça;
* **Quando** ele confirmar saindo do campo ou pressionando Enter;
* **Então** o sistema deve persistir a alteração e exibir a mensagem: *"Registro atualizado com sucesso!"*.

**Cenário 6: Cancelamento da edição**
* **Dado que** o usuário deu clique duplo sobre o `Nome` de uma raça já cadastrada e alterou o valor;
* **Quando** ele pressionar Esc;
* **Então** o sistema deve restaurar o valor original, descartando a alteração.

**Cenário 7: Exclusão de raça sem vínculo**
* **Dado que** existe uma raça cadastrada sem nenhum animal vinculado a ela;
* **Quando** o usuário confirmar a ação de "Excluir";
* **Então** o sistema deve excluir o registro e exibir a mensagem: *"Registro excluído com sucesso!"*.

**Cenário 8: Tentativa de exclusão de raça com vínculo**
* **Dado que** existe uma raça cadastrada com um ou mais animais vinculados a ela;
* **Quando** o usuário tentar excluí-la;
* **Então** o sistema deve impedir a exclusão e exibir a mensagem: *"Este registro está em uso e não pode ser excluído."* (Aplica `RN-RACA-01`).

</div>

</div>