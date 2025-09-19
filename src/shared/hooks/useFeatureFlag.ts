import { useMemo } from 'react';
import { FeatureFlag, isFeatureEnabled } from '../config/featureFlags';

export const useFeatureFlag = (flag: FeatureFlag) =>
  useMemo(() => isFeatureEnabled(flag), [flag]);
