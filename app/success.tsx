import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function RescueSuccessScreen() {
  const router = useRouter();
  
  const { orderId, modality, finalTotal } = useLocalSearchParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const modalityText: Record<string, string> = {
    'tienda': '🏪 Recojo en tienda',
    'delivery': '🚴 Delivery',
    'comer': '🍽️ Comer allí'
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (typeof orderId === 'string') {
        try {
          const orderRef = doc(db, 'pedidos', orderId);
          const orderSnap = await getDoc(orderRef);
          
          if (orderSnap.exists()) {
            const restId = orderSnap.data().restauranteId;
            let restName = "Restaurante";
            if (restId) {
              const restSnap = await getDoc(doc(db, 'restaurantes', restId));
              if (restSnap.exists()) restName = restSnap.data().nombre;
            }

            setOrderData({
              ...orderSnap.data(),
              restaurantName: restName
            });
          }
        } catch (error) {
          console.error("Error al buscar el pedido:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#C8D9A8] items-center justify-center">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white mt-4 font-bold">Generando tu código QR...</Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View className="flex-1 bg-[#C8D9A8] items-center justify-center p-6">
        <Text className="text-gray-800 font-bold text-xl text-center">No se pudo cargar la información del pedido.</Text>
        <TouchableOpacity 
          onPress={() => router.replace('/menuUser')}
          className="mt-6 bg-white px-6 py-3 rounded-xl"
        >
          <Text className="text-[#90C659] font-bold">Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalItems = orderData.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  const co2Saved = (totalItems * 1.25).toFixed(1); 
  const displayModality = typeof modality === 'string' ? modality : orderData.modalidad || 'tienda';
  const displayTotal = typeof finalTotal === 'string' ? parseFloat(finalTotal) : orderData.totalPagado;

  const originalSubtotal = orderData.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const ecoDiscount = originalSubtotal - displayTotal;

  return (
    <View className="flex-1 bg-[#C8D9A8] flex-col">
      
      <View className="items-center pt-16 pb-6">
        <View className="relative items-center justify-center">
          <View className="absolute w-24 h-24 bg-white/30 rounded-full" />
          <CheckCircle color="white" size={80} strokeWidth={3} />
        </View>
        <Text className="font-bold text-3xl mt-4 text-gray-800">¡Rescate Exitoso!</Text>
        <Text className="text-gray-700 mt-2 font-medium">Has contribuido a reducir el desperdicio</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
          <Text className="font-bold text-xl mb-4 text-gray-800">📋 Resumen del Pedido</Text>

          <View className="space-y-3 mb-6">
            <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
              <Text className="font-semibold text-gray-600">🏪 Local:</Text>
              <Text className="font-bold text-gray-800">{orderData.restaurantName}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
              <Text className="font-semibold text-gray-600">🍽️ Platos:</Text>
              <Text className="font-bold text-gray-800">{totalItems} {totalItems === 1 ? 'plato' : 'platos'}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
              <Text className="font-semibold text-gray-600">📦 Modalidad:</Text>
              <Text className="font-bold text-gray-800">{modalityText[displayModality] || '🏪 Tienda'}</Text>
            </View>
            
            {ecoDiscount > 0.01 && (
              <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
                <Text className="font-semibold text-green-600">♻️ Dscto. Envase:</Text>
                <Text className="font-bold text-green-600">-S/ {ecoDiscount.toFixed(2)}</Text>
              </View>
            )}

            <View className="flex-row justify-between items-center py-3">
              <Text className="font-bold text-gray-800 text-base">💰 Total Pagado:</Text>
              <Text className="font-black text-2xl text-[#90C659]">S/ {displayTotal.toFixed(2)}</Text>
            </View>
          </View>

          <View className="bg-[#90C659] rounded-xl px-4 py-3.5 flex-row items-center gap-3 shadow-sm">
            <Text className="text-3xl">🌍</Text>
            <View>
              <Text className="font-bold text-sm text-white">Impacto Ambiental</Text>
              <Text className="text-sm font-medium text-white/90">{co2Saved} Kg CO2 evitado</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-6 items-center shadow-sm border border-gray-100">
          <Text className="font-bold text-lg mb-4 text-gray-800">Código QR de Rescate</Text>

          <View className="w-52 h-52 border-4 border-[#90C659] rounded-2xl items-center justify-center bg-white mb-4 p-4 shadow-sm relative">
            <View className="w-full h-full flex-row flex-wrap justify-between content-between">
               {Array.from({ length: 64 }).map((_, i) => {
                 const orderIdValue = typeof orderId === 'string' ? orderId : Array.isArray(orderId) ? orderId[0] : '';
                 const isBlack = (orderIdValue.charCodeAt(i % (orderIdValue.length || 1)) || 0) % 2 === 0;
                 return (
                   <View 
                     key={i} 
                     className={`w-[11%] h-[11%] rounded-sm m-[0.5%] ${isBlack ? 'bg-gray-800' : 'bg-white'}`} 
                   />
                 )
               })}
            </View>
            <View className="absolute items-center justify-center w-full h-full">
              <View className="w-12 h-12 bg-[#90C659] rounded-lg items-center justify-center shadow-sm">
                <CheckCircle color="white" size={24} strokeWidth={3} />
              </View>
            </View>
          </View>

          <View className="items-center w-full mt-2">
            <View className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 mb-2 w-full items-center">
              <Text className="text-sm font-bold text-gray-700 tracking-widest uppercase">
                ID: ECO-{typeof orderId === 'string' ? orderId.substring(0, 5) : '12345'}
              </Text>
            </View>
            <View className="bg-orange-50 py-1.5 px-4 rounded-lg w-full items-center">
              <Text className="text-sm font-bold text-orange-500">
                ⏰ Válido hasta: {orderData.horario === "Lo antes posible" ? "Hoy" : orderData.horario}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/menuUser')} 
          className="w-full bg-white py-4 rounded-xl items-center justify-center mt-6 border-2 border-[#90C659] shadow-sm mb-4"
        >
          <Text className="text-[#90C659] font-bold text-lg">🏠 Volver al Inicio</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}