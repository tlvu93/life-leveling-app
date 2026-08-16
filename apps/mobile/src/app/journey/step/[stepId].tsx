import { ClientOnly } from '@/components/ClientOnly';
import StepDetailScreen from '@/screens/roadmap/StepDetailScreen';

export default function StepDetailRoute() {
  return <ClientOnly><StepDetailScreen /></ClientOnly>;
}
