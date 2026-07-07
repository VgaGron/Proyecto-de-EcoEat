import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { Camera as CameraIcon, Clock, Coins, Home, Leaf, Package, QrCode, ShoppingBag, User, UtensilsCrossed, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { dishesTab as DishesTab } from '../components/dishesTab';
import { ProfileRestaurant } from '../components/profileRestaurant';
import { auth, db } from '../firebase';

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
  useEffect(() => { setSeconds(parseTimeToSeconds(timeStr)); }, [timeStr]);
  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => { setSeconds((prev) => (prev > 0 ? prev - 1 : 0)); }, 1000);
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

  const [activeTab, setActiveTab] = useState('home'); 
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  const [restaurantName, setRestaurantName] = useState('Tu Restaurante');
  const [pendingOrdersList, setPendingOrdersList] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ packs: 0, platos: 0, ahorro: '0.00', co2: '0.0' });
  const [loading, setLoading] = useState(true);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const chartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [{ data: [30, 45, 25, 60, 80, 50, 90] }],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0, 
    color: (opacity = 1) => `rgba(144, 198, 89, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#ffffff' },
    propsForBackgroundLines: { stroke: '#f3f4f6', strokeDasharray: '' },
  };

  const fetchDashboardData = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      setLoading(true);

      const restRef = doc(db, 'restaurantes', uid);
      const restSnap = await getDoc(restRef);
      if (restSnap.exists()) setRestaurantName(restSnap.data().nombre || 'Tu Restaurante');

      const qTodosPedidos = query(collection(db, 'pedidos'), where('restauranteId', '==', uid));
      const pedidosSnap = await getDocs(qTodosPedidos);

      let packsVendidos = 0; let platosVendidos = 0; let ingresosRecuperados = 0;
      let pedidosPendientesReales: any[] = [];

      pedidosSnap.forEach((docSnap) => {
        const pedido = docSnap.data();

        if (pedido.estado === 'pagado_pendiente') {
          pedidosPendientesReales.push({ id: docSnap.id, ...pedido });
        }

        ingresosRecuperados += (pedido.totalPagado || 0);

        const items = pedido.items || [];
        items.forEach((item: any) => {
          if (item.collection === 'packs_sopresa') packsVendidos += (item.quantity || 1);
          else if (item.collection === 'platos_independientes') platosVendidos += (item.quantity || 1);
        });
      });

      const co2Total = ((packsVendidos + platosVendidos) * 1.25).toFixed(1);

      setMetrics({ packs: packsVendidos, platos: platosVendidos, ahorro: ingresosRecuperados.toFixed(2), co2: co2Total });
      setPendingOrdersList(pedidosPendientesReales); 

    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true); 
    try {
      const orderRef = doc(db, 'pedidos', data);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        
        if (orderData.restauranteId === auth.currentUser?.uid && orderData.estado === 'pagado_pendiente') {
          await updateDoc(orderRef, { estado: 'entregado' });
          
          Alert.alert("¡Pedido Entregado!", "El código QR es válido y el pedido ha sido completado con éxito.");
          setIsQRScannerOpen(false);
          fetchDashboardData(); 
        } else if (orderData.estado === 'entregado') {
          Alert.alert("Aviso", "Este código QR ya fue escaneado y entregado anteriormente.");
        } else {
          Alert.alert("Error", "Este pedido no pertenece a tu restaurante.");
        }
      } else {
        Alert.alert("QR Inválido", "No se encontró ningún pedido con este código.");
      }
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al procesar el código QR.");
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu cámara para escanear los QR de los clientes.");
        return;
      }
    }
    setScanned(false);
    setIsQRScannerOpen(true);
  };

  return (
    <View className="flex-1 bg-gray-50 flex-col relative">
      
      {/* PESTAÑA 1: INICIO (DASHBOARD) */}
      {activeTab === 'home' && (
        <View className="flex-1">
          <View className="bg-[#90C659] px-6 pt-16 pb-8 rounded-b-[40px] shadow-lg shadow-[#90C659]/30 shrink-0 relative z-10">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-black text-white tracking-tight">Hola, {restaurantName}</Text>
                <Text className="text-white/90 font-medium text-sm mt-1">Tu resumen general ✨</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-3">
              <View className="w-[48%] bg-white rounded-3xl p-4 flex-col items-center justify-center shadow-sm">
                <View className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                  <Package color="#3b82f6" size={16} />
                </View>
                <Text className="text-2xl font-black text-gray-800 leading-none">{metrics.packs}</Text>
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Packs</Text>
              </View>
              <View className="w-[48%] bg-white rounded-3xl p-4 flex-col items-center justify-center shadow-sm">
                <View className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mb-2">
                  <UtensilsCrossed color="#a855f7" size={16} />
                </View>
                <Text className="text-2xl font-black text-gray-800 leading-none">{metrics.platos}</Text>
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Platos</Text>
              </View>
              <View className="w-[48%] bg-white rounded-3xl p-4 flex-col items-center justify-center shadow-md border-2 border-[#90C659]/10">
                <View className="w-8 h-8 bg-[#90C659] rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Coins color="white" size={16} />
                </View>
                <Text className="text-xl font-black text-[#90C659] leading-none text-center">S/ {metrics.ahorro}</Text>
                <Text className="text-[10px] font-bold text-green-600/70 uppercase tracking-wider mt-1">Recuperado</Text>
              </View>
              <View className="w-[48%] bg-white rounded-3xl p-4 flex-col items-center justify-center shadow-sm">
                <View className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center mb-2">
                  <Leaf color="#14b8a6" size={16} />
                </View>
                <Text className="text-xl font-black text-gray-800 leading-none">{metrics.co2}kg</Text>
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">CO2</Text>
              </View>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
              <Text className="text-gray-800 font-bold mb-4 text-base">Ahorro semanal</Text>
              <View className="items-center -ml-4">
                <LineChart
                  data={chartData} width={Dimensions.get('window').width - 60} height={180}
                  chartConfig={chartConfig} bezier withVerticalLines={false} withShadow={false}
                  style={{ borderRadius: 16 }}
                />
              </View>
            </View>

            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-800 font-bold text-lg">Pedidos Pendientes</Text>
                <View className="bg-orange-100 px-2 py-1 rounded-lg">
                  <Text className="text-orange-600 text-xs font-bold">{pendingOrdersList.length} por entregar</Text>
                </View>
              </View>

              {pendingOrdersList.length === 0 ? (
                 <Text className="text-gray-400 italic mb-4">No tienes pedidos pendientes de entrega.</Text>
              ) : (
                <View className="flex-col gap-3">
                  {pendingOrdersList.map(order => {
                    const itemsCount = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                    
                    return (
                      <View key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          <View className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                            <ShoppingBag color="#ea580c" size={20} />
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-gray-800 text-sm">Cod: {order.id.substring(0, 5).toUpperCase()}</Text>
                            <View className="flex-row items-center gap-1.5 mt-1 flex-wrap pr-2">
                              <Clock color="#6b7280" size={12} />
                              <Text className="text-gray-500 text-[11px]">{order.horario}</Text>
                              <Text className="text-gray-300 text-xs">•</Text>
                              <Text className="text-gray-500 text-[11px]">{itemsCount} art(s)</Text>
                            </View>
                          </View>
                        </View>
                        
                        <TouchableOpacity 
                          onPress={openScanner}
                          className="w-12 h-12 bg-[#90C659] rounded-xl flex items-center justify-center shadow-sm"
                        >
                          <QrCode color="white" size={22} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {activeTab === 'dishes' && <DishesTab />}

      {activeTab === 'profile' && <ProfileRestaurant />}

      <View className="bg-white border-t border-gray-100 flex-row items-center justify-around py-3 shadow-lg shrink-0 z-20">
        <TouchableOpacity onPress={() => setActiveTab('home')} className="items-center gap-1">
          <Home color={activeTab === 'home' ? "#90C659" : "#9ca3af"} size={24} />
          <Text className={`text-[10px] font-bold ${activeTab === 'home' ? 'text-[#90C659]' : 'text-gray-400'}`}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('dishes')} className="items-center gap-1">
          <UtensilsCrossed color={activeTab === 'dishes' ? "#90C659" : "#9ca3af"} size={24} />
          <Text className={`text-[10px] font-bold ${activeTab === 'dishes' ? 'text-[#90C659]' : 'text-gray-400'}`}>Mis Platos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('profile')} className="items-center gap-1">
          <User color={activeTab === 'profile' ? "#90C659" : "#9ca3af"} size={24} />
          <Text className={`text-[10px] font-bold ${activeTab === 'profile' ? 'text-[#90C659]' : 'text-gray-400'}`}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DEL ESCÁNER DE CÁMARA (Se queda aquí porque es global para los pedidos) */}
      <Modal visible={isQRScannerOpen} transparent animationType="slide">
         <View className="flex-1 bg-black">
           <View className="p-6 flex-row justify-between items-center pt-16 relative z-50">
             <Text className="text-white text-xl font-bold">Escanear QR del Cliente</Text>
             <TouchableOpacity onPress={() => setIsQRScannerOpen(false)} className="p-2 bg-white/20 rounded-full">
               <X color="white" size={24} />
             </TouchableOpacity>
           </View>

           <View className="flex-1 relative">
             {permission?.granted ? (
               <CameraView 
                 style={StyleSheet.absoluteFillObject}
                 facing="back"
                 barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                 onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
               />
             ) : (
               <View className="flex-1 items-center justify-center">
                 <CameraIcon color="white" size={40} />
                 <Text className="text-white mt-4">Solicitando permisos de cámara...</Text>
               </View>
             )}

             <View className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <View className="w-64 h-64 border-4 border-[#90C659] rounded-3xl relative">
                  <View className="w-full h-0.5 bg-white absolute top-1/2 opacity-50" />
               </View>
               <Text className="text-white font-bold text-base mt-8 bg-black/50 px-4 py-2 rounded-full overflow-hidden">
                 Apunta al código QR del comensal
               </Text>
             </View>

             {scanned && (
               <TouchableOpacity 
                 onPress={() => setScanned(false)}
                 className="absolute bottom-12 self-center bg-white px-6 py-3 rounded-full"
               >
                 <Text className="text-[#90C659] font-bold">Escanear de nuevo</Text>
               </TouchableOpacity>
             )}
           </View>
         </View>
      </Modal>
      
    </View>
  );
}