import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import {
  Bike,
  CheckCircle2,
  Clock,
  Home,
  Leaf,
  Package,
  Store,
  Tag,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase';

const  COLORS = {
  bg: '#F5F7F1',
  surface: '#FFFFFF',
  border: '#ECEFE7',
  ink: '#1E2A1A',
  inkMuted: '#6F7A68',
  primary: '#90C659',     
  primaryDeep: '#3F6B2B', 
  amber: '#A86B2B',
  amberBg: '#F5EBDD',
};

type ModalityKey = 'tienda' | 'delivery' | 'comer';

const MODALITY_LABEL: Record<ModalityKey, string> = {
  tienda: 'Recojo en tienda',
  delivery: 'Delivery',
  comer: 'Comer allí',
};

const MODALITY_ICON: Record<ModalityKey, React.ComponentType<any>> = {
  tienda: Store,
  delivery: Bike,
  comer: UtensilsCrossed,
};

function Row({
  icon: Icon,
  label,
  children,
  isLast,
}: {
  icon: React.ComponentType<any>;
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-3 ${
        isLast ? '' : 'border-b border-[#F0F2EB]'
      }`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: '#EAF1E1' }}
        >
          <Icon color={COLORS.primaryDeep} size={16} strokeWidth={2.2} />
        </View>
        <Text className="font-medium" style={{ color: COLORS.inkMuted }}>
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function RescueSuccessScreen() {
  const router = useRouter();

  const { orderId, modality, finalTotal } = useLocalSearchParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (typeof orderId === 'string') {
        try {
          const orderRef = doc(db, 'pedidos', orderId);
          const orderSnap = await getDoc(orderRef);

          if (orderSnap.exists()) {
            const restId = orderSnap.data().restauranteId;
            let restName = 'Restaurante';
            if (restId) {
              const restSnap = await getDoc(doc(db, 'restaurantes', restId));
              if (restSnap.exists()) restName = restSnap.data().nombre;
            }

            setOrderData({
              ...orderSnap.data(),
              restaurantName: restName,
            });
          }
        } catch (error) {
          console.error('Error al buscar el pedido:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primaryDeep} />
        <Text className="mt-4 font-medium" style={{ color: COLORS.inkMuted }}>
          Generando tu código de retiro...
        </Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: COLORS.bg }}>
        <Text className="font-semibold text-xl text-center" style={{ color: COLORS.ink }}>
          No se pudo cargar la información del pedido.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/menuUser')}
          className="mt-6 px-6 py-3 rounded-xl"
          style={{ backgroundColor: COLORS.primaryDeep }}
        >
          <Text className="text-white font-semibold">Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalItems =
    orderData.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  const co2Saved = (totalItems * 1.25).toFixed(1);
  const displayModality: ModalityKey =
    (typeof modality === 'string' ? modality : orderData.modalidad) || 'tienda';
  const displayTotal =
    typeof finalTotal === 'string' ? parseFloat(finalTotal) : orderData.totalPagado;

  const originalSubtotal =
    orderData.items?.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    ) || 0;
  const ecoDiscount = originalSubtotal - displayTotal;

  const ModalityIcon = MODALITY_ICON[displayModality] || Store;
  const orderIdValue = typeof orderId === 'string' ? orderId : Array.isArray(orderId) ? orderId[0] : '';

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View className="items-center pt-16 pb-6 px-6">
        <View className="relative items-center justify-center">
          <View
            className="absolute w-20 h-20 rounded-full"
            style={{ backgroundColor: '#E1EDD3' }}
          />
          <CheckCircle2 color={COLORS.primaryDeep} size={64} strokeWidth={2} />
        </View>
        <Text className="font-bold text-2xl mt-4" style={{ color: COLORS.ink }}>
          Pedido confirmado
        </Text>
        <Text className="mt-1 text-center" style={{ color: COLORS.inkMuted }}>
          Tu rescate ayudó a evitar desperdicio de comida
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Resumen del pedido */}
        <View
          className="rounded-2xl p-5 mb-4 border"
          style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
        >
          <Text className="font-semibold text-base mb-1" style={{ color: COLORS.ink }}>
            Resumen del pedido
          </Text>

          <View>
            <Row icon={Store} label="Local">
              <Text className="font-semibold" style={{ color: COLORS.ink }}>
                {orderData.restaurantName}
              </Text>
            </Row>

            <Row icon={Package} label="Platos">
              <Text className="font-semibold" style={{ color: COLORS.ink }}>
                {totalItems} {totalItems === 1 ? 'plato' : 'platos'}
              </Text>
            </Row>

            <Row icon={ModalityIcon} label="Modalidad">
              <Text className="font-semibold" style={{ color: COLORS.ink }}>
                {MODALITY_LABEL[displayModality] || 'Tienda'}
              </Text>
            </Row>

            {ecoDiscount > 0.01 && (
              <Row icon={Tag} label="Descuento por envase">
                <Text className="font-semibold" style={{ color: COLORS.primaryDeep }}>
                  -S/ {ecoDiscount.toFixed(2)}
                </Text>
              </Row>
            )}

            <Row icon={Wallet} label="Total pagado" isLast>
              <Text className="font-bold text-xl" style={{ color: COLORS.primaryDeep }}>
                S/ {displayTotal.toFixed(2)}
              </Text>
            </Row>
          </View>

          {/* Impacto ambiental */}
          <View
            className="rounded-xl px-4 py-3.5 flex-row items-center gap-3 mt-4"
            style={{ backgroundColor: COLORS.primaryDeep }}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Leaf color="white" size={18} strokeWidth={2.2} />
            </View>
            <View>
              <Text className="font-semibold text-sm text-white">Impacto ambiental</Text>
              <Text className="text-sm text-white">{co2Saved} kg de CO₂ evitado</Text>
            </View>
          </View>
        </View>

        {/* Código de retiro */}
        <View
          className="rounded-2xl p-5 items-center border"
          style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
        >
          <Text className="font-semibold text-base mb-4 self-start" style={{ color: COLORS.ink }}>
            Código de retiro
          </Text>

          <View
            className="w-52 h-52 rounded-2xl items-center justify-center p-4 mb-4 relative border-2"
            style={{ borderColor: COLORS.primary, backgroundColor: COLORS.surface }}
          >
            <View className="w-full h-full flex-row flex-wrap justify-between content-between">
              {Array.from({ length: 64 }).map((_, i) => {
                const isBlack =
                  (orderIdValue.charCodeAt(i % (orderIdValue.length || 1)) || 0) % 2 === 0;
                return (
                  <View
                    key={i}
                    className="w-[11%] h-[11%] rounded-sm m-[0.5%]"
                    style={{ backgroundColor: isBlack ? COLORS.ink : COLORS.surface }}
                  />
                );
              })}
            </View>
            <View className="absolute items-center justify-center w-full h-full">
              <View
                className="w-12 h-12 rounded-lg items-center justify-center"
                style={{ backgroundColor: COLORS.primaryDeep }}
              >
                <CheckCircle2 color="white" size={22} strokeWidth={2.4} />
              </View>
            </View>
          </View>

          <View className="items-center w-full gap-2">
            <View
              className="px-4 py-2.5 rounded-xl border w-full items-center"
              style={{ backgroundColor: '#FAFBF8', borderColor: COLORS.border }}
            >
              <Text
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: COLORS.ink }}
              >
                ID: ECO-{orderIdValue ? orderIdValue.substring(0, 5) : '12345'}
              </Text>
            </View>

            <View
              className="py-2 px-4 rounded-lg w-full flex-row items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.amberBg }}
            >
              <Clock color={COLORS.amber} size={14} strokeWidth={2.4} />
              <Text className="text-sm font-semibold" style={{ color: COLORS.amber }}>
                Válido hasta:{' '}
                {orderData.horario === 'Lo antes posible' ? 'hoy' : orderData.horario}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/menuUser')}
          className="w-full py-4 rounded-xl items-center justify-center mt-6 mb-4 flex-row gap-2"
          style={{ backgroundColor: COLORS.primaryDeep }}
        >
          <Home color="white" size={18} strokeWidth={2.2} />
          <Text className="text-white font-semibold text-base">Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
