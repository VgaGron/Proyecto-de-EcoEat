import { db } from '@/services/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { doc, updateDoc } from 'firebase/firestore';
import { RefreshCw, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditProductProps {
  visible: boolean;
  item: any;
  viewMode: 'activos' | 'historial';
  onClose: () => void;
  onSuccess: () => void; 
}

export function EditProduct({ visible, item, viewMode, onClose, onSuccess }: EditProductProps) {
  const [precioOriginal, setPrecioOriginal] = useState('');
  const [precioOferta, setPrecioOferta] = useState('');
  const [stock, setStock] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // NUEVOS ESTADOS PARA EL RELOJ
  const [tempTime, setTempTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState<{ visible: boolean; field: 'horaInicio' | 'horaFin' | null }>({
    visible: false,
    field: null
  });

  useEffect(() => {
    if (item) {
      setPrecioOriginal(String(item.precioOriginal || ''));
      setPrecioOferta(String(item.precioOferta || ''));
      setStock(String(item.cantidadDisponible || '0'));
      setHoraInicio(item.horaInicio || '');
      setHoraFin(item.horaFin || '');
    }
  }, [item]);

  // FUNCIÓN QUE ESCUCHA LOS CAMBIOS DEL RELOJ
  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate && showPicker.field) {
        const hours = selectedDate.getHours().toString().padStart(2, '0');
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
        
        if (showPicker.field === 'horaInicio') setHoraInicio(`${hours}:${minutes}`);
        else setHoraFin(`${hours}:${minutes}`);
      }
      setShowPicker({ visible: false, field: null });
    } else {
      if (selectedDate) setTempTime(selectedDate);
    }
  };

  // FUNCIÓN PARA EL BOTÓN "CONFIRMAR" (Solo iOS)
  const handleConfirmTime = () => {
    if (showPicker.field) {
      const hours = tempTime.getHours().toString().padStart(2, '0');
      const minutes = tempTime.getMinutes().toString().padStart(2, '0');
      
      if (showPicker.field === 'horaInicio') setHoraInicio(`${hours}:${minutes}`);
      else setHoraFin(`${hours}:${minutes}`);
    }
    setShowPicker({ visible: false, field: null });
  };

  const handleSave = async () => {
    if (!item) return;
    if (Number(precioOferta) >= Number(precioOriginal)) {
      Alert.alert('Error', 'El precio de oferta debe ser menor al original.'); 
      return;
    }
    if (!horaInicio.trim() || !horaFin.trim()) {
      Alert.alert('Error', 'Debes colocar hora de inicio y fin.'); 
      return;
    }

    try {
      setIsSaving(true);
      const itemRef = doc(db, item.collectionName, item.id);
      
      await updateDoc(itemRef, {
        precioOriginal: Number(precioOriginal),
        precioOferta: Number(precioOferta),
        cantidadDisponible: Number(stock),
        horaInicio: horaInicio,
        horaFin: horaFin,
        fecha_creacion: new Date().toISOString() 
      });

      Alert.alert('¡Listo!', 'Producto actualizado correctamente.');
      onSuccess(); 
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Contenedor Principal del Modal de Edición */}
      <View className="flex-1 bg-black/50 justify-end relative">
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="font-black text-lg text-gray-800">
                {viewMode === 'historial' ? '♻️ Reactivar Producto' : '✏️ Editar Producto'}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">{item?.nombre}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
              <X color="#6b7280" size={18} />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="font-bold text-xs text-gray-400 mb-1">Precio original</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-gray-400 text-sm">S/.</Text>
                <TextInput value={precioOriginal} onChangeText={t => setPrecioOriginal(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" className="flex-1 text-base font-black text-gray-700" />
              </View>
            </View>
            <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
              <Text className="font-bold text-xs text-green-500 mb-1">Precio oferta</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-green-400 text-sm">S/.</Text>
                <TextInput value={precioOferta} onChangeText={t => setPrecioOferta(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" className="flex-1 text-base font-black text-green-700" />
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mb-5">
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="font-bold text-xs text-gray-400 mb-1">Stock</Text>
              <TextInput value={stock} onChangeText={t => setStock(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" className="text-base font-black text-gray-700" />
            </View>
            
            {/* BOTÓN DE HORA DE INICIO */}
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="font-bold text-xs text-gray-400 mb-1">Inicia</Text>
              <TouchableOpacity
                onPress={() => {
                  setTempTime(new Date());
                  setShowPicker({ visible: true, field: 'horaInicio' });
                }}
                className="flex-1 justify-center"
              >
                <Text className={`text-base font-black ${horaInicio ? 'text-gray-700' : 'text-gray-300'}`}>
                  {horaInicio || "14:00"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* BOTÓN DE HORA DE FIN */}
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="font-bold text-xs text-gray-400 mb-1">Termina</Text>
              <TouchableOpacity
                onPress={() => {
                  setTempTime(new Date());
                  setShowPicker({ visible: true, field: 'horaFin' });
                }}
                className="flex-1 justify-center"
              >
                <Text className={`text-base font-black ${horaFin ? 'text-gray-700' : 'text-gray-300'}`}>
                  {horaFin || "18:00"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl items-center flex-row justify-center gap-2 ${isSaving ? 'bg-gray-300' : 'bg-[#90C659]'}`}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              // ✨ AQUÍ ESTABA EL BUG: Cambiamos <> por <View>
              <View className="flex-row items-center justify-center gap-2">
                {viewMode === 'historial' && <RefreshCw color="white" size={18} />}
                <Text className="text-white font-black text-base">
                  {viewMode === 'historial' ? 'Reactivar y Publicar' : 'Guardar cambios'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </View>

        {/* OVERLAY PARA EL RELOJ EN iOS (Bottom Sheet integrado) */}
        {Platform.OS === 'ios' && showPicker.visible && (
          <View className="absolute inset-0 flex-1 justify-end bg-black/60 z-50">
            <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-2xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="font-bold text-lg text-gray-800">
                  {showPicker.field === 'horaInicio' ? '¿A qué hora inicia?' : '¿A qué hora termina?'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowPicker({ visible: false, field: null })}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <X color="#4b5563" size={20} />
                </TouchableOpacity>
              </View>

              <View className="items-center bg-gray-50 rounded-2xl py-4 mb-6 border border-gray-100">
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={onTimeChange}
                  textColor="#1f2937" 
                />
              </View>

              <TouchableOpacity
                onPress={handleConfirmTime}
                className="w-full bg-[#90C659] py-4 rounded-2xl items-center shadow-md shadow-green-200"
              >
                <Text className="text-white font-bold text-base">Confirmar Hora</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>

      {/* RELOJ NATIVO PARA ANDROID */}
      {Platform.OS === 'android' && showPicker.visible && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={onTimeChange}
        />
      )}
    </Modal>
  );
}

export default EditProduct;