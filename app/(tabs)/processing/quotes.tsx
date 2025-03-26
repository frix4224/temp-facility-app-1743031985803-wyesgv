import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Platform, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Clock, CircleDollarSign, CircleAlert as AlertCircle, Send, MessageSquare } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type CustomQuote = {
  id: string;
  item_name: string;
  description: string;
  image_url: string[];
  status: 'pending' | 'quoted' | 'accepted' | 'declined';
  urgency: 'standard' | 'express';
  created_at: string;
  suggested_price?: number;
  facility_note?: string;
};

export default function CustomQuotesScreen() {
  const [quotes, setQuotes] = useState<CustomQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<CustomQuote | null>(null);
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_price_quotes')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuote = async () => {
    if (!selectedQuote || !price || isNaN(Number(price))) {
      return;
    }

    try {
      setSubmitting(true);

      const updates = {
        status: 'quoted',
        suggested_price: Number(price),
        facility_note: note.trim() || null,
      };

      const { error } = await supabase
        .from('custom_price_quotes')
        .update(updates)
        .eq('id', selectedQuote.id);

      if (error) throw error;

      // Reset form and refresh quotes
      setSelectedQuote(null);
      setPrice('');
      setNote('');
      await fetchQuotes();
    } catch (err) {
      console.error('Error submitting quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuotePress = (quote: CustomQuote) => {
    if (selectedQuote?.id === quote.id) {
      setSelectedQuote(null);
      setPrice('');
      setNote('');
    } else {
      setSelectedQuote(quote);
      setPrice('');
      setNote('');
    }
  };

  const renderQuoteItem = ({ item }: { item: CustomQuote }) => (
    <View style={[styles.quoteCard, selectedQuote?.id === item.id && styles.selectedCard]}>
      <TouchableOpacity
        style={styles.quoteHeader}
        onPress={() => handleQuotePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.quoteInfo}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={[
            styles.urgencyBadge,
            item.urgency === 'express' && styles.expressBadge,
          ]}>
            <Clock size={14} color={item.urgency === 'express' ? '#dc2626' : '#0891b2'} />
            <Text style={[
              styles.urgencyText,
              item.urgency === 'express' && styles.expressText,
            ]}>
              {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>

      <Text style={styles.description}>{item.description}</Text>

      {item.image_url && item.image_url.length > 0 && (
        <Image
          source={{ uri: item.image_url[0] }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}

      {selectedQuote?.id === item.id && (
        <View style={styles.quoteForm}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Suggested Price (€)</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <MessageSquare size={16} color="#374151" />
              <Text style={styles.inputLabel}>Processing Notes</Text>
            </View>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add special handling instructions or processing details..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!price || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitQuote}
            disabled={!price || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Send size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Send Quote to Admin</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Custom Quotes</Text>
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
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchQuotes}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : quotes.length === 0 ? (
        <View style={styles.centerContent}>
          <CircleDollarSign size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Pending Quotes</Text>
          <Text style={styles.emptyText}>
            Custom price quotes will appear here when customers request special care items.
          </Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          renderItem={renderQuoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#111827',
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
  selectedCard: {
    borderColor: '#0891b2',
    borderWidth: 2,
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
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expressBadge: {
    backgroundColor: '#fee2e2',
  },
  urgencyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
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
  quoteForm: {
    marginTop: 16,
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  inputContainer: {
    gap: 8,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#374151',
  },
  priceInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  noteInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0891b2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
});