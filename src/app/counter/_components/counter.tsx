"use client";

import { useState } from "react";

type CountProps = {
    initial?: number
}

export function Counter( {initial = 0}: CountProps ) {
    const [value, setValue] = useState<number>(initial);

    function inc() {
        setValue(value+1)
        console.log(value)
    }

    function dec() {
        setValue(value-1)
        console.log(value)
    }

    return (
        <div className="flex flex-col gap-4 items-center border-2 border-zinc-50">
            <span> Contador </span>
            <span className="text-5xl font-black"> {value} </span>
            <div className="flex gap-2">
                <button className='button button-primary' onClick={() => inc()}> Incrementar </button>
                <button className='button button-danger' onClick={dec}> Decrementar </button>
            </div>
        </div>
    )
}