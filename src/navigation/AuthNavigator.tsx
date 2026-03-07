import React, { useState } from 'react';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpScreen } from '../screens/OtpScreen';

export function AuthNavigator() {
  const [confirmation, setConfirmation] = useState<any>(null);
  const [phone, setPhone] = useState('');

  if (confirmation) {
    return (
      <OtpScreen
        confirmation={confirmation}
        phoneNumber={phone}
        onBack={() => setConfirmation(null)}
      />
    );
  }

  return (
    <LoginScreen
      onOtpSent={(conf, phoneNum?: string) => {
        setPhone(phoneNum || '');
        setConfirmation(conf);
      }}
    />
  );
}
