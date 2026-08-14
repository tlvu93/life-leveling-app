import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ArrowRight, Check, Clock3, ExternalLink, File, FileText, Image as ImageIcon, Lock, Paperclip, Play, Sparkles, Trash2, Video, Zap } from 'lucide-react-native';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { ScreenScaffold } from '@/components/ScreenScaffold';
import { canResolveQuest } from '@/domain/journey';
import { getPathExperience } from '@/domain/path-experiences';
import { deleteEvidenceArtifact, persistEvidenceAsset, type EvidenceAssetInput } from '@/lib/evidence-storage';
import { type EvidenceKind, type QuestArtifact, type QuestOutcome, type QuestPull, useJourney } from '@/state/journey-context';
import { useLifeTheme } from '@/state/theme-context';

const stages = [
  { time: '10 min', title: 'Set up', detail: 'Open a familiar track and a free visual tool.' },
  { time: '35 min', title: 'Experiment', detail: 'Map at least two visible changes to rhythm or song sections.' },
  { time: '5 min', title: 'Capture', detail: 'Save a screenshot, short clip, link, or private note.' },
  { time: '10 min', title: 'Reflect', detail: 'Notice fit, friction, and what you want to try next.' },
];

const evidenceOptions: { id: EvidenceKind; label: string; icon: typeof FileText }[] = [
  { id: 'note', label: 'Private note', icon: FileText },
  { id: 'link', label: 'Paste a link', icon: ExternalLink },
];

const pullOptions: { id: QuestPull; label: string }[] = [
  { id: 'music-selection', label: 'Music selection' },
  { id: 'live-control', label: 'Live control' },
  { id: 'visual-design', label: 'Visual design' },
  { id: 'system-building', label: 'System building' },
  { id: 'none', label: 'None of these' },
];

