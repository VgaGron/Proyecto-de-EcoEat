import { Star } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export function favoriteTab() {
  return (
    <View className="flex-1 bg-gray-50 items-center justify-center p-6 text-center">
      <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
        <Star color="#90C659" fill="#90C659" size={40} opacity={0.5} />
      </View>
      <Text className="font-bold text-xl text-gray-800 mb-2">Aún no hay favoritos</Text>
      <Text className="text-gray-500 text-sm text-center">Los restaurantes que guardes aparecerán en esta lista.</Text>
    </View>
  );
}