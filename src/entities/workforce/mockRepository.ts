import { enterpriseState } from '../state';
import { deepClone } from '../utils';
import type {
  WorkforceAssignment,
  WorkforceMember,
  WorkforcePerformanceSummary,
  WorkforceReport,
  WorkforceState,
  WorkforceTeam,
  WorkforceUtilizationSnapshot,
} from './types';

const getState = (): WorkforceState => enterpriseState.workforce;

export const workforceRepository = {
  async listTeams(): Promise<WorkforceTeam[]> {
    return deepClone(getState().teams);
  },
  async listMembers(): Promise<WorkforceMember[]> {
    return deepClone(getState().members);
  },
  async listAssignments(): Promise<WorkforceAssignment[]> {
    return deepClone(getState().assignments);
  },
  async listUtilization(): Promise<WorkforceUtilizationSnapshot[]> {
    return deepClone(getState().utilization);
  },
  async listPerformance(): Promise<WorkforcePerformanceSummary[]> {
    return deepClone(getState().performance);
  },
  async listReports(): Promise<WorkforceReport[]> {
    return deepClone(getState().reports);
  },
};

export type WorkforceRepository = typeof workforceRepository;
