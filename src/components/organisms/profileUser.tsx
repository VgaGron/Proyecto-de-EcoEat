import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'; 
import { Award, Check, ChevronRight, Clock, Coins, Leaf, LogOut, Package, Settings, ShieldCheck, ShoppingBag, Wallet, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '@/services/firebase';

const ALERGIAS_DISPONIBLES = ["Sin Gluten", "Nueces", "Lactosa", "Mariscos", "Vegano", "Vegetariano"];

export function profileUser() {
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [metrics, setMetrics] = useState({ packs: 0, ahorro: 0, co2: 0 });
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [tempAllergies, setTempAllergies] = useState<string[]>([]);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const fetchUserProfile = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      setLoading(true);
      
      const userRef = doc(db, 'usuarios', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData({ id: userSnap.id, ...userSnap.data() });
      }

      const qPedidos = query(collection(db, 'pedidos'), where('clienteId', '==', uid));
      const pedidosSnap = await getDocs(qPedidos);

      let totalPacks = 0;
      let totalPagado = 0;
      let historialTemporal: any[] = [];

      pedidosSnap.forEach((doc) => {
        const pedido = doc.data();
        totalPagado += (pedido.totalPagado || 0);
        
        historialTemporal.push({ id: doc.id, ...pedido }); 
        const items = pedido.items || [];
        items.forEach((item: any) => {
          totalPacks += (item.quantity || 1);
        });
      });

      historialTemporal.sort((a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime());
      setOrderHistory(historialTemporal);

      const co2Evitado = totalPacks * 1.25; 
      const ahorroEstimado = totalPagado; 

      setMetrics({
        packs: totalPacks,
        ahorro: ahorroEstimado,
        co2: co2Evitado
      });

    } catch (error) {
      console.error("Error al cargar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const openPreferences = () => {
    const currentAlergias = userData?.alergias?.opciones_predefinidas || [];
    setTempAllergies(currentAlergias);
    setIsPreferencesModalOpen(true);
  };

  const toggleAllergy = (alergia: string) => {
    setTempAllergies((prev) => 
      prev.includes(alergia) ? prev.filter(a => a !== alergia) : [...prev, alergia]
    );
  };

  const savePreferences = async () => {
    if (!auth.currentUser) return;
    try {
      setIsSavingPreferences(true);
      const userRef = doc(db, 'usuarios', auth.currentUser.uid);
      
      await updateDoc(userRef, {
        'alergias.opciones_predefinidas': tempAllergies
      });

      setUserData((prev: any) => ({
        ...prev,
        alergias: {
          ...prev.alergias,
          opciones_predefinidas: tempAllergies
        }
      }));

      setIsPreferencesModalOpen(false);
      Alert.alert("¡Éxito!", "Tus preferencias han sido guardadas.");
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
      Alert.alert("Error", "No pudimos guardar tus preferencias.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, salir', style: 'destructive', onPress: async () => {
          await signOut(auth);
          router.replace('/auth/login');
        } 
      }
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#90C659" />
      </View>
    );
  }

  const userName = userData?.nombre || "Comensal ECOEAT";
  const userInitial = userName.charAt(0).toUpperCase();
  const userAllergies = userData?.alergias?.opciones_predefinidas || [];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        <View className="bg-[#90C659] px-6 pt-16 pb-20 rounded-b-[40px] shadow-lg shadow-[#90C659]/30 relative">
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
              <Text className="text-2xl font-black text-[#90C659]">{userInitial}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-black text-white">{userName}</Text>
              <View className="flex-row items-center gap-1 mt-1 bg-white/20 self-start px-3 py-1 rounded-full border border-white/30">
                <Award color="white" size={14} />
                <Text className="text-white text-xs font-bold">
                  {metrics.packs >= 10 ? 'Héroe Verde' : metrics.packs > 0 ? 'Rescatista Novato' : 'Nuevo Miembro'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between px-6 -mt-12 mb-8">
          <View className="w-[30%] bg-white rounded-2xl p-4 items-center shadow-md border border-gray-50">
            <Package color="#3b82f6" size={20} className="mb-2" />
            <Text className="text-xl font-black text-gray-800">{metrics.packs}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase">Packs</Text>
          </View>
          <View className="w-[30%] bg-white rounded-2xl p-4 items-center shadow-md border border-gray-50">
            <Coins color="#90C659" size={20} className="mb-2" />
            <Text className="text-lg font-black text-[#90C659]">S/{metrics.ahorro.toFixed(0)}</Text>
            <Text className="text-[10px] font-bold text-green-600/70 uppercase">Ahorro</Text>
          </View>
          <View className="w-[30%] bg-white rounded-2xl p-4 items-center shadow-md border border-gray-50">
            <Leaf color="#14b8a6" size={20} className="mb-2" />
            <Text className="text-xl font-black text-gray-800">{metrics.co2.toFixed(1)}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase">Kg CO2</Text>
          </View>
        </View>

        <View className="px-6 pb-10">

          <Text className="font-bold text-lg text-gray-800 mb-3">Mi Billetera</Text>
          <View className="bg-gray-900 rounded-3xl p-5 shadow-lg mb-6 relative overflow-hidden">
            <View className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
            <View className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
            
            <View className="flex-row justify-between items-start mb-6">
              <Text className="text-white text-xl font-black italic tracking-widest">VISA</Text>
              <ShieldCheck color="#90C659" size={24} />
            </View>
            
            <Text className="text-gray-400 font-mono text-lg tracking-[4px] mb-1">**** **** **** 1234</Text>
            
            <View className="flex-row justify-between mt-4">
              <View>
                <Text className="text-gray-500 text-[10px] uppercase font-bold">Titular</Text>
                <Text className="text-white font-bold text-sm uppercase">{userName}</Text>
              </View>
              <View>
                <Text className="text-gray-500 text-[10px] uppercase font-bold">Expira</Text>
                <Text className="text-white font-bold text-sm">12/28</Text>
              </View>
            </View>
          </View>

          <Text className="font-bold text-lg text-gray-800 mb-3">Mis Preferencias</Text>
          <TouchableOpacity 
            onPress={openPreferences}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-6 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Leaf color="#ef4444" size={20} />
              </View>
              <View>
                <Text className="font-bold text-gray-800 text-sm">Alergias y Dieta</Text>
                <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                  {userAllergies.length > 0 ? userAllergies.join(', ') : 'Ninguna configurada'}
                </Text>
              </View>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>

          <Text className="font-bold text-lg text-gray-800 mb-3">Cuenta</Text>
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            
            <TouchableOpacity 
              onPress={() => Alert.alert('Configuración', 'En la versión final aquí podrás cambiar tu contraseña y nombre.')}
              className="flex-row items-center justify-between p-4 border-b border-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <Settings color="#6b7280" size={20} />
                <Text className="font-bold text-gray-700">Configuración general</Text>
              </View>
              <ChevronRight color="#d1d5db" size={20} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsHistoryModalOpen(true)}
              className="flex-row items-center justify-between p-4 border-b border-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <Wallet color="#6b7280" size={20} />
                <Text className="font-bold text-gray-700">Historial de Rescates</Text>
              </View>
              <ChevronRight color="#d1d5db" size={20} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <LogOut color="#ef4444" size={20} />
                <Text className="font-bold text-red-500">Cerrar Sesión</Text>
              </View>
              <ChevronRight color="#fca5a5" size={20} />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      
      <Modal visible={isPreferencesModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10 min-h-[50%]">
            
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-bold text-xl text-gray-800">Tus Preferencias</Text>
              <TouchableOpacity onPress={() => setIsPreferencesModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <X color="#6b7280" size={20} />
              </TouchableOpacity>
            </View>
            
            <Text className="text-gray-500 text-sm mb-4">
              Selecciona las opciones que aplican para ti. Te avisaremos si intentas comprar un plato que contenga ingredientes a los que eres alérgico.
            </Text>

            <View className="flex-row flex-wrap gap-3 mb-8">
              {ALERGIAS_DISPONIBLES.map((alergia) => {
                const isSelected = tempAllergies.includes(alergia);
                return (
                  <TouchableOpacity 
                    key={alergia}
                    onPress={() => toggleAllergy(alergia)}
                    className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      isSelected ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <View className={`w-5 h-5 rounded items-center justify-center border ${isSelected ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>
                      {isSelected && <Check color="white" size={12} />}
                    </View>
                    <Text className={`font-bold ${isSelected ? 'text-red-700' : 'text-gray-600'}`}>{alergia}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity 
              onPress={savePreferences}
              disabled={isSavingPreferences}
              className={`w-full py-4 rounded-xl items-center justify-center flex-row gap-2 ${isSavingPreferences ? 'bg-gray-400' : 'bg-[#90C659]'}`}
            >
              {isSavingPreferences ? <ActivityIndicator color="white" /> : (
                <>
                  <Check color="white" size={20} />
                  <Text className="text-white font-bold text-lg">Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <Modal visible={isHistoryModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[80%]">
            
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-bold text-xl text-gray-800">Historial de Rescates</Text>
              <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <X color="#6b7280" size={20} />
              </TouchableOpacity>
            </View>

            {orderHistory.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <ShoppingBag color="#d1d5db" size={48} className="mb-4" />
                <Text className="text-gray-400 font-medium text-center px-6">Aún no has realizado ningún rescate. ¡Anímate a salvar el planeta!</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {orderHistory.map((order) => {
                  const fecha = new Date(order.fechaPedido).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                  
                  return (
                    <View key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-bold text-gray-800 text-base flex-1" numberOfLines={1}>Pedido: {order.id.substring(0,6).toUpperCase()}</Text>
                        <Text className="font-black text-[#90C659]">S/ {order.totalPagado?.toFixed(2)}</Text>
                      </View>
                      
                      <View className="flex-row items-center gap-1.5 mb-3">
                        <Clock color="#9ca3af" size={14} />
                        <Text className="text-gray-500 text-xs font-medium">{fecha} • {order.modalidad}</Text>
                      </View>

                      <View className="bg-gray-50 rounded-xl p-3">
                        {order.items?.map((item: any, i: number) => (
                          <View key={i} className="flex-row items-center justify-between mb-1">
                            <Text className="text-gray-600 text-xs flex-1">{item.quantity}x {item.name}</Text>
                            <Text className="text-gray-500 text-xs">S/ {item.price?.toFixed(2)}</Text>
                          </View>
                        ))}
                      </View>

                      {order.estado === 'entregado' ? (
                        <View className="mt-3 bg-green-50 self-start px-2 py-1 rounded flex-row items-center gap-1">
                          <Check color="#16a34a" size={12} />
                          <Text className="text-green-700 text-[10px] font-bold uppercase tracking-wider">Completado</Text>
                        </View>
                      ) : (
                        <View className="mt-3 bg-orange-50 self-start px-2 py-1 rounded flex-row items-center gap-1">
                          <Clock color="#ea580c" size={12} />
                          <Text className="text-orange-600 text-[10px] font-bold uppercase tracking-wider">Pendiente</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}