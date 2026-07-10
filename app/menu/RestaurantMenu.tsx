import { AlertComponent } from '@/components/molecules/AlertComponent';
import { RestaurantMenuItemCard, type RestaurantMenuItem } from '@/components/molecules/RestaurantMenuItemCard';
import { CartModal } from '@/components/organisms/CartModal';
import { RestaurantCheckoutBar } from '@/components/organisms/RestaurantCheckoutBar';
import { RestaurantMenuSection } from '@/components/organisms/RestaurantMenuSection';
import { auth, db } from '@/services/firebase';
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft, CheckCircle2, ShoppingCart } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

const getAbsoluteDate = (fechaCreacion: string, horaStr: string) => {
  if (!fechaCreacion || !horaStr || !horaStr.includes(':')) return null;
  const date = new Date(fechaCreacion);
  if (isNaN(date.getTime())) return null;
  const [h, m] = horaStr.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
};

export default function RestaurantMenuScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [packs, setPacks] = useState<RestaurantMenuItem[]>([]);
  const [platos, setPlatos] = useState<RestaurantMenuItem[]>([]);
  const [restaurantName, setRestaurantName] = useState("Cargando...");
  const [restaurantIsActive, setRestaurantIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [conflictAllergies, setConflictAllergies] = useState<string[]>([]);
  const [pendingItemToAdd, setPendingItemToAdd] = useState<any>(null);
  const [cartModalVisible, setCartModalVisible] = useState(false);

  const formatData = (docSnap: any, collectionName: string): RestaurantMenuItem => {
    const data = docSnap.data();
    
    let alergenosSeguros: string[] = [];
    if (Array.isArray(data.alergenos)) {
      alergenosSeguros = data.alergenos;
    } else if (typeof data.alergenos === 'string' && data.alergenos.trim() !== "") {
      alergenosSeguros = [data.alergenos];
    }

    return {
      id: docSnap.id,
      collection: collectionName,
      name: data.nombre ?? data.name ?? "Producto sin nombre",
      description: data.descripcion ?? data.description ?? "Delicioso excedente del día.",
      originalPrice: Number(data.precioOriginal ?? data.originalPrice ?? 0),
      discountPrice: Number(data.precioOferta ?? data.discountPrice ?? 0),
      category: data.categoria ?? data.category ?? "Variado",
      horaInicio: data.horaInicio || null, 
      horaFin: data.horaFin || null,
      fecha_creacion: data.fecha_creacion || null, 
      stock: Number(data.cantidadDisponible ?? data.stock ?? 1),
      image: data.imagenUrl ?? data.image ?? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
      alergenos: alergenosSeguros 
    };
  };

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      
      if (auth.currentUser) {
        const userRef = doc(db, 'usuarios', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.alergias && userData.alergias.opciones_predefinidas) {
             setUserAllergies(userData.alergias.opciones_predefinidas);
          }
        }
      }

      if (typeof id === 'string') {
        const restRef = doc(db, "restaurantes", id);
        const restSnap = await getDoc(restRef);
        if (restSnap.exists()) {
          const restData = restSnap.data();
          setRestaurantName(restData.nombre);
          setRestaurantIsActive(restData.activo !== false);
        }
      }

      const qPacks = query(collection(db, "packs_sopresa"), where("restauranteId", "==", id));
      const qPlatos = query(collection(db, "platos_independientes"), where("restauranteId", "==", id));

      const [packsSnapshot, platosSnapshot] = await Promise.all([
        getDocs(qPacks),
        getDocs(qPlatos)
      ]);
      
      setPacks(packsSnapshot.docs.map(doc => formatData(doc, "packs_sopresa")));
      setPlatos(platosSnapshot.docs.map(doc => formatData(doc, "platos_independientes")));

    } catch (error) {
      console.error("Error al cargar menú de Firestore:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [id]);

  const getItemStatus = (item: RestaurantMenuItem) => {
    let isUpcoming = false;
    let isExpired = false;
    const now = new Date();

    
    const startDate = getAbsoluteDate(item.fecha_creacion || "", item.horaInicio || "");
    const expDate = getAbsoluteDate(item.fecha_creacion || "", item.horaFin || "");

    if (startDate && expDate) {
      if (now < startDate) {
        isUpcoming = true; 
      } else if (now > expDate) {
        isExpired = true; 
      }
    } else {
      isExpired = true; 
    }

    const userAllergiesLower = userAllergies.map((a) => a.toLowerCase().trim());
    const platoAllergenosLower = (item.alergenos || []).map((a: string) => a.toLowerCase().trim());
    const isDangerous = platoAllergenosLower.some((a: string) => userAllergiesLower.includes(a));

    return { isUpcoming, isExpired, isDangerous };
  };

  const isItemVisibleWhenRestaurantActive = (item: RestaurantMenuItem) => {
    const { isUpcoming, isExpired } = getItemStatus(item);
    return !isUpcoming && !isExpired && item.stock > 0;
  };

  const applyQuantityChange = (dishId: string, delta: number, stock: number, name: string) => {
    setQuantities((prev) => {
      const currentQty = prev[dishId] || 0;
      const newQty = currentQty + delta;
      
      if (newQty < 0 || newQty > stock) return prev;
      
      if (delta > 0) {
        setToastMessage(`¡${name} añadido!`);
        setTimeout(() => setToastMessage(null), 2000);
      }
      return { ...prev, [dishId]: newQty };
    });
  };

  const handleQuantityChange = (item: any, delta: number) => {
    if (delta < 0) {
      applyQuantityChange(item.id, delta, item.stock, item.name);
      return;
    }

    const alergenosPlatoSeguro = Array.isArray(item.alergenos) ? item.alergenos : [];
    const userAllergiesLower = userAllergies.map(a => a.toLowerCase().trim());
    const platoAllergenosLower = alergenosPlatoSeguro.map((a: string) => a.toLowerCase().trim());

    const commonAllergiesLower = platoAllergenosLower.filter((a: string) => userAllergiesLower.includes(a));

    if (commonAllergiesLower.length > 0) {
      const originalNames = alergenosPlatoSeguro.filter((a: string) => userAllergiesLower.includes(a.toLowerCase().trim()));
      setConflictAllergies(originalNames);
      setPendingItemToAdd(item);
      setModalVisible(true);
    } else {
      applyQuantityChange(item.id, delta, item.stock, item.name);
    }
  };

  const confirmRiskyAdd = () => {
    if (pendingItemToAdd) {
      applyQuantityChange(pendingItemToAdd.id, 1, pendingItemToAdd.stock, pendingItemToAdd.name);
    }
    setModalVisible(false);
    setPendingItemToAdd(null);
  };

  const cancelRiskyAdd = () => {
    setModalVisible(false);
    setPendingItemToAdd(null);
  };

  const visiblePacks = restaurantIsActive ? packs.filter(isItemVisibleWhenRestaurantActive) : packs;
  const visiblePlatos = restaurantIsActive ? platos.filter(isItemVisibleWhenRestaurantActive) : platos;
  const allItems = [...visiblePacks, ...visiblePlatos];
  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  
  const totalAmount = allItems.reduce((sum, item) => {
    return sum + (quantities[item.id] || 0) * item.discountPrice;
  }, 0);

  const handleProceedCheckout = () => {
    const cartItems = allItems
      .map((item) => ({
        id: item.id,
        name: item.name,
        quantity: quantities[item.id] || 0,
        price: item.discountPrice,
        collection: item.collection
      }))
      .filter((item) => item.quantity > 0);

    router.push({
      pathname: '/menu/checkout', 
      params: { 
        cartStr: JSON.stringify(cartItems), 
        total: totalAmount,
        restaurantId: id
      }
    });
  };

  const renderItemCard = (item: RestaurantMenuItem, isSurprisePack: boolean) => {
    const { isUpcoming, isExpired, isDangerous } = getItemStatus(item);

    return (
      <RestaurantMenuItemCard
        key={item.id}
        item={item}
        quantity={quantities[item.id] || 0}
        isSurprisePack={isSurprisePack}
        isUpcoming={isUpcoming}
        isExpired={isExpired}
        isDangerous={isDangerous}
        onDecrease={() => handleQuantityChange(item, -1)}
        onIncrease={() => handleQuantityChange(item, 1)}
      />
    );
  };

  return (
    <View className="flex-1 bg-gray-50 flex-col relative">  
      <View className="bg-[#90C659] pt-12 pb-4 px-4 flex-row items-center justify-between shadow-md z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        
        <View className="items-center flex-1">
          <Text className="font-bold text-lg text-white" numberOfLines={1}>{restaurantName}</Text>
          <Text className="text-white/80 text-xs font-medium">Rescata comida hasta 70% dscto.</Text>
        </View>

        <TouchableOpacity className="relative p-1.5" onPress={() => setCartModalVisible(true)}>
          <ShoppingCart color="white" size={24} />
          {totalItems > 0 && (
            <View className="absolute top-0 right-0 bg-[#CD5334] w-4 h-4 rounded-full items-center justify-center">
              <Text className="text-white text-[10px] font-bold">{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {toastMessage && (
        <View className="absolute top-28 self-center bg-gray-800 px-4 py-2.5 rounded-full shadow-lg flex-row items-center gap-2 z-50">
          <CheckCircle2 color="#90C659" size={16} />
          <Text className="text-sm font-medium text-white">{toastMessage}</Text>
        </View>
      )}

      <AlertComponent 
        visible={modalVisible} 
        allergens={conflictAllergies} 
        onClose={cancelRiskyAdd} 
        onConfirm={confirmRiskyAdd} 
      />

      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
        items={allItems}
        quantities={quantities}
        totalAmount={totalAmount}
        onIncrease={(item) => handleQuantityChange(item, 1)}
        onDecrease={(item) => handleQuantityChange(item, -1)}
        onCheckout={() => {
          setCartModalVisible(false);
          handleProceedCheckout();
        }}
      />
      
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#90C659" />
          <Text className="text-gray-500 mt-4 font-medium">Cargando menú...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 190 }}>
          
          <RestaurantMenuSection
            title="Packs Sorpresa"
            icon={<Text className="text-lg">🎁</Text>}
            items={visiblePacks}
            isSurprisePack={true}
            renderItem={renderItemCard}
          />

          <RestaurantMenuSection
            title="Platos para rescatar"
            icon={<Text className="text-lg">🍽️</Text>}
            items={visiblePlatos}
            isSurprisePack={false}
            renderItem={renderItemCard}
          />

          {visiblePacks.length === 0 && visiblePlatos.length === 0 && (
            <View className="py-10 items-center justify-center">
              <Text className="text-gray-400 text-sm text-center">Este restaurante no cuenta con ofertas disponibles por el momento.</Text>
            </View>
          )}

        </ScrollView>
      )}

      <RestaurantCheckoutBar
        totalItems={totalItems}
        totalAmount={totalAmount}
        onProceedCheckout={handleProceedCheckout}
      />
      
    </View>
  );
}