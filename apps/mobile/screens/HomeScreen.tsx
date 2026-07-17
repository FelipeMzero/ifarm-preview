import { useEffect, useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";
import { apiBaseURL, authClient, signOut, useSession } from "../lib/auth-client";

type PropertyDetails = {
  id: string;
  name: string;
  ownerName: string;
  totalArea: number | null;
  productiveArea: number | null;
  city: string | null;
  state: string | null;
};

export function HomeScreen() {
  const { data: session } = useSession();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      // authClient.$fetch (não fetch puro): no nativo o fetch do RN não tem cookie jar,
      // então é o plugin do @better-auth/expo que reanexa a sessão guardada no
      // SecureStore — e isso só acontece em chamadas feitas por $fetch. Passar a URL
      // absoluta (em vez de um caminho relativo) faz o $fetch pular o prefixo /api/auth
      // que ele adiciona por padrão, já que essa rota não é do better-auth.
      const { data, error } = await authClient.$fetch<{ data: PropertyDetails | null }>(
        `${apiBaseURL}/api/user/current-property/details`,
      );

      if (cancelled) return;

      if (error) {
        console.error("Erro ao carregar propriedade:", error);
        setErrorMessage("Não foi possível carregar a propriedade.");
      } else {
        setProperty(data?.data ?? null);
      }
      setIsLoading(false);
    }

    loadProperty();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {session?.user.name}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Propriedade selecionada</Text>

        {isLoading && <ActivityIndicator style={styles.spacing} />}

        {!isLoading && errorMessage && (
          <Text style={[styles.spacing, styles.error]}>{errorMessage}</Text>
        )}

        {!isLoading && !errorMessage && !property && (
          <Text style={styles.spacing}>Nenhuma propriedade cadastrada.</Text>
        )}

        {!isLoading && !errorMessage && property && (
          <View style={styles.spacing}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <Text>Titular: {property.ownerName}</Text>
            {(property.city || property.state) && (
              <Text>
                Localização: {property.city ?? "-"}/{property.state ?? "-"}
              </Text>
            )}
            {property.totalArea != null && <Text>Área total: {property.totalArea} ha</Text>}
            {property.productiveArea != null && (
              <Text>Área produtiva: {property.productiveArea} ha</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.spacing}>
        <Button title="Sair" onPress={() => signOut()} color="#b91c1c" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
    backgroundColor: "#fff",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
    textTransform: "uppercase",
  },
  propertyName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  spacing: {
    marginTop: 12,
  },
  error: {
    color: "#b91c1c",
  },
});
