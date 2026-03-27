/**
 * LandedSafelySetupScreen — Configure who gets notified when you land
 *
 * Up to 5 contacts. Each contact: name, phone (+91), channel (WA/SMS/Both).
 * Message template editable with live preview.
 * Contacts saved to Firestore.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  getContacts,
  saveContacts,
  getMessageTemplate,
  saveMessageTemplate,
  sendLandedMessages,
  LandedSafelyContact,
  DEFAULT_MESSAGE_TEMPLATE,
} from '../services/LandedSafelyService';
import { haptic } from '../services/HapticService';

const MAX_CONTACTS = 5;

const CHANNEL_OPTIONS: Array<{ key: LandedSafelyContact['channel']; label: string; emoji: string }> = [
  { key: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { key: 'sms',      label: 'SMS',      emoji: '📱' },
  { key: 'both',     label: 'Both',     emoji: '📨' },
];

function ContactRow({
  contact,
  index,
  onChange,
  onRemove,
  themeColors,
}: {
  contact: LandedSafelyContact;
  index: number;
  onChange: (index: number, c: LandedSafelyContact) => void;
  onRemove: (index: number) => void;
  themeColors: any;
}) {
  const c = themeColors;
  return (
    <View style={[styles.contactCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.contactHeader}>
        <Text style={[styles.contactNum, { color: c.primary }]}>Contact {index + 1}</Text>
        <TouchableOpacity onPress={() => onRemove(index)}>
          <Text style={[styles.removeBtn, { color: '#EF4444' }]}>✕ Remove</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
        placeholder="Full name (e.g. Mum)"
        placeholderTextColor={c.textSecondary}
        value={contact.name}
        onChangeText={v => onChange(index, { ...contact, name: v })}
      />

      <View style={styles.phoneRow}>
        <View style={[styles.phonePrefix, { backgroundColor: c.primary + '18', borderColor: c.border }]}>
          <Text style={[styles.phonePrefixText, { color: c.primary }]}>+91</Text>
        </View>
        <TextInput
          style={[styles.phoneInput, { color: c.text, borderColor: c.border, backgroundColor: c.background }]}
          placeholder="10-digit mobile"
          placeholderTextColor={c.textSecondary}
          keyboardType="number-pad"
          maxLength={10}
          value={contact.phone}
          onChangeText={v => onChange(index, { ...contact, phone: v.replace(/\D/g, '') })}
        />
      </View>

      <View style={styles.channelRow}>
        {CHANNEL_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.channelBtn,
              { borderColor: c.border, backgroundColor: c.background },
              contact.channel === opt.key && { borderColor: c.primary, backgroundColor: c.primary + '18' },
            ]}
            onPress={() => { haptic.selection(); onChange(index, { ...contact, channel: opt.key }); }}>
            <Text style={styles.channelEmoji}>{opt.emoji}</Text>
            <Text style={[styles.channelLabel, { color: contact.channel === opt.key ? c.primary : c.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function LandedSafelySetupScreen() {
  const { user, isPremiumUser } = useAuth();
  const { themeColors: c } = useSettings();

  const [contacts, setContacts]         = useState<LandedSafelyContact[]>([]);
  const [template, setTemplate]         = useState(DEFAULT_MESSAGE_TEMPLATE);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [testSending, setTestSending]   = useState(false);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    Promise.all([
      getContacts(user.uid),
      getMessageTemplate(user.uid),
    ]).then(([cts, tmpl]) => {
      setContacts(cts.length ? cts : [{ name: '', phone: '', channel: 'whatsapp' }]);
      setTemplate(tmpl);
    }).finally(() => setLoading(false));
  }, [user?.uid]);

  const addContact = () => {
    if (contacts.length >= MAX_CONTACTS) { Alert.alert('Max 5 contacts'); return; }
    setContacts(prev => [...prev, { name: '', phone: '', channel: 'whatsapp' }]);
  };

  const updateContact = (index: number, updated: LandedSafelyContact) => {
    setContacts(prev => prev.map((c, i) => (i === index ? updated : c)));
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const valid = contacts.filter(c => c.name.trim() && c.phone.trim().length === 10);
    if (valid.length === 0) {
      Alert.alert('Add at least one contact with a name and 10-digit phone number.');
      return;
    }
    if (!user?.uid) { Alert.alert('Please log in to save contacts.'); return; }
    setSaving(true);
    try {
      await saveContacts(user.uid, valid);
      await saveMessageTemplate(user.uid, template);
      Alert.alert('✅ Saved!', `${valid.length} contact${valid.length > 1 ? 's' : ''} saved. We'll notify them when you land.`);
    } catch {
      Alert.alert('Save failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    const first = contacts.find(c => c.name.trim() && c.phone.trim().length === 10);
    if (!first) { Alert.alert('Add a valid contact first.'); return; }
    setTestSending(true);
    const results = await sendLandedMessages({
      uid: user?.uid ?? null,
      isPremium: isPremiumUser,
      arrIata: 'BOM',
      senderName: 'You',
      contacts: [first],
      template,
    });
    setTestSending(false);
    const r = results[0];
    if (r?.deepLinkOpened) {
      // WhatsApp opened — user needs to tap Send
    } else if (r?.success) {
      Alert.alert('✅ Test sent!', `Message sent to ${first.name}.`);
    } else {
      Alert.alert('Test failed', 'Could not send. Check the phone number and try again.');
    }
  };

  const previewMessage = template
    .replace('{contactName}', contacts[0]?.name || 'Mum')
    .replace('{city}', 'Mumbai')
    .replace('{senderName}', 'You');

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={[styles.banner, { backgroundColor: c.primary + '15', borderColor: c.primary }]}>
          <Text style={[styles.bannerTitle, { color: c.primary }]}>🛡️ Landed Safely</Text>
          <Text style={[styles.bannerText, { color: c.text }]}>
            When your plane lands, we automatically send a WhatsApp message to your chosen contacts so they know you arrived safe.
          </Text>
          {!isPremiumUser && (
            <Text style={[styles.bannerNote, { color: c.textSecondary }]}>
              Free: Opens WhatsApp for you to tap Send · Premium: Sends automatically
            </Text>
          )}
        </View>

        {/* Contacts */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>YOUR CONTACTS</Text>
        {contacts.map((contact, i) => (
          <ContactRow
            key={i}
            contact={contact}
            index={i}
            onChange={updateContact}
            onRemove={removeContact}
            themeColors={c}
          />
        ))}
        {contacts.length < MAX_CONTACTS && (
          <TouchableOpacity
            style={[styles.addContactBtn, { borderColor: c.primary }]}
            onPress={addContact}>
            <Text style={[styles.addContactText, { color: c.primary }]}>+ Add Contact</Text>
          </TouchableOpacity>
        )}

        {/* Message template */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary, marginTop: 20 }]}>MESSAGE TEMPLATE</Text>
        <View style={[styles.templateCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <TextInput
            style={[styles.templateInput, { color: c.text }]}
            multiline
            value={template}
            onChangeText={setTemplate}
            placeholderTextColor={c.textSecondary}
          />
          <View style={[styles.templateDivider, { backgroundColor: c.border }]} />
          <Text style={[styles.templateHint, { color: c.textSecondary }]}>
            {'Use {contactName}, {city}, {senderName} as placeholders'}
          </Text>
        </View>

        {/* Preview */}
        <View style={[styles.previewCard, { backgroundColor: '#DCF8C6', borderColor: '#25D366' }]}>
          <Text style={styles.previewLabel}>💬 WhatsApp Preview</Text>
          <Text style={styles.previewText}>{previewMessage}</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.testBtn, { borderColor: c.primary }]}
          onPress={handleTestSend}
          disabled={testSending}>
          {testSending
            ? <ActivityIndicator color={c.primary} size="small" />
            : <Text style={[styles.testBtnText, { color: c.primary }]}>📤 Send Test Message</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.primary }]}
          onPress={handleSave}
          disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveBtnText}>Save Contacts</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },

  banner:      { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20 },
  bannerTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  bannerText:  { fontSize: 13, lineHeight: 20 },
  bannerNote:  { fontSize: 12, marginTop: 8, fontStyle: 'italic' },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },

  contactCard:   { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  contactNum:    { fontSize: 13, fontWeight: '700' },
  removeBtn:     { fontSize: 13, fontWeight: '600' },
  input:         { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  phoneRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  phonePrefix:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, marginRight: 8 },
  phonePrefixText: { fontSize: 14, fontWeight: '700' },
  phoneInput:    { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  channelRow:    { flexDirection: 'row', gap: 8 },
  channelBtn:    { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, gap: 2 },
  channelEmoji:  { fontSize: 16 },
  channelLabel:  { fontSize: 11, fontWeight: '600' },

  addContactBtn:  { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 4 },
  addContactText: { fontSize: 14, fontWeight: '700' },

  templateCard:    { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  templateInput:   { fontSize: 14, lineHeight: 22, minHeight: 70 },
  templateDivider: { height: 1, marginVertical: 10 },
  templateHint:    { fontSize: 11 },

  previewCard:  { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  previewLabel: { color: '#25D366', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  previewText:  { color: '#111', fontSize: 14, lineHeight: 20 },

  testBtn:     { borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  testBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn:     { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
