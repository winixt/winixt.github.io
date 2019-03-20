

// publish subscription
function* generatorId() {
    let id = 1;
    while(true) {
        yield id++;
    }
}

const itr = generatorId();

console.log(itr.next().value);
console.log(itr.next().value);
console.log(itr.next().value);
console.log(itr.next().value);
console.log(itr.next().value);
console.log(itr.next().value);
console.log(itr.next().value);
console.log(itr.next().value);