import { AlertTriangle, Clock, Leaf, Minus, Plus, Tag } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { ActionButton } from '../atoms/ActionButton';

export interface RestaurantMenuItem {
  id: string;
  collection: string;
  name: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  category: string;
  horaInicio: string | null;
  horaFin: string | null;
  fecha_creacion: string | null; 
  stock: number;
  image: string;
  alergenos: string[];
}

interface Props {
  item: RestaurantMenuItem;
  quantity: number;
  isSurprisePack: boolean;
  isUpcoming: boolean;
  isExpired: boolean;
  isDangerous: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function RestaurantMenuItemCard({
  item,
  quantity,
  isSurprisePack,
  isUpcoming,
  isExpired,
  isDangerous,
  onDecrease,
  onIncrease
}: Props) {
  
  const isAgotado = item.stock <= 0 || isExpired;

  return (
    <View className={`bg-white border ${isSurprisePack ? 'border-[#90C659]/30' : 'border-gray-200'} rounded-xl overflow-hidden shadow-sm flex-row min-h-[150px] mb-4 py-1 ${(isAgotado || isUpcoming) ? 'opacity-60' : ''}`}>
      
      <View className="w-1/3 bg-gray-100 relative">
        <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
        
        {isUpcoming ? (
          <View className="absolute top-0 left-0 w-full bg-blue-500 py-1 items-center z-10">
            <Text className="text-white text-[9px] font-black tracking-widest">PRÓXIMAMENTE</Text>
          </View>
        ) : isExpired ? (
          <View className="absolute top-0 left-0 w-full bg-gray-600 py-1 items-center z-10">
            <Text className="text-white text-[9px] font-black tracking-widest">EXPIRADO</Text>
          </View>
        ) : item.stock <= 0 ? (
          <View className="absolute top-0 left-0 w-full bg-gray-600 py-1 items-center z-10">
            <Text className="text-white text-[9px] font-black tracking-widest">AGOTADO</Text>
          </View>
        ) : item.stock === 1 ? (
          <View className="absolute top-0 left-0 w-full bg-red-500 py-0.5 items-center z-10">
            <Text className="text-white text-[9px] font-bold">¡Último!</Text>
          </View>
        ) : null}

        {isSurprisePack && (
          <View className="absolute bottom-0 w-full bg-[#90C659]/90 py-0.5 items-center">
            <Text className="text-white text-[8px] font-black tracking-widest uppercase">Sorpresa</Text>
          </View>
        )}
      </View>

      <View className="p-3 flex-1 flex-col justify-between">
        <View>
          <View className="flex-row justify-between items-start mb-1">
            <Text className="font-bold text-sm text-gray-800 flex-1 pr-2 leading-tight" numberOfLines={2}>
              {item.name}
            </Text>
            {isDangerous ? (
               <AlertTriangle color="#ef4444" size={16} /> 
            ) : item.category === "Vegano" ? (
               <Leaf color="#90C659" size={16} />
            ) : null}
          </View>
          
          <Text className="text-[10px] text-gray-500 mb-1.5" numberOfLines={2}>
            {item.description}
          </Text>

          <View className="flex-row gap-2 items-center">
            <View className="bg-gray-100 px-1.5 py-0.5 rounded flex-row items-center gap-1">
              <Tag color="#4b5563" size={10} />
              <Text className="text-[9px] text-gray-600 font-medium">{item.category}</Text>
            </View>
            {(!isAgotado && !isUpcoming && item.horaFin) && (
              <View className="bg-orange-50 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                <Clock color="#ea580c" size={10} />
                <Text className="text-[9px] text-orange-600 font-bold">hasta {item.horaFin}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row items-end justify-between mt-2">
          <View>
            <Text className="text-[10px] text-gray-400 line-through">
              S/. {item.originalPrice?.toFixed(2)}
            </Text>
            <Text className="font-black text-[#90C659] text-base leading-none">
              S/. {item.discountPrice?.toFixed(2)}
            </Text>
          </View>

          {isUpcoming ? (
            <View className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
              <Text className="text-blue-600 text-[10px] font-bold">Desde las {item.horaInicio}</Text>
            </View>
          ) : isAgotado ? (
            <View className="bg-gray-200 px-3 py-1.5 rounded-lg">
              <Text className="text-gray-500 text-[10px] font-bold">{isExpired ? 'Fuera de hora' : 'Sin Stock'}</Text>
            </View>
          ) : quantity > 0 ? (
            <View className="flex-row items-center gap-2 bg-gray-50 border border-gray-200 rounded-full p-1">
              <TouchableOpacity 
                onPress={onDecrease}
                className="w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm"
              >
                <Minus color="#4b5563" size={12} />
              </TouchableOpacity>
              
              <Text className="text-xs font-bold w-4 text-center">{quantity}</Text>
              
              <TouchableOpacity 
                onPress={onIncrease}
                disabled={quantity >= item.stock}
                className={`w-6 h-6 rounded-full items-center justify-center shadow-sm ${quantity >= item.stock ? "bg-gray-200" : "bg-[#90C659]"}`}
              >
                <Plus color={quantity >= item.stock ? "#9ca3af" : "white"} size={12} />
              </TouchableOpacity>
            </View>
          ) : (
            <ActionButton onPress={onIncrease} text="Añadir" />
          )}

        </View>
      </View>
    </View>
  );
}