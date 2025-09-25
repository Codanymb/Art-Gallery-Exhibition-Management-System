import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from "react-native";

const artPieces = [
  {
    art_piece_id: 1,
    title: "Sunset in the Forest",
    description: "A beautiful sunset in the green forest",
    artist_id: 1,
    estimated_value: 1200,
    category: "Nature",
    availability: "available",
    is_active: "yes",
    image: "sunset.jpg",
    quantity: 2,
  },
  {
    art_piece_id: 2,
    title: "Historic War Painting",
    description: "Painting depicting an important historical event",
    artist_id: 2,
    estimated_value: 3000,
    category: "History",
    availability: "displayed",
    is_active: "yes",
    image: "war.jpg",
    quantity: 1,
  },
  {
    art_piece_id: 3,
    title: "Cityscape Photography",
    description: "Black and white photo of a bustling city",
    artist_id: 3,
    estimated_value: 800,
    category: "Photography",
    availability: "available",
    is_active: "yes",
    image: "cityscape.jpg",
    quantity: 5,
  },
  {
    art_piece_id: 4,
    title: "Abstract Colors",
    description: "An abstract piece with vibrant colors",
    artist_id: 1,
    estimated_value: 600,
    category: "Other",
    availability: "displayed",
    is_active: "yes",
    image: "abstract.jpg",
    quantity: 3,
  },
  // Add more art pieces as needed
];

const categories = ["All", "Nature", "History", "Photography", "Other"];
const availabilities = ["All", "available", "displayed"];

export default function ViewArtPieces() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAvailability, setSelectedAvailability] = useState("All");

  // Filter art pieces by category and availability
  const filteredArtPieces = artPieces.filter((piece) => {
    const categoryMatch = selectedCategory === "All" || piece.category === selectedCategory;
    const availabilityMatch = selectedAvailability === "All" || piece.availability === selectedAvailability;
    return categoryMatch && availabilityMatch;
  });

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.info}>Category: {item.category}</Text>
      <Text style={styles.info}>Availability: {item.availability}</Text>
      <Text style={styles.info}>Estimated Value: ${item.estimated_value.toFixed(2)}</Text>
      <Text style={styles.info}>Quantity: {item.quantity}</Text>
    </View>
  );

  const renderFilterButtons = (options, selected, setSelected) => {
    return (
      <View style={styles.filterRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterButton, selected === option && styles.filterButtonSelected]}
            onPress={() => setSelected(option)}
          >
            <Text style={[styles.filterButtonText, selected === option && styles.filterButtonTextSelected]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Art Pieces</Text>

      <Text style={styles.filterLabel}>Filter by Category:</Text>
      {renderFilterButtons(categories, selectedCategory, setSelectedCategory)}

      <Text style={styles.filterLabel}>Filter by Availability:</Text>
      {renderFilterButtons(availabilities, selectedAvailability, setSelectedAvailability)}

      <FlatList
        data={filteredArtPieces}
        keyExtractor={(item) => item.art_piece_id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No art pieces found.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2196F3",
    textAlign: "center",
  },
  filterLabel: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 8,
    fontWeight: "600",
    color: "#444",
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  filterButton: {
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  filterButtonSelected: {
    backgroundColor: "#2196F3",
  },
  filterButtonText: {
    color: "#444",
    fontWeight: "600",
  },
  filterButtonTextSelected: {
    color: "#fff",
  },
  itemContainer: {
    backgroundColor: "#f0f4f7",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },
  desc: {
    fontSize: 14,
    marginBottom: 5,
    color: "#555",
  },
  info: {
    fontSize: 14,
    marginBottom: 3,
    color: "#666",
  },
  emptyText: {
    marginTop: 30,
    textAlign: "center",
    color: "#999",
    fontSize: 16,
  },
});
