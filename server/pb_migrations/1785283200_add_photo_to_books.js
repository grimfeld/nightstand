/// <reference path="../pb_data/types.d.ts" />

/**
 * A photo taken of the physical book, for works Open Library has no cover for
 * (or a terrible one). Stored on the record itself rather than as a URL: the
 * client shows `photo` when present and falls back to `cover_url`.
 */

migrate(
  (app) => {
    const books = app.findCollectionByNameOrId("books");

    books.fields.add(
      new Field({
        type: "file",
        name: "photo",
        maxSelect: 1,
        maxSize: 10485760,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
        thumbs: ["200x300"],
      }),
    );

    app.save(books);
  },

  (app) => {
    const books = app.findCollectionByNameOrId("books");
    books.fields.removeByName("photo");
    app.save(books);
  },
);
