import React from 'react';
import { Modal, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';

interface AlertComponentProps {
  visible: boolean;
  allergens: string[];
  onClose: () => void;
  onConfirm: () => void;
}

export const AlertComponent = ({ visible, allergens, onClose, onConfirm }: AlertComponentProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        
        <View className="bg-white w-full max-w-sm rounded-[32px] p-6 items-center shadow-2xl relative">
          
          <TouchableOpacity 
            onPress={onClose} 
            className="absolute top-5 right-5 p-2 bg-gray-50 rounded-full"
          >
            <X color="#9ca3af" size={20} />
          </TouchableOpacity>

          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-5 mt-4">
            <AlertTriangle color="#ef4444" size={40} strokeWidth={2.5} />
          </View>

          <Text className="text-xl font-black text-gray-800 mb-2 text-center">
            Alerta de Salud
          </Text>
          
          <Text className="text-sm text-gray-500 text-center mb-6 leading-relaxed px-2">
            Tu perfil indica que tienes alergia a <Text className="font-bold text-red-500">{allergens.join(', ')}</Text>. Este producto contiene o podría contener trazas de estos ingredientes.
          </Text>

          <View className="w-full flex-col gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="w-full bg-gray-800 py-4 rounded-2xl items-center shadow-md active:scale-95 transition-all"
            >
              <Text className="text-white font-bold text-base">Entendido, no añadir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="w-full border-2 border-red-100 bg-red-50 py-3.5 rounded-2xl items-center active:scale-95 transition-all"
            >
              <Text className="text-red-500 font-bold text-sm">Añadir bajo mi propio riesgo</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};