import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Search, Filter, Clock, CircleDollarSign, CircleAlert as AlertCircle, MessageSquare, Camera } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from '@/lib/utils';

const URGENCY_FILTERS = {
  all: 'All Quotes',
  standard: 'Standard',
  express: 'Express',
};

export default function QuotesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);

  const handleQuotePress = (quoteId: string) => {
    router.push({
      pathname: '/quotes/[id]',
      params: { id: quoteId }
    });
  };

  const handleNewQuote = () => {
    router.push('/quotes/new');
  };

  const renderQuote = ({ item: quote }) => (
    <TouchableOpacity 
      style={styles.quoteCard}
      onPress={() => handleQuotePress(quote.id)}
      activeOpacity={0.7}
    >
      <View style={styles.quoteHeader}>
        <View style={styles.quoteInfo}>
          <Text style={styles.itemName}>{quote.item_name}</Text>
          <View style={[
            styles.urgencyBadge,
            quote.urgency === 'express' ? styles.expressBadge : styles.standardBadge
          ]}>
            <Clock size={14} color={quote.urgency === 'express' ? '#dc2626' : '#0891b2'} />
            <Text style={[
              styles.urgencyText,
              quote.urgency === 'express' ? styles.expressText : styles.standardText
            ]}>
              {quote.urgency.charAt(0).toUpperCase() + quote.urgency.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>
          {formatDistanceToNow(quote.created_at)}
        </Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {quote.description}
      </Text>

      {quote.image_url && quote.image_url.length > 0 && (
        <Image
          source={{ uri: quote.image_url[0] }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.quoteFooter}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            getStatusStyle(quote.status)
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(quote.status) }
            ]}>
              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
            </Text>
          </View>
        </View>

        {quote.facility_note && (
          <View style={styles.noteContainer}>
            <MessageSquare size={14} color="#6b7280" />
            <Text style={styles.noteText}>Has processing notes</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'quoted': return '#0891b2';
      case 'accepted': return '#059669';
      case 'declined': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return styles.pendingBadge;
      case 'quoted': return styles.quotedBadge;
      case 'accepted': return styles.acceptedBadge;
      case 'declined': return styles.declinedBadge;
      default: return {};
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Custom Quotes</Text>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search quotes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Object.entries(URGENCY_FILTERS)}
          keyExtractor={([key]) => key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: [key, label] }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === key && styles.filterChipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Loading quotes...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <AlertCircle size={48} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : quotes.length === 0 ? (
        <View style={styles.centerContent}>
          <CircleDollarSign size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Custom Quotes</Text>
          <Text style={styles.emptyText}>
            Custom price quotes will appear here when customers request special care items.
          </Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          renderItem={renderQuote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity 
        style={styles.newQuoteButton}
        onPress={handleNewQuote}
        activeOpacity={0.7}
      >
        <Camera size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    marginLeft: 12,
    padding: 4,
  },
  filterList: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0891b2',
  },
  filterChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4b5563',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  quoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteInfo: {
    flex: 1,
    gap: 8,
  },
  itemName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  standardBadge: {
    backgroundColor: '#e0f2fe',
  },
  expressBadge: {
    backgroundColor: '#fee2e2',
  },
  urgencyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  standardText: {
    color: '#0891b2',
  },
  expressText: {
    color: '#dc2626',
  },
  date: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  quotedBadge: {
    backgroundColor: '#e0f2fe',
  },
  acceptedBadge: {
    backgroundColor: '#d1fae5',
  },
  declinedBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  newQuoteButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});