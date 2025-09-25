import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, TextInput } from "react-native";

const artists = [
  {
    artist_id: 1,
    id_number: "A001",
    first_name: "John",
    surname: "Doe",
    is_active: "yes",
  },
  {
    artist_id: 2,
    id_number: "A002",
    first_name: "Jane",
    surname: "Smith",
    is_active: "no",
  },
  {
    artist_id: 3,
    id_number: "A003",
    first_name: "Emily",
    surname: "Johnson",
    is_active: "yes",
  },
  // Add more artists here as needed
];

export default function ViewArtists() {
  const [searchText, setSearchText] = useState("");

  // Filter artists based on search text (first_name or surname)
  const filteredArtists = artists.filter(({ first_name, surname }) => {
    const fullName = `${first_name} ${surname}`.toLowerCase();
    return fullName.includes(searchText.toLowerCase());
  });

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.name}>{item.first_name} {item.surname}</Text>
      <Text style={styles.id}>ID: {item.id_number}</Text>
      <Text style={[styles.status, item.is_active === "yes" ? styles.active : styles.inactive]}>
        {item.is_active === "yes" ? "Active" : "Inactive"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Artists</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name..."
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <FlatList
        data={filteredArtists}
        keyExtractor={(item) => item.artist_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No artists found.</Text>}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2196F3",
    textAlign: "center",
  },
  searchInput: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  itemContainer: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#f0f4f7",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  id: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    color: "#fff",
  },
  active: {
    backgroundColor: "#4caf50",
  },
  inactive: {
    backgroundColor: "#f44336",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
    fontSize: 16,
  },
});
