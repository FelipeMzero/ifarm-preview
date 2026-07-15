# 📦 Módulo: `MOD-AREAS`


Módulo responsável pelo gerenciamento das áreas de pastagem de cada propriedade (fazenda). O módulo deve possibilitar consulta, criação e alteração dos dados de área de pastagem, sendo que os limites de cada área devem ser desenhados sobre um mapa para tornar a sua identificação mais rápida e fácil. Cada área de pastagem está vinculada a uma propriedade específica.

Os dados identificados para áreas de pastagem são:

| Campo | Tipo | Descrição |
|-|-|-|
| `Nome*` | Texto | Nome da área, como "Piquete 01" |
| `Polígono*` | Json | Referência visual da área no mapa |
| `Hectares*` | Número | Área total em hectares (ha) |
| `Taxa de Lotação*` | Número | Taxa de lotação da área (UA/ha) |
| `Observação` | Texto | Qualquer observação sobre a área, como "Área para engorda com capim-braquiarão" |
| `Propriedade*` | Referência | Propriedade selecionada do sistema |

---

# 1 - Regras de Negócio do Módulo (RN)

* **`RN-AREA-01` - Área Vinculada à Propriedade:** Toda área de pastagem pertence fisicamente a uma propriedade específica, não podendo existir de forma independente ou pertencer a mais de uma propriedade simultaneamente.
* **`RN-AREA-02` - Preservação de Registro:** Áreas de pastagem que possuam registros associados não podem ser excluídas.

---

# 2 - Requisitos Funcionais (RF)

## 2.1 - `RF-AREA-01`: Mapa de Áreas de Pastagem
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.1.1 - Descrição
Tela de entrada do módulo, responsável por exibir todas as áreas de pastagens cadastradas de uma propriedade específica, desenhando seus contornos sobre um mapa. 

A partir desses desenhos da área, o usuário poderá executar ações sobre as áreas, como editar e exibir detalhes.

Cada área de pastagem no mapa deve ser representada por uma cor diferente e ter o nome da área como rótulo.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Administrador**, **Gerente** ou **Funcionário** quero **visualizar as áreas de pastagem cadastradas da propriedade selecionada através de desenhos de suas formas sobre um mapa** para localizar rapidamente um registro e acessar as ações que podem ser executadas para ela. |
| **Dependências** | `RF-PROPRIEDADE-02` (a propriedade deve existir previamente) |
| **Regras Vinculadas**| — |
| **Atores** | Administrador, Gerente, Funcionário |
| **Plataformas**| Web |

### 2.1.2 - Critérios de Aceitação
* [ ] A localização do mapa deve iniciar na localização definida na propriedade selecionada.
* [ ] O mapa possibilita navegar pela área visível e aproximar/afastar.
* [ ] O mapa deve exibir todas as áreas de pastagem ativas da propriedade selecionada no sistema, desenhando a forma de cada área sobre um mapa.
* [ ] Cada desenho da área sobre o mapa deve ter um preenchimento semitransparente de cor diferente (determinística por ID, estável entre acessos, cor provisória neutra durante a criação) e o nome da área como rótulo.
* [ ] Ao passar o mouse sobre uma área de pastagem do mapa deve aparecer um tooltip com `Hectares`, `Taxa de Lotação` e `Observação`.
* [ ] Clicar em uma área abre um popup com as opções Editar, Detalhes e Desativar.
* [ ] No topo do mapa deve ter um botão que inicia a ação de criar uma nova área de pastagem.
* [ ] No topo do mapa deve ter um combobox para alternar entre as áreas ativas e inativas, sendo que para as áreas inativas a única opção existente é a de reativar.


### 2.1.3 - Cenários de Uso

**Cenário 1: Exibição do mapa**
* **Dado que** existem áreas cadastradas para uma propriedade;
* **Quando** o usuário acessar a tela de áreas de pastagens daquela propriedade;
* **Então** o sistema deve exibir um mapa com o desenho dos limites de cada área com seus respectivos nomes como rótulos.

**Cenário 2: Acionar a criação de uma nova área**
* **Dado que** o usuário está na tela de listagem de áreas;
* **Quando** ele acionar o botão "Adicionar";
* **Então** o sistema aciona a criação de uma nova área.

**Cenário 3: Acionar a edição de uma área**
* **Dado que** o usuário está na tela de listagem de áreas;
* **Quando** ele acionar a opção "Editar";
* **Então** o sistema aciona a edição dessa área.

**Cenário 4: Acionar a exibição dos detalhes da área**
* **Dado que** o usuário está na tela de listagem de áreas;
* **Quando** ele acionar a opção "Detalhes";
* **Então** o sistema exibe os detalhes da área.

</div>






## 2.2 - `RF-AREA-02`: Criar Área de Pastagem
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.2.1 - Descrição
Tela com mapa interativo destinada ao cadastro de áreas de pastagens, possibilitando desenhar o contorno da área sobre o mapa e preencher os dados complementares através de um sheet que aparece à direita da tela.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Administrador**, **Gerente** ou **Funcionário** quero **cadastrar uma área desenhando seus limites no mapa** para que ela possa ser gerenciada e vinculada a lotes e animais. |
| **Dependências** | `RF-PROPRIEDADE-02` (a propriedade deve existir previamente) |
| **Regras Vinculadas**| `RN-AREA-01` |
| **Atores** | Administrador, Gerente, Funcionário |
| **Plataformas**| Web |

