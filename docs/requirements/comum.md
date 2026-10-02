# 📦 Estruturas Comuns

Este documento reúne estruturas de dados reutilizadas por mais de um módulo do sistema, evitando duplicar a definição dos mesmos campos em cada documento de requisitos.

## `Endereço`

Endereços para propriedades, compradores, fornecedores ou qualquer outra entidade que precise de localização. Os campos previstos para endereços são:

| Campo         | Tipo  | Descrição                                                                                    |
| ------------- | ----- | -------------------------------------------------------------------------------------------- |
| `CEP*`        | Texto | CEP, no formato 99999-999                                                                    |
| `Logradouro*` | Texto | Nome da rua, avenida, rodovia ou estrada de acesso. Até 150 caracteres                       |
| `Número`      | Texto | Número do imóvel ou ponto de referência na via, quando houver. Até 15 caracteres             |
| `Complemento` | Texto | Informação adicional para localização, como "Km 15" ou "Próximo à ponte". Até 100 caracteres |
| `Bairro`      | Texto | Bairro ou zona rural. Até 100 caracteres                                                     |
| `Município*`  | Texto | Município. Até 60 caracteres                                                                 |
| `UF*`         | Texto | Unidade Federativa (estado), sigla de 2 letras, por exemplo MT                               |
| `País`        | Texto | País. Sempre Brasil                                                                          |

O endereço é opcional para as entidades que o possuem. Quando informado, os campos marcados com `*` são obrigatórios.

Ao ser informado um CEP válido, o sistema deve consultar o serviço ViaCEP e preencher automaticamente `Logradouro`, `Bairro`, `Município` e `UF`. Se o CEP não for encontrado, deve exibir a mensagem: _"CEP não encontrado."_.

## Exclusão vs Inativação

Toda exclusão no banco será condicionada, ou seja, as entidades cadastradas que tiverem referências registradas em outras entidades não poderão ser excluídas. Nesse caso, o sistema deve impedir a exclusão e exibir a mensagem: _"Este registro está em uso e não pode ser excluído."_.

Por outro lado, essas entidades podem ter o estado Ativo/Inativo, que será usado para filtrar aqueles registros que não são mais usados (como um cliente que não faz mais negócios), ele permanece no sistema, pois aparece em registros antigos, mas é filtrado para novos registros.

## Unidade Animal (UA)

Medida usada para comparar a lotação de uma área com a sua capacidade de suporte, independentemente do tamanho dos animais. 1 UA equivale a 450 kg de peso vivo, e a UA de um animal é calculada assim:

- **Com peso:** peso atual (kg) ÷ 450;
- **Sem peso, com data de nascimento:** estimada pela idade:

  | Idade                                 | UA   |
  | ------------------------------------- | ---- |
  | Até 12 meses                          | 0,4  |
  | De 13 a 24 meses                      | 0,75 |
  | Acima de 24 meses                     | 1    |
  | Macho não castrado, acima de 24 meses | 1,25 |

- **Sem peso e sem data de nascimento:** 1 UA, para não subestimar a ocupação.

Quando algum animal tiver a UA estimada, os valores de lotação que o incluem são aproximados.

## Propriedade selecionada

O sistema deve ter selecionado a propridade no qual todas as movimentações serão vinculadas. A seleção deve ocorrer no cabeçalho da barra lateral.

## Campos de controle

Todo registro possui os campos abaixo, preenchidos automaticamente pelo sistema.

| Campo           | Descrição                          | Tipo      | Obrig. | Restrições              |
| --------------- | ---------------------------------- | --------- | ------ | ----------------------- |
| `Criado em`     | Data e hora de criação do registro | Data/hora | Sim    | Definido pelo sistema   |
| `Atualizado em` | Data e hora da última alteração    | Data/hora | Sim    | Atualizado pelo sistema |

## Padrão de listagem

Toda listagem do sistema deve:

- Exibir documentos e telefones formatados (ex.: 123.456.789-00, (65) 91234-5678).
- Permitir escolher quais colunas exibir ou ocultar.
- Permitir ordenar por qualquer coluna visível.
- Ser paginada, permitindo escolher a quantidade de registros por página.
- Exibir _"Nenhum registro encontrado."_ quando a pesquisa ou o filtro não retornar resultados.
