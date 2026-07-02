import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AlertTriangle, History, Home, MapPin, Menu, Package, Search, Star, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { UrgentOffers } from '../components/UrgentOffers';
import { favoriteTab as FavoriteTab } from '../components/favoriteTab'; 
import { profileUser as ProfileUser } from '../components/profileUser'; 

import { db } from '../firebase';

export default function MainMenuScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home'); 
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [restaurantsData, setRestaurantsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, "restaurantes"), where("activo", "==", true));
      const querySnapshot = await getDocs(q);

      const fetchedRestaurants = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setRestaurantsData(fetchedRestaurants);
    } catch (err) {
      console.error("Error al traer al restaurante", err);
      setError("Error al cargar los restaurantes. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const foodCategories = [
    { id: 'all', name: 'Todos', icon: '🍽️' },
    { id: 'bakery', name: 'Panadería', icon: '🥐' },
    { id: 'menu', name: 'Menú', icon: '🍲' },
    { id: 'vegan', name: 'Vegano', icon: '🥗' },
    { id: 'fastfood', name: 'Rápida', icon: '🍔' },
    { id: 'dessert', name: 'Postres', icon: '🍰' },
    { id: 'drinks', name: 'Bebidas', icon: '🧋' },
  ];

  const getCategoryName = (categoryId: string) =>{
    const category = foodCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Variado';
  };

  const filteredRestaurants = selectedCategory === 'all'
    ? restaurantsData
    : restaurantsData.filter(r => r.categoriaId === selectedCategory);

  const urgentOffersList = restaurantsData
    .filter(r => r.urgente === true)
    .map(r => ({
      id: r.id,
      name: r.nombre,
      image: r.imagenUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
      timeLeft: '30',
      offerCount: 3
    }));

  const upcomingOffersList = restaurantsData
    .filter(r => r.proximaOferta === true)
    .map(r => ({
      startTime: r.proximaOfertaHora || '18:00',
      restaurantName: r.nombre
    }));

  const dummyPositions: { top: `${number}%`; left: `${number}%` }[] = [
    { top: '15%', left: '35%' }, { top: '25%', left: '20%' },
    { top: '40%', left: '15%' }, { top: '50%', left: '50%' },
  ];

  const dynamicMapMarkers = filteredRestaurants.slice(0,4).map((r, index) => ({
    id: r.id,
    name: r.nombre,
    top: dummyPositions[index % 4].top,
    left: dummyPositions[index % 4].left
  })); 

  return (
    <View className="flex-1 bg-gray-50 flex-col">
      
      {/* MENÚ LATERAL (DRAWER) */}
      {isMenuOpen && (
        <View className="absolute inset-0 z-50 flex-row" style={StyleSheet.absoluteFill}>
          <TouchableOpacity 
            className="absolute inset-0 bg-black/40" 
            activeOpacity={1} 
            onPress={() => setIsMenuOpen(false)} 
          />
          <View className="w-72 h-full bg-white flex-col shadow-2xl">
            <View className="bg-[#90C659] p-5 pt-12 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-black tracking-wide text-white">ECOEAT</Text>
                <Text className="text-white/90 text-xs font-medium">Opciones extra 🌱</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} className="p-2">
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>

            <View className="flex-col gap-3 p-4 flex-1">
              <TouchableOpacity className="flex-row items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <Package color="#90C659" size={20} />
                <Text className="text-gray-700 font-bold text-sm">Pedido Activo</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <History color="#90C659" size={20} />
                <Text className="text-gray-700 font-bold text-sm">Pedidos anteriores</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-auto">
                <AlertTriangle color="#f87171" size={20} />
                <Text className="text-red-500 font-bold text-sm">Soporte y Quejas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'home' && (
        <View className="flex-1 flex-col overflow-hidden">
          
          <View className="bg-[#90C659] pt-12 pb-4 px-4 flex-row items-center gap-3 shadow-sm z-10">
            <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
              <Menu color="white" size={28} />
            </TouchableOpacity>
            <Text className="font-bold text-xl text-white tracking-wider">🌿 ECOEAT</Text>
            <View className="flex-1 bg-white rounded-full px-4 py-2.5 flex-row items-center gap-2">
              <Search color="#90C659" size={16} />
              <TextInput 
                placeholder="Buscar restaurantes..." 
                className="flex-1 text-sm text-gray-800 p-0 m-0" 
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={{ height: 200, width: '100%' }}>
  <MapView
    style={{ flex: 1 }}
    provider="google"
    initialRegion={{
      latitude: -9.0853,
      longitude: -78.5782,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }}
    showsUserLocation={true}
  >
    {filteredRestaurants.map((restaurant) => {
      const coords = restaurant.ubicacion?.coordenadas;
      if (!coords) return null;
      return (
        <Marker
          key={restaurant.id}
          coordinate={{
            latitude: coords.latitude,
            longitude: coords.longitude,
          }}
          title={restaurant.nombre}
          pinColor="#90C659"
          onPress={() => router.push({
            pathname: '/RestaurantMenu',
            params: { id: String(restaurant.id) },
          })}
        />
      );
    })}
  </MapView>
</View>

          {loading ? (
            <View className="flex-1 items-center justify-center bg-gray-50">
              <ActivityIndicator size="large" color="#90C659" />
              <Text className="text-gray-500 font-medium mt-4">Buscando locales cercanos...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center bg-gray-50 p-6">
              <AlertTriangle color="#f87171" size={48} className="mb-4" />
              <Text className="text-gray-600 font-medium text-center">{error}</Text>
              <TouchableOpacity onPress={fetchRestaurants} className="mt-4">
                <Text className="text-[#90C659] font-bold">Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView className="flex-1 bg-gray-50 pt-4" showsVerticalScrollIndicator={false}>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 px-4" contentContainerStyle={{ gap: 12 }}>
                {foodCategories.map((cat) => (
                  <TouchableOpacity 
                    key={cat.id} 
                    onPress={() => setSelectedCategory(cat.id)} 
                    className={`items-center justify-center w-[72px] h-[76px] rounded-2xl border ${selectedCategory === cat.id ? 'bg-[#90C659] border-[#90C659]' : 'bg-white border-gray-200'}`}
                  >
                    <Text className="text-2xl mb-1">{cat.icon}</Text>
                    <Text className={`text-[10px] font-bold ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {urgentOffersList.length > 0 && (
                <UrgentOffers 
                  restaurants={urgentOffersList} 
                  onRestaurantClick={(idRestaurante) => {
                  router.push(`/RestaurantMenu?id=${idRestaurante}`)
                  }} 
                />
              )}

              {upcomingOffersList.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3 px-4">
                    <Text className="text-lg">⏰</Text>
                    <Text className="font-bold text-lg text-gray-800">Por comenzar</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4" contentContainerStyle={{ gap: 12 }}>
                    {upcomingOffersList.map((offer, index) => (
                      <View key={index} className="w-[150px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm mr-2">
                        <Text className="text-xs text-gray-500 font-medium mb-1">Disponible a las:</Text>
                        <Text className="font-bold text-[#90C659] text-lg mb-1">{offer.startTime}</Text>
                        <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{offer.restaurantName}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View className="px-4 pb-10">
                <View className="flex-row items-center gap-2 mb-4">
                  <Text className="text-lg">🍴</Text>
                  <Text className="font-bold text-lg text-gray-800">Restaurantes Cercanos</Text>
                </View>

                {filteredRestaurants.length === 0 ? (
                  <Text className="text-gray-500 text-sm text-center py-6">No hay restaurantes en esta categoría.</Text>
                ) : (
                  <View className="flex-col gap-4">
                    {filteredRestaurants.map((restaurant) => (
                      <TouchableOpacity 
                        key={restaurant.id} 
                        onPress={() => {
                          router.push({
                            pathname: '/RestaurantMenu',
                            params: { id: String(restaurant.id) },
                          });
                        }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                      >
                        <View className="h-32 bg-gray-200 relative">
                          <Image source={{ uri: restaurant.imagenUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' }} className="w-full h-full" resizeMode="cover" />
                          <View className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-sm">
                            <Star color="#facc15" fill="#facc15" size={14} />
                            <Text className="text-xs font-bold text-gray-700">{restaurant.ratingPromedio || "4.5"}</Text>
                          </View>
                        </View>
                        <View className="p-4">
                          <Text className="font-bold text-base mb-1.5 text-gray-900">{restaurant.nombre}</Text>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-1.5">
                              <MapPin color="#6b7280" size={14} />
                              <Text className="text-sm font-medium text-gray-500">{restaurant.distanciaTexto || 'A 2 km'}</Text>
                            </View>
                            <View className="bg-green-50 px-2 py-1 rounded-md">
                              <Text className="text-[10px] text-green-700 uppercase font-bold tracking-wider">{getCategoryName(restaurant.categoriaId)}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

            </ScrollView>
          )}
        </View>
      )}

      {activeTab === 'favorites' && <FavoriteTab />}
      {activeTab === 'profile' && <ProfileUser />}

      <View className="bg-white border-t border-gray-100 flex-row items-center justify-around py-3 shadow-lg shrink-0 z-20">
        <TouchableOpacity onPress={() => setActiveTab('home')} className="items-center gap-1">
          <Home color={activeTab === 'home' ? "#90C659" : "#9ca3af"} size={24} />
          <Text className={`text-[10px] font-bold ${activeTab === 'home' ? 'text-[#90C659]' : 'text-gray-400'}`}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('favorites')} className="items-center gap-1">
          <Star color={activeTab === 'favorites' ? "#90C659" : "#9ca3af"} size={24} />
          <Text className={`text-[10px] font-bold ${activeTab === 'favorites' ? 'text-[#90C659]' : 'text-gray-400'}`}>Favoritos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('profile')} className="items-center gap-1">
          <User color={activeTab === 'profile' ? "#90C659" : "#9ca3af"} size={24} />
          <Text className={`text-[10px] font-bold ${activeTab === 'profile' ? 'text-[#90C659]' : 'text-gray-400'}`}>Perfil</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
}