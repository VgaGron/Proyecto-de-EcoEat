import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Award, Leaf, Coins, Package, CreditCard, ChevronRight, LogOut, Settings, ShieldCheck, Wallet } from 'lucide-react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter, useFocusEffect } from 'expo-router';

export function profileUser() {
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [metrics, setMetrics] = useState({ packs: 0, ahorro: 0, co2: 0 });
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      setLoading(true);
      
      const userRef = doc(db, 'usuarios', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }

      const qPedidos = query(collection(db, 'pedidos'), where('clienteId', '==', uid));
      const pedidosSnap = await getDocs(qPedidos);

      let totalPacks = 0;
      let totalPagado = 0;

      pedidosSnap.forEach((doc) => {
        const pedido = doc.data();
        totalPagado += (pedido.totalPagado || 0);
        
        const items = pedido.items || [];
        items.forEach((item: any) => {
          totalPacks += (item.quantity || 1);
        });
      });

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

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, salir', style: 'destructive', onPress: async () => {
          await signOut(auth);
          router.replace('/login');
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
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      
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
          onPress={() => Alert.alert('Preferencias', 'Función para editar alergias en desarrollo.')}
          className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-6 shadow-sm border border-gray-100"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <Leaf color="#ef4444" size={20} />
            </View>
            <View>
              <Text className="font-bold text-gray-800 text-sm">Alergias y Dieta</Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {userAllergies.length > 0 ? userAllergies.join(', ') : 'Ninguna configurada'}
              </Text>
            </View>
          </View>
          <ChevronRight color="#d1d5db" size={20} />
        </TouchableOpacity>

        <Text className="font-bold text-lg text-gray-800 mb-3">Cuenta</Text>
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-50">
            <View className="flex-row items-center gap-3">
              <Settings color="#6b7280" size={20} />
              <Text className="font-bold text-gray-700">Configuración general</Text>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-50">
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
  );
}