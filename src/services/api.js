// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://africanut-backend-postgres-production.up.railway.app';
console.log('API_URL configured as:', API_URL);
export function getToken(){ return localStorage.getItem('token') }
export function setToken(t){ localStorage.setItem('token', t) }
export async function api(path, options={}){
  const headers = options.headers || {}
  if(getToken()) headers['Authorization'] = 'Bearer ' + getToken()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(API_URL + path, { ...options, headers })
  if(!res.ok) throw new Error(await res.text())
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text()
}
