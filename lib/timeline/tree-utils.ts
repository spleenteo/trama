import type { NodeBase, NodeTree, ColorField } from '@/lib/types';

/**
 * Compute the effective end year for a node, considering its own end_year
 * and the years of all descendants (bottom-up traversal).
 *
 * Returns { computedStart, computedEnd } for the subtree.
 */
export function computeRange(
  node: NodeBase,
  childrenMap: Map<string, NodeBase[]>
): { computedStart: number; computedEnd: number } {
  const ownStart = node.year;
  const ownEnd = node.endYear ?? node.year;

  const kids = childrenMap.get(node.id) ?? [];
  if (kids.length === 0) {
    return { computedStart: ownStart, computedEnd: ownEnd };
  }

  let minStart = ownStart;
  let maxEnd = ownEnd;
  for (const kid of kids) {
    const kidRange = computeRange(kid, childrenMap);
    minStart = Math.min(minStart, kidRange.computedStart);
    maxEnd = Math.max(maxEnd, kidRange.computedEnd);
  }

  return { computedStart: minStart, computedEnd: maxEnd };
}

/**
 * Compute ranges for all nodes in a flat list.
 * Returns a map: node ID → { computedStart, computedEnd }.
 */
export function computeRanges(
  nodes: NodeBase[],
  parentIdMap: Map<string, string | null>
): Map<string, { computedStart: number; computedEnd: number }> {
  // Build children map
  const childrenMap = new Map<string, NodeBase[]>();
  for (const node of nodes) {
    const parentId = parentIdMap.get(node.id) ?? null;
    if (parentId) {
      const siblings = childrenMap.get(parentId) ?? [];
      siblings.push(node);
      childrenMap.set(parentId, siblings);
    }
  }

  // Compute range for each node
  const ranges = new Map<string, { computedStart: number; computedEnd: number }>();
  for (const node of nodes) {
    if (!ranges.has(node.id)) {
      ranges.set(node.id, computeRange(node, childrenMap));
    }
  }
  return ranges;
}

/**
 * Compute ranges for a tree structure (NodeTree with children).
 * Mutates nothing — returns a map of ranges.
 */
export function computeTreeRanges(
  root: NodeTree
): Map<string, { computedStart: number; computedEnd: number }> {
  const ranges = new Map<string, { computedStart: number; computedEnd: number }>();

  function walk(node: NodeTree): { computedStart: number; computedEnd: number } {
    const ownStart = node.year;
    const ownEnd = node.endYear ?? node.year;

    if (node.children.length === 0) {
      const range = { computedStart: ownStart, computedEnd: ownEnd };
      ranges.set(node.id, range);
      return range;
    }

    let minStart = ownStart;
    let maxEnd = ownEnd;
    for (const child of node.children) {
      const childRange = walk(child);
      minStart = Math.min(minStart, childRange.computedStart);
      maxEnd = Math.max(maxEnd, childRange.computedEnd);
    }

    const range = { computedStart: minStart, computedEnd: maxEnd };
    ranges.set(node.id, range);
    return range;
  }

  walk(root);
  return ranges;
}

/**
 * Walk up the tree to find the nearest ancestor with a color set.
 * Falls back to null if no ancestor has a color.
 */
export function inheritColor(
  node: NodeTree,
  parentMap?: Map<string, NodeTree>
): ColorField | null {
  if (node.color) return node.color;
  if (!parentMap) return null;

  // Walk up parents
  let current = node;
  while (true) {
    const parent = parentMap.get(current.id);
    if (!parent) return null;
    if (parent.color) return parent.color;
    current = parent;
  }
}

/**
 * Build a parent map from a NodeTree root (maps child ID → parent node).
 */
export function buildParentMap(root: NodeTree): Map<string, NodeTree> {
  const map = new Map<string, NodeTree>();
  function walk(node: NodeTree) {
    for (const child of node.children) {
      map.set(child.id, node);
      walk(child);
    }
  }
  walk(root);
  return map;
}

/**
 * Check if a node is a container (has children).
 * In the unified model, any node with children acts as a "context".
 */
export function isContainer(node: { children?: unknown[] }): boolean {
  return (node.children?.length ?? 0) > 0;
}
