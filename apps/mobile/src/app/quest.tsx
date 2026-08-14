import { ClientOnly } from '@/components/ClientOnly';
import QuestScreen from '@/screens/QuestScreen';

export default function QuestRoute() {
  return <ClientOnly><QuestScreen /></ClientOnly>;
}
