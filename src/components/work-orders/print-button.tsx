"use client";
export function PrintButton(){return <button type="button" onClick={()=>window.print()} className="min-h-11 rounded-xl bg-ink px-5 font-bold text-white print:hidden">Print / Save PDF</button>}
