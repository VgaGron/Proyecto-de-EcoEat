import { Stack, useRouter } from 'expo-router'; // Router moderno de Expo
import { addDoc, collection } from "firebase/firestore";
import React from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase';

export default function WelcomeScreen() {
  const router = useRouter(); 

  const probarConexion = async () => {
    try {
      const usuariosRef = collection(db, "usuarios");
      const nuevoUsuario = await addDoc(usuariosRef, {
        nombre_completo: "Comensal de Prueba Expo",
        email: "prueba@ecobocado.com",
        fecha_creacion: new Date().toISOString(),
        perfil_alimenticio: ["salado"],
        alergias: {
          opciones_predefinidas: ["ninguna"],
          alergia_personalizada: ""
        }
      });
      console.log("¡Conexión exitosa! ID del nuevo usuario: ", nuevoUsuario.id);
      Alert.alert("¡Éxito!", "Tu código se conectó a Firebase. Revisa tu consola web.");
    } catch (error) {
      console.error("Error al conectar con Firebase: ", error);
      Alert.alert("Error", "Hubo un problema. Revisa la terminal de Expo.");
    }
  };

  return (
    <View className="flex-1 bg-white flex-col max-w-md mx-auto relative overflow-hidden">
      
      <Stack.Screen options={{ headerShown: false }} />

      <View className="absolute top-12 left-4 z-50">
        <TouchableOpacity 
          onPress={probarConexion} 
          className="bg-[#90C659] py-2 px-4 rounded-xl shadow-lg border-2 border-white"
        >
          <Text className="text-white text-xs font-bold">🔥 Probar Firebase</Text>
        </TouchableOpacity>
      </View>

      {/* Imagen superior de comida */}
      <View className="relative h-[45%] shrink-0 overflow-hidden">
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1562785561-d88a65a2679e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800" }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/10" />
      </View>

      {/* Contenido inferior */}
      <View className="flex-1 flex-col items-center justify-between px-8 pt-2 pb-10">

        {/* Logo */}
        <View className="flex-col items-center -mt-10 z-10">
          <View className="flex-row items-center gap-2 mb-6">
            <View className="w-12 h-12 bg-[#90C659] rounded-full items-center justify-center shadow-md">
              {/* Simple emoji fallback to avoid requiring react-native-svg */}
              <Text style={{fontSize: 20, color: 'white'}}>🍽️</Text>
            </View>
            <Text className="text-3xl text-gray-800 font-bold tracking-tight">EcoEat</Text>
          </View>

          {/* Headline */}
          <Text className="text-center text-gray-900 mb-3 text-2xl font-bold leading-tight">
            Rescata comida deliciosa{"\n"}a precios increíbles.
          </Text>

          <Text className="text-center text-gray-500 text-sm leading-relaxed max-w-[250px]">
            Únete a la comunidad que lucha contra el desperdicio de alimentos.
          </Text>
        </View>

        <View className="w-full flex-col items-center gap-4 mt-8">
          
          <TouchableOpacity
            onPress={() => router.push('/registerselector')}
            className="w-full bg-[#4caf50] rounded-2xl py-4 flex-col items-center justify-center shadow-lg"
          >
            <Text className="text-base font-bold text-white">Crear cuenta</Text>
            <Text className="text-xs text-white/80 mt-1">(via Google, Apple o Email)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/login')}
            className="flex-row items-center"
          >
            <Text className="text-sm text-gray-500">¿Ya tienes cuenta? </Text>
            <Text className="text-sm text-[#4caf50] font-bold">Inicia sesión</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}