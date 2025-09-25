import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from "react-native";

const exhibitions = [
  {
    exhibition_id: 1,
    ex_title: "Nature Wonders",
    ex_date: "2025-10-15",
    ex_status: "coming",
    ex_space: 50,
    ex_category: "Nature",
    ex_poster: "nature-poster.jpg",
    ex_price: 20.0,
  },
  {
    exhibition_id: 2,
    ex_title: "Historical Artifacts",
    ex_date: "2025-09-01",
    ex_status: "ongoing",
    ex_space: 40,
    ex_category: "History",
    ex_poster: "history-poster.jpg",
    ex_price: 15.0,
  },
  {
    exhibition_id: 3,
    ex_title: "Photography Expo",
    ex_date: "2025-07-20",
    ex_status: "completed",
    ex_space: 30,
    ex_category: "Photography",
    ex_poster: "photography-poster.jpg",
    ex_price: 10.0,
  },
  {
    exhibition_id: 4,
    ex_title: "Abstract Exhibition",
    ex_date: "2025-11-05",
    ex_status: "coming",
    ex_space: 25,
    ex_category: "Other",
    ex_poster: "abstract-poster.jpg",
    ex_price: 12.5,
  },
  // Add more exhibitions here as needed
];

const statuses = ["All", "coming", "ongoing", "completed"];
const categories = ["All", "Nature", "History", "Photography", "Other"];

export default function ViewExhibitions() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filter exhibitions by status and category
  const filteredExhibitions = exhibitions.filter((ex) => {
    const statusMatch = selectedStatus === "All" || ex.ex_status === selectedStatus;
    const categoryMatch = selectedCategory === "All" || ex.ex_category === selectedCategory;
    return statusMatch && categoryMatch;
  });

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.title}>{item.ex_title}</Text>
      <Text style={styles.info}>Date: {item.ex_date}</Text>
      <Text style={styles.info}>Status: {item.ex_status}</Text>
      <Text style={styles.info}>Category: {item.ex_category}</Text>
      <Text style={styles.info}>Space: {item.ex_space} seats</Text>
      <Text style={styles.info}>Price: ${item.ex_price.toFixed(2)}</Text>
    </View>
  );

  const renderFilterButtons = (options, selected, setSelected) => (
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Exhibitions</Text>

      <Text style={styles.filterLabel}>Filter by Status:</Text>
      {renderFilterButtons(statuses, selectedStatus, setSelectedStatus)}

      <Text style={styles.filterLabel}>Filter by Category:</Text>
      {renderFilterButtons(categories, selectedCategory, setSelectedCategory)}

      <FlatList
        data={filteredExhibitions}
        keyExtractor={(item) => item.exhibition_id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No exhibitions found.</Text>}
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
