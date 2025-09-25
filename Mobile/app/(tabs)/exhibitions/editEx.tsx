import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Types
type ExhibitionForm = {
  exhibition_id?: number;
  ex_title: string;
  ex_date: string;
  ex_status: "coming" | "ongoing" | "completed" | "";
  ex_space: string;
  ex_category: "Nature" | "History" | "Photography" | "Other" | "";
  ex_poster: string;
  ex_price: string;
  assignedArtPieces: number[];
};

// Props
type Props = {
  exhibition_id: number;
};

export default function Exhibitions({ exhibition_id }: Props) {
  const [form, setForm] = useState<ExhibitionForm>({
    ex_title: "",
    ex_date: "",
    ex_status: "",
    ex_space: "",
    ex_category: "",
    ex_poster: "",
    ex_price: "0",
    assignedArtPieces: [],
  });

  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const statuses: Array<"coming" | "ongoing" | "completed"> = [
    "coming",
    "ongoing",
    "completed",
  ];
  const categories: Array<"Nature" | "History" | "Photography" | "Other"> = [
    "Nature",
    "History",
    "Photography",
    "Other",
  ];

  const mockArtPieces = [
    { id: 1, title: "Sunset Landscape", category: "Nature" },
    { id: 2, title: "Ancient Roman Vase", category: "History" },
    { id: 3, title: "Wildlife Photography", category: "Photography" },
    { id: 4, title: "Modern Art Piece", category: "Other" },
  ];

  // Fetch exhibition data


useEffect(() => {
  const fetchExhibitionDetails = async () => {
    try {
      const response = await fetch(`http://192.168.10.163:3000/api/getEachEx/getEachEx/${exhibition_id}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      console.log("Fetched Exhibition:", data);

      if (data.Exhibition) {
        setForm({
          exhibition_id: data.Exhibition.exhibition_id,
          ex_title: data.Exhibition.ex_title,
          ex_date: data.Exhibition.ex_date,
          ex_status: data.Exhibition.ex_status,
          ex_space: data.Exhibition.ex_space.toString(),
          ex_category: data.Exhibition.ex_category,
          ex_poster: data.Exhibition.ex_poster,
          ex_price: data.Exhibition.ex_price.toString(),
          assignedArtPieces: [], // later populate from art endpoint
        });
      }
    } catch (error) {
      console.error("Failed to load exhibition data:", error);
      Alert.alert("Error", "Failed to load exhibition data");
    }
  };

  fetchExhibitionDetails();
}, []);


  const handleInputChange = (
    field: keyof ExhibitionForm,
    value: string | number | number[] | undefined
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArtPiece = (artId: number) => {
    setForm((prev) => {
      const isAssigned = prev.assignedArtPieces.includes(artId);
      const updated = isAssigned
        ? prev.assignedArtPieces.filter((id) => id !== artId)
        : [...prev.assignedArtPieces, artId];
      return { ...prev, assignedArtPieces: updated };
    });
  };

  const handleSubmit = () => {
    if (!form.ex_title.trim()) {
      Alert.alert("Error", "Exhibition title is required");
      return;
    }
    if (!form.ex_date.trim()) {
      Alert.alert("Error", "Exhibition date is required");
      return;
    }
    if (!form.ex_space.trim() || isNaN(Number(form.ex_space))) {
      Alert.alert("Error", "Exhibition space must be a valid number");
      return;
    }
    if (!form.ex_status) {
      Alert.alert("Error", "Please select a status");
      return;
    }
    if (!form.ex_category) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    console.log("Editing exhibition:", form);
    Alert.alert("Success", "Exhibition updated successfully!");
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={{ textAlign: "center", fontSize: 18 }}>
          Loading exhibition detailssss...
        </Text>
      </View>
    );
  }

  const renderBasicFields = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Exhibition Detailsss</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter exhibition title"
          value={form.ex_title}
          onChangeText={(value) => handleInputChange("ex_title", value)}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={form.ex_date}
          onChangeText={(value) => handleInputChange("ex_date", value)}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Status</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => setShowStatusModal(true)}
        >
          <Text style={styles.dropdownText}>
            {form.ex_status || "Select Status"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Space</Text>
        <TextInput
          style={styles.input}
          placeholder="Exhibition space/room number"
          value={form.ex_space}
          onChangeText={(value) => handleInputChange("ex_space", value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={styles.dropdownText}>
            {form.ex_category || "Select Category"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Poster URL </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter poster image URL "
          value={form.ex_poster}
          onChangeText={(value) => handleInputChange("ex_poster", value)}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Price (R)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={form.ex_price.toString()}
          onChangeText={(value) =>
            handleInputChange("ex_price", parseFloat(value) || 0)
          }
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );

  const renderArtPiecesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Assign Art Pieces ({form.assignedArtPieces.length} selected)
      </Text>
      <FlatList
        data={mockArtPieces}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isSelected = form.assignedArtPieces.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.artPieceItem, isSelected && styles.artPieceSelected]}
              onPress={() => toggleArtPiece(item.id)}
            >
              <Text
                style={[
                  styles.artPieceText,
                  isSelected && styles.artPieceTextSelected,
                ]}
              >
                {item.title} - {item.category}
              </Text>
              <Text style={styles.artPieceStatus}>
                {isSelected ? "✓ Selected" : "Tap to select"}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const StatusModal = () => (
    <Modal visible={showStatusModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Status</Text>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={styles.modalOption}
              onPress={() => {
                handleInputChange("ex_status", status);
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

  const CategoryModal = () => (
    <Modal visible={showCategoryModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Category</Text>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.modalOption}
              onPress={() => {
                handleInputChange("ex_category", category);
                setShowCategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{category}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryModal(false)}
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
        <Text style={styles.headerTitle}>Edit Exhibitions</Text>
      </View>

      {renderBasicFields()}
      {renderArtPiecesSection()}
      <StatusModal />
      <CategoryModal />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Edit Exhibition</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ======= STYLING =======
// Keep all your original styling as-is
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
  section: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 15,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: "#212529",
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 16,
    color: "#212529",
  },
  artPieceItem: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  artPieceSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196F3",
  },
  artPieceText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  artPieceTextSelected: {
    color: "#1976D2",
  },
  artPieceStatus: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 15,
    margin: 15,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