### 2.2.2 - Critérios de Aceitação
* [ ] Uma vez que a criação de área inicia, o usuário deve desenhar os contornos da área clicando no mapa até fechar o polígono. Com o polígono definido, um sheet surge à direita do mapa para que o restante dos campos sejam preenchidos.
* [ ] Após o fechamento do polígono, o usuário pode ajustar sua geometria por meio do arraste dos vértices.
* [ ] Os campos `Nome`, `Hectares`, `Taxa de Lotação` e `Propriedade` são obrigatórios.
* [ ] Ao desenhar ou ajustar o `Polígono`, o sistema deve calcular e preencher automaticamente o campo `Hectares` como sugestão.
* [ ] O campo `Hectares` deve permanecer editável manualmente após o preenchimento automático.
* [ ] Caso o valor de `Hectares` informado divergir significativamente (acima de 25%) do calculado a partir do `Polígono`, o sistema deve exibir um alerta, sem impedir o salvamento.
* [ ] A área criada será vinculada à propriedade que está selecionada no sistema.

### 2.2.3 - Cenários de Uso

**Cenário 1: Cadastro realizado com sucesso**
* **Dado que** o usuário desenhou o `Polígono` da área no mapa e preencheu corretamente os demais campos obrigatórios;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve persistir os dados no banco de dados e exibir a mensagem: *"Registro salvo com sucesso!"*.

**Cenário 2: Divergência entre hectares informado e contorno desenhado**
* **Dado que** o usuário ajustou manualmente o campo `Hectares` para um valor muito diferente do calculado a partir do `Polígono`;
* **Quando** ele digitar essa alteração no campo;
* **Então** o sistema deve exibir no campo o alerta: *"O valor informado está bem diferente da área desenhada no mapa"*

**Cenário 3: Tentativa de cadastro com campos obrigatórios ausentes**
* **Dado que** o usuário está na interface de cadastro de áreas;
* **E** deixou de preencher ou desenhar um ou mais campos obrigatórios (como `Nome`, `Polígono` ou `Taxa de Lotação`);
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação, manter os dados já preenchidos no formulário e destacar visualmente os campos ausentes com uma mensagem de erro (ex: *"Este campo é obrigatório"*).

</div>









## 2.3 - `RF-AREA-03`: Atualizar Área de Pastagem
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.3.1 - Descrição
Tela com mapa interativo e sheet lateral destinada à edição dos dados de uma área de pastagem já cadastrada, incluindo o ajuste do seu polígono.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Administrador**, **Gerente** ou **Funcionário** quero **atualizar os dados de uma área de pastagem já cadastrada** para manter as informações corretas e atualizadas no sistema. |
| **Dependências** | `RF-AREA-02` |
| **Regras Vinculadas**| `RN-AREA-01` |
| **Atores** | Administrador, Gerente, Funcionário |
| **Plataformas**| Web |

### 2.3.2 - Critérios de Aceitação
* [ ] Ao acionar a edição de uma área, o sheet surge à direita do mapa já preenchido com os dados atuais da área, e o polígono correspondente é destacado no mapa em modo de edição, com seus vértices disponíveis para ajuste.
* [ ] O campo `Nome` é editável e obrigatório.
* [ ] O `Polígono` é editável através do arraste de seus vértices.
* [ ] Ao ajustar o `Polígono`, o sistema deve recalcular e sugerir um novo valor para o campo `Hectares`.
* [ ] O campo `Hectares` permanece editável manualmente após o recálculo automático.
* [ ] Caso o valor de `Hectares` informado divirja significativamente (acima de 25%) do calculado a partir do `Polígono`, o sistema deve exibir no campo o alerta: *"O valor informado está bem diferente da área desenhada no mapa"*, sem impedir o salvamento.
* [ ] O campo `Propriedade` continua vinculado a mesma propriedade dada na sua criação.

### 2.3.3 - Cenários de Uso

**Cenário 1: Atualização realizada com sucesso**
* **Dado que** o Gerente está editando uma área já cadastrada e alterou um ou mais campos com valores válidos;
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve persistir as alterações e exibir a mensagem: *"Registro atualizado com sucesso!"*.

**Cenário 2: Ajuste do polígono com divergência no hectares**
* **Dado que** o Gerente ajustou os vértices do `Polígono` de uma área e o valor de `Hectares` já preenchido divirja significativamente do novo cálculo;
* **Quando** o ajuste for realizado;
* **Então** o sistema deve exibir no campo `Hectares` o alerta: *"O valor informado está bem diferente da área desenhada no mapa"*, sem impedir o salvamento.

