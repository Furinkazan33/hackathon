const DEBUG = true

// Distances entre planètes
var PLANETS_DISTANCES = []

// Liste des id des parties jouées
var GAMES = []

// Pour attaquer une fois sur deux
var ATTACK


const UTILS = {
    log: (m1, m2) => DEBUG && console.log(m1, m2),
    // c1 and c2 are coordinates as { x: float, y: float }
    compute_distance: (c1, c2) =>
        Math.sqrt(Math.pow(parseFloat(c1.x) - parseFloat(c2.x), 2) + Math.pow(parseFloat(c1.y) - parseFloat(c2.y), 2)),

    sort_by: compare_fn => array => array.sort(compare_fn),
}

const CONST = {
    OWNER: { FREE: 0, ME: 1, OTHER: 2, },
    CLASS_PRIORITY: { "M": 0, "L": 1, "K": 2, "H": 3, "D": 4, "N": 5, "J": 6 },
    FLEET: { UNITS: { MIN: 3, INVALID: 0 } }
}

const PLANET = {
    GET: {
        id: planet => planet.id,
        owner: planet => planet.owner,
        coordinates: planet => ({ x: planet.x, y: planet.y }),
        population: planet => planet.units,
        class: planet => planet.classe,
        distances: planet => distances => distances.find(d => d.id == planet.id).distances,
        distance: id => planet => PLANETS_DISTANCES[planet.id][id]
    },
    TEST: {
        is_livable: planet => CONST.CLASS_PRIORITY[planet.classe] < 4,
        belongs_to: owner => planet => planet.owner == owner,
        is_free: planet => planet.owner == CONST.OWNER.FREE,
        is_mine: planet => planet.owner == CONST.OWNER.ME,
        is_other: planet => planet.owner == CONST.OWNER.OTHER,
        is_not_mine: planet => planet.owner != CONST.OWNER.ME,
    },
}

const PLANETS = {
    FILTER: {
        planet_id: id => planets => planets.find(p => p.id == id),
        free_planets: planets => planets.filter(PLANET.TEST.is_free),
        my_planets: planets => planets.filter(PLANET.TEST.is_mine),
        other_planets: planets => planets.filter(PLANET.TEST.is_other),
    },
    
}

const COMPARE = {
    population: (a, b) => a - b,
    distance: c0 => (c1, c2) => UTILS.compute_distance(c0, c1) - UTILS.compute_distance(c0, c2),
}


const SORT = {
    population: UTILS.sort_by(COMPARE.population),
    distance: planet => planets => UTILS.sort_by(COMPARE.distance(PLANET.GET.coordinates(planet)))(planets),
    distances: distances => distances.sort((d1, d2) => d1.distance - d2.distance),
}

const ORDER = {
    make_fleet: (units, source_id, target_id) => ( { "units": units, "source": source_id, "target": target_id } ),
    make_terraforming: planet_id => ( { "planet": planet_id } ),
    make_order: (fleets_array, terraformings_array) => 
        ( { "fleets": fleets_array.filter(fleet => fleet.units >= CONST.FLEET.UNITS.MIN), 
            "terraformings": terraformings_array } ),
}

//Computes distance graph - executed once
function make_graph(planets_array, cb) {
    var graph = []

    for (var i = 0; i < planets_array.length; i++) {
        var planet1 = planets_array[i]
        var distances = []

        for (var j = 0; j < planets_array.length; j++) {
            if (i != j) {
                var planet2 = planets_array[j]
                distances.push({ id: planet2.id, owner: planet2.owner, classe: planet2.classe, distance: UTILS.compute_distance(PLANET.GET.coordinates(planet1), PLANET.GET.coordinates(planet2)) })
            }
        }
        graph.push({ id: planet1.id, owner: planet1.owner, classe: planet1.classe, distances: distances })
    }

    graph.map(one_planet => SORT.distances(one_planet.distances))

    return cb(graph)
}


const get_owner = distance => planets_array =>
    planets_array.find(planet => planet.id == distance.id).owner

const get_population = distance => planets_array =>
    planets_array.find(planet => planet.id == distance.id).units
//const getfirst = planets_array => planets_array[0]

