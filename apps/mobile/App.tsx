import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSession } from "./lib/auth-client";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";

export default function App() {
  const { data: session, isPending } = useSession();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      {isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : session ? (
        <HomeScreen />
      ) : (
        <LoginScreen />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
});
