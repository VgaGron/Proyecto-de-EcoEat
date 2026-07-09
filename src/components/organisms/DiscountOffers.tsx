import { Clock, Tag } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface DiscountOfferItem {
  id: string;
  restauranteId: string;
  restaurantName: string;
  name: string;
  image: string;
  originalPrice: number;
  discountPrice: number;
  timeLeft: string;
}

interface DiscountOffersProps {
  title?: string;
  offers: DiscountOfferItem[];
  onOfferClick: (restaurantId: string) => void;
}

export const DiscountOffers = ({
  title = '💸 Platos en descuento',
  offers,
  onOfferClick,
}: DiscountOffersProps) => {
  if (offers.length === 0) {
    return null;
  }

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3 px-4">
        <Text className="font-bold text-lg text-gray-800">{title}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {offers.map((offer) => (
          <TouchableOpacity
            key={offer.id}
            onPress={() => onOfferClick(offer.restauranteId)}
            className="w-[190px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            <View className="h-28 relative bg-gray-200">
              <Image
                source={{ uri: offer.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' }}
                className="w-full h-full"
                resizeMode="cover"
              />

              <View className="absolute bottom-2 left-2 bg-[#90C659]/95 px-2.5 py-1 rounded-md flex-row items-center gap-1.5 max-w-[82%]">
                <Tag color="white" size={12} />
                <Text className="text-white text-[10px] font-bold" numberOfLines={1}>
                  {offer.restaurantName}
                </Text>
              </View>
            </View>

            <View className="p-3">
              <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>
                {offer.name}
              </Text>
              <View className="flex-row items-center gap-1 mt-1.5">
                <Clock color="#ea580c" size={12} />
                <Text className="text-xs text-orange-600 font-bold">Faltan {offer.timeLeft}</Text>
              </View>
              <View className="mt-2 flex-row items-end justify-between">
                <View>
                  <Text className="text-[10px] text-gray-400 line-through">
                    S/. {offer.originalPrice.toFixed(2)}
                  </Text>
                  <Text className="text-[#90C659] font-black text-base leading-none">
                    S/. {offer.discountPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};