// Get the nearest planet which is not mine and livable
//const get_nearest_to_attack = planet => (PLANET.GET.distances(planet)(PLANETS_DISTANCES).filter(PLANET.TEST.is_not_mine))
        //.filter(p => PLANET.TEST.is_livable(p))

const make_array_order_from = my_planet => n_orders => planets =>
    PLANET.GET.distances(my_planet)(PLANETS_DISTANCES)
        .filter(distance => get_owner(distance)(planets) != CONST.OWNER.ME || get_population(distance)(planets) < 20)
        .splice(0, n_orders)
        .map(p => ORDER.make_fleet(
                    PLANET.GET.population(my_planet) > 25 ? parseInt(PLANET.GET.population(my_planet) / 3)
                    :   PLANET.GET.population(my_planet) > 15 ? 3 
                    :   CONST.FLEET.UNITS.INVALID,
                    PLANET.GET.id(my_planet),
                    PLANET.GET.id(p) ) )

    


const fleets_attack_nearest_planet = my_planets => n_orders => planets_array =>
    [].concat(...my_planets.map(planet => make_array_order_from(planet)(n_orders)(planets_array)))

const attack_from = my_planets => n_orders => planets_array =>
    fleets_attack_nearest_planet(my_planets)(n_orders)(planets_array)


/*
TODO: different strategies :
  - attack : behind, center, sides, front, V shape
  - priorities to attack (nearest, farest)
*/
function make_orders(planets_array, my_planets, current_game_id, cb) {
    
    var orders = null

    // First round
    if (! GAMES.find(id => id == current_game_id)) {
        GAMES.push(current_game_id)
        
        ATTACK = true

        make_graph(planets_array, function(graph){ 
            
            PLANETS_DISTANCES = graph

            //UTILS.log("Distances from every planets", graph)
            
            /*
                var planet1 = PLANETS.FILTER.planet_id(1)(planets_array)
                UTILS.log("PLANET.TEST.is_livable(planet1)", PLANET.TEST.is_livable(planet1))
                UTILS.log("planets_array", planets_array)
                UTILS.log("planet1", planet1)
                UTILS.log("PLANET.GET.distances(planet1)", PLANET.GET.distances(planet1)(graph))
                UTILS.log("PLANET.GET.distance(2)(planet1)", PLANET.GET.distance(2)(planet1))
                UTILS.log("SORT.distance(planet1)(planets_array)", SORT.distance(planet1)(planets_array))
            */

            // Attacks without any terraforming
            orders = ORDER.make_order(attack_from(my_planets)(2)(planets_array), [])
            cb(orders)
        })
    }
    else {
        
        // Attaque 1 coup sur 2
        if (ATTACK) {
            ATTACK = false
            // Attacks without any terraforming
            orders = ORDER.make_order(attack_from(my_planets)(2)(planets_array), [])
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

    var planets_array = request.body.planets
    var current_game_id = request.body.config.id
    
    var my_planets = PLANETS.FILTER.my_planets(planets_array)
    
    UTILS.log("my_planets", my_planets)
    
    /*
        UTILS.log(request.body)
        var fleets_array = request.body.fleets
        var turns_left = request.body.config.maxTurn - request.body.config.turn
        var free_planets = PLANETS.FILTER.free_planets(planets_array)
        var other_planets = PLANETS.FILTER.other_planets(planets_array)
        
        UTILS.log("my_planets", my_planets)
        UTILS.log("free_planets", free_planets)
        UTILS.log("other_planets", other_planets)

        var fleets = [ ORDER.make_fleet(101, 1, 5), ORDER.make_fleet(102, 1, 10), ORDER.make_fleet(150, 2, 15) ]
        var terraformings = [ ORDER.make_terraforming(1), ORDER.make_terraforming(5), ORDER.make_terraforming(9), ORDER.make_terraforming(15) ]
        var order = ORDER.make_order(fleets, terraformings)
    */

    
    make_orders(planets_array, my_planets, current_game_id, function (orders) {

        UTILS.log("orders", orders)
        
        response.json(orders)
    })


})




var listener = app.listen(process.env.PORT, process.env.IP, function () {
    UTILS.log("Your app is listening on", process.env.IP+"/"+listener.address().port)
})