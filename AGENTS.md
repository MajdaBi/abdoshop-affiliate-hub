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
