export const content = `
  <h1>Explore the Tiptap rich text editor with Shadcn UI components 📝</h1>
  <p>This is a powerful editor that supports many features:</p>
  <ul class="list-disc">
      <li>
          <p>
              Rich text formatting with <strong>bold</strong>, <em>italic</em>, and
              <u>underline</u>
          </p>
      </li>
      <li>
          <p>Different heading levels</p>
      </li>
      <li>
          <p>Lists (ordered and unordered)</p>
      </li>
      <li>
          <p>Text alignment options</p>
      </li>
      <li>
          <p>Image uploads and management</p>
      </li>
  </ul>
  <h2>Tables</h2>
  <p>
      Use the <strong>Table</strong> toolbar button to pick rows and columns, or type
      <strong>/table</strong> for a quick 3×3 with a header row. When the cursor is inside a
      table, the bubble menu has row, column, merge, and delete actions.
  </p>
  <table>
      <tbody>
          <tr>
              <th><p>Feature</p></th>
              <th><p>How</p></th>
          </tr>
          <tr>
              <td><p>Insert</p></td>
              <td><p>Toolbar grid or slash command</p></td>
          </tr>
          <tr>
              <td><p>Edit structure</p></td>
              <td><p>Bubble menu above the selection</p></td>
          </tr>
      </tbody>
  </table>
  <h2>Try It Out!</h2>
  <p>
      Type '/' to see available commands or use the toolbar above to format your
      content.
  </p>
  <img src="https://res.cloudinary.com/sham007/image/upload/v1737910103/ProfileImages/724shots_so.jpg" alt="Example image"
      width="100%" align="center" caption="SAAS landing page template" aspectratio="1.640340218712029" />
  <figure data-tiptap-video>
      <video
          src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          title="Product walkthrough"
          controls
          preload="metadata"
          style="max-width:100%"
      ></video>
      <figcaption>Embedded demo video</figcaption>
  </figure>
  <p>
      You can also add links like
      <a target="_blank" rel="noopener noreferrer nofollow" href="https://ehtisham.vercel.app">this one</a>
      and use text alignment options.
  </p>
  <pre><code class="language-javascript">// Example code block
const greeting = "Hello, World!";
console.log(greeting);</code></pre>
`;
