<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep admin pages under the authenticated admin layout; database role policies authorize every write, while the layout role check is navigation-only.
- Admin data uses route loaders to prime TanStack Query and suspense subscriptions; filters belong in URL search parameters.
- Derive all commission reports from stored order commissions using the shared summary helpers; cancelling or editing status must not rewrite historical commission amounts.
- Products are archived through their active flag rather than deleted so historical orders retain their product reference.
- Admin and affiliate settings share AccountSettings; preserve the existing affiliate profile URL so old account links continue working.
- Profile writes use an authenticated server function with a strict name/phone schema and session-derived identity; database triggers preserve identity and mirror only confirmed Auth email changes.
- Settings password changes verify the current password server-side with an isolated Auth client before updating; never expose role or activation fields in self-service forms.
- Admin order deletion uses the existing browser Data API, filters by validated order UUID, and requires a returned deleted ID; existing RLS is authoritative and related records are untouched.
