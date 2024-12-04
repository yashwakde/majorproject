const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken:mapToken });
 
module.exports.index = async (req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};


module.exports.renderNewForm =(req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews",populate:{path:"author"}}).populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for doesn't exist!");
        res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing});
};


module.exports.createListing = async (req, res ,next) => {
 let response = await  geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
        .send();
        
let url = req.file.path;
let filename = req.file.filename;
     
    // Yahan hum ensure kar rahe hain ki image field empty na ho

const newListing = new Listing({
   ...req.body.listing,
   image: req.body.listing.image || { 
       filename: "default.jpg", // Default filename agar image provide nahi hota
       url: "https://images.unsplash.com/photo-1585543805890-6051f7829f98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJlYWNoJTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60" // Default URL agar image provide nahi hota
   }
});

newListing.owner = req.user._id;
newListing.image = {url,filename};
newListing.geometry = response.body.features[0].geometry;
  let savedListing =  await newListing.save();
  console.log(savedListing);
req.flash("success","New Listing created!");
res.redirect("/listings");

};

module.exports.editLisiting = async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for doesn't exist!");
        res.redirect("/listings");
    }
    let OriginalImageUrl = listing.image.url;
     OriginalImageUrl = OriginalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,OriginalImageUrl});
    };
    

   module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    // Check if image data exists before updating
    const updatedData = { ...req.body.listing };
    if (req.body.listing && req.body.listing.image) {
        updatedData.image = {
            filename: req.body.listing.image.filename,
            url: req.body.listing.image.url
        };
    }

    // Find and update the listing
    let listing = await Listing.findByIdAndUpdate(id, updatedData, { new: true });

    // If a new file is uploaded, update the image details
    if (typeof req.file !== "undefined" && req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    // Flash a success message and redirect to the listing page
    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
};

     module.exports.deleteListing =async (req,res)=>{
            let {id}= req.params;
            let deletedlisting = await Listing.findByIdAndDelete(id);
            console.log(deletedlisting);
            req.flash("success"," Listing deleted!");
            
            res.redirect("/listings");  
            };