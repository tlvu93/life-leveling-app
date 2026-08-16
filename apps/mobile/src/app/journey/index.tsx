import { ClientOnly } from '@/components/ClientOnly';
import JourneyScreen from '@/screens/roadmap/JourneyScreen';

export default function JourneyRoute() {
  return <ClientOnly><JourneyScreen /></ClientOnly>;
}
