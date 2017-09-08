const fs = require('fs')
const csv = require('csv-parse')
const _ = require('lodash')

var stream = fs.createReadStream("pedigraphV7.csv");

let properties;
let output = []
let numberOfAffectedPatients = 0

var csvStream = csv().on("data", function(data){
    if (data[0] === 'id') {
        properties = data
        return
    }
    const outputObject = {}
    data.map(function(property, index) {
        outputObject[properties[index]] = property
    })
    output.push(outputObject)
}).on('error', function (e) { console.log(e) }).on("end", function(){
  let allParents = []
  for (let i = 0; i < output.length; i++) {
    let maternalParents = []
  	let paternalParents = []
  	let bothParents = []

    // Recursively add all parents on either the maternal or paternal side
    const getParents = function (dog, maternal) {
        if (!dog) { return }
        if (dog.parent1 != 0) {
            const parent = _.find(output, (d) => {
                return d.id === dog.parent1
            })
            if (parent && ((maternal && !maternalParents.includes(parent.id)) || (!maternal && !paternalParents.includes(parent.id)))) {
                maternal ? maternalParents.push(parent.id) : paternalParents.push(parent.id)
                getParents(parent, maternal)
            }
        }
        if (dog.parent2 != 0) {
            const parent = _.find(output, (d) => {
                return d.id === dog.parent2
            })
            if (parent && ((maternal && !maternalParents.includes(parent.id)) || (!maternal && !paternalParents.includes(parent.id)))) {
                maternal ? maternalParents.push(parent.id) : paternalParents.push(parent.id)
                getParents(parent, maternal)
            }
        }
    }
    const dog = output[i]

    if (dog.affected == 1) {
      numberOfAffectedPatients++

  		maternalParents.push(dog.parent2)
  		paternalParents.push(dog.parent1)
  		const mother = _.find(output, (d) => {
  			return d.id === dog.parent2
  		})
  		const father = _.find(output, (d) => {
  			return d.id === dog.parent1
  		})
      getParents(mother, true)
  		getParents(father, false)
      // Only add parents to bothParents if they appear in both the maternal and paternal side of the affected patient
  		for (var j = 0; j < paternalParents.length; j++) {
  			if (!bothParents.includes(paternalParents[j]) && maternalParents.includes(paternalParents[j])) {
  				bothParents.push(paternalParents[j])
  			}
  		}
  		for (var j = 0; j < maternalParents.length; j++) {
  			if (!bothParents.includes(maternalParents[j]) && paternalParents.includes(maternalParents[j])) {
  				bothParents.push(maternalParents[j])
  			}
  		}

  		allParents = allParents.concat(bothParents)
    }
  }

  const matches = {}
  for (let i = 0; i < allParents.length; i++) {
      parent = allParents[i]
      if (matches[parent]) {
          matches[parent]++
      } else {
          matches[parent] = 1
      }
  }

  let filtered = _.filter(matches, (number, id) => {
  	if (number === numberOfAffectedPatients) {
  		console.log(id + ' has ' + number + ' matches')
  	}
  })
});

stream.pipe(csvStream);
