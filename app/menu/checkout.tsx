import { DynamicLoader } from '@/components/atoms/DynamicLoader';
import { ModalitySelector } from '@/components/molecules/ModalitySelector';
import { auth, db } from '@/services/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, increment, updateDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck, Smartphone, Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  
  const { cartStr, total, restaurantId } = useLocalSearchParams();
  
  const cartItems = typeof cartStr === 'string' ? JSON.parse(cartStr) : [];
  const initialTotal = typeof total === 'string' ? parseFloat(total) : 0;

  const [selectedModality, setSelectedModality] = useState('tienda');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [ownContainer, setOwnContainer] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState<string | null>(null);  
  const paymentSteps = [
    { text: "Conectando con tu método de pago...", icon: <CreditCard color="white" size={32} /> },
    { text: "Procesando transacción segura...", icon: <ShieldCheck color="white" size={32} /> },
    { text: "¡Pago aprobado!", icon: <CheckCircle2 color="white" size={32} /> }
  ];

  const isEcoEligible = true; 
  const ecoDiscount = (ownContainer && isEcoEligible) ? 0.50 : 0;
  const finalTotal = initialTotal - ecoDiscount;

  const timeSlots = React.useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const remainder = 15 - (start.getMinutes() % 15 || 15);
    start.setMinutes(start.getMinutes() + remainder, 0, 0);

    const formatTime = (date: Date) => {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutesStr = minutes.toString().padStart(2, '0');
      return `${hours}:${minutesStr} ${ampm}`;
    };

    const isSameDay = (date: Date) =>
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const slots: string[] = [];
    for (let i = 0; i < 3; i++) {
      const slotStart = new Date(start.getTime() + i * 30 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
      const dayLabel = isSameDay(slotStart) ? 'Hoy' : 'Mañana';
      slots.push(`${dayLabel}, ${formatTime(slotStart)} - ${formatTime(slotEnd)}`);
    }

    return slots;
  }, []);

  const handlePayment = async () => {
    if (!selectedTime) {
      Alert.alert("Aviso", "Por favor selecciona un horario de recojo o llegada.");
      return;
    }

    setIsProcessing(true);

    try {
      const userId = auth.currentUser?.uid || "usuario_anonimo"; 
      
      const nuevoPedido = {
        clienteId: userId,
        restauranteId: restaurantId,
        items: cartItems,
        totalPagado: finalTotal,
        metodoPago: selectedPayment,
        modalidad: selectedModality,
        horario: selectedTime,
        llevoEnvase: ownContainer,
        estado: "pagado_pendiente",
        fechaPedido: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'pedidos'), nuevoPedido);
      setGeneratedOrderId(docRef.id); 

      for (const item of cartItems) {
        if (item.collection && item.id) {
          const itemRef = doc(db, item.collection, item.id);
          await updateDoc(itemRef, {
            cantidadDisponible: increment(-item.quantity)
          });
        }
      }

    } catch (error) {
      console.error("Error al procesar:", error);
      Alert.alert("Error", "Hubo un problema procesando tu pago.");
      setIsProcessing(false);
    }
};
  const onPaymentComplete = () => {
    if (generatedOrderId) {
      router.replace({
        pathname: '/menu/success',
        params: { 
          orderId: generatedOrderId, 
          modality: selectedModality, 
          finalTotal: finalTotal 
        }
      });
    }
  };

  if (isProcessing) {
    return <DynamicLoader steps={paymentSteps} onComplete={onPaymentComplete} />;
  }

  return (
    <View className="flex-1 bg-gray-50 flex-col relative">
      
      <View className="bg-[#90C659] pt-12 pb-4 px-4 flex-row items-center gap-3 shadow-md z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="font-bold text-lg text-white tracking-wide">Detalles del Rescate</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-lg">📦</Text>
            <Text className="font-bold text-gray-800">Modalidad de Recepción</Text>
          </View>
          
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => { setSelectedModality('tienda'); setOwnContainer(false); }}
              className={`flex-1 py-3 rounded-xl items-center justify-center border transition-all ${
                selectedModality === 'tienda' ? 'bg-[#90C659] border-[#90C659]' : 'bg-white border-gray-200'
              }`}
            >
              <Text className="text-xl mb-1">🏪</Text>
              <Text className={`font-bold text-xs ${selectedModality === 'tienda' ? 'text-white' : 'text-gray-600'}`}>Tienda</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSelectedModality('comer'); setOwnContainer(false); }}
              className={`flex-1 py-3 rounded-xl items-center justify-center border transition-all ${
                selectedModality === 'comer' ? 'bg-[#90C659] border-[#90C659]' : 'bg-white border-gray-200'
              }`}
            >
              <Text className="text-xl mb-1">🍽️</Text>
              <Text className={`font-bold text-xs ${selectedModality === 'comer' ? 'text-white' : 'text-gray-600'}`}>Comer allí</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <ModalitySelector 
            modality={selectedModality as 'tienda' | 'comer_alli'} 
            value={selectedTime}
            onChange={(val) => setSelectedTime(val)}
            options={timeSlots}
          />

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setOwnContainer(!ownContainer)}
            className={`flex-row items-start gap-3 p-4 rounded-xl border transition-colors ${
              ownContainer ? 'bg-green-50 border-[#90C659]' : 'bg-white border-gray-200'
            }`}
          >
            <View className={`w-5 h-5 rounded items-center justify-center border mt-0.5 ${
              ownContainer ? 'bg-[#90C659] border-[#90C659]' : 'bg-white border-gray-300'
            }`}>
              {ownContainer && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-800">♻️ Llevaré mi propio envase</Text>
              <Text className="text-[10px] text-gray-500 mt-0.5">Ayuda al planeta y obtén S/ 0.50 de dscto.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="font-bold mb-3 text-gray-800">💳 Método de Pago</Text>
          <View className="flex-row gap-3">
            
            <TouchableOpacity
              onPress={() => setSelectedPayment('yape')}
              className={`flex-1 border-2 rounded-xl py-4 items-center justify-center gap-2 ${
                selectedPayment === 'yape' ? 'border-[#90C659] bg-green-50' : 'border-gray-100 bg-white'
              }`}
            >
              <View className="w-10 h-10 bg-[#74005e] rounded-full items-center justify-center">
                <Smartphone color="white" size={20} />
              </View>
              <Text className="text-xs font-bold text-gray-700">Yape</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPayment('plin')}
              className={`flex-1 border-2 rounded-xl py-4 items-center justify-center gap-2 ${
                selectedPayment === 'plin' ? 'border-[#90C659] bg-green-50' : 'border-gray-100 bg-white'
              }`}
            >
              <View className="w-10 h-10 bg-[#00e3ff] rounded-full items-center justify-center">
                <Wallet color="#111827" size={20} />
              </View>
              <Text className="text-xs font-bold text-gray-700">Plin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPayment('tarjeta')}
              className={`flex-1 border-2 rounded-xl py-4 items-center justify-center gap-2 ${
                selectedPayment === 'tarjeta' ? 'border-[#90C659] bg-green-50' : 'border-gray-100 bg-white'
              }`}
            >
              <View className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center">
                <CreditCard color="white" size={20} />
              </View>
              <Text className="text-xs font-bold text-gray-700">Tarjeta</Text>
            </TouchableOpacity>

          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-bold mb-4 text-gray-800">🛒 Resumen de Pedido</Text>
          
          <View className="space-y-3 mb-4">
            {cartItems.map((item: any, index: number) => (
              <View key={index} className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600 font-medium">
                  {item.quantity}x {item.name}
                </Text>
                <Text className="text-sm font-bold text-gray-800">
                  S/ {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View className="border-t border-dashed border-gray-200 pt-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-500">Subtotal</Text>
              <Text className="font-semibold text-gray-700">S/ {initialTotal.toFixed(2)}</Text>
            </View>
            
            {ecoDiscount > 0 && (
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-green-600 font-medium">♻️ Descuento Envase</Text>
                <Text className="font-bold text-green-600">-S/ {ecoDiscount.toFixed(2)}</Text>
              </View>
            )}
          </View>

          <View className="border-t border-gray-200 pt-4 flex-row justify-between items-end">
            <View>
              <Text className="font-bold text-base text-gray-800">Total a Pagar</Text>
              <Text className="text-[10px] text-gray-400">Incluye IGV</Text>
            </View>
            <Text className="font-black text-2xl text-[#90C659]">S/ {finalTotal.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      <View className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 pb-8">
        <TouchableOpacity
          onPress={handlePayment}
          disabled={!selectedPayment}
          className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 active:scale-95 ${
            selectedPayment ? 'bg-[#90C659]' : 'bg-gray-200'
          }`}
        >
          <Text className={`font-bold text-lg ${selectedPayment ? 'text-white' : 'text-gray-400'}`}>
            Confirmar Pago
          </Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
}