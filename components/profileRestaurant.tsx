import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Building, ChevronRight, FileCheck2, Landmark, LogOut, MapPin, MessageCircle, Package, ShieldCheck, Star, UtensilsCrossed } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking as RNLinking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';

const SOPORTE_WHATSAPP = '51999999999'; // Número de soporte EcoEat

export function ProfileRestaurant() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      try {
        const restRef = doc(db, 'restaurantes', uid);
        const restSnap = await getDoc(restRef);
        if (restSnap.exists()) setData(restSnap.data());

        const qPacks = query(collection(db, 'packs_sopresa'), where('restauranteId', '==', uid));
        const qPlatos = query(collection(db, 'platos_independientes'), where('restauranteId', '==', uid));
        const qPedidos = query(collection(db, 'pedidos'), where('restauranteId', '==', uid));

        const [packsSnap, platosSnap, pedidosSnap] = await Promise.all([
          getDocs(qPacks),
          getDocs(qPlatos),
          getDocs(qPedidos),
        ]);

        setTotalProductos(packsSnap.size + platosSnap.size);
        setTotalPedidos(pedidosSnap.size);

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

  const handleWhatsApp = () => {
    const mensaje = `Hola, soy el restaurante *${data?.nombre || data?.razonSocial || 'EcoEat'}* y necesito ayuda con mi cuenta.`;
    const url = `https://wa.me/${SOPORTE_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    RNLinking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#90C659" />
      </View>
    );
  }

  const statusDoc = data?.documentos_legales?.estado_verificacion || 'pendiente';
  const isVerified = statusDoc === 'aprobado';

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* HEADER */}
      <View className="bg-[#90C659] pt-14 pb-10 px-6 items-center">
        <View className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-md mb-3 border-4 border-white/30">
          <Building color="#90C659" size={40} />
        </View>
        <Text className="text-2xl font-black text-white">{data?.nombre || data?.razonSocial || 'Tu Restaurante'}</Text>
        {data?.razonSocial && data?.nombre && (
          <Text className="text-white/70 text-xs mt-0.5">{data.razonSocial}</Text>
        )}
        <Text className="text-white/80 text-sm font-medium mt-1">RUC: {data?.ruc || 'No registrado'}</Text>

        {data?.categoriaId && (
          <View className="mt-2 bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold capitalize">{data.categoriaId}</Text>
          </View>
        )}
      </View>

      <View className="px-4 -mt-5">

        {/* ESTADÍSTICAS */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <View className="w-10 h-10 bg-green-50 rounded-xl items-center justify-center mb-2">
              <Package color="#90C659" size={20} />
            </View>
            <Text className="text-2xl font-black text-gray-800">{totalProductos}</Text>
            <Text className="text-xs text-gray-500 font-medium text-center">Productos</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center mb-2">
              <UtensilsCrossed color="#f97316" size={20} />
            </View>
            <Text className="text-2xl font-black text-gray-800">{totalPedidos}</Text>
            <Text className="text-xs text-gray-500 font-medium text-center">Pedidos totales</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <View className="w-10 h-10 bg-yellow-50 rounded-xl items-center justify-center mb-2">
              <Star color="#eab308" size={20} />
            </View>
            <Text className="text-2xl font-black text-gray-800">{data?.ratingPromedio?.toFixed(1) || '5.0'}</Text>
            <Text className="text-xs text-gray-500 font-medium text-center">Rating</Text>
          </View>
        </View>

        {/* ESTADO DE CUENTA */}
        <Text className="font-bold text-sm text-gray-800 mb-3">Estado de la Cuenta</Text>
        <View className={`rounded-2xl p-4 flex-row items-center gap-3 mb-5 border ${isVerified ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          {isVerified ? <ShieldCheck color="#16a34a" size={24} /> : <FileCheck2 color="#ea580c" size={24} />}
          <View>
            <Text className={`font-bold ${isVerified ? 'text-green-800' : 'text-orange-800'}`}>
              {isVerified ? 'Cuenta Verificada ✅' : 'Documentos en Revisión'}
            </Text>
            <Text className={`text-xs mt-0.5 ${isVerified ? 'text-green-600' : 'text-orange-600'}`}>
              {isVerified ? 'Puedes vender sin límites' : 'Validando con SUNAT y MINSA'}
            </Text>
          </View>
        </View>

        {/* DIRECCIÓN */}
        {data?.ubicacion?.direccion_texto && (
          <>
            <Text className="font-bold text-sm text-gray-800 mb-3">Dirección del Local</Text>
            <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5 flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                <MapPin color="#3b82f6" size={20} />
              </View>
              <Text className="flex-1 text-sm text-gray-700 font-medium">{data.ubicacion.direccion_texto}</Text>
            </View>
          </>
        )}

        {/* DATOS FINANCIEROS */}
        <Text className="font-bold text-sm text-gray-800 mb-3">Datos Financieros</Text>
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
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
        </View>

        {/* EDITAR PERFIL */}
        <Text className="font-bold text-sm text-gray-800 mb-3">Configuración</Text>
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
          <TouchableOpacity
            onPress={() => router.push('/editProfileRestaurant')}
            className="p-4 flex-row items-center justify-between border-b border-gray-50"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                <Building color="#90C659" size={18} />
              </View>
              <Text className="font-bold text-gray-700">Editar perfil del local</Text>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleWhatsApp}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                <MessageCircle color="#25D366" size={18} />
              </View>
              <View>
                <Text className="font-bold text-gray-700">Soporte por WhatsApp</Text>
                <Text className="text-xs text-gray-400">Contacta al equipo de EcoEat</Text>
              </View>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>
        </View>

        {/* CERRAR SESIÓN */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 bg-red-50 py-4 rounded-2xl border border-red-100 mb-6"
        >
          <LogOut color="#ef4444" size={20} />
          <Text className="font-bold text-red-600">Cerrar Sesión</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}