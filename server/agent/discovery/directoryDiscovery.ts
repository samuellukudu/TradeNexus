// Phase 3+ — Directory discovery: searches business directories and company registries.
import type { ProductDetails, DiscoveryEvidence } from '../types';

export async function discoverFromDirectories(
  _product: ProductDetails
): Promise<DiscoveryEvidence[]> {
  throw new Error("Directory discovery not yet implemented (Phase 3+)");
}
