import axios from "axios";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Artist Type
type ArtistForm = {
  id_number: string;
  first_name: string;
  surname: string;
  is_active: "yes" | "no" | "";
};

export default function AddArtistScreen() {
  const [form, setForm] = useState<ArtistForm>({
    id_number: "",
    first_name: "",
    surname: "",
    is_active: "",
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const statusOptions: Array<"yes" | "no"> = ["yes", "no"];

  const handleInputChange = (
    field: keyof ArtistForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.id_number.trim()) {
      Alert.alert("Validation Error", "ID Number is required.");
      return;
    }

    if (!form.first_name.trim() || !form.surname.trim()) {
      Alert.alert("Validation Error", "First name and surname are required.");
      return;
    }

    if (!form.is_active) {
      Alert.alert("Validation Error", "Please select if artist is active.");
      return;
    }

    try {
      const response = await axios.post(
        "http://192.168.10.163:3000/api/AddArtist/AddA",
        form
      );

      if (response.status === 201 || response.status === 200) {
        Alert.alert("Success", "Artist added successfully!");
        setForm({ id_number: "", first_name: "", surname: "", is_active: "" });
      }
    } catch (error: any) {
      console.error("Failed to add artist:", error);
      Alert.alert("Error", "Something went wrong while adding the artist.");
    }
  };

  const StatusModal = () => (
    <Modal visible={showStatusModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Active Status</Text>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={styles.modalOption}
              onPress={() => {
                handleInputChange("is_active", status);
                setShowStatusModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{status}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowStatusModal(false)}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Artist</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>ID Number</Text>
        <TextInput
          style={styles.input}
          value={form.id_number}
          placeholder="Enter ID number"
          onChangeText={(value) => handleInputChange("id_number", value)}
        />

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={form.first_name}
          placeholder="Enter first name"
          onChangeText={(value) => handleInputChange("first_name", value)}
        />

        <Text style={styles.label}>Surname</Text>
        <TextInput
          style={styles.input}
          value={form.surname}
          placeholder="Enter surname"
          onChangeText={(value) => handleInputChange("surname", value)}
        />

        <Text style={styles.label}>Is Active</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => setShowStatusModal(true)}
        >
          <Text style={styles.dropdownText}>
            {form.is_active || "Select status"}
          </Text>
        </TouchableOpacity>
      </View>

      <StatusModal />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Add Artist</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    textAlign: "center",
  },
  formSection: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginTop: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: "#212529",
    marginTop: 5,
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    padding: 12,
    marginTop: 5,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 16,
    color: "#212529",
  },
  actionContainer: {
    margin: 15,
    marginBottom: 30,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalOption: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#212529",
  },
  modalCloseButton: {
    marginTop: 20,
  },
  modalCloseText: {
    color: "#007bff",
    fontSize: 16,
  },
});
