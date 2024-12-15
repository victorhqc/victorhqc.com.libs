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
npx tailwindcss -i ./src/photo-stack.css -o ./dist/photo-stack.css
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

The `PhotoStack` class accepts an options object as the first argument. The options object currently only accepts a `selector` property, which is the selector of the photos to be stacked.

```js
const stack = new PhotoStack({
  stackSelector: '#photos-stack',
  slideSelector: '.photo-slide',
  zAxisChange: 50,
  yAxisChange: 100,
});

await stack.init();
```
