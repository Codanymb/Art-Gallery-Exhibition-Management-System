import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function EditArtistScreen() {
  const { art_piece_id } = useLocalSearchParams<{ art_piece_id?: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!art_piece_id) {
      Alert.alert("Error", "No art piece ID provided.");
      router.back();
      return;
    }

    const fetchArtist = async () => {
      try {
        const res = await fetch(`http://192.168.10.163:3000/api/artists/${art_piece_id}`);
        const data = await res.json();
        setName(data.name);
        setBio(data.bio);
      } catch (error) {
        console.error("Error fetching artist:", error);
        Alert.alert("Error", "Could not load artist.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [art_piece_id]);

  const handleSave = async () => {
    try {
      await fetch(`http://192.168.10.163:3000/api/artists/${art_piece_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });

      Alert.alert("Success", "Artist updated successfully.");
      router.back();
    } catch (error) {
      console.error("Error updating artist:", error);
      Alert.alert("Error", "Could not update artist.");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        style={styles.input}
        multiline
      />

      <Button title="Save Changes" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  label: { fontWeight: "bold", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
});
