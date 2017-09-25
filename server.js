const DEBUG = true

var PLANETS_DISTANCES = []

const UTILS = {
    log: (m1, m2) => DEBUG && console.log(m1, m2),
    // c1 and c2 are coordinates as { x: float, y: float }
    compute_distance: (c1, c2) =>
        Math.sqrt(Math.pow(parseFloat(c1.x) - parseFloat(c2.x), 2) + Math.pow(parseFloat(c1.y) - parseFloat(c2.y), 2)),

    sort_by: compare_fn => array => array.sort(compare_fn),
}

const PLANETS = {
    FILTER: {
        planet_id: id => planets => planets.find(p => p.id == id),
        free_planets: planets => planets.filter(PLANET.TEST.is_free),
        my_planets: planets => planets.filter(PLANET.TEST.is_mine),
        other_planets: planets => planets.filter(PLANET.TEST.is_other),
        //player_planets: player => planets => planets.filter(PLANET.TEST.belongs_to(player)),
    },
    CONST: {
        OWNER: { FREE: 0, ME: 1, OTHER: 2, },
        CLASS_PRIORITY: { "M": 0, "L": 1, "K": 2, "H": 3, "D": 4, "N": 5, "J": 6 },
    },
}

const PLANET = {
    GET: {
        id: planet => planet.id,
        owner: planet => planet.owner,
        coordinates: planet => ({ x: planet.x, y: planet.y }),
        population: planet => planet.units,
        class: planet => planet.classe,
        distances: planet => distances => distances.find(d => d.id == planet.id),
        distance: id => planet => PLANETS_DISTANCES[planet.id][id]
    },
    TEST: {
        is_livable: planet => PLANETS.CONST.CLASS_PRIORITY[planet.classe] < 4,
        belongs_to: owner => planet => planet.owner == owner,
        is_free: planet => planet.owner == PLANETS.CONST.OWNER.FREE,
        is_mine: planet => planet.owner == PLANETS.CONST.OWNER.ME,
        is_other: planet => planet.owner == PLANETS.CONST.OWNER.OTHER,
    },
}
/*
const COMPARE = {
    population: (a, b) => a - b,
    distance: c0 => (c1, c2) => UTILS.compute_distance(c0, c1) - UTILS.compute_distance(c0, c2),
}
*/

const SORT = {
    //population: UTILS.sort_by(COMPARE.population),
    //distance: planet => planets => UTILS.sort_by(COMPARE.distance(PLANET.GET.coordinates(planet)))(planets),
    distances: distances => distances.sort((d1, d2) => d1.distance - d2.distance),
}

const ORDER = {
    make_fleet: (units, source_id, target_id) => ( { "units": units, "source": source_id, "target": target_id } ),
    make_terraforming: planet_id => ( { "planet": planet_id } ),
    make_order: (fleets_array, terraformings_array) => ( { "fleets": fleets_array, "terraformings": terraformings_array } ),
}

//Computes distance graph - executed once
function make_graph(planets_array) {
    var graph = []

    for (var i = 0; i < planets_array.length; i++) {
        var planet1 = planets_array[i]
        var distances = []

        for (var j = 0; j < planets_array.length; j++) {
            if (i != j) {
                var planet2 = planets_array[j]
                distances.push({ id: planet2.id, distance: UTILS.compute_distance(PLANET.GET.coordinates(planet1), PLANET.GET.coordinates(planet2)) })
            }
        }
        graph.push({ id: planet1.id, distances: distances })
    }

    graph.map(one_planet => SORT.distances(one_planet.distances))

    return graph
}

// Get the nearest planet which is not mine and livable
const get_nearest_to_attack = planet =>
    PLANET.GET.distances(planet)(PLANETS_DISTANCES)
        .filter(p => ! PLANET.TEST.is_mine(p))
        .filter(p => PLANET.TEST.is_livable(p))[0]

const fleets_attack_nearest_planet = my_planets =>
    my_planets.map(planet => 
        ORDER.make_fleet(PLANET.GET.population / 2, PLANET.GET.id(planet), PLANET.GET.id(get_nearest_to_attack(planet)))
    )

