import { ClientOnly } from '@/components/ClientOnly';
import DiscoverScreen from '@/screens/DiscoverScreen';

export default function DiscoverRoute() {
  return <ClientOnly><DiscoverScreen /></ClientOnly>;
}
