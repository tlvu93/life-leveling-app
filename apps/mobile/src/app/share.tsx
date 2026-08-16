import { ClientOnly } from '@/components/ClientOnly';
import SharePreviewScreen from '@/screens/roadmap/SharePreviewScreen';

export default function ShareRoute() {
  return <ClientOnly><SharePreviewScreen /></ClientOnly>;
}
