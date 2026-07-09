import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, Clock, Package, ShoppingBag } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '@/services/firebase';

export default function HistorialPedidosScreen() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const modalityText: Record<string, string> = {
    'tienda': '🏪 Tienda',
    'delivery': '🚴 Delivery',
    'comer': '🍽️ Comer allí'
  };

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'pedidos'),
          where('clienteId', '==', auth.currentUser.uid),
        );
        const snap = await getDocs(q);

        const pedidosConNombre = await Promise.all(
          snap.docs.map(async (pedidoDoc) => {
            const data = pedidoDoc.data();
            let restName = 'Restaurante';
            if (data.restauranteId) {
              const restSnap = await getDoc(doc(db, 'restaurantes', data.restauranteId));
              if (restSnap.exists()) restName = restSnap.data().nombre;
            }
            return { id: pedidoDoc.id, ...data, restaurantName: restName };
          })
        );

        // Ordenar por fecha más reciente
        pedidosConNombre.sort((a, b) =>
          new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
        );

        setPedidos(pedidosConNombre);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View className="flex-1 bg-gray-50">

      {/* HEADER */}
      <View className="bg-[#90C659] pt-12 pb-5 px-4 flex-row items-center shadow-md">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full bg-white/20 mr-3">
          <ArrowLeft color="white" size={22} />
        </TouchableOpacity>
        <View>
          <Text className="font-black text-lg text-white">Mis Pedidos</Text>
          <Text className="text-white/70 text-xs">Historial completo</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#90C659" />
        </View>
      ) : pedidos.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
            <ShoppingBag color="#90C659" size={36} />
          </View>
          <Text className="font-black text-lg text-gray-700 mb-2">Sin pedidos aún</Text>
          <Text className="text-gray-400 text-sm text-center">Tus pedidos anteriores aparecerán aquí.</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-[#90C659] px-6 py-3 rounded-2xl"
          >
            <Text className="text-white font-bold">Explorar restaurantes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          <Text className="text-xs text-gray-400 mb-4">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} en total</Text>

          {pedidos.map((pedido) => {
            const isPending = pedido.estado === 'pagado_pendiente';
            const totalItems = pedido.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;

            return (
              <View key={pedido.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
                
                {/* Top */}
                <View className="p-4 border-b border-gray-50">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-black text-gray-800 text-base" numberOfLines={1}>{pedido.restaurantName}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${isPending ? 'bg-orange-50' : 'bg-green-50'}`}>
                      <Text className={`text-[10px] font-bold ${isPending ? 'text-orange-600' : 'text-green-600'}`}>
                        {isPending ? 'Pendiente' : 'Completado'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-400">{formatDate(pedido.fechaPedido)}</Text>
                </View>

                {/* Info */}
                <View className="px-4 py-3 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1">
                      <Package color="#90C659" size={14} />
                      <Text className="text-xs text-gray-600 font-medium">{totalItems} productos</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Clock color="#f97316" size={14} />
                      <Text className="text-xs text-gray-600 font-medium">{modalityText[pedido.modalidad] || '🏪 Tienda'}</Text>
                    </View>
                  </View>
                  <Text className="font-black text-[#90C659]">S/ {pedido.totalPagado?.toFixed(2)}</Text>
                </View>

                {/* Items */}
                <View className="px-4 pb-4">
                  {pedido.items?.slice(0, 2).map((item: any, index: number) => (
                    <Text key={index} className="text-xs text-gray-400 mb-0.5">• {item.quantity}x {item.name}</Text>
                  ))}
                  {pedido.items?.length > 2 && (
                    <Text className="text-xs text-gray-400">+{pedido.items.length - 2} más...</Text>
                  )}
                </View>

                {/* Código */}
                <View className="bg-gray-50 px-4 py-2.5 flex-row items-center justify-between">
                  <Text className="text-xs text-gray-400">Código:</Text>
                  <Text className="text-xs font-black text-gray-700 tracking-widest">
                    ECO-{pedido.id?.substring(0, 5).toUpperCase()}
                  </Text>
                </View>

              </View>
            );
          })}

        </ScrollView>
      )}
    </View>
  );
}