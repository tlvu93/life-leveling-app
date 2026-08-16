import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { GuidePersona } from '@/domain/roadmap/catalog';
import { useLifeTheme } from '@/state/theme-context';

type Field = { key: keyof GuidePersona | 'title'; label: string; hint: string; multiline?: boolean };

const fields: Field[] = [
  { key: 'title', label: 'Name this route', hint: 'Club-first with borrowed gear' },
  { key: 'audience', label: 'Who is it for?', hint: 'Adults near a city with open-decks nights, on a limited budget', multiline: true },
  { key: 'startingPoint', label: 'What are they starting with?', hint: 'A laptop and headphones; no music training assumed', multiline: true },
  { key: 'outcome', label: 'Where does it get them?', hint: 'A ten-minute set on club gear at an open-decks night', multiline: true },
];

export function PersonaFields({
  title, persona, onChange,
}: {
  title: string;
  persona: GuidePersona;
  onChange: (patch: { title?: string } & Partial<GuidePersona>) => void;
}) {
  const { theme } = useLifeTheme();
  const valueOf = (key: Field['key']) => (key === 'title' ? title : (persona[key] as string));

  return (
    <View style={styles.root}>
      {fields.map((field) => (
        <View key={field.key} style={styles.field}>
          <Text style={[styles.label, { color: theme.ink }]}>{field.label}</Text>
          <TextInput
            testID={`persona-${field.key}`}
            accessibilityLabel={field.label}
            value={valueOf(field.key)}
            onChangeText={(text) => onChange({ [field.key]: text })}
            placeholder={field.hint}
            placeholderTextColor={theme.inkSecondary}
            multiline={field.multiline}
            style={[
              styles.input,
              field.multiline && styles.inputMultiline,
              { color: theme.ink, borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
});
