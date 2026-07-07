import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface RestaurantCheckoutBarProps {
  totalItems: number;
  totalAmount: number;
  onProceedCheckout: () => void;
}

export const RestaurantCheckoutBar = ({
  totalItems,
  totalAmount,
  onProceedCheckout,
}: RestaurantCheckoutBarProps) => {
  return (
    <View className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white shadow-lg pb-8">
      <TouchableOpacity
        onPress={onProceedCheckout}
        disabled={totalItems === 0}
        className={`w-full py-4 rounded-xl flex-row items-center justify-between px-6 active:scale-95 ${
          totalItems > 0 ? 'bg-[#90C659] shadow-lg' : 'bg-gray-200'
        }`}
      >
        <Text className={`font-bold text-base ${totalItems > 0 ? 'text-white' : 'text-gray-400'}`}>
          ♻️ Proceder al Rescate
        </Text>
        {totalItems > 0 && (
          <View className="bg-white px-2 py-1 rounded-md">
            <Text className="text-[#90C659] font-black text-sm">S/. {totalAmount.toFixed(2)}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};