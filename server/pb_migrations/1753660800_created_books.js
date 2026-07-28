/// <reference path="../pb_data/types.d.ts" />

/**
 * The books collection. Two choices worth explaining:
 *
 * 1. Dates are `text`, not PocketBase `date` fields. These are calendar days
 *    ("I finished it on the 14th"), not instants. PocketBase date fields
 *    serialise as timestamps with a timezone, which would make `finished_on`
 *    drift across a date boundary depending on where I happen to be standing.
 *
 * 2. `slot` uses 0 rather than null for "in the backlog". PocketBase coerces
 *    empty numbers to 0, so the client treats 0 and null identically instead of
 *    pretending a distinction the storage layer won't keep.
 *
 * The five-slot cap is NOT enforced here — collection rules can't count sibling
 * records. It lives in the client. Since there is exactly one user, that is
 * sufficient; a second user would need a hook in pb_hooks.
 */

const DAY = "^$|^\\d{4}-\\d{2}-\\d{2}$";

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    const books = new Collection({
      type: "base",
      name: "books",

      // One user, and every rule says so.
      listRule: "owner = @request.auth.id",
      viewRule: "owner = @request.auth.id",
      createRule: "owner = @request.auth.id",
      updateRule: "owner = @request.auth.id",
      deleteRule: "owner = @request.auth.id",

      fields: [
        {
          type: "relation",
          name: "owner",
          required: true,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { type: "text", name: "title", required: true, max: 500 },
        { type: "text", name: "author", max: 300 },
        // Open Library *work* key, e.g. /works/OL27448W. Identity for dedupe.
        { type: "text", name: "work_key", max: 100 },
        { type: "text", name: "cover_url", max: 500 },
        { type: "number", name: "pages", min: 0, onlyInt: true },
        { type: "number", name: "year", min: 0, onlyInt: true },

        {
          type: "select",
          name: "acquisition",
          required: true,
          maxSelect: 1,
          values: ["WANTED", "OWNED", "BORROWED", "GONE"],
        },
        {
          type: "select",
          name: "engagement",
          required: true,
          maxSelect: 1,
          values: ["UNREAD", "READING", "READ", "ABANDONED"],
        },

        { type: "bool", name: "studied" },
        { type: "text", name: "reason", max: 2000 },

        { type: "number", name: "slot", min: 0, max: 5, onlyInt: true },

        { type: "text", name: "added_on", pattern: DAY },
        { type: "text", name: "acquired_on", pattern: DAY },
        { type: "text", name: "slotted_on", pattern: DAY },
        { type: "text", name: "started_on", pattern: DAY },
        { type: "text", name: "finished_on", pattern: DAY },

        { type: "autodate", name: "created", onCreate: true },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],

      indexes: [
        // Work-level uniqueness: the same work cannot be added twice, whichever
        // edition it was found through. Partial, because books added by hand
        // have no work_key and several of them may coexist.
        "CREATE UNIQUE INDEX idx_books_owner_work ON books (owner, work_key) WHERE work_key != ''",
        "CREATE INDEX idx_books_owner_slot ON books (owner, slot)",
      ],
    });

    app.save(books);
  },

  (app) => {
    app.delete(app.findCollectionByNameOrId("books"));
  },
);
