import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  DndContext,
  type DragEndEvent,
  type DraggableSyntheticListeners,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  KeyboardSensor,
  MeasuringStrategy,
  type Modifiers,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  type AnimateLayoutChanges,
  arrayMove,
  defaultAnimateLayoutChanges,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type * as React from "react";
import {
  Children,
  type CSSProperties,
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@sycom-learn/ui/lib/utils";

// Sortable Item Context
const SortableItemContext = createContext<{
  listeners: DraggableSyntheticListeners | undefined;
  isDragging?: boolean;
  disabled?: boolean;
}>({
  listeners: undefined,
  isDragging: false,
  disabled: false,
});

const IsOverlayContext = createContext(false);

const SortableInternalContext = createContext<{
  activeId: UniqueIdentifier | null;
  modifiers?: Modifiers;
}>({
  activeId: null,
  modifiers: undefined,
});

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

// Multipurpose Sortable Component
export interface SortableRootProps<T> extends Omit<
  useRender.ComponentProps<"div">,
  "onDragStart" | "onDragEnd" | "children"
> {
  value: T[];
  onValueChange: (value: T[]) => void;
  getItemValue: (item: T) => string;
  children: ReactNode;
  onMove?: (event: { event: DragEndEvent; activeIndex: number; overIndex: number }) => void;
  strategy?: "horizontal" | "vertical" | "grid";
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  modifiers?: Modifiers;
}

function Sortable<T>({
  value,
  onValueChange,
  getItemValue,
  className,
  render,
  onMove,
  strategy = "vertical",
  onDragStart,
  onDragEnd,
  modifiers,
  children,
  ...props
}: SortableRootProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id);
      onDragStart?.(event);
    },
    [onDragStart],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      onDragEnd?.(event);

      if (!over) {
        return;
      }

      // Handle item reordering
      const activeIndex = value.findIndex((item: T) => getItemValue(item) === active.id);
      const overIndex = value.findIndex((item: T) => getItemValue(item) === over.id);

      if (activeIndex !== overIndex) {
        if (onMove) {
          onMove({ event, activeIndex, overIndex });
        } else {
          const newValue = arrayMove(value, activeIndex, overIndex);
          onValueChange(newValue);
        }
      }
    },
    [value, getItemValue, onValueChange, onMove, onDragEnd],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const getStrategy = () => {
    switch (strategy) {
      case "horizontal":
        return rectSortingStrategy;
      case "grid":
        return rectSortingStrategy;
      default:
        return verticalListSortingStrategy;
    }
  };

  const itemIds = useMemo(() => value.map(getItemValue), [value, getItemValue]);

  const contextValue = useMemo(() => ({ activeId, modifiers }), [activeId, modifiers]);

  const defaultProps = {
    "data-slot": "sortable",
    "data-dragging": activeId !== null,
    className: cn(activeId !== null && "cursor-grabbing!", className),
    children,
  };

  // Find the active child for the overlay
  const overlayContent = useMemo(() => {
    if (!activeId) {
      return null;
    }
    let result: ReactNode = null;
    Children.forEach(children, (child) => {
      if (isValidElement(child) && (child.props as SortableItemProps).value === activeId) {
        result = cloneElement(child as ReactElement<SortableItemProps>, {
          ...(child.props as SortableItemProps),
          className: cn((child.props as SortableItemProps).className, "z-50 shadow-lg"),
        });
      }
    });
    return result;
  }, [activeId, children]);

  return (
    <SortableInternalContext.Provider value={contextValue}>
      <DndContext
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        modifiers={modifiers}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <SortableContext items={itemIds} strategy={getStrategy()}>
          {useRender({
            defaultTagName: "div",
            render,
            props: mergeProps<"div">(defaultProps, props),
          })}
        </SortableContext>
        {mounted &&
          createPortal(
            <DragOverlay
              className={cn("z-50", activeId && "cursor-grabbing")}
              dropAnimation={dropAnimationConfig}
              modifiers={modifiers}
            >
              <IsOverlayContext.Provider value={true}>{overlayContent}</IsOverlayContext.Provider>
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </SortableInternalContext.Provider>
  );
}

export interface SortableItemProps extends useRender.ComponentProps<"div"> {
  value: string;
  disabled?: boolean;
}

function SortableItemOverlayBranch({ value, className, render, ...props }: SortableItemProps) {
  const defaultProps = {
    "data-slot": "sortable-item",
    "data-value": value,
    "data-dragging": true,
    className: cn(className),
    children: props.children,
  };

  return (
    <SortableItemContext.Provider
      value={{ listeners: undefined, isDragging: true, disabled: false }}
    >
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(defaultProps, props),
      })}
    </SortableItemContext.Provider>
  );
}

function SortableItemDraggableBranch({
  value,
  className,
  render,
  disabled,
  ...props
}: SortableItemProps) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
    animateLayoutChanges,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  } as CSSProperties;

  const draggableAttributes = mounted
    ? attributes
    : {
        ...attributes,
        "aria-describedby": undefined,
      };

  const defaultProps = {
    "data-slot": "sortable-item",
    "data-value": value,
    "data-dragging": isSortableDragging,
    "data-disabled": disabled,
    ref: setNodeRef,
    style,
    ...draggableAttributes,
    className: cn(isSortableDragging && "z-50 opacity-50", disabled && "opacity-50", className),
    children: props.children,
  };

  return (
    <SortableItemContext.Provider value={{ listeners, isDragging: isSortableDragging, disabled }}>
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(defaultProps, props),
      })}
    </SortableItemContext.Provider>
  );
}

function SortableItem(props: SortableItemProps) {
  const isOverlay = useContext(IsOverlayContext);
  if (isOverlay) {
    return <SortableItemOverlayBranch {...props} />;
  }
  return <SortableItemDraggableBranch {...props} />;
}

export interface SortableItemHandleProps extends useRender.ComponentProps<"div"> {
  cursor?: boolean;
}

function SortableItemHandle({
  className,
  render,
  cursor = true,
  ...props
}: SortableItemHandleProps) {
  const { listeners, isDragging, disabled } = useContext(SortableItemContext);

  const defaultProps = {
    "data-slot": "sortable-item-handle",
    "data-dragging": isDragging,
    "data-disabled": disabled,
    ...listeners,
    className: cn(cursor && (isDragging ? "cursor-grabbing!" : "cursor-grab!"), className),
    children: props.children,
  };

  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(defaultProps, props),
  });
}

export interface SortableOverlayProps extends Omit<
  React.ComponentProps<typeof DragOverlay>,
  "children"
> {
  children?: ReactNode | ((params: { value: UniqueIdentifier }) => ReactNode);
}

function SortableOverlay({ children, className, ...props }: SortableOverlayProps) {
  const { activeId, modifiers } = useContext(SortableInternalContext);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => setMounted(true), []);

  const content =
    activeId && children
      ? typeof children === "function"
        ? children({ value: activeId })
        : children
      : null;

  if (!mounted) {
    return null;
  }

  return createPortal(
    <DragOverlay
      className={cn("z-50", activeId && "cursor-grabbing", className)}
      dropAnimation={dropAnimationConfig}
      modifiers={modifiers}
      {...props}
    >
      <IsOverlayContext.Provider value={true}>{content}</IsOverlayContext.Provider>
    </DragOverlay>,
    document.body,
  );
}

export { Sortable, SortableItem, SortableItemHandle, SortableOverlay };
