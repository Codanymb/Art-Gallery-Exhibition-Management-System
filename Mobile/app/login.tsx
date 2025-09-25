import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Button,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post(
        "http://192.168.10.163:3000/api/auth/login",
        formData
      );

      if (response?.data?.status === true) {
        // ✅ Store the token in AsyncStorage
        await AsyncStorage.setItem("token", response.data.token);

        setMessage({ text: "Login successful!", type: "success" });
        setFormData({ email: "", password: "" });

        // ✅ Navigate to home page
 router.replace({ pathname: "home" as RelativePathString });
      } else {
        setMessage({
          text: response?.data?.message || "Unexpected response from server.",
          type: "error",
        });
      }
    } catch (error: any) {
      setMessage({
        text:
          error.response?.data?.message ||
          "Login failed. Check your credentials.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("./../assets/images/art.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Login</Text>

        {message.text !== "" && (
          <Text
            style={[
              styles.message,
              message.type === "success" ? styles.success : styles.error,
            ]}
          >
            {message.text}
          </Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ccc"
          value={formData.email}
          onChangeText={(value) => handleChange("email", value)}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={formData.password}
          onChangeText={(value) => handleChange("password", value)}
        />

        {loading ? (
          <ActivityIndicator size="small" color="#ffd33d" />
        ) : (
          <Button title="Login" onPress={handleLogin} color="#ffd33d" />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  title: { color: "#993a3aff", fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  input: { backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 8, marginBottom: 15 },
  message: { marginBottom: 15, textAlign: "center", fontSize: 14, padding: 10, borderRadius: 5 },
  success: { color: "#155724", backgroundColor: "#d4edda" },
  error: { color: "#721c24", backgroundColor: "#f8d7da" },
});
