import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Building, FileCheck2, Landmark, LogOut, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useRouter } from 'expo-router';

export function ProfileRestaurant() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        const restRef = doc(db, 'restaurantes', auth.currentUser.uid);
        const restSnap = await getDoc(restRef);
        if (restSnap.exists()) {
          setData(restSnap.data());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
          await signOut(auth);
          router.replace('/login');
        }
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#90C659" className="flex-1 mt-10" />;
  }

  const statusDoc = data?.documentos_legales?.estado_verificacion || 'pendiente';
  const isVerified = statusDoc === 'aprobado';

  return (
    <ScrollView className="flex-1 bg-gray-50 px-6 pt-8">
      
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 mb-3 overflow-hidden">
           <Building color="#90C659" size={40} />
        </View>
        <Text className="text-xl font-black text-gray-800">{data?.razonSocial || 'Tu Restaurante'}</Text>
        <Text className="text-gray-500 font-medium mt-1">RUC: {data?.ruc || 'No registrado'}</Text>
      </View>

      <Text className="font-bold text-sm text-gray-800 mb-3">Estado de la Cuenta</Text>
      <View className={`rounded-2xl p-4 flex-row items-center justify-between mb-6 border ${isVerified ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <View className="flex-row items-center gap-3">
          {isVerified ? <ShieldCheck color="#16a34a" size={24} /> : <FileCheck2 color="#ea580c" size={24} />}
          <View>
            <Text className={`font-bold ${isVerified ? 'text-green-800' : 'text-orange-800'}`}>
              {isVerified ? 'Cuenta Verificada' : 'Documentos en Revisión'}
            </Text>
            <Text className={`text-xs mt-0.5 ${isVerified ? 'text-green-600' : 'text-orange-600'}`}>
              {isVerified ? 'Puedes vender sin límites' : 'Validando con SUNAT y MINSA'}
            </Text>
          </View>
        </View>
      </View>

      <Text className="font-bold text-sm text-gray-800 mb-3">Datos Financieros (Depósitos)</Text>
      <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-8 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
            <Landmark color="#4b5563" size={20} />
          </View>
          <View>
            <Text className="font-bold text-gray-700">Código de Cuenta (CCI)</Text>
            <Text className="text-gray-400 font-mono text-xs mt-0.5 tracking-wider">
              {data?.cci ? `****${data.cci.slice(-4)}` : 'No configurado'}
            </Text>
          </View>
        </View>
        <ChevronRight color="#d1d5db" size={20} />
      </View>

      <TouchableOpacity onPress={handleLogout} className="flex-row items-center justify-center gap-2 bg-red-50 py-4 rounded-xl border border-red-100">
        <LogOut color="#ef4444" size={20} />
        <Text className="font-bold text-red-600">Cerrar Sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}