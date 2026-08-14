import { ClientOnly } from '@/components/ClientOnly';
import CommunityScreen from '@/screens/CommunityScreen';

export default function CommunityRoute() {
  return <ClientOnly><CommunityScreen /></ClientOnly>;
}
