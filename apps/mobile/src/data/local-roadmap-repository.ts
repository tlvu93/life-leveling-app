import AsyncStorage from '@react-native-async-storage/async-storage';

import { KeyValueRoadmapRepository } from './roadmap-repository';

export const localRoadmapRepository = new KeyValueRoadmapRepository(AsyncStorage);
