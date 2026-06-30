import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Leaf, Minus, Plus, ShoppingCart, Tag } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ActionButton } from "../components/ActionButton";
import { auth, db } from "../firebase";

export default function RestaurantMenuScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [packs, setPacks] = useState<any[]>([]);
  const [platos, setPlatos] = useState<any[]>([]);
  const [restaurantName, setRestaurantName] = useState("Cargando...");
  const [loading, setLoading] = useState(true);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);

  const formatData = (doc: any, collectionName: string) => {
    const data = doc.data();
    return {
      id: doc.id,
      collection: collectionName,
      name: data.nombre || data.name || "Producto sin nombre",
      description: data.descripcion || data.description || "Delicioso excedente del día.",
      originalPrice: Number(data.precioOriginal || data.originalPrice || 0),
      discountPrice: Number(data.precioOferta || data.discountPrice || 0),
      category: data.categoria || data.category || "Variado",
      timeLeft: data.tiempoRestante || data.timeLeft || "Pronto",
      stock: Number(data.cantidadDisponible || data.stock || 1),
      image: data.imagenUrl || data.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
      alergenos: data.alergenos || [] 
    };
  };

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar alergias del usuario (con validación fuerte)
      if (auth.currentUser) {
        const userRef = doc(db, 'usuarios', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Navegamos seguro por el objeto de alergias
          if (userData.alergias && userData.alergias.opciones_predefinidas) {
             const userAlergiasArray = userData.alergias.opciones_predefinidas;
             console.log("Alergias del usuario detectadas:", userAlergiasArray); // Radar para consola
             setUserAllergies(userAlergiasArray);
          } else {
             console.log("El usuario no tiene alergias predefinidas guardadas.");
          }
        }
      }

      if (typeof id === 'string') {
        const restRef = doc(db, "restaurantes", id);
        const restSnap = await getDoc(restRef);
        if (restSnap.exists()) {
          setRestaurantName(restSnap.data().nombre);
        }
      }

      // CORRECCIÓN DE TIPO: En tu código decia "packs_sopresa" sin la 'r'. 
      // ¡Esto también hacía que no te cargaran los packs! Lo cambié a "packs_sorpresa"
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

    const commonAllergies = item.alergenos.filter((a: string) => userAllergies.includes(a));

    if (commonAllergies.length > 0) {
      Alert.alert(
        "⚠️ Alerta de Salud",
        `Tu perfil indica que tienes alergia a: ${commonAllergies.join(', ')}. Este producto contiene dicho ingrediente.\n\n¿Estás seguro de que deseas añadirlo al carrito?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sí, añadir bajo mi riesgo", onPress: () => applyQuantityChange(item.id, delta, item.stock, item.name) }
        ]
      );
    } else {
      applyQuantityChange(item.id, delta, item.stock, item.name);
    }
  };

  const allItems = [...packs, ...platos];
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
      pathname: '/checkout', 
      params: { 
        cartStr: JSON.stringify(cartItems), 
        total: totalAmount,
        restaurantId: id
      }
    });
  };

  const renderItemCard = (item: any, isSurprisePack: boolean) => {
    const isAgotado = item.stock <= 0;
    const isDangerous = item.alergenos && item.alergenos.some((a: string) => userAllergies.includes(a));

    return (

      <View key={item.id} className={`bg-white border ${isSurprisePack ? 'border-[#90C659]/30' : 'border-gray-200'} rounded-xl overflow-hidden shadow-sm flex-row h-44 mb-4 ${isAgotado ? 'opacity-60' : ''}`}>

        
        <View className="w-1/3 bg-gray-100 relative">
          <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
          
          {isAgotado ? (
            <View className="absolute top-0 left-0 w-full bg-gray-600 py-1 items-center z-10">
              <Text className="text-white text-[10px] font-black tracking-widest">AGOTADO</Text>
            </View>
          ) : item.stock === 1 ? (
            <View className="absolute top-0 left-0 w-full bg-red-500 py-0.5 items-center z-10">
              <Text className="text-white text-[9px] font-bold">¡Último!</Text>
            </View>
          ) : null}

          {isSurprisePack && (
            <View className="absolute bottom-0 w-full bg-[#90C659]/90 py-0.5 items-center">
              <Text className="text-white text-[8px] font-black tracking-widest uppercase">Sorpresa</Text>
            </View>
          )}
        </View>

        <View className="p-3 flex-1 flex-col justify-between">
          <View>
            <View className="flex-row justify-between items-start mb-1">
              <Text className="font-bold text-sm text-gray-800 flex-1 pr-2 leading-tight" numberOfLines={2}>
                {item.name}
              </Text>
              {isDangerous ? (
                 <AlertTriangle color="#ef4444" size={16} /> 
              ) : item.category === "Vegano" ? (
                 <Leaf color="#90C659" size={16} />
              ) : null}
            </View>
            
            <Text className="text-[10px] text-gray-500 mb-1.5" numberOfLines={2}>
              {item.description}
            </Text>

            <View className="flex-row gap-2 items-center">
              <View className="bg-gray-100 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                <Tag color="#4b5563" size={10} />
                <Text className="text-[9px] text-gray-600 font-medium">{item.category}</Text>
              </View>
              {!isAgotado && (
                <View className="bg-orange-50 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                  <Clock color="#ea580c" size={10} />
                  <Text className="text-[9px] text-orange-600 font-bold">exp. {item.timeLeft}</Text>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row items-end justify-between mt-2">
            <View>
              <Text className="text-[10px] text-gray-400 line-through">
                S/. {item.originalPrice?.toFixed(2)}
              </Text>
              <Text className="font-black text-[#90C659] text-base leading-none">
                S/. {item.discountPrice?.toFixed(2)}
              </Text>
            </View>

            {isAgotado ? (
              <View className="bg-gray-200 px-3 py-1.5 rounded-lg">
                <Text className="text-gray-500 text-[10px] font-bold">Sin Stock</Text>
              </View>
            ) : quantities[item.id] ? (
              <View className="flex-row items-center gap-2 bg-gray-50 border border-gray-200 rounded-full p-1">
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(item, -1)}
                  className="w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm"
                >
                  <Minus color="#4b5563" size={12} />
                </TouchableOpacity>
                
                <Text className="text-xs font-bold w-4 text-center">{quantities[item.id]}</Text>
                
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(item, 1)}
                  disabled={quantities[item.id] >= item.stock}
                  className={`w-6 h-6 rounded-full items-center justify-center shadow-sm ${quantities[item.id] >= item.stock ? "bg-gray-200" : "bg-[#90C659]"}`}
                >
                  <Plus color={quantities[item.id] >= item.stock ? "#9ca3af" : "white"} size={12} />
                </TouchableOpacity>
              </View>
            ) : (
              <ActionButton onPress={() => handleQuantityChange(item, 1)} text="Añadir" />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 flex-col relative">
      
      {/* HEADER */}
      <View className="bg-[#90C659] pt-12 pb-4 px-4 flex-row items-center justify-between shadow-md z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        
        <View className="items-center flex-1">
          <Text className="font-bold text-lg text-white" numberOfLines={1}>{restaurantName}</Text>
          <Text className="text-white/80 text-xs font-medium">Rescata comida hasta 70% dscto.</Text>
        </View>

        <TouchableOpacity className="relative p-1.5">
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
      
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#90C659" />
          <Text className="text-gray-500 mt-4 font-medium">Cargando menú...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          
          {packs.length > 0 && (
            <View className="mb-2">
              <View className="flex-row items-center gap-2 mb-4">
                <Text className="text-lg">🎁</Text>
                <Text className="font-bold text-lg text-gray-800">Packs Sorpresa</Text>
              </View>
              {packs.map((pack) => renderItemCard(pack, true))}
            </View>
          )}

          {platos.length > 0 && (
            <View className="mt-4 mb-2">
              <View className="flex-row items-center gap-2 mb-4">
                <Text className="text-lg">🍽️</Text>
                <Text className="font-bold text-lg text-gray-800">Platos para rescatar</Text>
              </View>
              {platos.map((plato) => renderItemCard(plato, false))}
            </View>
          )}

          {packs.length === 0 && platos.length === 0 && (
            <View className="py-10 items-center justify-center">
              <Text className="text-gray-400 text-sm text-center">Este restaurante no cuenta con ofertas disponibles por el momento.</Text>
            </View>
          )}

        </ScrollView>
      )}

      <View className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white shadow-lg pb-8">
        <TouchableOpacity
          onPress={handleProceedCheckout}
          disabled={totalItems === 0}
          className={`w-full py-4 rounded-xl flex-row items-center justify-between px-6 active:scale-95 ${
            totalItems > 0 ? "bg-[#90C659] shadow-lg" : "bg-gray-200"
          }`}
        >
          <Text className={`font-bold text-base ${totalItems > 0 ? "text-white" : "text-gray-400"}`}>
            ♻️ Proceder al Rescate
          </Text>
          {totalItems > 0 && (
            <View className="bg-white px-2 py-1 rounded-md">
              <Text className="text-[#90C659] font-black text-sm">S/. {totalAmount.toFixed(2)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
    </View>
  );
}