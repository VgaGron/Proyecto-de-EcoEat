import { auth, db } from '@/services/firebase';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AlertTriangle, Clock, Edit2, Package, Plus, RefreshCw } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import EditProduct from './EditProduct';

const getAbsoluteDate = (fechaCreacion: string, horaStr: string) => {
  if (!fechaCreacion || !horaStr || !horaStr.includes(':')) return null;
  const date = new Date(fechaCreacion);
  if (isNaN(date.getTime())) return null;
  const [h, m] = horaStr.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
};

export function DishesTab() {
  const router = useRouter();

  const [activos, setActivos] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'activos' | 'historial'>('activos');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchProducts = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      setLoading(true);
      const qPacks = query(collection(db, 'packs_sopresa'), where('restauranteId', '==', uid));
      const qPlatos = query(collection(db, 'platos_independientes'), where('restauranteId', '==', uid));

      const [packsSnap, platosSnap] = await Promise.all([getDocs(qPacks), getDocs(qPlatos)]);

      const allItems: any[] = [
        ...packsSnap.docs.map(d => ({ id: d.id, collectionName: 'packs_sopresa', tipo: 'Pack Sorpresa', ...d.data() })),
        ...platosSnap.docs.map(d => ({ id: d.id, collectionName: 'platos_independientes', tipo: 'Plato', ...d.data() }))
      ];

      const now = new Date();
      const listaActivos: any[] = [];
      const listaHistorial: any[] = [];

      allItems.forEach(item => {
        const isAgotado = (item?.cantidadDisponible || 0) <= 0;
        const expDate = getAbsoluteDate(item.fecha_creacion, item.horaFin);
        const isExpired = expDate ? now > expDate : true;

        if (isExpired || isAgotado) {
          listaHistorial.push(item);
        } else {
          listaActivos.push(item);
        }
      });

      listaHistorial.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

      setActivos(listaActivos);
      setHistorial(listaHistorial);
    } catch (error) {
      console.error("Error al traer productos:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditModalVisible(true);
  };

  const descuento = (precioOriginal: number, precioOferta: number) =>
    precioOriginal > 0 ? Math.round((1 - precioOferta / precioOriginal) * 100) : 0;

  const renderProductList = (items: any[]) => {
    if (items.length === 0) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
            <Package color="#90C659" size={36} />
          </View>
          <Text className="font-black text-lg text-gray-700 mb-2">
            {viewMode === 'activos' ? '¡Todo listo para publicar!' : 'Sin historial aún'}
          </Text>
          <Text className="text-gray-400 text-sm text-center px-8">
            {viewMode === 'activos'
              ? 'Toca el botón verde para publicar tus excedentes del día.'
              : 'Tus productos vencidos o agotados aparecerán aquí.'}
          </Text>
        </View>
      );
    }

    return items.map((item) => {
      const isAgotado = (item.cantidadDisponible || 0) <= 0;
      const desc = descuento(item.precioOriginal, item.precioOferta);
      const isHistorial = viewMode === 'historial';

      return (
        <View key={item.id} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-4 ${isHistorial ? 'opacity-70' : ''}`}>
          <View className="flex-row">
            <View className="w-28 h-32 bg-gray-100">
              <Image
                source={{ uri: item.imagenUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' }}
                className="w-full h-full"
                resizeMode="cover"
              />
              {desc > 0 && (
                <View className="absolute top-2 left-2 bg-[#90C659] px-1.5 py-0.5 rounded-full">
                  <Text className="text-white text-[9px] font-black">-{desc}%</Text>
                </View>
              )}
            </View>

            <View className="flex-1 p-3 justify-between">
              <View>
                <View className="flex-row items-center gap-1.5 mb-1 flex-wrap">
                  <View className={`px-2 py-0.5 rounded-full ${item.tipo === 'Pack Sorpresa' ? 'bg-green-100' : 'bg-blue-50'}`}>
                    <Text className={`text-[9px] font-bold ${item.tipo === 'Pack Sorpresa' ? 'text-green-700' : 'text-blue-600'}`}>
                      {item.tipo === 'Pack Sorpresa' ? '🎁 Pack' : '🍽️ Plato'}
                    </Text>
                  </View>
                  {isAgotado && (
                    <View className="bg-red-50 px-2 py-0.5 rounded-full flex-row items-center gap-0.5">
                      <AlertTriangle color="#dc2626" size={9} />
                      <Text className="text-[9px] font-bold text-red-600">Agotado</Text>
                    </View>
                  )}
                </View>

                <Text className="font-black text-sm text-gray-800 mb-1" numberOfLines={1}>{item.nombre}</Text>

                <View className="flex-row items-center gap-1">
                  <Clock color="#f97316" size={11} />
                  <Text className="text-[10px] text-orange-500 font-bold">
                    {item.horaInicio && item.horaFin ? `${item.horaInicio} - ${item.horaFin}` : 'Sin horario'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-end justify-between mt-2">
                <View>
                  {item.precioOriginal > 0 && (
                    <Text className="text-[10px] text-gray-400 line-through">S/ {Number(item.precioOriginal).toFixed(2)}</Text>
                  )}
                  <Text className="font-black text-[#90C659] text-base leading-none">S/ {Number(item.precioOferta || 0).toFixed(2)}</Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">Stock: {item.cantidadDisponible ?? 0}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${isHistorial ? 'bg-[#90C659]' : 'bg-gray-100'}`}
                >
                  {isHistorial
                    ? <><RefreshCw color="white" size={13} /><Text className="text-white text-[10px] font-bold">Reactivar</Text></>
                    : <><Edit2 color="#4b5563" size={13} /><Text className="text-gray-600 text-[10px] font-bold">Editar</Text></>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <View className="flex-1 bg-gray-50">

      <View className="px-4 pt-5 pb-3">
        <View className="flex-row bg-gray-100 p-1 rounded-2xl">
          <TouchableOpacity
            onPress={() => setViewMode('activos')}
            className={`flex-1 py-2.5 items-center rounded-xl ${viewMode === 'activos' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-xs font-black ${viewMode === 'activos' ? 'text-[#90C659]' : 'text-gray-400'}`}>
              Activos ({activos.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('historial')}
            className={`flex-1 py-2.5 items-center rounded-xl ${viewMode === 'historial' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-xs font-black ${viewMode === 'historial' ? 'text-gray-700' : 'text-gray-400'}`}>
              Historial ({historial.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        {loading
          ? <View className="items-center py-20"><ActivityIndicator size="large" color="#90C659" /></View>
          : renderProductList(viewMode === 'activos' ? activos : historial)
        }
      </ScrollView>

      <View className="absolute bottom-6 w-full px-4 z-20">
        <TouchableOpacity
          onPress={() => router.push('/business/addProduct')}
          className="bg-[#90C659] flex-row items-center justify-center gap-2 py-4 rounded-2xl w-full"
          style={{ shadowColor: '#90C659', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
        >
          <Plus color="white" size={22} />
          <Text className="text-white font-black text-base">Publicar Excedentes</Text>
        </TouchableOpacity>
      </View>

      <EditProduct
        visible={editModalVisible}
        item={editingItem}
        viewMode={viewMode}
        onClose={() => setEditModalVisible(false)}
        onSuccess={() => {
          setEditModalVisible(false);
          fetchProducts(); 
        }}
      />
    </View>
  );
}