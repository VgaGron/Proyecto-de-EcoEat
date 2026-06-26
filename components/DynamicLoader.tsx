import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';

export interface LoadingStep {
  text: string;
  icon: React.ReactNode;
}

interface DynamicLoaderProps {
  steps: LoadingStep[];
  onComplete: () => void;
}

export const DynamicLoader = ({ steps, onComplete }: DynamicLoaderProps) => {
  const [loadingStep, setLoadingStep] = useState(0);
  
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: ((loadingStep + 1) / steps.length) * 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [loadingStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1500);

    const timeout = setTimeout(() => {
      onComplete();
    }, (steps.length * 1500) + 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete, steps.length]);

  return (
    <View className="flex-1 bg-green-50 flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Fondo decorativo */}
      <View className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
        <Image 
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png" }} 
          className="w-64 h-64" 
          style={{ transform: [{ rotate: '45deg' }] }} 
        />
      </View>
      <View className="absolute -bottom-10 -left-10 opacity-5 pointer-events-none">
        <Image 
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png" }} 
          className="w-64 h-64" 
          style={{ transform: [{ rotate: '-12deg' }] }} 
        />
      </View>

      <View className="z-10 flex-col items-center w-full max-w-xs">
        
        {/* Círculo estático (Las animaciones complejas de ping/pulse de Tailwind a veces no rinden bien en móvil, así que usamos un diseño limpio y sólido) */}
        <View className="relative w-24 h-24 mb-8 items-center justify-center">
          <View className="absolute inset-0 bg-[#90C659] rounded-full opacity-20" />
          <View className="absolute inset-2 bg-[#90C659] rounded-full opacity-40" />
          
          <View className="relative z-10 w-16 h-16 bg-[#90C659] rounded-full shadow-lg flex items-center justify-center">
            {/* Aquí inyectamos el ícono dinámico */}
            {steps[loadingStep]?.icon}
          </View>
        </View>

        <Text className="text-xl font-black text-gray-800 mb-2 h-14 text-center">
          {steps[loadingStep]?.text}
        </Text>
        
        {/* Barra de progreso nativa */}
        <View className="w-48 h-1.5 bg-gray-200 rounded-full mt-4 overflow-hidden">
          <Animated.View 
            className="h-full bg-[#90C659] rounded-full"
            style={{ 
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }) 
            }}
          />
        </View>

      </View>
    </View>
  );
};