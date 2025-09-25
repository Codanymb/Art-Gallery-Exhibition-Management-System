import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router"; // Add this import
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// 👇 replace this with your computer's IP address
const API_BASE_URL = "http://192.168.10.163:3000";

export default function ExhibitionDetails() {
  // 🔹 Use Expo Router hook to get params
  const params = useLocalSearchParams();
  
  // 🔹 Get exhibition_id from params
  const exhibition_id = params.exhibition_id;
  
  // 🔹 Check if we have an exhibition_id
  if (!exhibition_id) {
    return (
      <View style={styles.container}>
        <Text>No exhibition data available</Text>
        <Text>Debug: Params = {JSON.stringify(params)}</Text>
      </View>
    );
  }
  const [exhibition, setExhibition] = useState<any>(null);
  const [artPieces, setArtPieces] = useState<any[]>([]);
  const [availableArt, setAvailableArt] = useState<any[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔹 Load user type & data
  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          setUserType(decoded.user_type);
        } catch (err) {
          console.error("Invalid token", err);
        }
      }
      fetchExhibitionData();
      fetchAvailableArt();
    };
    loadUser();
  }, [exhibition_id]);

  // 🔹 Fetch exhibition details + art pieces
  const fetchExhibitionData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/getEachEx/getEachEx/${exhibition_id}`);
      const data = await res.json();
      setExhibition(data.Exhibition);

      const resArt = await fetch(`${API_BASE_URL}/api/ExArt/getExhibitionArt/${exhibition_id}`);
      const dataArt = await resArt.json();
      setArtPieces(dataArt.art_pieces || []);
    } catch (err) {
      console.error("Error fetching exhibition:", err);
    }
  };

  // 🔹 Fetch available art
  const fetchAvailableArt = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/available/getAvailableArt`);
      const data = await res.json();
      setAvailableArt(data.art_pieces || []);
    } catch (err) {
      console.error("Error fetching available art:", err);
    }
  };

  // 🔹 Add to Cart
  const handleAddToCart = async (art_piece_id: number, price: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("You must be logged in to add to cart");

      const res = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ art_piece_id, quantity: 1, price }),
      });

      const data = await res.json();
      if (!res.ok) return Alert.alert(data.error || "Failed to add to cart");

      Alert.alert("Success", data.message);
    } catch (err) {
      console.error("Error adding to cart:", err);
      Alert.alert("An error occurred. Check console.");
    }
  };

  // 🔹 Owner: Add art to exhibition
  const handleAdd = async (art_piece_id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Assign/AssignArt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exhibition_id, art_piece_id }),
      });

      const data = await res.json();
      Alert.alert(data.msg);

      if (res.ok) {
        fetchExhibitionData();
        setAvailableArt((prev) => prev.filter((a) => a.art_piece_id !== art_piece_id));
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error assigning art:", err);
    }
  };

  // 🔹 Owner: Remove art
  const handleRemove = async (art_piece_id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/remove/DeleteArt/${exhibition_id}/${art_piece_id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      Alert.alert(data.msg);

      if (res.ok) {
        fetchExhibitionData();
      }
    } catch (err) {
      console.error("Error removing art:", err);
    }
  };

  const filteredArt = availableArt.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!exhibition) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{exhibition.ex_title}</Text>
      <Text>Status: {exhibition.ex_status}</Text>
      <Text>Date: {exhibition.ex_date}</Text>

      {userType === "owner" && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.addBtnText}>+ Add Art Piece</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Art Pieces</Text>
      <View style={styles.artGrid}>
        {artPieces.length ? (
          artPieces.map((art, i) => (
            <View key={i} style={styles.artCard}>
              {art.image ? (
                <Image source={{ uri: art.image }} style={styles.artImage} />
              ) : (
                <Text>No Image</Text>
              )}
              <Text style={styles.artTitle}>{art.title}</Text>
              <Text>Category: {art.category}</Text>
              <Text>{art.description}</Text>
              <Text>Value: {art.estimated_value ? `R${art.estimated_value}` : "No Price"}</Text>

              {userType === "owner" ? (
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(art.art_piece_id)}>
                  <Text style={{ color: "white" }}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cartBtn}
                  onPress={() => handleAddToCart(art.art_piece_id, art.estimated_value)}
                >
                  <Text style={{ color: "white" }}>Add to Cart</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text>No art pieces found.</Text>
        )}
      </View>

      {/* 🔹 Modal for Adding Art */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="Search art..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.input}
            />
            <ScrollView>
              {filteredArt.length ? (
                filteredArt.map((a) => (
                  <View key={a.art_piece_id} style={styles.modalItem}>
                    <Text>{a.title} ({a.category})</Text>
                    <TouchableOpacity onPress={() => handleAdd(a.art_piece_id)}>
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text>No available art</Text>
              )}
            </ScrollView>
            <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f6f2eb" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20 },
  artGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  artCard: { width: "48%", backgroundColor: "#fffaf3", padding: 10, borderRadius: 10, marginVertical: 8 },
  artImage: { width: "100%", height: 120, borderRadius: 8, marginBottom: 6 },
  artTitle: { fontWeight: "bold", marginBottom: 4 },
  addBtn: { backgroundColor: "#8b5e3c", padding: 12, borderRadius: 8, marginVertical: 10, alignItems: "center" },
  addBtnText: { color: "white", fontWeight: "bold" },
  cartBtn: { backgroundColor: "#8b5e3c", padding: 8, borderRadius: 6, marginTop: 6, alignItems: "center" },
  removeBtn: { backgroundColor: "red", padding: 8, borderRadius: 6, marginTop: 6, alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "80%" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 10 },
  modalItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#ddd" },
  closeBtn: { marginTop: 10, padding: 10, backgroundColor: "#ccc", borderRadius: 6, alignItems: "center" },
});
