import { Minus, Plus, X } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { RestaurantMenuItem } from '../molecules/RestaurantMenuItemCard';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  items: RestaurantMenuItem[];
  quantities: { [key: string]: number };
  totalAmount: number;
  onIncrease: (item: any) => void;
  onDecrease: (item: any) => void;
  onCheckout: () => void;
}

export const CartModal = ({
  visible,
  onClose,
  items,
  quantities,
  totalAmount,
  onIncrease,
  onDecrease,
  onCheckout,
}: CartModalProps) => {
  const cartItems = items.filter((item) => (quantities[item.id] || 0) > 0);
  const hasItems = cartItems.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl max-h-[75%]">
          
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <Text className="font-bold text-lg text-gray-800">🛒 Tu carrito</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X color="#6b7280" size={22} />
            </TouchableOpacity>
          </View>

          {!hasItems ? (
            <View className="py-16 items-center justify-center px-5">
              <Text className="text-gray-400 text-sm text-center">
                Tu carrito está vacío. Agrega packs o platos para continuar.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView className="px-5 pt-2" style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                {cartItems.map((item) => (
                  <View key={item.id} className="flex-row items-center justify-between py-3 border-b border-gray-50">
                    <View className="flex-1 pr-3">
                      <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>{item.name}</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        S/ {item.discountPrice.toFixed(2)} c/u
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity
                        onPress={() => onDecrease(item)}
                        className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <Minus color="#374151" size={14} />
                      </TouchableOpacity>

                      <Text className="font-bold text-sm text-gray-800 w-5 text-center">
                        {quantities[item.id]}
                      </Text>

                      <TouchableOpacity
                        onPress={() => onIncrease(item)}
                        className="w-7 h-7 rounded-full bg-[#90C659] items-center justify-center"
                      >
                        <Plus color="white" size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View className="px-5 pt-4 pb-8 border-t border-gray-100">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="font-bold text-base text-gray-800">Total</Text>
                  <Text className="font-black text-xl text-[#90C659]">S/ {totalAmount.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                  onPress={onCheckout}
                  className="w-full py-4 rounded-xl bg-[#90C659] items-center justify-center"
                >
                  <Text className="font-bold text-white text-base">Continuar al pago</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};