function formatFileSize(size: number | null) {
  if (!size) return 'Size unavailable';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fallbackMediaName(asset: ImagePicker.ImagePickerAsset) {
  const extension = asset.type === 'video' ? 'mp4' : 'jpg';
  return `quest-${asset.type === 'video' ? 'video' : 'image'}.${extension}`;
}

export default function QuestScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { theme } = useLifeTheme();
  const { hydrated, state, updateQuest, resolveQuest } = useJourney();
  const router = useRouter();
  const { quest } = state;
  const [evidenceBusy, setEvidenceBusy] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<QuestOutcome | null>(null);
  const checkedPendingMedia = useRef(false);

  const attachEvidence = useCallback(async (input: EvidenceAssetInput) => {
    setEvidenceBusy(true);
    setEvidenceError(null);
    try {
      const previous = quest.artifact;
      const artifact = await persistEvidenceAsset(input);
      updateQuest({ artifact });
      if (previous) await deleteEvidenceArtifact(previous).catch(() => undefined);
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : 'The evidence could not be saved.');
    } finally {
      setEvidenceBusy(false);
    }
  }, [quest.artifact, updateQuest]);

  const attachMediaResult = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    await attachEvidence({
      kind: asset.type === 'video' ? 'video' : 'image',
      mimeType: asset.mimeType ?? null,
      name: asset.fileName ?? fallbackMediaName(asset),
      size: asset.fileSize ?? null,
      sourceUri: asset.uri,
      webFile: asset.file ?? null,
    });
  }, [attachEvidence]);

  useEffect(() => {
    if (Platform.OS !== 'android' || checkedPendingMedia.current || quest.status === 'completed' || quest.status === 'stopped') return;
    checkedPendingMedia.current = true;
    void ImagePicker.getPendingResultAsync().then((result) => {
      if (result && 'assets' in result && !result.canceled && result.assets[0]) void attachMediaResult(result.assets[0]);
    });
  }, [attachMediaResult, quest.status]);

  if (!hydrated) return <View style={[styles.loading, { backgroundColor: theme.surfaceStrong }]}><ActivityIndicator color={theme.green} /></View>;
  if (!state.profile.completed) return <Redirect href="/onboarding" />;
  if (!state.selectedPathId) return <Redirect href="/discover" />;

  const experience = getPathExperience(state.selectedPathId);
  const questContent = experience.quest;
  const stagesForPath = state.selectedPathId === 'live-av' ? stages : questContent.stages;
  const pullOptionsForPath = state.selectedPathId === 'live-av' ? pullOptions : questContent.pulls;
  const completed = quest.status === 'completed';
  const stopped = quest.status === 'stopped';
  const done = completed || stopped;
  const ready = canResolveQuest(quest);

  const pickMedia = async () => {
    setEvidenceError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ['images', 'videos'],
        quality: 1,
        videoMaxDuration: 90,
      });
      if (!result.canceled && result.assets[0]) await attachMediaResult(result.assets[0]);
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : 'The photo or video picker could not be opened.');
    }
  };

  const pickFile = async () => {
    setEvidenceError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ base64: false, copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      await attachEvidence({
        kind: 'file',
        mimeType: asset.mimeType ?? null,
        name: asset.name,
        size: asset.size ?? null,
        sourceUri: asset.uri,
        webFile: asset.file ?? null,
      });
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : 'The file picker could not be opened.');
    }
  };

  const removeArtifact = async () => {
    if (!quest.artifact) return;
    setEvidenceBusy(true);
    setEvidenceError(null);
    try {
      await deleteEvidenceArtifact(quest.artifact);
      updateQuest({ artifact: null });
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : 'The evidence could not be removed.');
    } finally {
      setEvidenceBusy(false);
    }
  };

  const requestResolution = (outcome: QuestOutcome) => {
    if (done) {
      router.replace('/');
      return;
    }
    if (!ready) return;
    setPendingOutcome(outcome);
  };

  const confirmResolution = () => {
    if (!pendingOutcome || !resolveQuest(pendingOutcome)) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(
      pendingOutcome === 'completed' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
    setPendingOutcome(null);
    router.replace({ pathname: '/', params: { reveal: '1' } });
  };

  return (
    <ScreenScaffold>
      <View style={[styles.hero, compact && styles.heroCompact, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
        <View style={[styles.questMark, { backgroundColor: completed ? theme.success : stopped ? theme.amber : theme.coral }]}>{done ? <Check color="#FFFFFF" size={25} /> : <Zap color="#FFFFFF" size={24} />}</View>
        <View style={styles.heroCopy}>
          <Text style={[styles.eyebrow, { color: completed ? theme.success : stopped ? theme.amber : theme.coral }]}>{completed ? 'QUEST COMPLETED · REFLECTION SAVED' : stopped ? 'QUEST ATTEMPTED · REDIRECT SAVED' : 'ACTIVE PATH / FIRST QUEST'}</Text>
          <Text style={[styles.title, compact && styles.titleCompact, { color: theme.ink }]}>{questContent.title}</Text>
          <Text style={[styles.subtitle, { color: theme.inkSecondary }]}>{questContent.detail}</Text>
        </View>
        <View style={styles.timeBlock}>
          <Clock3 color={theme.green} size={19} />
          <Text style={[styles.timeValue, { color: theme.ink }]}>{stagesForPath.reduce((total, stage) => total + Number.parseInt(stage.time, 10), 0)}</Text>
          <Text style={[styles.timeLabel, { color: theme.inkSecondary }]}>MIN EST.</Text>
        </View>
      </View>

      <View style={[styles.finishCondition, { borderColor: theme.green, backgroundColor: `${theme.green}0D` }]}>
        <Play color={theme.green} size={18} />
        <View style={styles.finishCopy}>
          <Text style={[styles.finishLabel, { color: theme.green }]}>FINISH CONDITION</Text>
          <Text style={[styles.finishText, { color: theme.ink }]}>{questContent.finishCondition}</Text>
        </View>
      </View>

      <SectionHeading index="01" title="Take it into the real world" subtitle="This sequence is a guide, not an in-app checklist. Leave the app open or come back when you have something to record." />
      <View style={[styles.stageGrid, compact && styles.stageGridCompact]}>
        {stagesForPath.map((stage, index) => (
          <View key={stage.title} style={[styles.stage, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
            <View style={styles.stageTopline}>
              <Text style={[styles.stageIndex, { color: theme.green }]}>0{index + 1}</Text>
              <Text style={[styles.stageTime, { color: theme.inkSecondary }]}>{stage.time}</Text>
            </View>
            <Text style={[styles.stageTitle, { color: theme.ink }]}>{stage.title}</Text>
            <Text style={[styles.stageDetail, { color: theme.inkSecondary }]}>{stage.detail}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.toolNote, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}>
        <Sparkles color={theme.amber} size={18} />
        <View>
          <Text style={[styles.toolLabel, { color: theme.amber }]}>{questContent.toolLabel}</Text>
          <Text style={[styles.toolText, { color: theme.inkSecondary }]}>{questContent.toolNote}</Text>
        </View>
      </View>

      <SectionHeading index="02" title="Add private evidence" subtitle="Optional: a short note or local artifact can anchor the memory. Nothing is published or sent to a researcher." />
      <View style={[styles.formCard, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <View style={styles.privacyRow}><Lock color={theme.green} size={14} /><Text style={[styles.privacyText, { color: theme.green }]}>PRIVATE · SAVED ONLY ON THIS DEVICE</Text></View>

        <View style={[styles.pickerRow, compact && styles.pickerRowCompact]}>
          <Pressable
            accessibilityRole="button"
            disabled={done || evidenceBusy}
            onPress={() => void pickMedia()}
            style={({ pressed }) => [styles.pickerButton, { borderColor: theme.green, backgroundColor: `${theme.green}0D` }, pressed && !done && styles.pressed]}>
            {evidenceBusy ? <ActivityIndicator color={theme.green} size="small" /> : <ImageIcon color={theme.green} size={18} />}
            <View style={styles.pickerCopy}>
              <Text style={[styles.pickerLabel, { color: theme.ink }]}>{quest.artifact?.kind === 'image' || quest.artifact?.kind === 'video' ? 'Replace photo or video' : 'Add photo or video'}</Text>
              <Text style={[styles.pickerHint, { color: theme.inkSecondary }]}>Choose an image or a short clip</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={done || evidenceBusy}
            onPress={() => void pickFile()}
            style={({ pressed }) => [styles.pickerButton, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }, pressed && !done && styles.pressed]}>
            <Paperclip color={theme.inkSecondary} size={18} />
            <View style={styles.pickerCopy}>
              <Text style={[styles.pickerLabel, { color: theme.ink }]}>{quest.artifact?.kind === 'file' ? 'Replace file' : 'Choose a file'}</Text>
              <Text style={[styles.pickerHint, { color: theme.inkSecondary }]}>Any locally available file</Text>
            </View>
          </Pressable>
        </View>

        {quest.artifact && <ArtifactCard artifact={quest.artifact} disabled={done || evidenceBusy} onRemove={() => void removeArtifact()} />}
        {evidenceError && <Text accessibilityRole="alert" style={[styles.evidenceError, { color: theme.coral }]}>{evidenceError}</Text>}

        <View style={[styles.evidenceDivider, { backgroundColor: theme.borderSoft }]} />
        <Text style={[styles.fieldLabel, { color: theme.ink }]}>Add context or use a note as evidence</Text>
        <View accessibilityRole="radiogroup" style={styles.evidenceOptions}>
          {evidenceOptions.map(({ id, label, icon: Icon }) => {
            const selected = quest.evidenceKind === id;
            return (
              <Pressable
                key={id}
                aria-checked={selected}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                disabled={done}
                onPress={() => updateQuest({ evidenceKind: id })}
                style={({ pressed }) => [styles.evidenceOption, { borderColor: selected ? theme.green : theme.borderSoft, backgroundColor: selected ? `${theme.green}10` : theme.surfaceMuted }, pressed && !done && styles.pressed]}>
                <Icon color={selected ? theme.green : theme.inkSecondary} size={17} />
                <Text style={[styles.evidenceOptionText, { color: theme.ink }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          accessibilityLabel="Quest evidence"
          editable={!done}
          multiline
          onChangeText={(evidence) => updateQuest({ evidence })}
          placeholder={quest.evidenceKind === 'link' ? 'Paste a private or public URL…' : quest.artifact ? 'Optional: what should you remember about this evidence?' : 'What did you make or observe? A sentence is enough…'}
          placeholderTextColor={theme.inkSecondary}
          style={[styles.input, styles.evidenceInput, { borderColor: theme.borderSoft, color: theme.ink, backgroundColor: theme.surfaceMuted }]}
          value={quest.evidence}
        />
      </View>

      <SectionHeading index="03" title="Reflect on fit" subtitle="Difficulty is not failure, and enjoyment is not a grade. These signals decide which territory appears next." />
      <View style={[styles.formCard, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <Text style={[styles.fieldLabel, { color: theme.ink }]}>Private reflection</Text>
        <TextInput
          accessibilityLabel="Private reflection"
          editable={!done}
          multiline
          onChangeText={(reflection) => updateQuest({ reflection })}
          placeholder="What surprised you, energized you, or got in the way?"
          placeholderTextColor={theme.inkSecondary}
          style={[styles.input, styles.reflectionInput, { borderColor: theme.borderSoft, color: theme.ink, backgroundColor: theme.surfaceMuted }]}
          value={quest.reflection}
        />

        <View style={[styles.ratingGrid, compact && styles.ratingGridCompact]}>
          <Rating label="DIFFICULTY" low="Light" high="Hard" value={quest.difficulty} disabled={done} onChange={(difficulty) => updateQuest({ difficulty })} />
          <Rating label="ENJOYMENT" low="Low" high="High" value={quest.enjoyment} disabled={done} onChange={(enjoyment) => updateQuest({ enjoyment })} />
        </View>

        <Text style={[styles.fieldLabel, styles.pullLabel, { color: theme.ink }]}>Which part pulled you in, if any?</Text>
        <View accessibilityRole="radiogroup" style={styles.pullOptions}>
          {pullOptionsForPath.map((option) => {
            const selected = quest.pulledIn === option.id;
            return (
              <Pressable
                key={option.id}
                aria-checked={selected}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                disabled={done}
                onPress={() => updateQuest({ pulledIn: option.id })}
                style={({ pressed }) => [styles.pullOption, { borderColor: selected ? theme.violet : theme.borderSoft, backgroundColor: selected ? `${theme.violet}10` : theme.surfaceMuted }, pressed && !done && styles.pressed]}>
                <Text style={[styles.pullText, { color: theme.ink }]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.actionBar, compact && styles.actionBarCompact, { borderColor: theme.borderSoft, backgroundColor: theme.surface }]}>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionLabel, { color: stopped ? theme.amber : done || ready ? theme.green : theme.inkSecondary }]}>{completed ? 'QUEST COMPLETED' : stopped ? 'QUEST ATTEMPTED · NOT COMPLETED' : ready ? 'REFLECTION READY · SAVES LOCALLY' : 'ADD REFLECTION + BOTH RATINGS + A PULL'}</Text>
          <Text style={[styles.actionText, { color: theme.ink }]}>{done ? 'Your recorded outcome changed the Atlas and refined your next recommendation.' : 'Stopping after a real attempt still improves the Atlas; it records learning without awarding completion.'}</Text>
        </View>
        {done ? (
          <Pressable accessibilityRole="button" onPress={() => requestResolution(quest.outcome ?? 'completed')} style={({ pressed }) => [styles.primaryButton, { backgroundColor: completed ? theme.green : theme.amber }, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>VIEW ATLAS GROWTH</Text>
            <ArrowRight color="#FFFFFF" size={17} />
          </Pressable>
        ) : (
          <View style={[styles.outcomeActions, compact && styles.outcomeActionsCompact]}>
            <Pressable
              accessibilityRole="button"
              disabled={!ready}
              onPress={() => requestResolution('completed')}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: ready ? theme.green : theme.border }, pressed && ready && styles.pressed]}>
              <Text style={styles.primaryText}>COMPLETE QUEST</Text>
              <ArrowRight color="#FFFFFF" size={17} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!ready}
              onPress={() => requestResolution('stopped')}
              style={({ pressed }) => [styles.stopButton, { borderColor: ready ? theme.coral : theme.border }, pressed && ready && styles.pressed]}>
              <Text style={[styles.stopText, { color: ready ? theme.coral : theme.inkSecondary }]}>I TRIED IT — NOT FOR ME</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Modal animationType={Platform.OS === 'web' ? 'none' : 'fade'} onRequestClose={() => setPendingOutcome(null)} transparent visible={pendingOutcome !== null}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Cancel Quest resolution" onPress={() => setPendingOutcome(null)} style={StyleSheet.absoluteFill} />
          <View accessibilityRole="alert" testID="quest-resolution-dialog" style={[styles.resolutionDialog, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceStrong }]}>
            <Text style={[styles.resolutionEyebrow, { color: pendingOutcome === 'stopped' ? theme.coral : theme.green }]}>{pendingOutcome === 'stopped' ? 'RECORD AN ATTEMPT' : 'RECORD COMPLETION'}</Text>
            <Text style={[styles.resolutionTitle, { color: theme.ink }]}>{pendingOutcome === 'stopped' ? 'Stop this Quest after your attempt?' : 'Complete this Quest?'}</Text>
            <Text style={[styles.resolutionText, { color: theme.inkSecondary }]}>{pendingOutcome === 'stopped'
              ? 'The Quest will be marked attempted, not completed. Your reflection will redirect the Atlas toward an adjacent experiment.'
              : 'The Quest will be marked completed. Your reflection will deepen or advance the route.'}</Text>
            <View style={styles.resolutionActions}>
              <Pressable accessibilityRole="button" onPress={() => setPendingOutcome(null)} style={({ pressed }) => [styles.cancelButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}>
                <Text style={[styles.cancelText, { color: theme.ink }]}>GO BACK</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={confirmResolution} style={({ pressed }) => [styles.confirmButton, { backgroundColor: pendingOutcome === 'stopped' ? theme.coral : theme.green }, pressed && styles.pressed]}>
                <Text style={styles.confirmText}>{pendingOutcome === 'stopped' ? 'RECORD AS ATTEMPTED' : 'CONFIRM COMPLETION'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenScaffold>
  );

  function SectionHeading({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
    return <View style={styles.sectionHeading}><Text style={[styles.sectionIndex, { color: theme.green }]}>{index}</Text><View style={styles.sectionCopy}><Text style={[styles.sectionTitle, { color: theme.ink }]}>{title}</Text><Text style={[styles.sectionSubtitle, { color: theme.inkSecondary }]}>{subtitle}</Text></View></View>;
  }

  function Rating({ label, low, high, value, disabled, onChange }: { label: string; low: string; high: string; value: number | null; disabled: boolean; onChange: (value: number) => void }) {
    return (
      <View style={styles.rating}>
        <Text style={[styles.ratingLabel, { color: theme.inkSecondary }]}>{label}</Text>
        <View accessibilityRole="radiogroup" style={styles.ratingButtons}>
          {[1, 2, 3, 4, 5].map((number) => {
            const selected = value === number;
            return <Pressable key={number} aria-checked={selected} accessibilityLabel={`${label.toLowerCase()} ${number} of 5`} accessibilityRole="radio" accessibilityState={{ checked: selected }} disabled={disabled} onPress={() => onChange(number)} style={({ pressed }) => [styles.ratingButton, { borderColor: selected ? theme.green : theme.borderSoft, backgroundColor: selected ? theme.green : theme.surfaceMuted }, pressed && !disabled && styles.pressed]}><Text style={[styles.ratingNumber, { color: selected ? '#FFFFFF' : theme.ink }]}>{number}</Text></Pressable>;
          })}
        </View>
        <View style={styles.ratingHints}><Text style={[styles.ratingHint, { color: theme.inkSecondary }]}>{low}</Text><Text style={[styles.ratingHint, { color: theme.inkSecondary }]}>{high}</Text></View>
      </View>
    );
  }

  function ArtifactCard({ artifact, disabled, onRemove }: { artifact: QuestArtifact; disabled: boolean; onRemove: () => void }) {
    const ArtifactIcon = artifact.kind === 'video' ? Video : artifact.kind === 'image' ? ImageIcon : File;
    return (
      <View testID="quest-artifact" style={[styles.artifact, { borderColor: theme.green, backgroundColor: `${theme.green}0A` }]}>
        {artifact.kind === 'image' && Platform.OS !== 'web'
          ? <Image accessibilityLabel="Attached Quest evidence preview" source={{ uri: artifact.uri }} style={styles.artifactImage} />
          : <View style={[styles.artifactIcon, { backgroundColor: `${theme.green}14` }]}><ArtifactIcon color={theme.green} size={22} /></View>}
        <View style={styles.artifactCopy}>
          <Text style={[styles.artifactLabel, { color: theme.green }]}>ATTACHED {artifact.kind.toUpperCase()}</Text>
          <Text numberOfLines={1} style={[styles.artifactName, { color: theme.ink }]}>{artifact.name}</Text>
          <Text style={[styles.artifactMeta, { color: theme.inkSecondary }]}>{formatFileSize(artifact.size)} · {Platform.OS === 'web' ? 'stored in this browser' : 'stored in app documents'}</Text>
        </View>
        {!disabled && (
          <Pressable accessibilityLabel="Remove attached evidence" accessibilityRole="button" hitSlop={8} onPress={onRemove} style={({ pressed }) => [styles.removeArtifact, { borderColor: theme.borderSoft }, pressed && styles.pressed]}>
            <Trash2 color={theme.coral} size={16} />
          </Pressable>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 190, flexDirection: 'row', alignItems: 'center', gap: 20, borderWidth: 1, borderRadius: 7, padding: 24 },
  heroCompact: { alignItems: 'flex-start', flexWrap: 'wrap', padding: 18 },
  questMark: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  heroCopy: { minWidth: 220, flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '900' },
  title: { marginTop: 8, fontSize: 40, fontWeight: '900', lineHeight: 42 },
  titleCompact: { fontSize: 30, lineHeight: 32 },
  subtitle: { maxWidth: 670, marginTop: 10, fontSize: 12, lineHeight: 18 },
  timeBlock: { minWidth: 76, alignItems: 'center' },
  timeValue: { marginTop: 5, fontSize: 28, fontWeight: '900' },
  timeLabel: { fontSize: 7, fontWeight: '800' },
  finishCondition: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12, borderWidth: 1, borderRadius: 7, padding: 14 },
  finishCopy: { flex: 1 },
  finishLabel: { fontSize: 7, fontWeight: '900' },
  finishText: { marginTop: 4, fontSize: 10, lineHeight: 15 },
  sectionHeading: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 13 },
  sectionIndex: { fontSize: 11, fontWeight: '900' },
  sectionCopy: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  sectionSubtitle: { maxWidth: 740, marginTop: 3, fontSize: 10, lineHeight: 14 },
  stageGrid: { flexDirection: 'row', gap: 9 },
  stageGridCompact: { flexWrap: 'wrap' },
  stage: { minWidth: 155, minHeight: 150, flex: 1, borderWidth: 1, borderRadius: 7, padding: 14 },
  stageTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stageIndex: { fontSize: 9, fontWeight: '900' },
  stageTime: { fontSize: 8, fontWeight: '700' },
  stageTitle: { marginTop: 20, fontSize: 15, fontWeight: '900' },
  stageDetail: { marginTop: 7, fontSize: 9, lineHeight: 14 },
  toolNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginTop: 10, borderWidth: 1, borderRadius: 7, padding: 13 },
  toolLabel: { fontSize: 7, fontWeight: '900' },
  toolText: { maxWidth: 810, marginTop: 4, fontSize: 9, lineHeight: 14 },
  formCard: { borderWidth: 1, borderRadius: 7, padding: 16 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  privacyText: { fontSize: 7, fontWeight: '900' },
  pickerRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  pickerRowCompact: { flexDirection: 'column' },
  pickerButton: { minHeight: 64, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 6, paddingHorizontal: 13 },
  pickerCopy: { minWidth: 0, flex: 1 },
  pickerLabel: { fontSize: 10, fontWeight: '900' },
  pickerHint: { marginTop: 3, fontSize: 8 },
  artifact: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 10, borderWidth: 1, borderRadius: 6, padding: 9 },
  artifactImage: { width: 48, height: 48, borderRadius: 5 },
  artifactIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  artifactCopy: { minWidth: 0, flex: 1 },
  artifactLabel: { fontSize: 7, fontWeight: '900' },
  artifactName: { marginTop: 4, fontSize: 10, fontWeight: '800' },
  artifactMeta: { marginTop: 3, fontSize: 8 },
  removeArtifact: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5 },
  evidenceError: { marginTop: 9, fontSize: 9, lineHeight: 14 },
  evidenceDivider: { height: 1, marginTop: 16, marginBottom: 14 },
  evidenceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  evidenceOption: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 5, paddingHorizontal: 11 },
  evidenceOptionText: { fontSize: 9, fontWeight: '800' },
  input: { width: '100%', borderWidth: 1, borderRadius: 6, padding: 12, fontSize: 11, lineHeight: 17, textAlignVertical: 'top' },
  evidenceInput: { minHeight: 88, marginTop: 11 },
  reflectionInput: { minHeight: 108, marginTop: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '900' },
  pullLabel: { marginTop: 20 },
  ratingGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  ratingGridCompact: { flexDirection: 'column' },
  rating: { flex: 1 },
  ratingLabel: { fontSize: 8, fontWeight: '900' },
  ratingButtons: { flexDirection: 'row', gap: 6, marginTop: 8 },
  ratingButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5 },
  ratingNumber: { fontSize: 11, fontWeight: '900' },
  ratingHints: { maxWidth: 224, flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  ratingHint: { fontSize: 7 },
  pullOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  pullOption: { minHeight: 40, justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 12 },
  pullText: { fontSize: 9, fontWeight: '700' },
  actionBar: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, borderWidth: 1, borderRadius: 7, padding: 14 },
  actionBarCompact: { alignItems: 'stretch', flexDirection: 'column' },
  actionCopy: { minWidth: 220, flex: 1 },
  actionLabel: { fontSize: 8, fontWeight: '900' },
  actionText: { marginTop: 4, fontSize: 10, lineHeight: 15 },
  outcomeActions: { minWidth: 220, gap: 8 },
  outcomeActionsCompact: { width: '100%' },
  primaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 5, paddingHorizontal: 18 },
  primaryText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  stopButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 15 },
  stopText: { fontSize: 8, fontWeight: '900' },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8, 18, 12, 0.52)', padding: 18 },
  resolutionDialog: { width: '100%', maxWidth: 460, borderWidth: 1, borderRadius: 8, padding: 20, shadowColor: '#101A14', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  resolutionEyebrow: { fontSize: 8, fontWeight: '900' },
  resolutionTitle: { marginTop: 9, fontSize: 22, fontWeight: '900' },
  resolutionText: { marginTop: 8, fontSize: 11, lineHeight: 17 },
  resolutionActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 15 },
  cancelText: { fontSize: 8, fontWeight: '900' },
  confirmButton: { minWidth: 170, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 5, paddingHorizontal: 15 },
  confirmText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
