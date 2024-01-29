

// Função no servidor "sub"
async function sub(a, b) {
  return a - b;
}

async function sum(a, b) {
  return a + b;
}

async function rodeiSum(a,b){
  return sum(a,b);
}
// Função principal que chama a função "sub"
async function main() {
  const result = await sub(10, 5);
  console.log('Rodei sub aqui')
  console.log("Resultado da função sub:", result);
  const result2 = await rodeiSum(7, 3);
  console.log('Rodei sum')
  console.log("Resultado da função sum:", result2);
  return { result, result2 };
}

export  {
  sub, sum, main, rodeiSum
}