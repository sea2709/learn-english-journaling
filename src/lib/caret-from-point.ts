/** Map a viewport point to a character offset within an element's text. */

function offsetWithinElement(
  element: Element,
  node: Node,
  offset: number
): number {
  if (node === element) {
    let total = 0;
    for (let i = 0; i < offset && i < element.childNodes.length; i++) {
      total += element.childNodes[i].textContent?.length ?? 0;
    }
    return total;
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let total = 0;
  let current: Node | null = walker.nextNode();
  while (current) {
    if (current === node) return total + offset;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return total;
}

function offsetFromPointByRects(
  element: Element,
  clientX: number,
  clientY: number
): number {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let bestDist = Infinity;
  let bestOffset = 0;
  let running = 0;
  let node: Node | null = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const len = textNode.length;

    for (let i = 0; i < len; i++) {
      const range = document.createRange();
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);

      for (const rect of range.getClientRects()) {
        if (rect.width === 0 && rect.height === 0) continue;

        const inside =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom;
        const caretAt =
          clientX >= rect.left + rect.width / 2
            ? running + i + 1
            : running + i;

        if (inside) return caretAt;

        const dx =
          clientX < rect.left
            ? rect.left - clientX
            : clientX > rect.right
              ? clientX - rect.right
              : 0;
        const dy =
          clientY < rect.top
            ? rect.top - clientY
            : clientY > rect.bottom
              ? clientY - rect.bottom
              : 0;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestOffset = caretAt;
        }
      }
    }

    running += len;
    node = walker.nextNode();
  }

  return bestOffset;
}

export function characterOffsetFromPoint(
  element: Element,
  clientX: number,
  clientY: number
): number {
  const textLength = element.textContent?.length ?? 0;
  if (textLength === 0) return 0;

  const caretPositionFromPoint = document.caretPositionFromPoint?.bind(document);
  if (caretPositionFromPoint) {
    const pos = caretPositionFromPoint(clientX, clientY);
    if (pos && element.contains(pos.offsetNode)) {
      return clamp(
        offsetWithinElement(element, pos.offsetNode, pos.offset),
        textLength
      );
    }
  }

  const caretRangeFromPoint = document.caretRangeFromPoint?.bind(document);
  if (caretRangeFromPoint) {
    const range = caretRangeFromPoint(clientX, clientY);
    if (range && element.contains(range.startContainer)) {
      return clamp(
        offsetWithinElement(element, range.startContainer, range.startOffset),
        textLength
      );
    }
  }

  return clamp(offsetFromPointByRects(element, clientX, clientY), textLength);
}

function clamp(offset: number, textLength: number): number {
  return Math.max(0, Math.min(textLength, offset));
}
