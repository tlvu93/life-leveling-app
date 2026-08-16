import { ClientOnly } from '@/components/ClientOnly';
import PathOverviewScreen from '@/screens/roadmap/PathOverviewScreen';

export default function PathOverviewRoute() {
  return <ClientOnly><PathOverviewScreen /></ClientOnly>;
}
