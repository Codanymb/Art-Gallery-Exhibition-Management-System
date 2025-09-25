import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

const CreateExhibition: React.FC = () => {
  const handlePress = () => {
    Alert.alert("Button Pressed", "This is where the create exhibition form will go.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Exhibition</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Create New Exhibition</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateExhibition;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#5a3e2b",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
