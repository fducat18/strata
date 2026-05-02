-- Add performance indexes for common query patterns.

-- asset_snapshots: fast "latest snapshot for a given asset" lookups (findLatestByAsset, findLatestPerNonDisposedAsset)
CREATE INDEX "asset_snapshots_asset_id_observed_at_idx" ON "asset_snapshots"("asset_id", "observed_at" DESC);

-- portfolio_snapshots: fast chronological listing
CREATE INDEX "portfolio_snapshots_observed_at_idx" ON "portfolio_snapshots"("observed_at" DESC);

-- transactions: fast per-asset history lookups
CREATE INDEX "transactions_asset_id_occurred_at_idx" ON "transactions"("asset_id", "occurred_at" DESC);

-- asset_categories: fast "assets in a given category" lookups
CREATE INDEX "asset_categories_category_id_idx" ON "asset_categories"("category_id");

-- asset_tags: fast "assets with a given tag" lookups
CREATE INDEX "asset_tags_tag_id_idx" ON "asset_tags"("tag_id");
