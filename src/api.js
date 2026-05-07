import axios from 'axios'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});
api.interceptors.request.use(c=>{const t=localStorage.getItem('xoxo_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c})
export const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0))
export const user=()=>{try{return JSON.parse(localStorage.getItem('xoxo_user')||'{}')}catch{return{}}}
