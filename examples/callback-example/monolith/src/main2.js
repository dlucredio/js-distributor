function objectFunction(hi){
    const something = " One thing ";

    function other(){
        return "Other thing" + something + hi;
    }

    function thirdThing(){
        return "Last thing"+something + hi;
    }

    return { other, thirdThing };
}

export {objectFunction}