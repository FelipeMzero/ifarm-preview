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




Soft Delete
Toda entidade do banco que está registrada em alguma movimentação não pode ser efetivamente removido do banco, por isso será usada a estratégia de soft delete