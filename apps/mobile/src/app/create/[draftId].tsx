import { ClientOnly } from '@/components/ClientOnly';
import GuideBuilderScreen from '@/screens/roadmap/GuideBuilderScreen';

export default function GuideBuilderRoute() {
  return <ClientOnly><GuideBuilderScreen /></ClientOnly>;
}
