import { useQuery } from '@tanstack/react-query';
import { workforceRepository } from '../../entities';
import { queryKeys } from '../../shared/api/queryKeys';

export const useWorkforceTeamsQuery = () =>
  useQuery({
    queryKey: queryKeys.workforce.teams,
    queryFn: () => workforceRepository.listTeams(),
    staleTime: 60_000,
  });

export const useWorkforceMembersQuery = () =>
  useQuery({
    queryKey: queryKeys.workforce.members,
    queryFn: () => workforceRepository.listMembers(),
    staleTime: 30_000,
  });

export const useWorkforceAssignmentsQuery = () =>
  useQuery({
    queryKey: queryKeys.workforce.assignments,
    queryFn: () => workforceRepository.listAssignments(),
    staleTime: 10_000,
  });

export const useWorkforceUtilizationQuery = () =>
  useQuery({
    queryKey: queryKeys.workforce.utilization,
    queryFn: () => workforceRepository.listUtilization(),
    staleTime: 60_000,
  });

export const useWorkforcePerformanceQuery = () =>
  useQuery({
    queryKey: queryKeys.workforce.performance,
    queryFn: () => workforceRepository.listPerformance(),
    staleTime: 60_000,
  });

export const useWorkforceReportsQuery = () =>
  useQuery({
    queryKey: queryKeys.workforce.reports,
    queryFn: () => workforceRepository.listReports(),
    staleTime: 120_000,
  });
