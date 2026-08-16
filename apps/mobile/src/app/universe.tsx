import { ClientOnly } from '@/components/ClientOnly';
import UniverseScreen from '@/screens/roadmap/UniverseScreen';

export default function UniverseRoute() {
  return <ClientOnly><UniverseScreen /></ClientOnly>;
}