**Cenário 3: Tentativa de atualização com campos obrigatórios ausentes**
* **Dado que** o Gerente está editando uma área já cadastrada;
* **E** removeu o preenchimento de um ou mais campos obrigatórios (como `Nome` ou `Taxa de Lotação`);
* **Quando** ele acionar a ação de "Salvar";
* **Então** o sistema deve impedir a gravação, manter os dados já digitados no formulário e destacar visualmente os campos ausentes com uma mensagem de erro (ex: *"Este campo é obrigatório"*).

</div>





## 2.4 - 🚧 `RF-AREA-04`: Detalhes da Área de Pastagem (INCOMPLETO)
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.4.1 - Descrição
Tela destinada à exibição de informações detalhadas de uma área de pastagem, incluindo dados cadastrais completos e o histórico de lotes e animais vinculados a ela.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Administrador**, **Gerente** ou **Funcionário** quero **consultar os detalhes de uma área de pastagem cadastrada** para visualizar seus dados detalhados e o histórico de lotes e animais vinculados a ela. |
| **Dependências** | `RF-AREA-02` |
| **Regras Vinculadas**| `RN-AREA-02` |
| **Atores** | Administrador, Gerente, Funcionário |
| **Plataformas**| Web |

### 2.4.2 - Critérios de Aceitação
* [ ] Exibir um botão para excluir.
* [ ] Exibir os detalhes ...

### 2.4.3 - Cenários de Uso

**Cenário 1: Exibição dos detalhes com histórico vinculado**
* **Dado que** existe uma área cadastrada com lotes ou animais vinculados a ela;
* **Quando** o Gerente acionar a exibição de detalhes a partir do mapa;
* **Então** o sistema deve exibir os dados cadastrais da área, sua localização no mapa e o histórico de lotes e animais vinculados a ela.

**Cenário 2: Exibição dos detalhes**
* **Dado que** existe uma área cadastrada sem nenhum lote ou animal vinculado a ela;
* **Quando** o Gerente acionar a exibição de detalhes a partir do mapa;
* **Então** o sistema deve exibir os dados cadastrais da área e indicar que não há histórico vinculado.

</div>








## 2.5 - `RF-AREA-05`: Excluir Área de pastagem
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.5.1 - Descrição
Funcionalidade destinada à exclusão de uma área de pastagem cadastrada no sistema apenas se não houver outros registros vinculados a ela.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Administrador**, **Gerente** ou **Funcionário**, quero **excluir uma área de pastagem** para manter a base de dados organizada e consistente. |
| **Dependências** | — |
| **Regras Vinculadas**| `RN-AREA-02` |
| **Atores** | Administrador, Gerente, Funcionário |
| **Plataformas**| Web |

### 2.5.2 - Critérios de Aceitação
* [ ] A área de pastagem só pode ser excluída se não tiver outros registros vinculados a ela.

### 2.5.3 - Cenários de Uso

**Cenário 1: Exclusão de área de pastagem sem registros vinculados**
* **Dado que** o Gerente está na tela de detalhes de uma área de pastagem sem registros vinculados a ela;
* **Quando** ele confirmar a ação de "Excluir";
* **Então** o sistema deve excluir o registro e exibir a mensagem: *"Registro excluído com sucesso!"*.

**Cenário 2: Tentativa de exclusão de área de pastagem com registro vinculado**
* **Dado que** o Gerente está na tela de detalhes de uma área de pastagem que possui registros vinculados a ela;
* **Quando** ele confirmar a ação de "Excluir";
* **Então** o sistema deve impedir a exclusão e exibir a mensagem: *"Este registro já possui registros e não pode ser excluído."* (Aplica `RN-AREA-02`).

</div>



## 2.6 - `RF-AREA-06`: Ativar/Desativar Áreas de Pastagem
<div style="border:1px solid #ccc; padding:16px; border-radius:8px;">

### 2.6.1 - Descrição
Funcionalidade destinada à ativação/desativação de uma área de pastagem, possibilitando filtrar as áreas que ainda têm vínculo ativo com o negócio, sem excluí-las. Áreas de pastagem inativas ficam ocultas por padrão nas listagens, mas continuam disponíveis para consultas e relatórios.

| Tipo | Valor |
| :--- | :--- |
| **User Story** | Como **Administrador**, **Gerente** ou **Funcionário**, quero **ativar ou desativar uma área de pastagem cadastrada** para ocultá-la das listagens quando ela não tiver mais relacionamento ativo com o negócio, sem perder seus dados e histórico. |
| **Dependências** | `RF-AREA-02` |
| **Regras Vinculadas**| — |
| **Atores** | Administrador, Gerente, Funcionário |
| **Plataformas**| Web |

### 2.6.2 - Critérios de Aceitação
* [ ] A ação deve alternar o status da área de pastagem entre `Ativo` e `Inativo`.


### 2.6.3 - Cenários de Uso

**Cenário 1: Desativação de área ativa**
* **Dado que** existe uma área cadastrada com status `Ativo`;
* **Quando** o Gerente acionar a ação "Desativar";
* **Então** o sistema deve alterar seu status para `Inativo`.

**Cenário 2: Ativação de área inativa**
* **Dado que** existe uma área cadastrada com status `Inativo`;
* **Quando** o Gerente acionar a ação "Ativar";
* **Então** o sistema deve alterar seu status para `Ativo`.

</div>