# iFarm Mobile

App mobile (Expo / React Native) do iFarm. Não tem banco de dados nem backend próprio — consome a API do [apps/web](../web/README.md) pela rede.

## 🚀 Pré-requisitos

- [apps/web](../web/README.md) configurado e **rodando** (`pnpm --filter web dev`).
- App **Expo Go** instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)) — ou um emulador Android/simulador iOS configurado.
- Celular e computador na **mesma rede Wi-Fi**, se for testar em dispositivo físico.

## 🛠️ Configuração

As dependências já foram instaladas pelo `pnpm install` rodado na raiz do repositório.

### 1. Configurar variável de ambiente

Dentro da pasta `apps/mobile`:

```bash
cp .env.example .env
```

Edite o `.env` e preencha `EXPO_PUBLIC_API_URL` com o IP da máquina que está rodando o `apps/web` **na rede local**:

```bash
hostname -I        # Linux/Mac — pega o primeiro IP listado
ipconfig            # Windows — procure por "Endereço IPv4"
```

```env
EXPO_PUBLIC_API_URL="http://SEU_IP_AQUI:3000"
```

> Esse IP muda se você trocar de rede (ex: outro Wi-Fi). Sempre que isso acontecer, atualize o `.env` e reinicie o `pnpm start`.

## 💻 Executando

Da raiz do repositório:

```bash
pnpm --filter mobile start
```

Ou de dentro da pasta `apps/mobile`:

```bash
pnpm start
```

No terminal vai aparecer um QR code e um menu de atalhos:

| Atalho             | Ação                                                      |
| :----------------- | :-------------------------------------------------------- |
| Escanear o QR code | Abre no app Expo Go do celular                            |
| `a`                | Abre num emulador Android (exige Android SDK configurado) |
| `i`                | Abre num simulador iOS (exige macOS)                      |
| `w`                | Abre no navegador                                         |
| `r`                | Recarrega o app                                           |
