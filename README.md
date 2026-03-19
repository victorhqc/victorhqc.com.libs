# victorhqc.com.libs

Web Libraries for my personal Website

## Development

### Requirements

- Deno >= 2.0
- Node >= 16.0 (For Minifying)

### Building

```sh
deno run --allow-env --allow-read --allow-write --allow-run ./bundle.ts
npx terser dist/photo-stack.js -o dist/photo-stack.min.js -c -m
npx terser dist/blurhash-canvas.js -o dist/blurhash-canvas.min.js -c -m
npx tailwindcss -i ./src/photo-stack/styles.css -o ./dist/photo-stack.css
```

## Photo Stack

This creates a simple animation of photo stacks. It is inspired by [Swiper.js](https://swiperjs.com)

### Usage

```html
<div id="photos-stack">
  <div class="photo-slide">
    <img src="https://picsum.photos/id/1001/200/300" />
  </div>
  <div class="photo-slide">
    <img src="https://picsum.photos/id/1002/200/300" />
  </div>
  <div class="photo-slide">
    <img src="https://picsum.photos/id/1003/200/300" />
  </div>
  <div class="photo-slide">
    <img src="https://picsum.photos/id/1004/200/300" />
  </div>
</div>
```

Then, in your JavaScript file, you can initialize the stack:

```js
const stack = new PhotoStack();
await stack.init();
```

### Options

The `PhotoStack` class accepts an options object as the first argument. The options
object currently only accepts a `selector` property, which is the selector of the photos to be stacked.

```js
const stack = new PhotoStack({
  stackSelector: "#photos-stack",
  slideSelector: ".photo-slide",
  zAxisChange: 50,
  yAxisChange: 100,
});

await stack.init();
```

## Blurhash Canvas

Renders [BlurHash](https://blurha.sh) placeholders into canvas elements. Useful for showing a
smooth, gradient-like preview while full images load.

### Usage

Add a `data-blurhash` attribute to any container element. The library will insert a `<canvas>`
as the first child with the decoded placeholder.

```html
<div
  data-blurhash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
  data-blurhash-width="300"
  data-blurhash-height="200"
>
  <img src="https://example.com/photo.jpg" />
</div>
```

Then initialize:

```js
const bh = new BlurhashCanvas();
bh.init();
```

To scan a subtree (e.g. after HTMX swaps new content):

```js
bh.init(document.querySelector("#new-content"));
```

### Options

| Option       | Default             | Description                                                                                                                    |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `selector`   | `"[data-blurhash]"` | CSS selector for elements to process                                                                                           |
| `resolution` | `32`                | Decode width in pixels (height is derived from the element's aspect ratio). Kept small since the browser scales it up via CSS. |

### Data Attributes

| Attribute              | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| `data-blurhash`        | The blurhash string to decode                                   |
| `data-blurhash-width`  | Target width (falls back to element width)                      |
| `data-blurhash-height` | Target height (falls back to element height)                    |
| `data-blurhash-class`  | CSS class for the inserted canvas (default `"blurhash-canvas"`) |
