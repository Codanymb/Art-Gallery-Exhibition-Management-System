import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await AsyncStorage.removeItem("token");
        console.log("Token removed, user logged out.");
      } catch (error) {
        console.error("Error removing token:", error);
      } finally {
        router.replace("../login");
 // ✅ Correct route path
      }
    };

    const timeout = setTimeout(doLogout, 500); // small delay for spinner
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffd33d" />
      <Text style={styles.text}>Logging out...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  text: {
    color: "#fff",
    marginTop: 15,
    fontSize: 16,
  },
});
