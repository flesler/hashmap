/*jshint -W030,-W121 */
var HashMapNew = require('../hashmap');
var HashMapOld = require('../HashMap2.4.0/hashmap');
var Benchmark = require('benchmark');

for(var loop = 0; loop < 2 ; loop++) {
    var HashMap;
    var suite;
    if(loop === 1){
        console.log("New");
         HashMap = HashMapNew.HashMap;
        suite = new Benchmark.Suite("hashmap new");
    } else {
        console.log("Old");
         HashMap = HashMapOld.HashMap;
        suite = new Benchmark.Suite("hashmap old");
    }
    var hashmap = new HashMap();
    console.log("setup constants");
    var key = makeid(16);
    var value = makeid(128);

    console.log("1'024 hashmap");
    var hashmap1024 = new HashMap();

    for (var i = 0; i < 1024; i++) {
        hashmap1024.set(makeid(16), makeid(128));
    }
// console.log("262'144 hashmap");
// var hashmap262144 = new HashMap();
// for (var i = 0; i < 262144; i++) {
//     hashmap262144.set(makeid(16), makeid(128));
// }
    console.log("define benchmarks");
    suite.add("create", function () {
        hashmap = new HashMap();
    })
        .add("singleSet", function () {
            hashmap.set(key, value);
        },{'onCycle': function () {
                key = makeid(16);
                value = makeid(128);
                hashmap.clear();
            }})
        .add("singleReplace", function () {
            hashmap.set(key, value);
        },{'onCycle': function () {
                key = makeid(16);
                value = makeid(128);
                hashmap.clear();
                hashmap.set(key, makeid(128));
            }})
        .add("setAfter 1,024", function () {
            hashmap1024.set(key, value);
        },{'onCycle': function () {
                hashmap1024.delete(key);
                key = makeid(16);
                value = makeid(128);
            }})
        // .add("setAfter 262,144", function () {
        //     hashmap262144.set(key, value);
        // },{'onCycle': function () {
        //         hashmap262144.delete(key);
        //     key = makeid(16);
        //     value = makeid(128);
        // }})
        .on('cycle', function(event) {
            console.log(String(event.target));
        }).on('complete', function () {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        console.log('Slowest is ' + this.filter('slowest').map('name'));
    }).on('onError', function(err) {
        console.log("Error",err);
    }).run();

}


function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * create x 14,494,621 ops/sec ±3.17% (89 runs sampled)
 singleSet x 3,198,502 ops/sec ±1.52% (85 runs sampled)
 singleReplace x 3,084,387 ops/sec ±1.51% (83 runs sampled)
 setAfter 1,024 x 137,042 ops/sec ±2.51% (59 runs sampled)

 */