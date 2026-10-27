const Campground = require("../models/campground");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

// Look up a location with Mapbox. Returns a GeoJSON point, or null if nothing matched.
async function geocodeLocation(location) {
  const geoData = await geocoder
    .forwardGeocode({
      query: location,
      limit: 1,
    })
    .send();
  const feature = geoData.body.features[0];
  return feature ? feature.geometry : null;
}

// Remove photos that were uploaded to Cloudinary for a save that is being abandoned.
async function removeUploads(files = []) {
  for (const f of files) {
    await cloudinary.uploader.destroy(f.filename);
  }
}

module.exports.index = async (req, res) => {
  const campgrounds = await Campground.paginate(
    {},
    {
      page: req.query.page || 1,
      limit: 10,
      sort: "_id",
    }
  );
  campgrounds.page = Number(campgrounds.page);
  let totalPages = campgrounds.totalPages;
  let currentPage = campgrounds.page;
  let startPage;
  let endPage;

  if (totalPages <= 10) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (currentPage <= 6) {
      startPage = 1;
      endPage = 10;
    } else if (currentPage + 4 >= totalPages) {
      startPage = totalPages - 9;
      endPage = totalPages;
    } else {
      startPage = currentPage - 5;
      endPage = currentPage + 4;
    }
  }
  res.render("campgrounds/index", {
    campgrounds,
    startPage,
    endPage,
    currentPage,
    totalPages,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res, next) => {
  const geometry = await geocodeLocation(req.body.campground.location);
  if (!geometry) {
    await removeUploads(req.files);
    req.flash(
      "error",
      `Could not find "${req.body.campground.location}" on the map. Please check the location and try again.`
    );
    return res.redirect("/campgrounds/new");
  }
  const campground = new Campground(req.body.campground);
  campground.geometry = geometry;
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.author = req.user._id;
  await campground.save();
  req.flash("success", "Successfully made a new campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  if (!campground) {
    req.flash("error", "Cannot find that campground!");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "Cannot find that campground!");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  // Look the location up again on every save, so the map pin follows the location text.
  const geometry = await geocodeLocation(req.body.campground.location);
  if (!geometry) {
    await removeUploads(req.files);
    req.flash(
      "error",
      `Could not find "${req.body.campground.location}" on the map. Please check the location and try again.`
    );
    return res.redirect(`/campgrounds/${id}/edit`);
  }
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
    geometry,
  });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  campground.images.push(...imgs);
  await campground.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash("success", "Successfully updated campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted campground");
  res.redirect("/campgrounds");
};
