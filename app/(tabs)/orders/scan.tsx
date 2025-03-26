import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, QrCode, CircleAlert as AlertCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Camera from 'expo-camera';
import { supabase } from '@/lib/supabase';

type ScannedOrder = {
  order_number: string;
  customer_name: string;
  items: Array<{ name: string; quantity: number }>;
};

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleClose = () => {
    // Use a direct route instead of back() to ensure reliable navigation
    router.push('/(tabs)/orders');
  };

  // For web platform, show a message that scanning is only available in mobile app
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>QR Code Scanner</Text>
        </View>
        <View style={styles.webContent}>
          <QrCode size={64} color="#6b7280" />
          <Text style={styles.webMessage}>
            QR code scanning is only available in the mobile app. Please use your mobile device to scan order QR codes.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>Return to Orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state while permissions are being checked
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.message}>Checking camera permissions...</Text>
        </View>
      </View>
    );
  }

  // Show permission request if not granted
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <QrCode size={64} color="#6b7280" />
          <Text style={styles.title}>Camera Access Required</Text>
          <Text style={styles.message}>
            We need access to your camera to scan QR codes. Please grant camera permission in your device settings.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>Return to Orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);
    try {
      // Try to parse the QR code data
      let orderData: ScannedOrder;
      try {
        orderData = JSON.parse(data);
      } catch {
        throw new Error('Invalid QR code format');
      }

      // Validate the required fields
      if (!orderData.order_number || !orderData.customer_name || !Array.isArray(orderData.items)) {
        throw new Error('Invalid order data: missing required fields');
      }

      // Look up the order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, qr_code')
        .eq('order_number', orderData.order_number)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      // Verify QR code matches stored data
      if (order.qr_code !== data) {
        throw new Error('Invalid QR code for this order');
      }

      // Check if order is in a valid state for scanning
      if (order.status !== 'pending') {
        throw new Error(`Order cannot be scanned: status is ${order.status}`);
      }

      // Update order status to processing
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', order.id);

      if (updateError) {
        throw new Error('Failed to update order status');
      }

      // Navigate to order details using a direct route
      router.push({
        pathname: '/(tabs)/orders/[id]',
        params: { id: order.id }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process QR code');
      setTimeout(() => {
        setError(null);
        setScanned(false);
      }, 3000);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <TouchableOpacity style={styles.backButton} onPress={handleClose}>
        <ArrowLeft size={24} color="#ffffff" />
      </TouchableOpacity>

      <Camera.CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barCodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : processing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.processingText}>Processing order...</Text>
          </View>
        ) : (
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Position the QR code within the frame to scan
            </Text>
          </View>
        )}
      </View>

      {scanned && !error && !processing && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#111827',
  },
  webContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 400,
    marginTop: 16,
    marginBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: '#0891b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rescanButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  instructions: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  instructionsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 24,
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 8,
    maxWidth: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  processingContainer: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#ffffff',
  },
});