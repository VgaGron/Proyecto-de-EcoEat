import { ExitAppAlert } from '@/components/molecules/ExitAppAlert';
import { DiscountOffers } from '@/components/organisms/DiscountOffers';
import { favoriteTab as FavoriteTab } from '@/components/organisms/favoriteTab';
import { profileUser as ProfileUser } from '@/components/organisms/profileUser';
import { UrgentOffers } from '@/components/organisms/UrgentOffers';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AlertTriangle, History, Home, MapPin, Menu, Package, Search, Star, User, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { db } from '@/services/firebase';

const getAbsoluteDate = (fechaCreacion: string, horaStr: string) => {
  if (!fechaCreacion || !horaStr || !horaStr.includes(':')) return null;
  const date = new Date(fechaCreacion);
  if (isNaN(date.getTime())) return null;
  const [h, m] = horaStr.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
};

const formatTimeLeft = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function MainMenuScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home'); 
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [restaurantsData, setRestaurantsData] = useState<any[]>([]);
  const [urgentOffersList, setUrgentOffersList] = useState<any[]>([]);
  const [discountOffersList, setDiscountOffersList] = useState<any[]>([]);
  const [upcomingOffersList, setUpcomingOffersList] = useState<any[]>([]);
  const [allDishesList, setAllDishesList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showExitAlert, setShowExitAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRestaurantsAndOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      const qRest = query(collection(db, "restaurantes"), where("activo", "==", true));
      const [restSnap, packsSnap, platosSnap] = await Promise.all([
        getDocs(qRest),
        getDocs(collection(db, "packs_sopresa")),
        getDocs(collection(db, "platos_independientes"))
      ]);

      const restaurantesDict: Record<string, any> = {};
      const fetchedRestaurants = restSnap.docs.map((doc) => {
        const data = doc.data();
        restaurantesDict[doc.id] = data;
        return { id: doc.id, ...data };
      });

      const now = new Date();
      const urgentMap = new Map();
      const discountMap = new Map();
      const upcomingMap = new Map();
      const allDishesMap = new Map();

      const processOffers = (snap: any, collectionName: string) => {
        snap.docs.forEach((docSnap: any) => {
          const data = docSnap.data();
          if (!data.restauranteId || !restaurantesDict[data.restauranteId]) return;

          const startDate = getAbsoluteDate(data.fecha_creacion, data.horaInicio);
          const expDate = getAbsoluteDate(data.fecha_creacion, data.horaFin);

          if (!startDate || !expDate || now > expDate) return;

          const restInfo = restaurantesDict[data.restauranteId];

          if (now < startDate) {
            if (!upcomingMap.has(data.restauranteId)) {
              upcomingMap.set(data.restauranteId, {
                restauranteId: data.restauranteId,
                restaurantName: restInfo.nombre,
                startTime: data.horaInicio,
                minStartTime: startDate.getTime()
              });
            } else {
              const existing = upcomingMap.get(data.restauranteId);
              if (startDate.getTime() < existing.minStartTime) {
                existing.minStartTime = startDate.getTime();
                existing.startTime = data.horaInicio;
              }
            }
          } 
          else if (now >= startDate && now <= expDate) {
            const leftMins = (expDate.getTime() - now.getTime()) / 60000;
            const baseOffer = {
              id: `${collectionName}-${docSnap.id}`,
              restauranteId: data.restauranteId,
              restaurantName: restInfo.nombre,
              name: data.nombre || data.name || 'Producto sin nombre',
              image: data.imagenUrl || data.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
              originalPrice: Number(data.precioOriginal ?? data.originalPrice ?? 0),
              discountPrice: Number(data.precioOferta ?? data.discountPrice ?? 0),
              timeLeft: formatTimeLeft(leftMins),
            };

            // Se guarda SIEMPRE en la lista completa de platos, para que la búsqueda encuentre cualquier plato disponible
            allDishesMap.set(baseOffer.id, baseOffer);

            if (leftMins <= 120) { 
              if (!urgentMap.has(data.restauranteId)) {
                urgentMap.set(data.restauranteId, {
                  id: data.restauranteId,
                  name: restInfo.nombre,
                  image: restInfo.imagenUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
                  timeLeft: formatTimeLeft(leftMins),
                  offerCount: 0,
                  minEndMins: expDate.getTime()
                });
              }
              const existing = urgentMap.get(data.restauranteId);
              existing.offerCount += (Number(data.cantidadDisponible) || 1);
              
              if (expDate.getTime() < existing.minEndMins) {
                existing.minEndMins = expDate.getTime();
                existing.timeLeft = formatTimeLeft(leftMins);
              }
            } else {
              discountMap.set(baseOffer.id, baseOffer);
            }
          }
        });
      };

      processOffers(packsSnap, 'packs_sopresa');
      processOffers(platosSnap, 'platos_independientes');

      const finalUrgent = Array.from(urgentMap.values());
      const finalDiscount = Array.from(discountMap.values());
      const finalUpcoming = Array.from(upcomingMap.values()).sort((a, b) => a.minStartTime - b.minStartTime);
      const finalAllDishes = Array.from(allDishesMap.values());

      setUrgentOffersList(finalUrgent);
      setDiscountOffersList(finalDiscount);
      setUpcomingOffersList(finalUpcoming);
      setAllDishesList(finalAllDishes);
      setRestaurantsData(fetchedRestaurants);

    } catch (err) {
      console.error("Error al traer datos", err);
      setError("Error al cargar los restaurantes y ofertas. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchRestaurantsAndOffers(); }, []));

  useFocusEffect(
    useCallback(() => {
      setShowExitAlert(false);
      return () => setShowExitAlert(false);
    }, [])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setShowExitAlert(false);
      }
    });

    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isMenuOpen) {
          setIsMenuOpen(false);
          return true;
        }

        setShowExitAlert(true);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isMenuOpen])
  );

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

  const isSearching = searchQuery.trim().length > 0;

  const searchedRestaurants = isSearching
    ? restaurantsData.filter((r) =>
        (r.nombre || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const searchedDishes = isSearching
    ? allDishesList.filter((o) =>
        (o.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (o.restaurantName || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  return (
    <View className="flex-1 bg-gray-50 flex-col">
      
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
                <Text className="text-white/90 text-xs font-medium">Opciones extra 🌱</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} className="p-2">
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>

            <View className="flex-col gap-3 p-4 flex-1">
  <TouchableOpacity
    onPress={() => { setIsMenuOpen(false); router.push('/activePedido'); }}
    className="flex-row items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100"
  >
    <Package color="#90C659" size={20} />
    <Text className="text-gray-700 font-bold text-sm">Pedido Activo</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => { setIsMenuOpen(false); router.push('/historialPedidos'); }}
    className="flex-row items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100"
  >
    <History color="#90C659" size={20} />
    <Text className="text-gray-700 font-bold text-sm">Pedidos anteriores</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => {
      const mensaje = 'Hola, soy un cliente de EcoEat y necesito ayuda con mi pedido.';
      const url = `https://wa.me/51999999999?text=${encodeURIComponent(mensaje)}`;
      Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir WhatsApp.'));
    }}
    className="flex-row items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-auto"
  >
    <AlertTriangle color="#f87171" size={20} />
    <Text className="text-red-500 font-bold text-sm">Soporte y Quejas</Text>
  </TouchableOpacity>
</View>
          </View>
        </View>
      )}

      <ExitAppAlert
        visible={showExitAlert}
        onCancel={() => setShowExitAlert(false)}
        onConfirm={() => BackHandler.exitApp()}
      />

      {activeTab === 'home' && (
        <View className="flex-1 flex-col overflow-hidden">
          
          <View className="bg-[#90C659] pt-12 pb-4 px-4 flex-row items-center gap-3 shadow-sm z-10">
            <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
              <Menu color="white" size={28} />
            </TouchableOpacity>
            <Text className="font-bold text-xl text-white tracking-wider">🌿</Text>
            <View className="flex-1 bg-white rounded-full px-4 py-2.5 flex-row items-center gap-2">
              <Search color="#90C659" size={16} />
              <TextInput 
                placeholder="Buscar restaurantes o platos..." 
                className="flex-1 text-sm text-gray-800 p-0 m-0" 
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X color="#9ca3af" size={16} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isSearching ? (
            <ScrollView className="flex-1 bg-gray-50 pt-4 px-4" showsVerticalScrollIndicator={false}>
              <Text className="font-bold text-lg text-gray-800 mb-4">
                Resultados para "{searchQuery}"
              </Text>

              {searchedRestaurants.length === 0 && searchedDishes.length === 0 ? (
                <Text className="text-gray-500 text-sm text-center py-10">
                  No encontramos restaurantes ni platos con ese nombre.
                </Text>
              ) : (
                <>
                  {searchedRestaurants.length > 0 && (
                    <View className="mb-6">
                      <Text className="font-bold text-sm text-gray-600 mb-3">🍴 Restaurantes</Text>
                      <View className="flex-col gap-3">
                        {searchedRestaurants.map((restaurant) => (
                          <TouchableOpacity
                            key={restaurant.id}
                            onPress={() => router.push({ pathname: '/menu/[id]', params: { id: String(restaurant.id) } })}
                            className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center gap-3 shadow-sm"
                          >
                            <Image
                              source={{ uri: restaurant.imagenUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' }}
                              className="w-12 h-12 rounded-lg"
                              resizeMode="cover"
                            />
                            <View className="flex-1">
                              <Text className="font-bold text-sm text-gray-900" numberOfLines={1}>{restaurant.nombre}</Text>
                              <Text className="text-xs text-gray-500">{getCategoryName(restaurant.categoriaId)}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {searchedDishes.length > 0 && (
                    <View className="mb-10">
                      <Text className="font-bold text-sm text-gray-600 mb-3">🍽️ Platos</Text>
                      <View className="flex-col gap-3">
                        {searchedDishes.map((dish) => (
                          <TouchableOpacity
                            key={dish.id}
                            onPress={() => router.push(`/menu/${dish.restauranteId}`)}
                            className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center gap-3 shadow-sm"
                          >
                            <Image
                              source={{ uri: dish.image }}
                              className="w-12 h-12 rounded-lg"
                              resizeMode="cover"
                            />
                            <View className="flex-1">
                              <Text className="font-bold text-sm text-gray-900" numberOfLines={1}>{dish.name}</Text>
                              <Text className="text-xs text-gray-500" numberOfLines={1}>{dish.restaurantName}</Text>
                            </View>
                            <Text className="font-bold text-[#90C659] text-sm">S/ {dish.discountPrice.toFixed(2)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          ) : (
            <>
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
                        coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
                        title={restaurant.nombre}
                        pinColor="#90C659"
                        onPress={() => router.push({ pathname: '/menu/[id]', params: { id: String(restaurant.id) } })}
                      />
                    );
                  })}
                </MapView>
              </View>

              {loading ? (
                <View className="flex-1 items-center justify-center bg-gray-50">
                  <ActivityIndicator size="large" color="#90C659" />
                  <Text className="text-gray-500 font-medium mt-4">Calculando ofertas en tiempo real...</Text>
                </View>
              ) : error ? (
                <View className="flex-1 items-center justify-center bg-gray-50 p-6">
                  <AlertTriangle color="#f87171" size={48} className="mb-4" />
                  <Text className="text-gray-600 font-medium text-center">{error}</Text>
                  <TouchableOpacity onPress={fetchRestaurantsAndOffers} className="mt-4">
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
                      onRestaurantClick={(idRestaurante) => { router.push(`/menu/${idRestaurante}`) }} 
                    />
                  )}

                  {discountOffersList.length > 0 && (
                    <DiscountOffers
                      offers={discountOffersList}
                      onOfferClick={(idRestaurante) => { router.push(`/menu/${idRestaurante}`) }}
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
                          <TouchableOpacity 
                            key={index} 
                            onPress={() => router.push(`/menu/${offer.restauranteId}`)}
                            className="w-[150px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm mr-2"
                          >
                            <Text className="text-xs text-gray-500 font-medium mb-1">Disponible a las:</Text>
                            <Text className="font-bold text-[#90C659] text-lg mb-1">{offer.startTime}</Text>
                            <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{offer.restaurantName}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <View className="px-4 pb-10">
                    <View className="flex-row items-center gap-2 mb-4">
                      <Text className="text-lg">🍴</Text>
                      <Text className="font-bold text-lg text-gray-800">Directorio de Restaurantes</Text>
                    </View>

                    {filteredRestaurants.length === 0 ? (
                      <Text className="text-gray-500 text-sm text-center py-6">No hay restaurantes en esta categoría.</Text>
                    ) : (
                      <View className="flex-col gap-4">
                        {filteredRestaurants.map((restaurant) => (
                          <TouchableOpacity 
                            key={restaurant.id} 
                            onPress={() => { router.push({ pathname: '/menu/[id]', params: { id: String(restaurant.id) } }); }}
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
            </>
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