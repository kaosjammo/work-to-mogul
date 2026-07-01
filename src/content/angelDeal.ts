// ============================================================
//  Compatibility shim. The Angel Investment content now lives in the Mogul Stories
//  framework at ./mogulStories/angelInvestment.ts. This re-export keeps existing
//  imports (engine/angelDeal, save/serialize, store/buildView, the modal) working.
//  New stories should be authored directly under ./mogulStories/.
// ============================================================
export * from './mogulStories/angelInvestment'
