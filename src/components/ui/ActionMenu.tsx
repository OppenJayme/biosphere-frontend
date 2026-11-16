/**
 * A dropdown menu of actions behind one button ("More actions", "QR & Label"), so a panel does not
 * need a stack of buttons. Built on Radix Dropdown Menu for keyboard navigation, type-ahead and
 * focus handling; the menu is rendered in a portal, so a scrolling panel cannot clip it.
 *
 * An item only runs `onSelect`. A state-changing item should open a ConfirmDialog from there.
 * `onSelect` runs only after the menu has closed and handed focus back to its button, so a dialog
 * it opens returns focus there when it closes. (While the menu is open Radix traps focus in it, and
 * the item itself is gone by the time the dialog closes.)
 */

"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRef, type ComponentType, type ReactNode, type SVGProps } from "react";

export type ActionMenuItem = {
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  onSelect: () => void;
  disabled?: boolean;
  /** Red text for a destructive action. */
  danger?: boolean;
  /** Draws a divider above this item, to set a destructive action apart. */
  separated?: boolean;
};

export function ActionMenu({
  trigger,
  label,
  items,
  className,
  align = "end",
  disabled = false,
  onOpenChange,
}: {
  /** Content of the button that opens the menu. */
  trigger: ReactNode;
  /** Accessible name, needed when the trigger is only an icon. */
  label?: string;
  items: ActionMenuItem[];
  /** Classes for the opening button. */
  className: string;
  align?: "start" | "center" | "end";
  disabled?: boolean;
  /**
   * Called when the menu opens or closes. A popover that hosts this menu needs it: the menu is
   * portalled outside the popover, so its own outside-click and Escape handling must stand down
   * while the menu is open.
   */
  onOpenChange?: (open: boolean) => void;
}) {
  const chosen = useRef<(() => void) | null>(null);
  return (
    <DropdownMenu.Root onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger aria-label={label} disabled={disabled} className={className}>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          collisionPadding={8}
          // Radix focuses the trigger after this handler; run the chosen action once that is done.
          onCloseAutoFocus={() => {
            const action = chosen.current;
            chosen.current = null;
            if (action) window.setTimeout(action, 0);
          }}
          className="z-50 min-w-48 overflow-hidden rounded-xl border border-black/10 bg-white py-1 font-sans shadow-lg"
        >
          {items.map((item) => (
            <div key={item.label}>
              {item.separated && <DropdownMenu.Separator className="my-1 h-px bg-black/10" />}
              <DropdownMenu.Item
                disabled={item.disabled}
                onSelect={() => {
                  chosen.current = item.onSelect;
                }}
                className={`flex cursor-pointer items-center gap-2.5 px-4 py-2 text-sm font-medium outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 ${
                  item.danger
                    ? "text-red-700 data-[highlighted]:bg-red-50"
                    : "text-zinc-700 data-[highlighted]:bg-sage-100"
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                {item.label}
              </DropdownMenu.Item>
            </div>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
