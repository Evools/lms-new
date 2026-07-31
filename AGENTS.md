<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI & Modal Design Rules

1. **Compact Density & Sizing (Плотный компактный интерфейс)**:
   - Maintain compact font sizing (`text-xs` for body text/inputs, `text-sm font-bold` for card/dialog titles).
   - Use small button heights (`h-8 text-xs px-3` or `size="xs"` / `h-6 px-2.5 text-xs`).
   - Use tight container paddings (`p-3` or `p-4`, `gap-2` or `gap-3`).

2. **No Font-Weight Toggling (Без динамической жирности шрифтов)**:
   - NEVER toggle `font-semibold` or `font-bold` dynamically between active and inactive states on buttons/toggles (causes text width changes and layout jittering).
   - Keep a static font-weight (e.g. `font-medium`) across active and inactive states. Indicate active state using background colors (`bg-primary/10`, `bg-primary`), border colors (`border-primary`), and text color (`text-primary`, `text-primary-foreground`).

3. **Color Palette & Accents (Единая брендовая палитра)**:
   - Use `primary` theme color (`bg-primary`, `text-primary`, `border-l-primary`) for all highlights, active states, and important badges.
   - Do NOT use yellow/amber colors for "Important" tags; always align with the primary theme color.

4. **Dialogs & Modals (`Dialog` & `AlertDialog`)**:
   - `DialogContent`: Always use compact padding and width (`p-4 gap-3 text-xs sm:max-w-[420px]`).
   - `AlertDialogContent`: NEVER use `size="sm"` (which forces narrow `max-w-xs` 320px boxes and 2-column grid footers that distort button text). Use `className="p-4 gap-3 text-xs sm:max-w-[400px]"` with left-aligned headers (`place-items-start text-left gap-1`).
   - `AlertDialogFooter`: Always align action buttons in a clean right-aligned flex row (`flex flex-row justify-end gap-2 pt-2 border-t mt-2`).
   - Action buttons in modals: Use concise button labels (`"Отмена"`, `"Удалить"`, `"Сохранить"`) with `size="xs"` / `h-6 px-2.5 text-xs`.
   - Priority Toggles in Modals: Use a compact Segmented Pill Toggle (`<div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">`) instead of multi-line form buttons.
