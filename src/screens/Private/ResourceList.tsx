// src/screens/Private/ResourceList.tsx
import React from 'react';
import {
  SectionList,
  SectionListData,
  Text,
  View,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import rawResources from '../../data/resources.json';

type Resource = {
  id: string;
  title: string;
  category: string;
  url: string;
};

type ResourceSection = SectionListData<Resource>;

// Cast JSON → typed array
const resources = rawResources as Resource[];

// Group by `category`
const sections: ResourceSection[] = Object.entries(
  resources.reduce<Record<string,Resource[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {})
).map(([title, data]) => ({ title, data }));

export default function ResourceList() {
  return (
    <SectionList<Resource,ResourceSection>
      sections={sections}
      keyExtractor={item => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.header}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => alert(`Open this link:\n${item.url}`)}
        >
          <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding:16 },
  header: {
    fontSize:18, fontWeight:'bold',
    backgroundColor:'#f0f0f0',
    paddingVertical:4, paddingHorizontal:8,
    marginTop:16
  },
  item: { paddingVertical:8, paddingHorizontal:8 },
  title: { fontSize:16 },
  sep: { height:1, backgroundColor:'#ddd', marginVertical:4 }
});
