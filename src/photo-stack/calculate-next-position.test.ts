import { expect } from "jsr:@std/expect";
import { calculateNextPosition } from "./calculate-next-position.ts";
import { Direction, PhotoPosition } from "./types.ts";

/*
To represent the movements of the stack, a tree-like structure can be used.
An example can be described with the following case:
- 3 Photos exist in the stack: @ Card, # Card and $ Card.
- Each card exist in a position of the stack, where 2 means is on top, and 0 is at the bottom.
  2 because corresponds to 3 (the length of the stack) minus one.
- When the card in the tree is left to its parent, the position corresponds to "Below"
- When the card in the tree is right to its parent, the position corresponds to "Above".

The following is the initial position of the stack:
```
[
  { element: @, i: 2, prevI: null, position: "ON_TOP" },
  { element: #, i: 1, prevI: null, position: "BELOW" },
  { element: $, i: 0, prevI: null, position: "BELOW" },
]
````
And can be expresseda as following:

          @
        /
      #
    /
  $
*/

Deno.test("calculateNestPosition", async (t) => {
  await t.step("Should move DOWN", () => {
    /*
    CURRENT STATE
              @
            /
          #
        /
      $
    NEXT STATE
             $
           /
         @
       /
     #
    */

    const initial: PhotoPosition<string>[] = [
      { element: "@", i: 2, prevI: 1, len: 2, pos: "T", prevPos: "A" },
      { element: "#", i: 1, prevI: 2, len: 2, pos: "B", prevPos: "T" },
      { element: "$", i: 0, prevI: 1, len: 2, pos: "B", prevPos: "B" },
    ];

    const poss = recalculate(initial, "DOWN");

    expect(poss).toEqual([
      { element: "@", i: 1, prevI: 2, len: 2, pos: "B", prevPos: "T" },
      { element: "#", i: 0, prevI: 1, len: 2, pos: "B", prevPos: "B" },
      { element: "$", i: 2, prevI: 0, len: 2, pos: "T", prevPos: "B" },
    ]);
  });

  await t.step("Should move UP", () => {
    /*
    When changing pos, it serves to imagine it as a conveyor belt or the cards
    tied with an imaginary rope, in this casee. The $ will fall "Above"

    CURRENT STATE
             $
           /
         @
       /
     #

    NEXT SATE
              @
            /   \
          #       $
    */

    const initial: PhotoPosition<string>[] = [
      { element: "@", i: 1, prevI: 2, len: 2, pos: "B", prevPos: "T" },
      { element: "#", i: 0, prevI: 1, len: 2, pos: "B", prevPos: "B" },
      { element: "$", i: 2, prevI: 0, len: 2, pos: "T", prevPos: "B" },
    ];

    const poss = recalculate(initial, "UP");

    expect(poss).toEqual([
      { element: "@", i: 2, prevI: 1, len: 2, pos: "T", prevPos: "B" },
      { element: "#", i: 1, prevI: 0, len: 2, pos: "B", prevPos: "B" },
      { element: "$", i: 1, prevI: 2, len: 2, pos: "A", prevPos: "T" },
    ]);
  });

  await t.step("Keep moving UP", () => {
    /*
    CURRENT STATE
              @
            /   \
          #       $

    NEXT STATE
              #
                \
                  @
                    \
                      $
    */

    const initial: PhotoPosition<string>[] = [
      { element: "@", i: 2, prevI: 1, len: 2, pos: "T", prevPos: "B" },
      { element: "#", i: 1, prevI: 0, len: 2, pos: "B", prevPos: "B" },
      { element: "$", i: 1, prevI: 2, len: 2, pos: "A", prevPos: "T" },
    ];

    const poss = recalculate(initial, "UP");

    expect(poss).toEqual([
      { element: "@", i: 1, prevI: 2, len: 2, pos: "A", prevPos: "T" },
      { element: "#", i: 2, prevI: 1, len: 2, pos: "T", prevPos: "B" },
      { element: "$", i: 0, prevI: 1, len: 2, pos: "A", prevPos: "A" },
    ]);
  });

  await t.step("UP Again", () => {
    /*
    CURRENT STATE
              #
                \
                  @
                    \
                      $
    NEXT STATE
              $
                \
                  #
                    \
                      @
    */

    const initial: PhotoPosition<string>[] = [
      { element: "@", i: 1, prevI: 2, len: 2, pos: "A", prevPos: "T" },
      { element: "#", i: 2, prevI: 1, len: 2, pos: "T", prevPos: "B" },
      { element: "$", i: 0, prevI: 1, len: 2, pos: "A", prevPos: "A" },
    ];

    const poss = recalculate(initial, "UP");

    expect(poss).toEqual([
      { element: "@", i: 0, prevI: 1, len: 2, pos: "A", prevPos: "A" },
      { element: "#", i: 1, prevI: 2, len: 2, pos: "A", prevPos: "T" },
      { element: "$", i: 2, prevI: 0, len: 2, pos: "T", prevPos: "A" },
    ]);
  });

  await t.step("Moves DOWN", () => {
    /*
    CURRENT STATE
              $
                \
                  #
                    \
                      @
    NEXT STEP
              #
            /   \
          $       @
    */

    const initial: PhotoPosition<string>[] = [
      { element: "@", i: 0, prevI: 1, len: 2, pos: "A", prevPos: "A" },
      { element: "#", i: 1, prevI: 2, len: 2, pos: "A", prevPos: "T" },
      { element: "$", i: 2, prevI: 0, len: 2, pos: "T", prevPos: "A" },
    ];

    const poss = recalculate(initial, "DOWN");

    expect(poss).toEqual([
      { element: "@", i: 1, prevI: 0, len: 2, pos: "A", prevPos: "A" },
      { element: "#", i: 2, prevI: 1, len: 2, pos: "T", prevPos: "A" },
      { element: "$", i: 1, prevI: 2, len: 2, pos: "B", prevPos: "T" },
    ]);
  });

  function recalculate(
    positions: PhotoPosition<string>[],
    direction: Direction,
  ) {
    const one = calculateNextPosition<string>(
      positions,
      "@",
      direction,
    );
    const two = calculateNextPosition<string>(
      positions,
      "#",
      direction,
    );
    const three = calculateNextPosition<string>(
      positions,
      "$",
      direction,
    );

    return [one, two, three];
  }
});
