'use strict';

const SEED_EMAILS = ['admin@bookflow.com', 'user@bookflow.com'];

/** Check whether an email belongs to a seed admin account. */
const isSeedAdmin = (email) =>
  email && SEED_EMAILS.includes(email.toLowerCase());

/**
 * Build a SQL fragment to include/exclude seed-user rows.
 *
 * @param {boolean|undefined} seedOnly
 *   true  → keep only rows whose `col` belongs to a seed user
 *   false → exclude seed-user rows
 *   undefined → no filter (return empty clause)
 * @param {number}  idx   next $N placeholder index
 * @param {string}  [col='b.user_id']  column to filter on
 * @returns {{ clause: string, values: any[], nextIdx: number }}
 */
const seedFilter = (seedOnly, idx, col = 'b.user_id') => {
  if (seedOnly === undefined || seedOnly === null) {
    return { clause: '', values: [], nextIdx: idx };
  }
  const op = seedOnly ? 'IN' : 'NOT IN';
  return {
    clause: `AND ${col} ${op} (SELECT id FROM users WHERE email = ANY($${idx}::TEXT[]))`,
    values: [SEED_EMAILS],
    nextIdx: idx + 1,
  };
};

module.exports = { SEED_EMAILS, isSeedAdmin, seedFilter };
