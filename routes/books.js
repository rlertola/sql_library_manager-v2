const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

/*
GET list of books, limit 10 per page.
Home route redirects to /books/page/1 (this is for exceeds expectations grade).
Books are in alpha order by author, then title.
*/
router.get("/page" + "/:pageNumber", (req, res, next) => {
  let pageNumber = req.params.pageNumber;
  let limit = 10;
  let offset = limit * (pageNumber - 1);
  let length;

  // For adding the page links.
  Book.findAll().then(books => {
    length = books.length;
  });
  Book.findAll({
    order: [["author", "ASC"], ["title", "ASC"]],
    offset,
    limit
  })
    .then(books => {
      const numberOfPages = Math.ceil(length / 10);
      res.render("index", {
        books,
        title: "My Awesome Book Library",
        numberOfPages,
        pageNumber,
        page: "Page",
        libraryTitle: "Books"
      });
    })
    .catch(err => res.send(500));
});

// POST search for books. Searches all columns.
router.post("/search", (req, res) => {
  let searchTerm = req.body.searchTerm;

  Book.findAll({
    where: {
      [Op.or]: {
        title: {
          [Op.like]: `%${searchTerm}%`
        },
        author: {
          [Op.like]: `%${searchTerm}%`
        },
        genre: {
          [Op.like]: `%${searchTerm}%`
        },
        year: {
          [Op.like]: `%${searchTerm}%`
        }
      }
    },
    order: [["title", "ASC"]]
  })
    .then(books =>
      res.render("index", { books: books, libraryTitle: `← Books` })
    )
    .catch(err => res.send(500));
});

// GET create new book form.
router.get("/new", (req, res, next) => {
  res.render("new-book", { book: Book.build(), title: "New Book" });
});

// POST new book to database. Checks for validation on title and author.
router.post("/", (req, res, next) => {
  Book.create(req.body)
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      if (err.name === "SequelizeValidationError") {
        let book = Book.build(req.body);
        res.render("new-book", {
          book,
          title: "Edit Book (new book)",
          errors: err.errors
        });
      } else {
        throw err;
      }
    })
    .catch(err => res.send(500));
});

// GET book detail form. Renders error page if book id not available.
router.get("/:id", (req, res, next) => {
  const id = req.params.id;
  Book.findById(id)
    .then(book => {
      if (book) {
        res.render("book-detail", { book });
      } else {
        let err = new Error("Book Not found");
        err.status = 500;
        next(err);
      }
    })
    .catch(err => res.send(err.status));
});

// POST edit book info in database. Also validates title and author.
router.post("/:id", (req, res, next) => {
  const id = req.params.id;
  Book.findById(id)
    .then(book => {
      if (book) {
        return book.update(req.body);
      } else {
        res.send(404);
      }
    })
    .then(book => {
      res.redirect("/");
    })
    .catch(err => {
      if (err.name === "SequelizeValidationError") {
        let book = Book.build(req.body);
        book.id = id;
        res.render("book-detail", {
          book,
          title: "Edit Book",
          errors: err.errors
        });
      } else {
        throw err;
      }
    })
    .catch(err => res.send(500));
});

// GET delete-confirmation form.
router.get("/:id/delete", (req, res, next) => {
  const id = req.params.id;
  Book.findById(id)
    .then(book => {
      if (book) {
        res.render("delete-confirm", { book, title: "Delete Book" });
      } else {
        res.send(404);
      }
    })
    .catch(err => send(500));
});

// POST deletes a book.
router.delete("/:id", (req, res, next) => {
  const id = req.params.id;
  Book.findById(id)
    .then(book => {
      if (book) {
        return book.destroy();
      } else {
        res.send(404);
      }
    })
    .then(() => {
      res.redirect("/");
    })
    .catch(err => res.send(500));
});

module.exports = router;
