import React from 'react';
import { ScrollView, View } from 'react-native';
import MarketAnalysisWidget from './MarketAnalysisWidget';
import { AuctionsTab } from './tabs/AuctionsTab';
import { LiveSellTab } from './tabs/LiveSellTab';
import { TendersTab } from './tabs/TendersTab';
import type { CategoryFilterState } from './types';

interface HomeTabsProps {
  refreshKey: number;
  categoryFilter: CategoryFilterState;
  searchQuery: string;
}

export const HomeTabs: React.FC<HomeTabsProps> = ({ refreshKey, categoryFilter, searchQuery }) => {
  const renderContent = () => (
    <>
      <AuctionsTab
        refreshKey={refreshKey}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
      />
      <TendersTab categoryFilter={categoryFilter} searchQuery={searchQuery} />
      <LiveSellTab categoryFilter={categoryFilter} searchQuery={searchQuery} />
      {/* <DataTab /> */}
    </>
  );

  return (
    <View>
      {/* Widget التحليل */}
      <View className="px-4 pt-1 pb-0">
        <MarketAnalysisWidget />
      </View>

      {/* عرض جميع التابات داخل ScrollView */}
      <ScrollView
        className="px-4 py-2"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

export default HomeTabs;