const attack_from = my_planets =>
        fleets_attack_nearest_planet(my_planets)


/*
TODO: different strategies :
  - attack : behind, center, sides, front, V shape
  - priorities to attack (nearest, farest)
*/


var express = require("express")
var app = express()
var bodyParser = require("body-parser")
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

//app.use(express.static('public'));

var first_time = true

app.post("/", function (request, response) {
    var json = request.body
    UTILS.log(json)

    var planets_array = json.planets
    var fleets_array = json.fleets
    var turns_left = json.config.maxTurn - json.config.turn

    var my_planets = PLANETS.FILTER.my_planets(planets_array)
    var free_planets = PLANETS.FILTER.free_planets(planets_array)
    var other_planets = PLANETS.FILTER.other_planets(planets_array)
    
    UTILS.log("my_planets", my_planets)
    UTILS.log("free_planets", free_planets)
    UTILS.log("other_planets", other_planets)

    /*
    var json = { 
        planets: 
        [ 
            { id: 1,    
                x: 665.1466753684999,    
                y: 397.883483851,    
                owner: 0,    
                units: 52,    
                mu: 160,    
                gr: 4,    
                classe: 'J',    
                tr: null },    
            { id: 2,    
                x: 1229.5130151720002,    
                y: 81.6290483386,    
                owner: 1,    
                units: 145,    
                mu: 200,    
                gr: 5,    
                classe: 'M',    
                tr: null },    
            { id: 3,    
                x: 100.78033555850001,    
                y: 714.137919367,    
                owner: 2,    
                units: 75,    
                mu: 200,    
                gr: 5,    
                classe: 'M',    
                tr: null },    
            { id: 4,    
                x: 293.7982869367,    
                y: 375.132566836,    
                owner: 0,    
                units: 21,    
                mu: 80,    
                gr: 2,    
                classe: 'D',    
                tr: null },    
            { id: 5,    
                x: 1036.4950637924999,    
                y: 420.634400869,    
                owner: 0,    
                units: 21,    
                mu: 80,    
                gr: 2,    
                classe: 'D',    
                tr: null },    
            { id: 6,    
                x: 246.95357164465,    
                y: 752.7669677050001,    
                owner: 2,    
                units: 7,    
                mu: 120,    
                gr: 3,    
                classe: 'J',    
                tr: null },    
            { id: 7,    
                x: 1083.3397790865001,    
                y: 43,    
                owner: 0,    
                units: 39,    
                mu: 120,    
                gr: 3,    
                classe: 'J',    
                tr: null },    
            { id: 8,    
                x: 1110.3477686535,    
                y: 366.56067383799996,    
                owner: 0,    
                units: 65,    
                mu: 80,    
                gr: 2,    
                classe: 'D',    
                tr: null },    
            { id: 9,    
                x: 219.9455820796,    
                y: 429.206293867,    
                owner: 0,    
                units: 65,    
                mu: 80,    
                gr: 2,    
                classe: 'D',    
                tr: null },    
            { id: 10,    
                x: 610.45384964395,    
                y: 586.8611937430001,    
                owner: 0,    
                units: 20,    
                mu: 120,    
                gr: 3,    
                classe: 'H',    
                tr: null },    
            { id: 11,    
                x: 719.8395010885,    
                y: 208.90577396289999,    
                owner: 0,    
                units: 20,    
                mu: 120,    
                gr: 3,    
                classe: 'H',    
                tr: null },    
            { id: 12,    
                x: 150.90328294405,    
                y: 154.0203814063,    
                owner: 0,    
                units: 9,    
                mu: 40,    
                gr: 1,    
                classe: 'K',    
                tr: null },    
            { id: 13,    
                x: 1179.3900677845002,    
                y: 641.746586299,    
                owner: 0,    
                units: 9,    
                mu: 40,    
                gr: 1,    
                classe: 'K',    
                tr: null },    
            { id: 14,    
                x: 398.74285704954997,    
                y: 556.045477309,    
                owner: 0,    
                units: 68,    
                mu: 200,    
                gr: 5,    
                classe: 'M',    
                tr: null },    
            { id: 15,    
                x: 931.5504936789999,    
                y: 239.72149039689998,    
                owner: 0,    
                units: 68,    
                mu: 200,    
                gr: 5,    
                classe: 'M',    
                tr: null },    
            { id: 16,    
                x: 859.4679424240001,    
                y: 496.05748564600003,    
                owner: 0,    
                units: 37,    
                mu: 200,    
                gr: 5,    
                classe: 'M',    
                tr: null },    
            { id: 17,    
                x: 470.82540830519997,    
                y: 299.70948205959996,    
                owner: 0,    
                units: 37,    
                mu: 200,    
                gr: 5,    
                classe: 'M',    
                tr: null },    
            { id: 18,    
                x: 121.47492773,    
                y: 291.7444243384,    
                owner: 0,    
                units: 52,    
                mu: 160,    
                gr: 4,    
                classe: 'K',    
                tr: null },    
            { id: 19,    
                x: 1208.8184230005002,    
                y: 504.022543366,    
                owner: 0,    
                units: 52,    
                mu: 160,    
                gr: 4,    
                classe: 'K',    
                tr: null },    
            { id: 20,    
                x: 1323.7933507305,    
                y: 635.57063359,    
                owner: 0,    
                units: 50,    
                mu: 160,    
                gr: 4,    
                classe: 'K',    
                tr: null },    
            { id: 21,    
                x: 6.5,    
                y: 160.19633411499998,    
                owner: 0,    
                units: 50,    
                mu: 160,    
                gr: 4,    
                classe: 'K',    
                tr: null },    
            { id: 22,    
                x: 240.82369034425,    
                y: 518.885306767,    
                owner: 0,    
                units: 29,    
                mu: 80,    
                gr: 2,    
                classe: 'D',    
                tr: null },    
            { id: 23,    
                x: 1089.4696603895,    
                y: 276.8816609371,    
                owner: 0,    
                units: 29,    
                mu: 80,    
                gr: 2,    
                classe: 'D',    
                tr: null } 
        ],    
        fleets: [ { owner: 2, units: 30, from: 3, to: 22, turns: 12, left: 10 } ],    
        config: { id: 23, turn: 9, maxTurn: 200 } 
    }
    */


    if (first_time) {
        PLANETS_DISTANCES = make_graph(planets_array)
        UTILS.log("Distances from every planets", PLANETS_DISTANCES)
        first_time = false
    }

    /*
    var planet1 = PLANETS.FILTER.planet_id(1)(planets_array)
    UTILS.log("PLANET.TEST.is_livable(planet1)", PLANET.TEST.is_livable(planet1))
    UTILS.log("planets_array", planets_array)
    UTILS.log("planet1", planet1)
    UTILS.log("PLANET.GET.distances(planet1)", PLANET.GET.distances(planet1)(PLANETS_DISTANCES))
    UTILS.log("PLANET.GET.distance(2)(planet1)", PLANET.GET.distance(2)(planet1))
    UTILS.log("SORT.distance(planet1)(planets_array)", SORT.distance(planet1)(planets_array))
    */

    /*
    var order_example = { 
        "fleets": [ { "units": 50, "source": 1, "target": 17 }, { "units": 50, "source": 4, "target": 17 } ],
        "terraformings": [ { "planet": 1 } ]
    }

    var fleets = [ ORDER.make_fleet(101, 1, 5), ORDER.make_fleet(102, 1, 10), ORDER.make_fleet(150, 2, 15) ]
    var terraformings = [ ORDER.make_terraforming(1), ORDER.make_terraforming(5), ORDER.make_terraforming(9), ORDER.make_terraforming(15) ]
    var order = ORDER.make_order(fleets, terraformings)
    UTILS.log("order", order)
    */
   
    // Attacks without any terraforming
    var res = ORDER.make_order(attack_from(my_planets), [])
  
    response.json({ res })
})




var listener = app.listen(process.env.PORT, function () {
    UTILS.log("Your app is listening on port " + listener.address().port)
})