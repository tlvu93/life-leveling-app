import { ClientOnly } from '@/components/ClientOnly';
import DraftListScreen from '@/screens/roadmap/DraftListScreen';

export default function CreateRoute() {
  return <ClientOnly><DraftListScreen /></ClientOnly>;
}
