import AsyncStorage from '@react-native-async-storage/async-storage';

import { KeyValueJourneyRepository } from './journey-repository';

export const localJourneyRepository = new KeyValueJourneyRepository(AsyncStorage);
