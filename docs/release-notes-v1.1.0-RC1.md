# Release Notes - v1.1.0-RC1 (Candidate)

This version integrates several fixes and features, aiming to improve stability and functionality based on recent upstream changes and community contributions (specifically Pull Request #3).

## Process Summary

1.  **Started from Latest Upstream:** The work began by checking out the latest commit from the `cline/linear-mcp:main` branch (`dc2fcc1`) to ensure all official fixes were included.
2.  **Identified Missing/Incorrect Functionality:** Compared to the latest upstream code, several issues were identified, some originating from unmerged Pull Request #3 and others discovered during testing:
    *   **PAT Authentication:** The Linear SDK client was incorrectly initialized using `accessToken` instead of `apiKey` for Personal Access Tokens.
    *   **Search by Full Issue ID:** The `linear_search_issues` tool lacked the ability to parse and search using full identifiers like `TEAM-123`. (Feature from PR #3)
    *   **Bulk Update by State Name:** The `linear_bulk_update_issues` tool lacked the ability to accept state names (e.g., "Todo") instead of only state IDs. (Feature from PR #3)
    *   **Bulk Update API Call:** The underlying mechanism for bulk updates was failing, initially presenting misleading error messages regarding the expected arguments (`ids` vs `id`).
3.  **Applied Fixes and Updates:** The following changes were integrated and tested:
    *   **PAT Authentication Fix:** Corrected `src/auth.ts` to use `apiKey` when initializing `LinearClient` for PATs.
    *   **Search by ID:** Integrated the logic from PR #3 into `src/features/issues/handlers/issue.handler.ts` to parse full issue IDs in `linear_search_issues`.
    *   **Bulk Update State Name Logic:**
        *   Integrated the logic from PR #3 into `src/features/issues/handlers/issue.handler.ts` to fetch teams and find the corresponding state ID when a name is provided.
        *   Corrected the type definition for `Team.states` in `src/features/teams/types/team.types.ts` to `{ nodes: TeamState[] }` to match the likely runtime structure (addressing a `team.states.find is not a function` error).
        *   Adjusted the state lookup logic in `issue.handler.ts` to access `team.states.nodes.find(...)`.
    *   **Bulk Update API Call Fix:**
        *   Based on persistent API errors (`Unknown argument "ids"... Did you mean "id"?`), modified the `UPDATE_ISSUES_MUTATION` in `src/graphql/mutations.ts` to expect a single `$id: String!`. *Note: This contradicts the apparent original intent but aligns with the observed API behavior during testing.*
        *   Modified the `updateIssues` function in `src/graphql/client.ts` to call the (now single-ID) mutation sequentially in a loop for each provided ID.
4.  **Testing:** The integrated changes were tested manually, confirming PAT authentication, search by ID, and bulk update by state name are now functional. Existing automated tests also passed.

## Result

This branch now represents the latest upstream code combined with verified fixes and features from community contributions, providing a more stable and functional base. Pull Request #11 has been updated to reflect these changes.
