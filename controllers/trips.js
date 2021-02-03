const Trips = require('../models/trip')

const fetch = require('node-fetch')
const unsplashJs = require('unsplash-js')
const unsplash = unsplashJs.createApi({
    accessKey: process.env.UNSPLASH_API_KEY,
    fetch,
  });

module.exports = {
    index,
    newTrip,
    addTrip,
    showTrip,
    updateTrip,
    delTrip,
}

function index(req, res) {

    Trips.find({ createdBy: req.user.id}).exec((err, userTrips) => {
    
        if (err) return console.log(err);

        const context = {
          trips: userTrips,
          user: req.user,
          currLink: 'yourTrips',
        }
        
        res.render('trips/index', context)
      })
  }

function newTrip(req, res) {

    const context = {
        user: req.user,
        currLink: 'newTrip',
    }

    res.render('trips/new', context)

}

function addTrip(req, res) {

    const newTripInfo = {
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        destination: req.body.destination,
        createdBy: req.user.id,
        stops: [],
    }

    Trips.create(newTripInfo, (err, newTrip) => {
        if (err) return console.log(err)
        getHeaderPic(newTrip)
        getLatLng(newTrip)
        res.redirect(`/trips/${newTrip._id}`)
    })


}


function showTrip(req, res) {

    Trips.findById(req.params.id, (err, foundTrip) => {
        if (err) return console.log(err)

        const dateRange = [];

        let currDate = foundTrip.startDate

        while (currDate < foundTrip.endDate) {
            dateRange.push(currDate)
            currDate = new Date(currDate.getTime() + 1000 * 60 * 60 * 24)
        }

        dateRange.push(foundTrip.endDate)

        const context = {
            trip: foundTrip,
            user: req.user,
            dateRange,
        }

        res.render('trips/show', context)
    } )
}

function updateTrip(req, res) {

    return

}

function delTrip(req, res) {
    
    Trips.findByIdAndDelete(req.params.id, (err, deletedTrip) => {
        if (err) return console.log(err)

        res.redirect('/trips')
    })

}

/* Helper Functions */

function getLatLng(newTrip) {
    
    const geocodeApiUrl = `http://www.mapquestapi.com/geocoding/v1/address?key=${process.env.MAPQUEST_API_KEY}&location=${newTrip.destination}`

    fetch(geocodeApiUrl)
    .then(res => res.json())
    .then(res => {
        newTrip.latLng = [res.results[0].locations[0].latLng.lat, res.results[0].locations[0].latLng.lng]
        newTrip.save(function(err) { 
            if (err) return console.log(err)
        })
        })

}

function getHeaderPic(newTrip) {

    const photoApiParams = {
        query: newTrip.destination,
        per_page: 1,
        orientation: 'landscape'
    }

    unsplash.search.getPhotos( photoApiParams ).then(result => {
        if (result.errors) {

            console.log('error occurred: ', result.errors[0]);

        } else {

            newTrip.headerPic  = result.response.results[0].urls.regular
            newTrip.save(function (err) {
                if (err) return console.log(err)
            })

        }
    })
}