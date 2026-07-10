import { Stack, useRouter } from 'expo-router';
import { addDoc, collection } from "firebase/firestore";
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { db } from '@/services/firebase';

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
    } catch (error) {
      console.error("Error al conectar con Firebase: ", error);
    }
  };

  return (
    <View className="flex-1 bg-white relative overflow-hidden">
      
      <Stack.Screen options={{ headerShown: false }} />

      <View className="h-[55%] overflow-hidden">
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1562785561-d88a65a2679e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800" }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/10" />
      </View>

      <View className="flex-1 bg-white rounded-t-3xl -mt-6 px-8 pt-8 pb-10 flex-col items-center justify-between">

        <View className="flex-col items-center w-full">
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-12 h-12 bg-[#4caf50] rounded-full items-center justify-center shadow-md">
              <Text style={{ fontSize: 20, color: 'white' }}>🍽️</Text>
            </View>
            <Text className="text-3xl text-gray-800 font-bold tracking-tight">EcoEat</Text>
          </View>

          <View className="w-12 h-1 bg-[#4caf50] rounded-full mb-4" />

          <Text className="text-center text-gray-900 mb-3 text-2xl font-bold leading-tight">
            Rescata comida deliciosa{"\n"}a precios increíbles.
          </Text>

          <Text className="text-center text-gray-500 text-sm leading-relaxed">
            Únete a la comunidad que lucha{"\n"}contra el desperdicio de alimentos.
          </Text>
        </View>

        <View className="w-full flex-col gap-3">

          <TouchableOpacity
            onPress={() => router.push('/auth/registerselector')}
            className="w-full bg-[#4caf50] rounded-2xl py-4 flex-col items-center justify-center shadow-lg"
          >
            <Text className="text-base font-bold text-white">Crear cuenta</Text>
            <Text className="text-xs text-white/80 mt-1">(via Google, Apple o Email)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            className="w-full border-2 border-[#4caf50] rounded-2xl py-4 items-center"
          >
            <Text className="text-sm text-gray-500">¿Ya tienes cuenta? <Text className="text-[#4caf50] font-bold">Inicia sesión</Text></Text>
          </TouchableOpacity>

        </View>

      </View>
    </View>
  );
}