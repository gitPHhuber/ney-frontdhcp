import { beforeEach, describe, expect, it } from 'vitest';
import { enterpriseState, mesRepository, resetEnterpriseState } from '../index';

const findLatestMove = (predicate: (move: { refId: string; note?: string }) => boolean) => {
  return enterpriseState.inventory.stockMoves.find(predicate);
};

describe('mesRepository', () => {
  beforeEach(() => {
    resetEnterpriseState();
  });

  it('generates work orders for a production order routing', async () => {
    const generated = await mesRepository.generateWorkOrders('po-router-11');
    expect(generated).toHaveLength(3);
    const uniqueWorkCenters = new Set(generated.map(workOrder => workOrder.wcId));
    expect(uniqueWorkCenters.size).toBeGreaterThan(1);
  });

  it('consumes BOM components and moves finished goods when completing work orders', async () => {
    const generated = await mesRepository.generateWorkOrders('po-router-11');
    const firstOp = generated[0];
    const lastOp = generated[generated.length - 1];

    await mesRepository.completeWorkOrder(firstOp.id);
    const componentMove = findLatestMove(move => move.refId === firstOp.id && move.note === 'Issue components');
    expect(componentMove).toBeDefined();

    await mesRepository.completeWorkOrder(lastOp.id);
    const finishedGoodsMove = findLatestMove(move => move.refId === lastOp.id && move.note === 'Finished goods transfer');
    expect(finishedGoodsMove).toBeDefined();
  });
});
