# 📦 Módulo: `MOD-TIPOS-SANITARIOS`

Módulo responsável pelo gerenciamento dos tipos de manejo sanitário utilizados para classificar os procedimentos sanitários aplicados aos animais. O módulo deve possibilitar consulta, criação, atualização e exclusão de tipos de manejo sanitário.

Os dados identificados para tipos de manejo sanitário são:

| Campo   | Tipo        | Descrição                                                   |
| ------- | ----------- | ----------------------------------------------------------- |
| `Nome*` | Texto/Único | Nome do tipo de manejo, como "Vacinação" ou "Vermifugação" |

---

# 1 - Regras de Negócio do Módulo (RN)

- **`RN-TSAN-01` - Preservação de Registro:** Tipos de manejo sanitário que possuam registros associados não podem ser excluídos.

---

# 2 - Requisitos Funcionais (RF)

## ✅ 2.1 - `RF-TSAN-01`: Gerenciar Tipos de Manejo Sanitário

<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição

Tela única responsável por listar, criar, editar, ativar/desativar e excluir tipos de manejo sanitário cadastrados no sistema, utilizados na classificação dos procedimentos sanitários aplicados aos animais.

| Tipo                  | Valor                                                                                                                                                                                  |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**        | Como **Administrador** ou **Gerente** quero **gerenciar os tipos de manejo sanitário cadastrados no sistema** para classificar corretamente os procedimentos sanitários do rebanho. |
| **Dependências**      | —                                                                                                                                                                                      |
| **Regras Vinculadas** | `RN-TSAN-01`                                                                                                                                                                           |
| **Atores**            | Administrador, Gerente                                                                                                                                                                 |
| **Plataformas**       | Web                                                                                                                                                                                    |

### 2.1.2 - Critérios de Aceitação

- [ ] A listagem deve exibir o `Nome` de todos os tipos de manejo sanitário cadastrados, ordenados alfabeticamente.
- [ ] Deve ser possível pesquisar por `Nome`.
- [ ] A criação e edição de tipos de manejo sanitário deve ocorrer diretamente na listagem, sem necessidade de tela ou dialog separado.
- [ ] Um botão "Adicionar" deve inserir uma nova linha editável ao final da listagem para preenchimento do `Nome`.
- [ ] Um clique duplo sobre o `Nome` de um tipo já cadastrado deve habilitá-lo para edição inline.
- [ ] A confirmação da criação/edição ocorre ao perder o foco do campo (blur) ou pressionar Enter; a tecla Esc cancela a alteração em andamento, restaurando o valor anterior (ou removendo a linha, no caso de uma criação cancelada).
- [ ] O campo `Nome` é obrigatório e único.
- [ ] Deve ser possível excluir um tipo de manejo sanitário, desde que não esteja vinculado a nenhum procedimento sanitário.
- [ ] Caso o tipo de manejo sanitário esteja vinculado a algum procedimento sanitário, a exclusão deve ser impedida.

### 2.1.3 - Cenários de Uso

**Cenário 1: Cadastro realizado com sucesso**

- **Dado que** o usuário acionou "Adicionar" e informou um `Nome` válido e ainda não utilizado por outro tipo de manejo sanitário;
- **Quando** ele confirmar saindo do campo ou pressionando Enter;
- **Então** o sistema deve persistir o registro e exibir a mensagem: _"Registro salvo com sucesso!"_.

**Cenário 2: Tentativa de cadastro com nome duplicado**

- **Dado que** o usuário informou, na linha de criação, um `Nome` que já pertence a outro tipo de manejo sanitário cadastrado;
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

- **Dado que** o usuário deu clique duplo sobre o `Nome` de um tipo de manejo sanitário já cadastrado e alterou o valor para um nome válido e não utilizado por outro tipo;
- **Quando** ele confirmar saindo do campo ou pressionando Enter;
- **Então** o sistema deve persistir a alteração e exibir a mensagem: _"Registro atualizado com sucesso!"_.

**Cenário 6: Cancelamento da edição**

- **Dado que** o usuário deu clique duplo sobre o `Nome` de um tipo de manejo sanitário já cadastrado e alterou o valor;
- **Quando** ele pressionar Esc;
- **Então** o sistema deve restaurar o valor original, descartando a alteração.

**Cenário 7: Exclusão de tipo de manejo sanitário sem vínculo**

- **Dado que** existe um tipo de manejo sanitário cadastrado sem nenhum procedimento sanitário vinculado a ele;
- **Quando** o usuário confirmar a ação de "Excluir";
- **Então** o sistema deve excluir o registro e exibir a mensagem: _"Registro excluído com sucesso!"_.

**Cenário 8: Tentativa de exclusão de tipo de manejo sanitário com vínculo**

- **Dado que** existe um tipo de manejo sanitário cadastrado com um ou mais procedimentos sanitários vinculados a ele;
- **Quando** o usuário tentar excluí-lo;
- **Então** o sistema deve impedir a exclusão e exibir a mensagem: _"Este registro está em uso e não pode ser excluído."_ (Aplica `RN-TSAN-01`).

</div>
