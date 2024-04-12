

// Função no servidor "sub"
export default function sub_rabbit(a, b) {
    return a - b;
}
  
function sum_rabbit(a, b) {
    return a + b;
}

function rodeiSum(a,b){
    return sum_rabbit(a,b);
}

// Função principal que chama a função "sub"
function main_rabbit() {
    const result = sub_rabbit(10, 5);
    console.log('Rodei sub aqui')
    console.log("Resultado da função sub:", result);
    const result2 = rodeiSum(7, 3);
    console.log('Rodei sum')
    console.log("Resultado da função sum:", result2);
    return { result, result2 };
}


// export  {
//     sub, sum, main, rodeiSum
// }