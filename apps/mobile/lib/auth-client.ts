import { Platform } from "react-native";
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

// No alvo web, usa o mesmo host da própria página em vez do IP fixo do .env: o cookie
// de sessão é SameSite=Lax, e pro navegador "localhost" e "192.168.x.x" são sites
// diferentes mesmo sendo a mesma máquina, então o cookie recebido de um IP nunca volta
// numa chamada feita a partir do outro host. No nativo isso não importa — o plugin do
// Expo guarda a sessão no SecureStore e manda o cookie manualmente, sem passar pelo
// cookie jar do navegador.
const baseURL =
  Platform.OS === "web"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : process.env.EXPO_PUBLIC_API_URL;

// Origem "crua" da API (sem o /api/auth que o client do better-auth adiciona sozinho),
// pra usar em fetch normal contra as demais rotas de /api do apps/web.
export const apiBaseURL = baseURL;

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "ifarmmobile",
      storage: SecureStore,
      storagePrefix: "ifarmmobile",
    }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
