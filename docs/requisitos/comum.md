# 📦 Estruturas Comuns

Este documento reúne estruturas de dados reutilizadas por mais de um módulo do sistema, evitando duplicar a definição dos mesmos campos em cada documento de requisitos.

## `Endereço`

Endereços para propriedades, compradores, fornecedores ou qualquer outra entidade que precise de localização. Os campos previstos para endereços são:

| Campo | Tipo | Descrição |
|-|-|-|
| `CEP` | Texto | CEP, no formato 99999-999 |
| `Logradouro` | Texto | Nome da rua, avenida, rodovia ou estrada de acesso |
| `Número` | Texto | Número do imóvel ou ponto de referência na via, quando houver |
| `Complemento` | Texto | Informação adicional para localização, como "Km 15" ou "Próximo à ponte" |
| `Bairro` | Texto | Bairro ou zona rural |
| `Município` | Texto | Município |
| `UF` | Texto | Unidade Federativa (estado), sigla de 2 letras, por exemplo MT |
| `País` | Texto | País |




## Exclusão vs Inativação
Toda exclusão no banco será condicionada, ou seja, as entidades cadastradas que tiverem referências registradas em outras entidades não poderão ser excluídas.

Por outro lado, essas entidades podem ter o estado Ativo/Inativo, que será usado para filtrar aqueles registros que não são mais usados (como um cliente que não faz mais negócios), ele permanece no sistema, pois aparece em registros antigos, mas é filtrado para novos registros.



## Propriedade selecionada
O sistema deve ter selecionado a propridade no qual todas as movimentações serão vinculadas. A seleção deve ocorrer no cabeçalho da barra lateral.