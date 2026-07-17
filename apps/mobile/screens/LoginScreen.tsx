import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signIn } from "../lib/auth-client";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);
    const { error } = await signIn.email({ email, password });
    setIsSubmitting(false);

    if (error) {
      // Alert.alert não funciona no target web do Expo (react-native-web faz dela um no-op),
      // por isso o erro é mostrado em tela em vez de usar Alert.
      console.error("Erro ao entrar:", error);
      setErrorMessage(error.message ?? "E-mail ou senha inválidos.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>iFarm</Text>
      <Text style={styles.subtitle}>Entre com sua conta para continuar</Text>

      <View style={styles.field}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      {isSubmitting ? (
        <ActivityIndicator />
      ) : (
        <Button title="Entrar" onPress={handleSubmit} disabled={!email || !password} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    color: "#b91c1c",
    marginBottom: 16,
    textAlign: "center",
  },
});
