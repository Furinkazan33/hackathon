
const UTILS = {
    // c1 and c2 are coordinates as { x: float, y: float }
    compute_distance: (c1, c2) =>
        Math.sqrt(Math.pow(parseFloat(c1.x) - parseFloat(c2.x), 2) + Math.pow(parseFloat(c1.y) - parseFloat(c2.y), 2)),

    sort_by: compare_fn => array => array.sort(compare_fn),
}

/*
 * Filters and constants
 */
const PLANETS = {
    FILTER: {
        planet_id: id => planets => planets.find(p => p.id == id),
        free_planets: planets => planets.filter(PLANET.TEST.is_free),
        my_planets: planets => planets.filter(PLANET.TEST.is_mine),
        other_planets: planets => planets.filter(PLANET.TEST.belongs_to_other),
        //player_planets: player => planets => planets.filter(PLANET.TEST.belongs_to(player)),
    },
    CONST: {
        TYPE: { FREE: 0, MINE: 1, },
        CLASS_PRIORITY: { "M": 0, "L": 1, "K": 2, "H": 3, "D": 4, "N": 5, "J": 6 },
    },
}

/*
 * Accessors and tests functions
 */
const PLANET = {
    GET: {
        id: planet => planet.id,
        type: planet => planet.type,
        coordinates: planet => planet.coordinates,
        population: planet => planet.population,
        class: planet => planet.class,
        distances: planet => distances => distances[PLANET.GET.id(planet)],
        distance: id => planet => PLANETS_DISTANCES[planet.id][id]
    },
    TEST: {
        is_habitable: planet => PLANETS.CONST.CLASS_PRIORITY[PLANET.GET.class(planet)] < 4,
        belongs_to: type => planet => planet.type == type,
        dont_belongs_to: type => planet => planet.type != type,
        is_free: planet => planet.type == PLANETS.CONST.TYPE.FREE,
        is_mine: planet => planet.type == PLANETS.CONST.TYPE.MINE,
        belongs_to_other: planet => planet.type != PLANETS.CONST.TYPE.FREE && planet.type != PLANETS.CONST.TYPE.MINE,
    },
}

const COMPARE = {
    population: (a, b) => a - b,
    distance: c0 => (c1, c2) => UTILS.compute_distance(c0, c1) - UTILS.compute_distance(c0, c2),
}

const SORT = {
    population: UTILS.sort_by(COMPARE.population),
    distance: planet => planets => UTILS.sort_by(COMPARE.distance(PLANET.GET.coordinates(planet)))(planets),
}




/*
 * Executed once
 */
const _dist = (planets_array, i, result) => planet =>
    i == planets_array.length - 1 
    ?   result.push({ [PLANET.GET.id(planets_array[i])]: UTILS.compute_distance(PLANET.GET.coordinates(planet), 
                                                                    PLANET.GET.coordinates(planets_array[i])) })
    :   PLANET.GET.id(planets_array[i]) == PLANET.GET.id(planet) 
        ?   result
        :   result.push(_dist(planets_array, i + 1, 
                [ { [PLANET.GET.id(planets_array[i])]: UTILS.compute_distance(  PLANET.GET.coordinates(planet), 
                                                                                PLANET.GET.coordinates(planets_array[i])) } ])(planet))

const _dists = (planets_array, i, result) =>
    i == planets_array.length - 1 ?
        result.push({ [PLANET.GET.id(planets_array[i])]: dist(planets_array)(planets_array[i]) })
    :   result.push(_dists(planets_array, i + 1, [ { [PLANET.GET.id(planets_array[i])]: dist(planets_array)(planets_array[i]) }]))


// Returns all the distances from 1 planet eg { 1: 20, 2: 24.413, 23: 26, }
const dist = planets_array => planet => _dist(planets_array, 0, [])(planet)
//console.log("Distances from planet 0", dist(planets_array)({ id: 0, type: 0, coordinates: { x: 1, y: 5 }, population: 0, class: "L", }))

// Returns dist for every planets eg { 0: dist(planet0), 1: dist(planet1), }
const dists = planets_array => _dists(planets_array, 0, [])



/*
 * Has to refresh at each turn
*/
var planets_array = [
        { id: 0, type: 0, coordinates: { x: 1, y: 5 }, population: 0, class: "L", },
        { id: 1, type: 1, coordinates: { x: 1, y: 25 }, population: 0, class: "L", },
        { id: 2, type: 2, coordinates: { x: 15, y: 25 }, population: 0, class: "M", },
        { id: 23, type: 3, coordinates: { x: 25, y: 15 }, population: 0, class: "L", },
        { id: 1568, type: 2, coordinates: { x: 35, y: 42 }, population: 0, class: "K", },
        { id: 20540, type: 1, coordinates: { x: 15, y: 500 }, population: 0, class: "H", },
        { id: 21548152, type: 0, coordinates: { x: 15, y: 25 }, population: 0, class: "N", },
    ]



const PLANETS_DISTANCES = dists(planets_array)
console.log("Distances from every planets", PLANETS_DISTANCES)



var my_planets = PLANETS.FILTER.my_planets(planets_array)
var free_planets = PLANETS.FILTER.free_planets(planets_array)
var other_planets = PLANETS.FILTER.other_planets(planets_array)




var planet1568 = PLANETS.FILTER.planet_id(1568)(planets_array)
console.log("PLANET.TEST.is_habitable(planet1568)", PLANET.TEST.is_habitable(planet1568))
console.log("planets_array", planets_array)
console.log("planet1568", planet1568)
console.log("PLANET.GET.distances(planet1568)", PLANET.GET.distances(planet1568)(PLANETS_DISTANCES))
console.log("PLANET.GET.distance(23)(planet1568)", PLANET.GET.distance(23)(planet1568))

console.log("my_planets", my_planets)
console.log("free_planets", free_planets)
console.log("other_planets", other_planets)



var nearest = SORT.distance(planet1568)(planets_array)
console.log(nearest)
// rank_players_by_planets_number
// rank_players_by_population


/*
var map_planets_to_players =


var players_ranks = planets =>
  planets.

*/



/*
TODO:
Premier tour : calculer les zones de l'espace les plus denses et les moins denses


Different strategies :
  - attack : behind, center, sides, front, V shape
  - defense : idem attack
  - priorities to attack (rank by planets, distance, players)
  - priorities to defend

*/

const sort_distances = distances => distances.sort((d1, d2) => d1.distance - d2.distance)
const sort_graph = graph => graph.map(one_planet => sort_distances(one_planet.distances))


// Computes distance graph
function make_graph(planets_array) {
    var graph = [];

    for (var i = 0; i < planets_array.length; i++) {
        var planet1 = planets_array[i];
        var distances = [];

        for (var j = 0; j < planets_array.length; j++) {
            if (i != j) {
                var planet2 = planets_array[j];
                distances.push({ id: planet2.id, distance: UTILS.compute_distance(PLANET.GET.coordinates(planet1), PLANET.GET.coordinates(planet2)) });
            }
        }
        graph.push({ id: planet1.id, distances: distances })
    }
    sort_graph(graph);

    return graph;
}

const graph = make_graph(planets_array)

console.log(graph)
