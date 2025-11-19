// src/screens/NewsFeed/NewsList.tsx

import { StackScreenProps } from '@react-navigation/stack';
import {
  Text,
  View
} from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';

console.log('*** in NewsList.tsx ***');

type Props = StackScreenProps<RootStackParamList, 'NewsList'>;
type Article = { title: string; publishedAt: string; url: string; urlToImage?: string };

// basic test screen begin
export default function NewsList({ navigation }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>NewsList basic test screen</Text>
    </View>
  );
}
// basic test screen end

// export default function NewsList({ navigation }: Props) {
//   const [articles,   setArticles] = useState<Article[]>([]);
//   const [primaryPin, setPrimaryPin] = useState<string | null>(null);
//   const [backupPin,  setBackupPin]  = useState<string | null>(null);
//   const [decoyYear,  setDecoyYear]  = useState<string | null>(null);
//   const [pinEntry,   setPinEntry]   = useState('');
//   const [modalVis,   setModalVis]   = useState(false);
//   const [loading,    setLoading]    = useState(true);
//   const [error,      setError]      = useState<string | null>(null);

//   useEffect(() => {
//     // 1) Load PINs
//     Promise.all([
//       SecureStore.getItemAsync('PRIMARY_PIN'),
//       SecureStore.getItemAsync('BACKUP_PIN'),
//     ]).then(([p, b]) => {
//       setPrimaryPin(p);
//       setBackupPin(b);
//     });

//     // 2) Fetch news from backend (no API key in app)
//     const BASE_URL = "https://nova-news.onrender.com"; // your FastAPI backend
//     fetch(`${BASE_URL}/api/news?country=us&pageSize=50`)
//       .then(res => res.json())
//       .then(json => {
//         if (json.status !== 'ok' && !json.articles) throw new Error(json.message || 'API Error');
//         setArticles(json.articles);
//       })
//       .catch(err => setError(err.message))
//       .finally(() => setLoading(false));
//   }, []);

//   // Loading or error states
//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }
//   if (error) {
//     return (
//       <View style={styles.loader}>
//         <Text style={{ color: 'red' }}>Error: {error}</Text>
//       </View>
//     );
//   }

//   // Decoy filter
//   const displayed = decoyYear
//     ? articles.filter(a =>
//         new Date(a.publishedAt).getFullYear().toString() === decoyYear
//       )
//     : articles;

//   // PIN modal logic
//   const tryUnlock = () => {
//     if      (pinEntry === primaryPin) { setModalVis(false); navigation.navigate('PrivateTabs'); }
//     else if (pinEntry === backupPin)  { setModalVis(false); setDecoyYear(pinEntry); }
//     else                              { alert('That year doesn’t look right.'); }
//     setPinEntry('');
//   };

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Header */}
//       <SafeAreaView style={styles.header}>
//         <Text style={styles.headerTitle}>Nova News</Text>
//         <TouchableOpacity onPress={() => navigation.navigate('PinLogin')}>
//           <Ionicons name="lock-closed" size={24} color="#333" />
//         </TouchableOpacity>
//       </SafeAreaView>

//       {/* Decoy banner */}
//       {decoyYear && (
//         <View style={styles.decoyBanner}>
//           <Text>Showing news from {decoyYear} only</Text>
//           <Button title="Clear" onPress={() => setDecoyYear(null)} />
//         </View>
//       )}

//       {/* News list */}
//       <FlatList
//         data={displayed}
//         keyExtractor={(item, idx) => item.url + idx}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.item}
//             onPress={() => navigation.navigate('WebviewScreen', { uri: item.url })}
//           >
//             <Text style={styles.title}>{item.title}</Text>
//             <Text style={styles.date}>
//               {new Date(item.publishedAt).toLocaleDateString()}
//             </Text>
//           </TouchableOpacity>
//         )}
//         ItemSeparatorComponent={() => <View style={styles.sep} />}
//         contentContainerStyle={styles.container}
//       />

//       {/* PIN Modal */}
//       <Modal visible={modalVis} transparent animationType="slide">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text>Enter your special year:</Text>
//             <TextInput
//               style={styles.input}
//               keyboardType="number-pad"
//               secureTextEntry
//               maxLength={4}
//               placeholder="YYYY"
//               value={pinEntry}
//               onChangeText={setPinEntry}
//             />
//             <Button title="Submit" onPress={tryUnlock} />
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   loader:       { flex:1, justifyContent:'center',alignItems:'center' },
//   header:       {
//     flexDirection:'row',
//     alignItems:'center',
//     paddingTop:24,
//     paddingBottom:12,
//     paddingHorizontal:16,
//     backgroundColor:'#fff'
//   },
//   headerTitle:  { flex:1, fontSize:20, fontWeight:'bold' },
//   decoyBanner:  {
//     backgroundColor:'#ffeead',
//     padding:8,
//     flexDirection:'row',
//     justifyContent:'space-between'
//   },
//   container:    { padding:16 },
//   item:         { paddingVertical:12 },
//   title:        { fontSize:16, fontWeight:'600' },
//   date:         { fontSize:12, color:'#666', marginTop:4 },
//   sep:          { height:1, backgroundColor:'#ddd', marginVertical:8 },
//   modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center',alignItems:'center' },
//   modalContent: { width:'80%', backgroundColor:'#fff', padding:24, borderRadius:8 },
//   input:        { fontSize:24, borderBottomWidth:1, marginBottom:24, textAlign:'center' },
// });
