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

type ArtForm = {
  title: string;
  description: string;
  estimated_value: string;
  category: "Nature" | "History" | "Photography" | "Other" | "";
  availability: "available" | "displayed" | "";
  is_active: "yes" | "no" | "";
  quantity: string;
  artist_id: string;
};

export default function AddArtScreen() {
  const [form, setForm] = useState<ArtForm>({
    title: "",
    description: "",
    estimated_value: "",
    category: "",
    availability: "",
    is_active: "",
    quantity: "",
    artist_id: "",
  });

  // Modals for dropdowns
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);

  const categoryOptions: ArtForm["category"][] = [
    "Nature",
    "History",
    "Photography",
    "Other",
  ];

  const availabilityOptions: ArtForm["availability"][] = [
    "available",
    "displayed",
  ];

  const activeOptions: ArtForm["is_active"][] = ["yes", "no"];

  const handleInputChange = (
    field: keyof ArtForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert("Validation Error", "Title is required.");
      return;
    }
    if (!form.description.trim()) {
      Alert.alert("Validation Error", "Description is required.");
      return;
    }
    if (!form.estimated_value.trim() || isNaN(Number(form.estimated_value))) {
      Alert.alert("Validation Error", "Valid estimated value is required.");
      return;
    }
    if (!form.category) {
      Alert.alert("Validation Error", "Please select a category.");
      return;
    }
    if (!form.availability) {
      Alert.alert("Validation Error", "Please select availability.");
      return;
    }
    if (!form.is_active) {
      Alert.alert("Validation Error", "Please select active status.");
      return;
    }
    if (!form.quantity.trim() || isNaN(Number(form.quantity))) {
      Alert.alert("Validation Error", "Valid quantity is required.");
      return;
    }
    if (!form.artist_id.trim() || isNaN(Number(form.artist_id))) {
      Alert.alert("Validation Error", "Valid artist ID is required.");
      return;
    }

    try {
      const response = await axios.post(
        "http://192.168.10.163:3000/api/AddArt/AddArt",
        {
          ...form,
          estimated_value: parseFloat(form.estimated_value),
          quantity: parseInt(form.quantity, 10),
          artist_id: parseInt(form.artist_id, 10),
        }
      );

      if (response.status === 201 || response.status === 200) {
        Alert.alert("Success", "Art piece added successfully!");
        setForm({
          title: "",
          description: "",
          estimated_value: "",
          category: "",
          availability: "",
          is_active: "",
          quantity: "",
          artist_id: "",
        });
      }
    } catch (error) {
      console.error("Failed to add art piece:", error);
      Alert.alert("Error", "Something went wrong while adding the art piece.");
    }
  };

  const DropdownModal = ({
    visible,
    options,
    onSelect,
    onClose,
    title,
  }: {
    visible: boolean;
    options: string[];
    onSelect: (value: string) => void;
    onClose: () => void;
    title: string;
  }) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.modalOption}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text style={styles.modalOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
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
        <Text style={styles.headerTitle}>Add New Art Piece</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          value={form.title}
          onChangeText={(val) => handleInputChange("title", val)}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          multiline
          placeholder="Enter description"
          value={form.description}
          onChangeText={(val) => handleInputChange("description", val)}
        />

        <Text style={styles.label}>Estimated Value</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter estimated value"
          keyboardType="numeric"
          value={form.estimated_value}
          onChangeText={(val) => handleInputChange("estimated_value", val)}
        />

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={styles.dropdownText}>
            {form.category || "Select category"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Availability</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => setShowAvailabilityModal(true)}
        >
          <Text style={styles.dropdownText}>
            {form.availability || "Select availability"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Active Status</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => setShowActiveModal(true)}
        >
          <Text style={styles.dropdownText}>
            {form.is_active || "Select status"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter quantity"
          keyboardType="numeric"
          value={form.quantity}
          onChangeText={(val) => handleInputChange("quantity", val)}
        />

        <Text style={styles.label}>Artist ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter artist ID"
          keyboardType="numeric"
          value={form.artist_id}
          onChangeText={(val) => handleInputChange("artist_id", val)}
        />
      </View>

      <DropdownModal
        visible={showCategoryModal}
        options={categoryOptions}
        onSelect={(val) => handleInputChange("category", val)}
        onClose={() => setShowCategoryModal(false)}
        title="Select Category"
      />
      <DropdownModal
        visible={showAvailabilityModal}
        options={availabilityOptions}
        onSelect={(val) => handleInputChange("availability", val)}
        onClose={() => setShowAvailabilityModal(false)}
        title="Select Availability"
      />
      <DropdownModal
        visible={showActiveModal}
        options={activeOptions}
        onSelect={(val) => handleInputChange("is_active", val)}
        onClose={() => setShowActiveModal(false)}
        title="Select Active Status"
      />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Add Art Piece</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
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
