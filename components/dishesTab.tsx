import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { AlertTriangle, Edit2, Package, Plus, RefreshCw, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';

const getAbsoluteDate = (fechaCreacion: string, horaStr: string) => {
  if (!fechaCreacion || !horaStr || !horaStr.includes(':')) return null;
  const date = new Date(fechaCreacion);
  if (isNaN(date.getTime())) return null;
  const [h, m] = horaStr.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
};

export function dishesTab() {
  const router = useRouter();
  
  const [activos, setActivos] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'activos' | 'historial'>('activos');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editPrecioOriginal, setEditPrecioOriginal] = useState('');
  const [editPrecioOferta, setEditPrecioOferta] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editHoraInicio, setEditHoraInicio] = useState('');
  const [editHoraFin, setEditHoraFin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      setLoading(true);
      const qPacks = query(collection(db, 'packs_sopresa'), where('restauranteId', '==', uid));
      const qPlatos = query(collection(db, 'platos_independientes'), where('restauranteId', '==', uid));

      const [packsSnap, platosSnap] = await Promise.all([getDocs(qPacks), getDocs(qPlatos)]);

      const allItems: any[] = [
        ...packsSnap.docs.map(d => ({ id: d.id, collectionName: 'packs_sopresa', tipo: 'Pack Sorpresa', ...d.data() })),
        ...platosSnap.docs.map(d => ({ id: d.id, collectionName: 'platos_independientes', tipo: 'Plato', ...d.data() }))
      ];

      const now = new Date();
      const listaActivos: any[] = [];
      const listaHistorial: any[] = [];

      allItems.forEach(item => {
        const isAgotado = (item?.cantidadDisponible || 0) <= 0;
        let isExpired = false;

        const expDate = getAbsoluteDate(item.fecha_creacion, item.horaFin);
        
        if (expDate) {
          isExpired = now > expDate;
        } else {
          isExpired = true; 
        }

        if (isExpired || isAgotado) {
          listaHistorial.push(item);
        } else {
          listaActivos.push(item);
        }
      });

      listaHistorial.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

      setActivos(listaActivos);
      setHistorial(listaHistorial);
    } catch (error) {
      console.error("Error al traer productos:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditPrecioOriginal(String(item.precioOriginal || ''));
    setEditPrecioOferta(String(item.precioOferta || ''));
    setEditStock(String(item.cantidadDisponible || '0'));
    setEditHoraInicio(item.horaInicio || '');
    setEditHoraFin(item.horaFin || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (Number(editPrecioOferta) >= Number(editPrecioOriginal)) {
      Alert.alert('Error', 'El precio de oferta debe ser menor al original.'); return;
    }
    if (!editHoraInicio.trim() || !editHoraFin.trim()) {
      Alert.alert('Error', 'Debes colocar hora de inicio y fin.'); return;
    }

    try {
      setIsSaving(true);
      const itemRef = doc(db, editingItem.collectionName, editingItem.id);

      await updateDoc(itemRef, {
        precioOriginal: Number(editPrecioOriginal),
        precioOferta: Number(editPrecioOferta),
        cantidadDisponible: Number(editStock),
        horaInicio: editHoraInicio,
        horaFin: editHoraFin,
        fecha_creacion: new Date().toISOString() 
      });

      setEditModalVisible(false);
      await fetchProducts(); 
      Alert.alert('¡Listo!', 'Producto reactivado/actualizado correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderProductList = (items: any[]) => {
    if (items.length === 0) {
      return (
        <View className="bg-white rounded-2xl p-8 items-center border border-gray-100 mt-4">
          <Package color="#d1d5db" size={40} />
          <Text className="text-gray-400 text-sm text-center mt-3">No hay productos en esta sección.</Text>
        </View>
      );
    }

    return items.map((item) => {
      const isAgotado = (item.cantidadDisponible || 0) <= 0;
      return (
        <View key={item.id} className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-row h-28 mb-3 ${viewMode === 'historial' ? 'opacity-60' : ''}`}>
          <Image source={{ uri: item.imagenUrl }} className="w-24 h-full" resizeMode="cover" />
          <View className="flex-1 p-3 justify-between">
            <View>
              <View className="flex-row items-center gap-1.5 mb-0.5 flex-wrap">
                <View className={`px-1.5 py-0.5 rounded ${item.tipo === 'Pack Sorpresa' ? 'bg-green-100' : 'bg-blue-50'}`}>
                  <Text className={`text-[9px] font-bold ${item.tipo === 'Pack Sorpresa' ? 'text-green-700' : 'text-blue-600'}`}>{item.tipo}</Text>
                </View>
                {isAgotado && (
                  <View className="bg-red-50 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                    <AlertTriangle color="#dc2626" size={10} />
                    <Text className="text-[9px] font-bold text-red-600">Agotado</Text>
                  </View>
                )}
              </View>
              <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>{item.nombre}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] text-gray-500 font-medium">Stock: {item.cantidadDisponible ?? 0}</Text>
                <Text className="text-[10px] text-orange-600 font-medium">{item.horaInicio} a {item.horaFin}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-black text-[#90C659] text-sm">S/ {Number(item.precioOferta || 0).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => openEditModal(item)} className={`p-1.5 rounded-lg ${viewMode === 'historial' ? 'bg-[#90C659]/10' : 'bg-gray-100'}`}>
                  {viewMode === 'historial' ? <RefreshCw color="#90C659" size={14} /> : <Edit2 color="#4b5563" size={14} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 mb-4">
        <View className="flex-row bg-gray-200/50 p-1 rounded-xl">
          <TouchableOpacity onPress={() => setViewMode('activos')} className={`flex-1 py-2 items-center rounded-lg ${viewMode === 'activos' ? 'bg-white shadow-sm' : ''}`}>
            <Text className={`text-xs font-bold ${viewMode === 'activos' ? 'text-gray-800' : 'text-gray-500'}`}>Activos ({activos.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('historial')} className={`flex-1 py-2 items-center rounded-lg ${viewMode === 'historial' ? 'bg-white shadow-sm' : ''}`}>
            <Text className={`text-xs font-bold ${viewMode === 'historial' ? 'text-gray-800' : 'text-gray-500'}`}>Historial ({historial.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {loading ? <ActivityIndicator size="large" color="#90C659" className="mt-10" /> : renderProductList(viewMode === 'activos' ? activos : historial)}
      </ScrollView>

      <View className="absolute bottom-6 w-full px-6 items-center pointer-events-box-none z-20">
        <TouchableOpacity onPress={() => router.push('/addProduct')} className="bg-[#90C659] flex-row items-center justify-center gap-2 px-8 py-4 rounded-full shadow-lg shadow-[#90C659]/40 w-full">
          <Plus color="white" size={24} />
          <Text className="text-white font-bold text-lg">Publicar Excedentes</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE EDICIÓN */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="font-bold text-lg text-gray-800">{viewMode === 'historial' ? 'Reactivar Producto' : 'Editar Producto'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-1"><X color="#6b7280" size={22} /></TouchableOpacity>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="font-bold text-xs text-gray-700 mb-1">Precio original</Text>
                <TextInput value={editPrecioOriginal} onChangeText={t => setEditPrecioOriginal(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" className="bg-gray-100 rounded-xl px-3 h-12 text-sm text-gray-800" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-xs text-gray-700 mb-1">Precio oferta</Text>
                <TextInput value={editPrecioOferta} onChangeText={t => setEditPrecioOferta(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" className="bg-gray-100 rounded-xl px-3 h-12 text-sm text-gray-800" />
              </View>
            </View>

            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Text className="font-bold text-xs text-gray-700 mb-1">Nuevo Stock</Text>
                <TextInput value={editStock} onChangeText={t => setEditStock(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" className="bg-gray-100 rounded-xl px-3 h-12 text-sm text-gray-800" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[10px] text-gray-700 mb-1">Inicia (Ej. 14:00)</Text>
                <TextInput value={editHoraInicio} onChangeText={setEditHoraInicio} maxLength={5} className="bg-gray-100 rounded-xl px-3 h-12 text-sm text-gray-800" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[10px] text-gray-700 mb-1">Termina (Ej. 18:00)</Text>
                <TextInput value={editHoraFin} onChangeText={setEditHoraFin} maxLength={5} className="bg-gray-100 rounded-xl px-3 h-12 text-sm text-gray-800" />
              </View>
            </View>

            <TouchableOpacity onPress={handleSaveEdit} disabled={isSaving} className={`w-full py-4 rounded-2xl items-center flex-row justify-center gap-2 ${isSaving ? 'bg-gray-300' : 'bg-[#90C659]'}`}>
              {isSaving ? <ActivityIndicator color="white" /> : (
                <>
                  {viewMode === 'historial' && <RefreshCw color="white" size={18} />}
                  <Text className="text-white font-bold text-base">{viewMode === 'historial' ? 'Reactivar y Publicar' : 'Guardar cambios'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}