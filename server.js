const DEBUG = true

// Distances entre planètes
var PLANETS_DISTANCES = []

// Liste des id des parties jouées
var GAMES = []

var PLANETS_ARRAY = []

// Pour attaquer une fois sur deux
var ATTACK


const log = (m1, m2) => DEBUG && console.log(m1, m2)


const CONST = {
    OWNER: { FREE: 0, ME: 1, OTHER: 2, },
    CLASS_PRIORITY: { "M": 0, "L": 1, "K": 2, "H": 3, "D": 4, "N": 5, "J": 6 },
    FLEET: { UNITS: { MIN: 3, INVALID: 0 } }
}

// c1 and c2 are coordinates as { x: float, y: float }
const compute_distance = (c1, c2) =>
    Math.sqrt(Math.pow(parseFloat(c1.x) - parseFloat(c2.x), 2) + Math.pow(parseFloat(c1.y) - parseFloat(c2.y), 2))

const planet_get_id = planet => planet.id
const planet_get_coordinates = planet => ({ x: planet.x, y: planet.y })
const planet_get_units = planet => planet.units
const planet_get_distances = planet => distances => distances.find(d => d.id == planet.id).distances
// const planet_get_owner = planet => planet.owner
// const planet_get_class = planet => planet.classe
// const planet_get_distance = id => planet => PLANETS_DISTANCES[planet.id][id]

//const planet_is_livable = planet => CONST.CLASS_PRIORITY[planet_get_class(planet)] < 4
const planet_belongs_to = owner => planet => planet.owner == owner
//const planet_belongs_to_noone = planet_belongs_to(CONST.OWNER.FREE)
const planet_belongs_to_me = planet_belongs_to(CONST.OWNER.ME)
//const planet_belongs_to_other = planet_belongs_to(CONST.OWNER.OTHER)
//const planet_dont_belongs_to_me = planet => planet.owner != CONST.OWNER.ME

//const compare_units = (a, b) => a - b
//const compare_distance = c0 => (c1, c2) => compute_distance(c0, c1) - compute_distance(c0, c2)

//const sort_by = compare_fn => array => array.sort(compare_fn)
//const sort_by_units = sort_by(compare_units)
//const sort_by_distance = planet => planets => sort_by(compare_distance(planet_get_coordinates(planet)))(planets)
const sort_by_distances = distances => distances.sort((d1, d2) => d1.distance - d2.distance)

const make_fleet = (units, source_id, target_id) => ( { "units": units, "source": source_id, "target": target_id } )
//const make_terraforming = planet_id => ( { "planet": planet_id } )
const make_order = (fleets_array, terraformings_array) => 
    ( { "fleets": fleets_array.filter(fleet => fleet.units >= CONST.FLEET.UNITS.MIN), 
        "terraformings": terraformings_array } )

//Computes distance graph - executed once
function make_graph(planets_array, cb) {
    var graph = []

    for (var i = 0; i < planets_array.length; i++) {
        var planet1 = planets_array[i]
        var distances = []

        for (var j = 0; j < planets_array.length; j++) {
            if (i != j) {
                var planet2 = planets_array[j]
                distances.push({ id: planet2.id, owner: planet2.owner, classe: planet2.classe, distance: compute_distance(planet_get_coordinates(planet1), planet_get_coordinates(planet2)) })
            }
        }
        graph.push({ id: planet1.id, owner: planet1.owner, classe: planet1.classe, distances: distances })
    }

    graph.map(one_planet => sort_by_distances(one_planet.distances))

    return cb(graph)
}


const get_owner = distance => planets_array =>
    planets_array.find(planet => planet.id == distance.id).owner

const get_population = distance => planets_array =>
    planets_array.find(planet => planet.id == distance.id).units
//const getfirst = planets_array => planets_array[0]

// Get the nearest planet which is not mine and livable
//const get_nearest_to_attack = planet => (planet_get_distances(planet)(PLANETS_DISTANCES).filter(planet_dont_belongs_to_me))
//.filter(planet_is_livable)

const under_attack = fleets => planet_id =>
    fleets.find(f => f.to == planet_id)


const make_array_order_from = my_planet => n_orders => planets => fleets =>
    planet_get_distances(my_planet)(PLANETS_DISTANCES)
        .filter(distance => get_owner(distance)(planets) != CONST.OWNER.ME || under_attack(fleets)(distance.id) && get_population(distance)(planets) < 20)
        .splice(0, n_orders)
        .map(p => make_fleet(
            planet_get_units(my_planet) > 25 ? parseInt(planet_get_units(my_planet) / 3)
                :   planet_get_units(my_planet) > 15 ? 3 
                    :   CONST.FLEET.UNITS.INVALID,
            planet_get_id(my_planet),
            planet_get_id(p) ) )
    


const fleets_attack_nearest_planet = my_planets => n_orders => planets_array => fleets =>
    [].concat(...my_planets.map(planet => make_array_order_from(planet)(n_orders)(planets_array)(fleets)))

const attack_from = my_planets => n_orders => planets_array => fleets =>
    fleets_attack_nearest_planet(my_planets)(n_orders)(planets_array)(fleets)


/*
TODO: different strategies :
  - attack : behind, center, sides, front, V shape
  - priorities to attack (nearest, farest)
*/
function make_orders(planets_array, my_planets, fleets, current_game_id, cb) {
    
    var orders = null

    // First round
    if (! GAMES.find(id => id == current_game_id)) {
        GAMES.push(current_game_id)
        
        ATTACK = true

        make_graph(planets_array, function(graph){ 
            
            PLANETS_DISTANCES = graph
            //log("PLANETS_DISTANCES", PLANETS_DISTANCES)
            
            // Attacks without any terraforming
            orders = make_order(attack_from(my_planets)(2)(planets_array)(fleets), [])
            cb(orders)
        })
    }
    else {
        
        // Attaque 1 coup sur 2
        if (ATTACK) {
            ATTACK = false
            // Attacks without any terraforming
            orders = make_order(attack_from(my_planets)(2)(planets_array)(fleets), [])
        }
        else {
            ATTACK = true
            orders = { "fleets": [], "terraformings": [] }
        }
        
        cb(orders)
        
    }
}



var express = require("express")
var app = express()
var bodyParser = require("body-parser")
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies



app.post("/", function (request, response) {

    PLANETS_ARRAY = request.body.planets
    var current_game_id = request.body.config.id
    
    var my_planets = PLANETS_ARRAY.filter(planet_belongs_to_me)
    
    log("my_planets", my_planets)
    
    /*
        log(request.body)
        var fleets_array = request.body.fleets
        var turns_left = request.body.config.maxTurn - request.body.config.turn
        var free_planets = PLANETS_ARRAY.filter(planet_belongs_to_noone)
        var other_planets = PLANETS_ARRAY.filter(planet_belongs_to_other)
        
        log("my_planets", my_planets)
        log("free_planets", free_planets)
        log("other_planets", other_planets)

        var fleets = [ make_fleet(101, 1, 5), make_fleet(102, 1, 10), make_fleet(150, 2, 15) ]
        var terraformings = [ make_terraforming(1), make_terraforming(5), make_terraforming(9), make_terraforming(15) ]
        var order = make_order(fleets, terraformings)
    */

    
    make_orders(PLANETS_ARRAY, my_planets, request.body.fleets, current_game_id, function (orders) {

        log("orders", orders)
        
        response.json(orders)
    })


})




var listener = app.listen(process.env.PORT, process.env.IP, function () {
    log("Your app is listening on", process.env.IP+"/"+listener.address().port)
})