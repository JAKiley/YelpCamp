const express = require("express");
const router = express.Router({ mergeParams: true });
const reviews = require("../controllers/reviews");

const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware");

// campground reviews
router.post("/", isLoggedIn, validateReview, reviews.createReview);

// Delete ID
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, reviews.deleteReview);

module.exports = router;
