import { ClientOnly } from '@/components/ClientOnly';
import RoadmapDiscoverScreen from '@/screens/roadmap/RoadmapDiscoverScreen';

export default function HomeRoute() {
  return <ClientOnly><RoadmapDiscoverScreen /></ClientOnly>;
}
