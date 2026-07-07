import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { RestaurantMenuItem } from './RestaurantMenuItemCard';

interface RestaurantMenuSectionProps {
  title: string;
  icon: ReactNode;
  items: RestaurantMenuItem[];
  isSurprisePack: boolean;
  renderItem: (item: RestaurantMenuItem, isSurprisePack: boolean) => ReactNode;
}

export const RestaurantMenuSection = ({
  title,
  icon,
  items,
  isSurprisePack,
  renderItem,
}: RestaurantMenuSectionProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <View className={isSurprisePack ? 'mb-2' : 'mt-4 mb-2'}>
      <View className="flex-row items-center gap-2 mb-4">
        {icon}
        <Text className="font-bold text-lg text-gray-800">{title}</Text>
      </View>
      {items.map((item) => renderItem(item, isSurprisePack))}
    </View>
  );
};