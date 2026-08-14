import { ClientOnly } from '@/components/ClientOnly';
import AtlasScreen from '@/screens/AtlasScreen';

export default function AtlasRoute() {
  return <ClientOnly><AtlasScreen /></ClientOnly>;
}
