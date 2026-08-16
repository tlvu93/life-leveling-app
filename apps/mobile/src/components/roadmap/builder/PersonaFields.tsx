import { useState } from 'react';
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
  const stored = (key: Field['key']) => (key === 'title' ? title : (persona[key] as string));

  /**
   * Text is held locally while a field is focused and committed on blur.
   * Writing per keystroke would serialize and persist the entire roadmap state
   * on every character.
   */
  const [local, setLocal] = useState<Partial<Record<Field['key'], string>>>({});
  const valueOf = (key: Field['key']) => local[key] ?? stored(key);
  const release = (key: Field['key']) => setLocal((current) => {
    const next = { ...current };
    delete next[key];
    return next;
  });

  return (
    <View style={styles.root}>
      {fields.map((field) => (
        <View key={field.key} style={styles.field}>
          <Text style={[styles.label, { color: theme.ink }]}>{field.label}</Text>
          <TextInput
            testID={`persona-${field.key}`}
            accessibilityLabel={field.label}
            value={valueOf(field.key)}
            onChangeText={(text) => setLocal((current) => ({ ...current, [field.key]: text }))}
            onBlur={() => {
              const text = local[field.key];
              if (text !== undefined && text !== stored(field.key)) onChange({ [field.key]: text });
              release(field.key);
            }}
            placeholder={field.hint}
            placeholderTextColor={theme.inkSecondary}
            multiline={field.multiline}
            style={[
              styles.input,
              field.multiline && styles.inputMultiline,
              { color: theme.ink, borderColor: theme.panelBorder, backgroundColor: theme.panel },
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
