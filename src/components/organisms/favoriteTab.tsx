import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Star, MapPin, Trash2, Store } from 'lucide-react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useRouter, useFocusEffect } from 'expo-router';

export function FavoriteTab() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      setLoading(true);
      const userRef = doc(db, 'usuarios', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const favIds = userSnap.data().favoritos || []; // Array de IDs (ej. ["id1", "id2"])

        if (favIds.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const favPromises = favIds.map((restId: string) => getDoc(doc(db, 'restaurantes', restId)));
        const favSnaps = await Promise.all(favPromises);

        const favData = favSnaps
          .filter(snap => snap.exists())
          .map(snap => ({ id: snap.id, ...snap.data() }));

        setFavorites(favData);
      }
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const removeFavorite = async (restaurantId: string, restaurantName: string) => {
    Alert.alert(
      "Eliminar favorito",
      `¿Deseas quitar a ${restaurantName} de tus favoritos?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, quitar", 
          style: "destructive",
          onPress: async () => {
            if (!auth.currentUser) return;
            try {
              const userRef = doc(db, 'usuarios', auth.currentUser.uid);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const currentFavs = userSnap.data().favoritos || [];
                const newFavs = currentFavs.filter((id: string) => id !== restaurantId);
                
                await updateDoc(userRef, { favoritos: newFavs });
                
                setFavorites(prev => prev.filter(rest => rest.id !== restaurantId));
              }
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar de favoritos.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#90C659" />
        <Text className="text-gray-500 mt-4 font-medium">Cargando tus favoritos...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6 text-center">
        <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
          <Star color="#90C659" fill="#90C659" size={40} opacity={0.5} />
        </View>
        <Text className="font-bold text-xl text-gray-800 mb-2">Aún no hay favoritos</Text>
        <Text className="text-gray-500 text-sm text-center px-4">
          Los restaurantes que guardes tocando el ícono del corazón o estrella aparecerán en esta lista.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-[#90C659] pt-14 pb-5 px-6 flex-row items-center shadow-md z-10">
        <Store color="white" size={24} />
        <Text className="font-black text-xl text-white ml-3">Mis Favoritos</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {favorites.map((restaurant) => (
          <TouchableOpacity 
            key={restaurant.id} 
            onPress={() => router.push({ pathname: '../RestaurantMenu', params: { id: String(restaurant.id) } })}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-4"
          >
            <View className="h-32 bg-gray-200 relative">
              <Image source={{ uri: restaurant.imagenUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' }} className="w-full h-full" resizeMode="cover" />
              
              <View className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-sm">
                <Star color="#facc15" fill="#facc15" size={14} />
                <Text className="text-xs font-bold text-gray-700">{restaurant.ratingPromedio || "5.0"}</Text>
              </View>
            </View>

            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-bold text-base mb-1 text-gray-900" numberOfLines={1}>{restaurant.nombre}</Text>
                <View className="flex-row items-center gap-1.5">
                  <MapPin color="#6b7280" size={14} />
                  <Text className="text-sm font-medium text-gray-500">{restaurant.distanciaTexto || 'A 2 km'}</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => removeFavorite(restaurant.id, restaurant.nombre)}
                className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center"
              >
                <Trash2 color="#ef4444" size={18} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}