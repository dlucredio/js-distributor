The example's objective is to explore solutions to the following scenario:

```js
function objectFunction(hi){
    const something = " One thing";

    function other(){
        return "Other thing" + something + hi;
    }

    function thirdThing(){
        return "Last thing"+something + hi;
    }

    return { other, thirdThing };
}

export {objectFunction}


import objectFunction;

function useCase(objtFunc){
    //bussiness logic...
    console.log(objtFunc.other())
}

```

And then, we extract `useCase` so the function is a remote call, that will transform the parameters into strings

Currently, since JS-Distributor transforms every remote parameter into strings, then the previous code will fail on the micro service architecture.
