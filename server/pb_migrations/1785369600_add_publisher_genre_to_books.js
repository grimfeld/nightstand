/// <reference path="../pb_data/types.d.ts" />

/**
 * Descriptive metadata for the book page. Both are plain text and both are
 * cosmetic: they never participate in identity, dedupe, or any transition.
 * Auto-filled from Open Library at add time, editable afterwards.
 */

migrate(
  (app) => {
    const books = app.findCollectionByNameOrId("books");

    books.fields.add(new Field({ type: "text", name: "publisher", max: 300 }));
    books.fields.add(new Field({ type: "text", name: "genre", max: 300 }));

    app.save(books);
  },

  (app) => {
    const books = app.findCollectionByNameOrId("books");
    books.fields.removeByName("publisher");
    books.fields.removeByName("genre");
    app.save(books);
  },
);
