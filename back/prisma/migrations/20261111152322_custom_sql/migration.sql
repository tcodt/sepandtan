-- This is an empty migration.
CREATE UNIQUE INDEX uq_user_plans_one_active ON user_plans (user_id)
WHERE
    status = 'ACTIVE';

CREATE UNIQUE INDEX uq_user_plans_open_per_request ON user_plans (request_id)
WHERE
    request_id IS NOT NULL
    AND status IN ('DRAFT', 'ACTIVE');

CREATE UNIQUE INDEX IF NOT EXISTS wallets_single_platform_idx ON wallets (is_platform)
WHERE
    is_platform = true;