/**
 * Simple remark plugin that converts ```mermaid code blocks to
 * <pre class="mermaid"> elements, which are rendered client-side by mermaid.js.
 * No build-time browser (playwright/puppeteer) required.
 */
import { visit } from 'unist-util-visit';

export function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid') {
        parent.children.splice(index, 1, {
          type: 'html',
          value: `<pre class="mermaid">${node.value}</pre>`,
        });
      }
    });
  };
}
