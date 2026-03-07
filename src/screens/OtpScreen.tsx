import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../theme';

type Props = {
  confirmation: any;
  phoneNumber: string;
  onBack: () => void;
};

export function OtpScreen({ confirmation, phoneNumber, onBack }: Props) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) {return;}
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Enter OTP', 'Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      await confirmation.confirm(code);
      // Auth state change is handled by AuthContext automatically
    } catch {
      Alert.alert('Wrong OTP', 'The code you entered is incorrect. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.logo}>✈️</Text>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.desc}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phone}>+91 {phoneNumber}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => { inputs.current[i] = ref; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={v => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Verify & Continue →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Change number</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 12,
  },
  desc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  phone: {
    fontWeight: '700',
    color: colors.white,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  otpBox: {
    width: 46,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  otpBoxFilled: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: colors.white,
  },
  btn: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  backBtn: {
    marginTop: 20,
    padding: 10,
  },
  backText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },
});
