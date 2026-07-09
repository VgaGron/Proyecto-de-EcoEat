import { useRouter } from 'expo-router';
import { ArrowLeft, Store, User } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function RegisterRoleSelector() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50 flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-12 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm z-10"
      >
        <ArrowLeft color="#6b7280" size={24} />
      </TouchableOpacity>

      <View className="items-center mb-10 mt-10 z-10">
        <Text className="text-3xl font-black text-gray-900 mb-3">¿Cómo quieres unirte?</Text>
        <Text className="text-gray-500 font-medium px-4 text-center">
          Selecciona tu perfil para comenzar tu experiencia en ECOEAT.
        </Text>
      </View>

      <View className="w-full max-w-sm z-10">
        
        <TouchableOpacity 
          onPress={() => router.push('/auth/register-user')} 
          className="w-full bg-white p-6 rounded-[32px] shadow-sm border-2 border-transparent flex-row items-center gap-5 relative overflow-hidden mb-4"
        >
          <View className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
            <User color="#90C659" size={32} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-black text-gray-800 mb-1">Soy un Comensal</Text>
            <Text className="text-sm text-gray-500 font-medium">Quiero rescatar comida deliciosa a precios increíbles.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/auth/register-restaurant')} 
          className="w-full bg-white p-6 rounded-[32px] shadow-sm border-2 border-transparent flex-row items-center gap-5 relative overflow-hidden"
        >
          <View className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
            <Store color="#f97316" size={32} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-black text-gray-800 mb-1">Soy un Negocio</Text>
            <Text className="text-sm text-gray-500 font-medium">Quiero vender mis excedentes y reducir el desperdicio.</Text>
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
}