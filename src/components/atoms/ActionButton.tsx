import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface ActionButtonProps {
  onPress: () => void;
  text?: string;
}

export const ActionButton = ({ onPress, text = "Añadir" }: ActionButtonProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-[#CD5334] px-3 py-1.5 rounded-lg items-center justify-center active:scale-95 shadow-sm"
    >
      <Text className="text-white text-[10px] font-bold">
        {text}
      </Text>
    </TouchableOpacity>
  );
};