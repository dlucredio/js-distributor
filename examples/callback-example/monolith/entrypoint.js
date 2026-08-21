import {objectFunction}   from './src/main2.js';

function useCase(objtFunc){
    console.log(objtFunc.other())
}

function serverOne(){
    const something = objectFunction("Olá")
    useCase(something);
}