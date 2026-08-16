import { ClientOnly } from '@/components/ClientOnly';
import DraftPreviewScreen from '@/screens/roadmap/DraftPreviewScreen';

export default function DraftPreviewRoute() {
  return <ClientOnly><DraftPreviewScreen /></ClientOnly>;
}
