import axios from "axios";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Register() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    user_type: "visitor", 
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post("http://192.168.10.163:3000/api/auth/register", formData);

      if (response?.data?.status === true) {
        setMessage({ text: response.data.message || "Registration successful!", type: "success" });
        setFormData({ name: "", surname: "", email: "", password: "", user_type: "visitor" });

        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      } else {
        setMessage({ text: response?.data?.message || "Unexpected server error.", type: "error" });
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Registration failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

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
        placeholder="First Name"
        placeholderTextColor="#ccc"
        value={formData.name}
        onChangeText={(value) => handleChange("name", value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        placeholderTextColor="#ccc"
        value={formData.surname}
        onChangeText={(value) => handleChange("surname", value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#ccc"
        autoCapitalize="none"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(value) => handleChange("email", value)}
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
        <Button title="Register" onPress={handleRegister} color="#ffd33d" />
      )}

      <TouchableOpacity style={styles.loginContainer}>
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Link href="/login" style={styles.loginLink}>
            Login
          </Link>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  loginContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
  },
  loginLink: {
    color: "#ffd33d",
    fontWeight: "bold",
  },
  message: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
    padding: 10,
    borderRadius: 5,
  },
  success: {
    color: "#155724",
    backgroundColor: "#d4edda",
  },
  error: {
    color: "#721c24",
    backgroundColor: "#f8d7da",
  },
});
