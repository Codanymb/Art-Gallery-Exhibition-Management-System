import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffd33d",
        headerStyle: { backgroundColor: "#25292e" },
        headerShadowVisible: false,
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#25292e" },
      }}
    >

      <Tabs.Screen
        name="artists"
        
        options={{
          title: "Artists",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={24} />
          ),
        }}
      />

      <Tabs.Screen
        name="artPieces"
        options={{
          title: "ArtPieces",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "images" : "images-outline"} color={color} size={24} />
          ),
        }}
      />

      <Tabs.Screen
        name="exhibitions"
        options={{
          title: "Exhibitions",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "business" : "business-outline"} color={color} size={24} />
          ),
        }}
      />

      <Tabs.Screen
      name="index" // 👈 this points to index.tsx
        options={{
         title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
       }}
      />

      <Tabs.Screen
      name="cart" 
        options={{
         title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
          ),
       }}
      />
      

      
    </Tabs>
  );
}
