import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft,
  Package2,
  CircleAlert as AlertCircle,
  Camera,
  Plus,
  CircleCheck as CheckCircle2,
  CircleMinus as MinusCircle,
  MessageSquare,
  CircleDollarSign,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem } from '@/hooks/useOrders';

type CheckInItem = OrderItem & {
  isChecked: boolean;
  hasIssue: boolean;
  issueNote?: string;
};

export default function OrderCheckInScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<CheckInItem[]>([]);
  const [processingNotes, setProcessingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          status,
          created_at,
          items:order_items (
            id,
            product_name,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setOrder(data);
      setItems(data.items.map(item => ({
        ...item,
        isChecked: false,
        hasIssue: false,
      })));
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleItemCheck = (itemId: string) => {
    setItems(current =>
      current.map(item =>
        item.id === itemId
          ? { ...item, isChecked: !item.isChecked }
          : item
      )
    );
  };

  const handleItemIssue = (itemId: string) => {
    setItems(current =>
      current.map(item =>
        item.id === itemId
          ? { ...item, hasIssue: !item.hasIssue }
          : item
      )
    );
  };

  const handleIssueNote = (itemId: string, note: string) => {
    setItems(current =>
      current.map(item =>
        item.id === itemId
          ? { ...item, issueNote: note }
          : item
      )
    );
  };

  const handleCustomQuote = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
      const { data, error } = await supabase
        .from('custom_price_quotes')
        .insert({
          item_name: item.product_name,
          description: item.issueNote || 'Special handling required',
          status: 'pending',
          urgency: 'standard',
        })
        .select()
        .single();

      if (error) throw error;

      router.push({
        pathname: '/quotes/[id]',
        params: { id: data.id }
      });
    } catch (err) {
      console.error('Error creating quote:', err);
      // Show error in UI
    }
  };

  const handleStartProcessing = async () => {
    try {
      setSubmitting(true);

      // Create status log
      await supabase
        .from('order_status_logs')
        .insert({
          order_id: id,
          status: 'processing',
          notes: processingNotes || 'Items checked in and processing started',
        });

      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          special_instructions: processingNotes || null
        })
        .eq('id', id);

      // Create issues if any
      const itemsWithIssues = items.filter(item => item.hasIssue && item.issueNote);
      if (itemsWithIssues.length > 0) {
        await supabase
          .from('order_issues')
          .insert(
            itemsWithIssues.map(item => ({
              order_id: id,
              issue_type: 'other',
              description: item.issueNote,
            }))
          );
      }

      router.push('/(tabs)/processing');
    } catch (err) {
      console.error('Error starting processing:', err);
      setError(err instanceof Error ? err.message : 'Failed to start processing');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#dc2626" />
        <Text style={styles.errorText}>{error || 'Order not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allItemsChecked = items.every(item => item.isChecked);
  const hasIssues = items.some(item => item.hasIssue);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Check-In Items</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.orderInfo}>
          <View style={styles.orderHeader}>
            <Package2 size={24} color="#0891b2" />
            <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          </View>
          <Text style={styles.customerName}>{order.customer_name}</Text>
        </View>

        <View style={styles.itemsList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    item.isChecked && styles.checkButtonActive
                  ]}
                  onPress={() => handleItemCheck(item.id)}
                >
                  <CheckCircle2 
                    size={24} 
                    color={item.isChecked ? '#059669' : '#9ca3af'}
                  />
                </TouchableOpacity>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.issueButton,
                    item.hasIssue && styles.issueButtonActive
                  ]}
                  onPress={() => handleItemIssue(item.id)}
                >
                  <AlertCircle 
                    size={24} 
                    color={item.hasIssue ? '#dc2626' : '#9ca3af'} 
                  />
                </TouchableOpacity>
              </View>

              {item.hasIssue && (
                <View style={styles.issueSection}>
                  <TextInput
                    style={styles.issueInput}
                    placeholder="Describe the issue..."
                    value={item.issueNote}
                    onChangeText={(text) => handleIssueNote(item.id, text)}
                    multiline
                    numberOfLines={2}
                    placeholderTextColor="#9ca3af"
                  />
                  
                  <TouchableOpacity
                    style={styles.quoteButton}
                    onPress={() => handleCustomQuote(item.id)}
                  >
                    <CircleDollarSign size={20} color="#0891b2" />
                    <Text style={styles.quoteButtonText}>Request Quote</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.notesSection}>
          <View style={styles.noteHeader}>
            <MessageSquare size={20} color="#374151" />
            <Text style={styles.noteTitle}>Processing Notes</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Add special handling instructions or processing details..."
            value={processingNotes}
            onChangeText={setProcessingNotes}
            multiline
            numberOfLines={4}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (!allItemsChecked || submitting) && styles.startButtonDisabled
          ]}
          onPress={handleStartProcessing}
          disabled={!allItemsChecked || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Package2 size={20} color="#ffffff" />
              <Text style={styles.startButtonText}>
                Start Processing
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
  },
  orderInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  orderNumber: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#111827',
  },
  customerName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  itemsList: {
    padding: 16,
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
    }),
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  checkButtonActive: {
    backgroundColor: '#d1fae5',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  itemQuantity: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  issueButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  issueButtonActive: {
    backgroundColor: '#fee2e2',
  },
  issueSection: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  issueInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
  },
  quoteButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#0891b2',
  },
  notesSection: {
    padding: 16,
    gap: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#374151',
  },
  notesInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
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
    }),
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  startButton: {
    backgroundColor: '#0891b2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});