import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, Clock, MapPin, Package, ShoppingBag } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { auth, db } from '@/services/firebase';

export default function ActivePedidoScreen() {
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const modalityText: Record<string, string> = {
    'tienda': '🏪 Recojo en tienda',
    'delivery': '🚴 Delivery',
    'comer': '🍽️ Comer allí'
  };

  useEffect(() => {
    const fetchActivePedido = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'pedidos'),
          where('clienteId', '==', auth.currentUser.uid),
          where('estado', '==', 'pagado_pendiente'),
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const pedidoDoc = snap.docs[0];
          const data = pedidoDoc.data();

          let restName = 'Restaurante';
          if (data.restauranteId) {
            const restSnap = await getDoc(doc(db, 'restaurantes', data.restauranteId));
            if (restSnap.exists()) restName = restSnap.data().nombre;
          }

          setPedido({ id: pedidoDoc.id, ...data, restaurantName: restName });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivePedido();
  }, []);

  return (
    <View className="flex-1 bg-gray-50">

      <View className="bg-[#90C659] pt-12 pb-5 px-4 flex-row items-center shadow-md">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full bg-white/20 mr-3">
          <ArrowLeft color="white" size={22} />
        </TouchableOpacity>
        <View>
          <Text className="font-black text-lg text-white">Pedido Activo</Text>
          <Text className="text-white/70 text-xs">Tu pedido en curso</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#90C659" />
        </View>
      ) : !pedido ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
            <ShoppingBag color="#90C659" size={36} />
          </View>
          <Text className="font-black text-lg text-gray-700 mb-2">Sin pedidos activos</Text>
          <Text className="text-gray-400 text-sm text-center">Cuando hagas un pedido aparecerá aquí.</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-[#90C659] px-6 py-3 rounded-2xl"
          >
            <Text className="text-white font-bold">Explorar restaurantes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>

          <View className="bg-green-50 rounded-2xl p-4 border border-green-200 flex-row items-center gap-3 mb-5">
            <CheckCircle color="#16a34a" size={28} />
            <View>
              <Text className="font-black text-green-800 text-base">¡Pago confirmado!</Text>
              <Text className="text-green-600 text-xs mt-0.5">Pago completado — listo para recoger</Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
            <Text className="font-black text-gray-800 text-base mb-3">🏪 {pedido.restaurantName}</Text>

            <View className="flex-row items-center gap-2 mb-2">
              <Package color="#90C659" size={16} />
              <Text className="text-sm text-gray-600 font-medium">
                {pedido.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0} productos
              </Text>
            </View>

            <View className="flex-row items-center gap-2 mb-2">
              <Clock color="#f97316" size={16} />
              <Text className="text-sm text-gray-600 font-medium">
                {pedido.horario || 'Lo antes posible'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <MapPin color="#3b82f6" size={16} />
              <Text className="text-sm text-gray-600 font-medium">
                {modalityText[pedido.modalidad] || '🏪 Recojo en tienda'}
              </Text>
            </View>
          </View>

          <Text className="font-black text-sm text-gray-800 mb-3">🛒 Productos</Text>
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
            {pedido.items?.map((item: any, index: number) => (
              <View key={index} className={`p-4 flex-row items-center justify-between ${index < pedido.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <Text className="text-sm text-gray-700 font-medium flex-1">{item.quantity}x {item.name}</Text>
                <Text className="text-sm font-black text-[#90C659]">S/ {(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View className="p-4 border-t border-gray-100 flex-row justify-between">
              <Text className="font-black text-gray-800">Total pagado</Text>
              <Text className="font-black text-[#90C659] text-base">S/ {pedido.totalPagado?.toFixed(2)}</Text>
            </View>
          </View>

<Text className="font-black text-sm text-gray-800 mb-3">🎫 Código de recojo</Text>
<View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm items-center">
  <View className="border-4 border-[#90C659] rounded-2xl p-4 mb-3">
    <QRCode
      value={pedido.id || 'ECOEAT'}
      size={160}
      color="#1f2937"
      backgroundColor="white"
    />
  </View>
  <View className="bg-gray-50 px-6 py-2 rounded-xl border border-gray-200 mb-2">
    <Text className="text-base font-black text-gray-800 tracking-widest">
      ECO-{pedido.id?.substring(0, 5).toUpperCase()}
    </Text>
  </View>
  <Text className="text-xs text-gray-400 text-center">Muestra este QR al recoger tu pedido</Text>
</View>

        </ScrollView>
      )}
    </View>
  );
}