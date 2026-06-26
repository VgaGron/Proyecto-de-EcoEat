import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';

interface UrgentRestaurant {
  name: string;
  image: string;
  timeLeft: string | number;
  offerCount: number;
}

interface UrgentOffersProps {
  title?: string;
  restaurants: UrgentRestaurant[];
  onRestaurantClick: () => void;
}

export const UrgentOffers = ({ 
  title = "🔥 A punto de acabar", 
  restaurants, 
  onRestaurantClick 
}: UrgentOffersProps) => {
  
  return (
    <View className="mb-8">
      {/* Encabezado del Carrusel */}
      <View className="flex-row justify-between items-center mb-3 px-4">
        <Text className="font-bold text-lg text-gray-800">
          {title}
        </Text>
        <TouchableOpacity>
          <Text className="text-[#90C659] text-xs font-bold">
            Ver todos
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Carrusel Deslizable con el dedo */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {restaurants.map((restaurant, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={onRestaurantClick}
            className="w-[200px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            {/* Imagen y Etiqueta de Tiempo */}
            <View className="h-28 relative bg-gray-200">
              <Image 
                source={{ uri: restaurant.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' }} 
                className="w-full h-full" 
                resizeMode="cover"
              />
              
              {/* Sombra inferior (Simula el gradient para que el texto resalte) */}
              <View className="absolute bottom-0 w-full h-1/2 bg-black/40" />
              
              <View className="absolute bottom-2 left-2 bg-orange-500/95 px-2.5 py-1 rounded-md flex-row items-center gap-1.5">
                <Clock color="white" size={14} />
                <Text className="text-white text-xs font-bold">Faltan {restaurant.timeLeft} min</Text>
              </View>
            </View>
            
            {/* Textos Inferiores */}
            <View className="p-3">
              {/* numberOfLines={1} funciona como el 'truncate' de Tailwind en móviles */}
              <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>
                {restaurant.name}
              </Text>
              <Text className="text-[#90C659] font-medium text-xs mt-1">
                {restaurant.offerCount} opciones para rescatar
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};