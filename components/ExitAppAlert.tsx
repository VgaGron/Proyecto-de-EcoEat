import { LogOut, X } from 'lucide-react-native';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface ExitAppAlertProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ExitAppAlert = ({ visible, onCancel, onConfirm }: ExitAppAlertProps) => {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="w-full max-w-sm bg-white rounded-[30px] p-6 shadow-2xl relative">
          <TouchableOpacity onPress={onCancel} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full">
            <X color="#000000" size={20} />
          </TouchableOpacity>

          <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-5 mt-2 self-center">
            <LogOut color="#25d150" size={32} />
          </View>

          <Text className="text-xl font-black text-black mb-2 text-center">
            Salir de la aplicación
          </Text>

          <Text className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
            ¿Quieres salir de EcoEat?
          </Text>

          <View className="w-full flex-col gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="w-full bg-gray-800 py-4 rounded-2xl items-center active:scale-95"
            >
              <Text className="text-white font-bold text-base">Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="w-full border-2 border-red-100 bg-red-50 py-3.5 rounded-2xl items-center active:scale-95"
            >
              <Text className="text-red-500 font-bold text-sm">Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};