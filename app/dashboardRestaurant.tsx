import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { AlertTriangle, Clock, Edit2, LogOut, Package, Plus, ShoppingBag, Store, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';

// Convierte el texto de tiempoRestante a segundos
const parseTimeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const lower = timeStr.toLowerCase();
  const num = parseFloat(lower);
  if (isNaN(num)) return 0;
  if (lower.includes('hora')) return num * 3600;
  if (lower.includes('min')) return num * 60;
  return 0;
};

const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return 'Expirado';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

function CountdownTimer({ timeStr }: { timeStr: string }) {
  const [seconds, setSeconds] = useState(parseTimeToSeconds(timeStr));

  useEffect(() => {
    setSeconds(parseTimeToSeconds(timeStr));
  }, [timeStr]);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds > 0]);

  const isExpiring = seconds > 0 && seconds < 600;

  return (
    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${seconds <= 0 ? 'bg-gray-100' : isExpiring ? 'bg-red-50' : 'bg-orange-50'}`}>
      <Clock color={seconds <= 0 ? '#9ca3af' : isExpiring ? '#dc2626' : '#ea580c'} size={10} />
      <Text className={`text-[9px] font-bold ${seconds <= 0 ? 'text-gray-400' : isExpiring ? 'text-red-600' : 'text-orange-600'}`}>
        {formatCountdown(seconds)}
      </Text>
    </View>
  );
}

export default function DashboardRestaurantScreen() {
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState('Tu Restaurante');
  const [packs, setPacks] = useState<any[]>([]);
  const [platos, setPlatos] = useState<any[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal de edición
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editPrecioOferta, setEditPrecioOferta] = useState('');
  const [editPrecioOriginal, setEditPrecioOriginal] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editTiempo, setEditTiempo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDashboardData = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      setLoading(true);

      const restRef = doc(db, 'restaurantes', uid);
      const restSnap = await getDoc(restRef);
      if (restSnap.exists()) {
        setRestaurantName(restSnap.data().nombre || 'Tu Restaurante');
      }

      const qPacks = query(collection(db, 'packs_sopresa'), where('restauranteId', '==', uid));
      const qPlatos = query(collection(db, 'platos_independientes'), where('restauranteId', '==', uid));
      const qPedidos = query(collection(db, 'pedidos'), where('restauranteId', '==', uid), where('estado', '==', 'pagado_pendiente'));

      const [packsSnap, platosSnap, pedidosSnap] = await Promise.all([
        getDocs(qPacks),
        getDocs(qPlatos),
        getDocs(qPedidos),
      ]);

      setPacks(packsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPlatos(platosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPedidosPendientes(pedidosSnap.size);

    } catch (error) {
      console.error('Error al cargar el dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          router.replace('/login');
        },
      },
    ]);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditPrecioOferta(String(item.precioOferta || ''));
    setEditPrecioOriginal(String(item.precioOriginal || ''));
    setEditStock(String(item.cantidadDisponible || ''));
    setEditTiempo(item.tiempoRestante || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    if (Number(editPrecioOferta) >= Number(editPrecioOriginal)) {
      Alert.alert('Error', 'El precio de oferta debe ser menor al precio original.');
      return;
    }

    try {
      setIsSaving(true);
      const collectionName = editingItem.tipo === 'Pack Sorpresa' ? 'packs_sopresa' : 'platos_independientes';
      const itemRef = doc(db, collectionName, editingItem.id);

      await updateDoc(itemRef, {
        precioOferta: Number(editPrecioOferta),
        precioOriginal: Number(editPrecioOriginal),
        cantidadDisponible: Number(editStock),
        tiempoRestante: editTiempo,
      });

      setEditModalVisible(false);
      await fetchDashboardData();
      Alert.alert('¡Listo!', 'Producto actualizado correctamente.');
    } catch (error) {
      console.error('Error al editar:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const allProducts = [
    ...packs.map((p) => ({ ...p, tipo: 'Pack Sorpresa' })),
    ...platos.map((p) => ({ ...p, tipo: 'Plato' })),
  ];

  return (
    <View className="flex-1 bg-gray-50 flex-col relative">

      {/* HEADER */}
      <View className="bg-[#90C659] pt-12 pb-6 px-5 flex-row items-center justify-between shadow-md z-10">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
            <Store color="white" size={24} />
          </View>
          <View>
            <Text className="text-white/80 text-xs font-medium">Panel de Restaurante</Text>
            <Text className="text-white text-lg font-bold" numberOfLines={1}>{restaurantName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} className="p-2">
          <LogOut color="white" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Tarjetas resumen */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <View className="w-9 h-9 bg-green-50 rounded-xl items-center justify-center mb-2">
              <Package color="#90C659" size={18} />
            </View>
            <Text className="text-2xl font-black text-gray-800">{allProducts.length}</Text>
            <Text className="text-xs text-gray-500 font-medium">Productos activos</Text>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <View className="w-9 h-9 bg-orange-50 rounded-xl items-center justify-center mb-2">
              <ShoppingBag color="#f97316" size={18} />
            </View>
            <Text className="text-2xl font-black text-gray-800">{pedidosPendientes}</Text>
            <Text className="text-xs text-gray-500 font-medium">Pedidos pendientes</Text>
          </View>
        </View>

        {/* Botón subir producto */}
        <TouchableOpacity
          onPress={() => router.push('/addProduct')}
          className="w-full bg-[#90C659] rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg mb-6"
        >
          <Plus color="white" size={20} />
          <Text className="text-white font-bold text-base">Subir nuevo producto</Text>
        </TouchableOpacity>

        {/* Lista de productos */}
        <Text className="font-bold text-lg text-gray-800 mb-3">Tus productos</Text>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#90C659" />
          </View>
        ) : allProducts.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
            <Package color="#d1d5db" size={40} />
            <Text className="text-gray-400 text-sm text-center mt-3">
              Aún no has subido productos. Toca el botón de arriba para empezar.
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-3">
            {allProducts.map((item) => {
              const isAgotado = (item.cantidadDisponible || 0) <= 0;
              return (
                <View key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-row h-28">
                  <Image
                    source={{ uri: item.imagenUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' }}
                    className="w-24 h-full"
                    resizeMode="cover"
                  />
                  <View className="flex-1 p-3 justify-between">
                    <View>
                      <View className="flex-row items-center gap-1.5 mb-0.5 flex-wrap">
                        <View className={`px-1.5 py-0.5 rounded ${item.tipo === 'Pack Sorpresa' ? 'bg-green-100' : 'bg-blue-50'}`}>
                          <Text className={`text-[9px] font-bold ${item.tipo === 'Pack Sorpresa' ? 'text-green-700' : 'text-blue-600'}`}>
                            {item.tipo}
                          </Text>
                        </View>
                        {isAgotado && (
                          <View className="bg-red-50 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                            <AlertTriangle color="#dc2626" size={10} />
                            <Text className="text-[9px] font-bold text-red-600">Agotado</Text>
                          </View>
                        )}
                        {item.tiempoRestante ? (
                          <CountdownTimer timeStr={item.tiempoRestante} />
                        ) : null}
                      </View>
                      <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>{item.nombre}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-gray-500 font-medium">Stock: {item.cantidadDisponible ?? 0}</Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="font-black text-[#90C659] text-sm">S/ {Number(item.precioOferta || 0).toFixed(2)}</Text>
                        <TouchableOpacity
                          onPress={() => openEditModal(item)}
                          className="bg-gray-100 p-1.5 rounded-lg"
                        >
                          <Edit2 color="#4b5563" size={14} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* MODAL DE EDICIÓN */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10">

            <View className="flex-row items-center justify-between mb-5">
              <Text className="font-bold text-lg text-gray-800">Editar producto</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-1">
                <X color="#6b7280" size={22} />
              </TouchableOpacity>
            </View>

            <Text className="font-bold text-xs text-gray-700 mb-1">Precio original (S/.)</Text>
            <TextInput
              value={editPrecioOriginal}
              onChangeText={(t) => setEditPrecioOriginal(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800 mb-3"
            />

            <Text className="font-bold text-xs text-gray-700 mb-1">Precio oferta (S/.)</Text>
            <TextInput
              value={editPrecioOferta}
              onChangeText={(t) => setEditPrecioOferta(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800 mb-3"
            />

            <Text className="font-bold text-xs text-gray-700 mb-1">Stock disponible</Text>
            <TextInput
              value={editStock}
              onChangeText={(t) => setEditStock(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800 mb-3"
            />

            <Text className="font-bold text-xs text-gray-700 mb-1">Tiempo restante (Ej: 2 horas, 30 minutos)</Text>
            <TextInput
              value={editTiempo}
              onChangeText={setEditTiempo}
              placeholder="Ej. 2 horas"
              className="bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-800 mb-5"
            />

            <TouchableOpacity
              onPress={handleSaveEdit}
              disabled={isSaving}
              className={`w-full py-4 rounded-2xl items-center ${isSaving ? 'bg-gray-300' : 'bg-[#90C659]'}`}
            >
              {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Guardar cambios</Text>}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}