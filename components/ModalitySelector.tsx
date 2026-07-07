import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

interface ModalitySelectorProps {
  modality: 'tienda' | 'comer_alli'; 
  value: string;
  onChange: (value: string) => void;
  options?: string[]; 
}

export const ModalitySelector = ({ 
  modality, 
  value, 
  onChange, 
  options = [
    "Hoy, 6:00 PM - 7:00 PM",
    "Hoy, 7:00 PM - 8:00 PM",
    "Mañana, 10:00 AM - 11:00 AM"
  ]
}: ModalitySelectorProps) => {

  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <Text className="font-bold mb-3 text-gray-800">
        {modality === 'tienda' ? '⏰ Horario para Recojo' : '⏰ Horario de Llegada'}
      </Text>
      
      {/* Botón principal del selector */}
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-4 border rounded-xl bg-gray-50 flex-row justify-between items-center ${isOpen ? 'border-[#90C659]' : 'border-gray-200'}`}
      >
        <Text className={`text-sm font-medium ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value || "Selecciona una ventana de recojo"}
        </Text>
        {isOpen ? <ChevronUp color="#90C659" size={20} /> : <ChevronDown color="#90C659" size={20} />}
      </TouchableOpacity>

      {/* Lista desplegable personalizada */}
      {isOpen && (
        <View className="mt-2 border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
          {options.map((time, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => {
                onChange(time);
                setIsOpen(false); 
              }}
              className={`px-4 py-4 border-b border-gray-50 flex-row items-center justify-between ${value === time ? 'bg-green-50' : 'bg-white'}`}
            >
              <Text className={`text-sm ${value === time ? 'font-bold text-[#90C659]' : 'font-medium text-gray-600'}`}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};