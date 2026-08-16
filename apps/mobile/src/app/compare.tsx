import { ClientOnly } from '@/components/ClientOnly';
import GuideComparisonScreen from '@/screens/roadmap/GuideComparisonScreen';

export default function CompareRoute() {
  return <ClientOnly><GuideComparisonScreen /></ClientOnly>;
}
