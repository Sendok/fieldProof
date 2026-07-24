"use client";
import { useEffect } from "react";
const scopeKey="fieldproof-private-cache-user";
export function PrivateCacheScope({userId}:{userId:string}){useEffect(()=>{const previous=localStorage.getItem(scopeKey);if(previous&&previous!==userId){navigator.serviceWorker?.controller?.postMessage({type:"CLEAR_PRIVATE_CACHES"});indexedDB.deleteDatabase("fieldproof-offline");}localStorage.setItem(scopeKey,userId);},[userId]);return null;}
