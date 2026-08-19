import { Button } from "@sycom-learn/ui/components/button";
import { cn } from "@sycom-learn/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@sycom-learn/ui/components/drawer";

interface MobileToolbarGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileToolbarGroup = ({ label, children, className }: MobileToolbarGroupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeDrawer = () => setIsOpen(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-max gap-1 px-3 font-normal", className)}
          />
        }
      >
        {label}
        <ChevronDown className="h-4 w-4" />
      </DrawerTrigger>
      <DrawerPopup>
        <DrawerHeader>
          <DrawerTitle className="text-start">{label}</DrawerTitle>
        </DrawerHeader>
        <DrawerPanel className="flex flex-col">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { closeDrawer } as {
                  closeDrawer: () => void;
                })
              : child,
          )}
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
};

export const MobileToolbarItem = ({
  children,
  active,
  onClick,
  closeDrawer,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  closeDrawer?: () => void;
}) => (
  <button
    className={cn(
      "flex w-full items-center rounded-md px-4 py-2 text-sm transition-colors hover:bg-accent",
      active && "bg-accent text-accent-foreground",
    )}
    onClick={(e) => {
      onClick?.(e);
      setTimeout(() => {
        closeDrawer?.();
      }, 100);
    }}
    {...props}
  >
    {children}
  </button>
);
