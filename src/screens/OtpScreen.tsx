import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors } from '../theme';

const RESEND_COOLDOWN = 30; // seconds

type Props = {
  confirmation: any;
  phoneNumber: string;
  onBack: () => void;
};

export function OtpScreen({ confirmation, phoneNumber, onBack }: Props) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [currentConfirmation, setCurrentConfirmation] = useState(confirmation);
  const inputs = useRef<Array<TextInput | null>>([]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) { return; }
    const id = setInterval(() => {
      setResendTimer(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer > 0 || resending) { return; }
    setResending(true);
    try {
      const newConfirmation = await auth().signInWithPhoneNumber(`+91${phoneNumber}`);
      setCurrentConfirmation(newConfirmation);
      setResendTimer(RESEND_COOLDOWN);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

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
      await currentConfirmation.confirm(code);
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

        {/* Resend OTP */}
        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend OTP in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendBtn}>
                {resending ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
  resendRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendTimer: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  resendBtn: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
